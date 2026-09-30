// Public catalogue and farmer product management.
import { Router } from "express";
import { z } from "zod";
import {
  User,
  Market,
  Category,
  Product,
  Order,
  Review,
  Announcement,
} from "../models.js";
import {
  asyncRoute,
  bad,
  id,
  publicUser,
  auth,
  role,
  notify,
} from "../common.js";
import { unitsFor } from "../../../JS/productUnits.js";

const router = Router();
const validImage = value => !value || /^https:\/\/\S+$/i.test(value) || /^\/api\/uploads\/[0-9a-f]{24}$/i.test(value);
// Public stock excludes quantities held by open pickup orders.
const forCustomer = product => ({
  ...product.toObject(),
  stock: Math.max(0, product.stock - (product.reserved || 0)),
});
router.get(
  "/api/markets",
  asyncRoute(async (req, res) =>
    res.json(
      await Market.find({
        active: true,
        ...(req.query.day
          ? {
              days: {
                $regex: String(req.query.day).slice(0, 30),
                $options: "i",
              },
            }
          : {}),
      }).sort({ name: 1 }),
    ),
  ),
);
router.get(
  "/api/farmers",
  asyncRoute(async (req, res) =>
    res.json(
      (
        await User.find({ role: "farmer", status: "active" }).select(
          "-passwordHash",
        )
      ).map(publicUser),
    ),
  ),
);
router.get(
  "/api/categories",
  asyncRoute(async (req, res) =>
    res.json(await Category.find().sort({ name: 1 })),
  ),
);
router.get(
  "/api/products",
  asyncRoute(async (req, res) => {
    const activeFarmers = await User.find({
      role: "farmer",
      status: "active",
    }).distinct("_id");
    const filter = { available: true, farmer: { $in: activeFarmers } };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.market) filter.markets = id(req.query.market);
    if (req.query.farmer) {
      const farmerId = id(req.query.farmer);
      if (!activeFarmers.map(String).includes(farmerId)) return res.json([]);
      filter.farmer = farmerId;
    }
    if (req.query.q)
      filter.name = {
        $regex: String(req.query.q)
          .slice(0, 80)
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        $options: "i",
      };
    if (req.query.maxPrice) filter.price = { $lte: Number(req.query.maxPrice) };
    res.json((await Product.find(filter).sort({ createdAt: -1 }).limit(200)).map(forCustomer));
  }),
);
router.get(
  "/api/products/:id",
  asyncRoute(async (req, res) => {
    const p = await Product.findById(id(req.params.id));
    if (
      !p ||
      !p.available ||
      !(await User.exists({ _id: p.farmer, status: "active" }))
    )
      throw bad("Product not found", 404);
    res.json(forCustomer(p));
  }),
);
router.get(
  "/api/announcements",
  asyncRoute(async (req, res) =>
    res.json(
      await Announcement.find({ active: true })
        .sort({ createdAt: -1 })
        .limit(20),
    ),
  ),
);
router.get(
  "/api/reviews",
  asyncRoute(async (req, res) => {
    const q = {};
    if (req.query.farmer) q.farmer = id(req.query.farmer);
    if (req.query.product) q.product = id(req.query.product);
    if (req.query.market) q.market = id(req.query.market);
    res.json(
      await Review.find(q)
        .populate("customer", "name")
        .populate("product", "name")
        .populate("market", "name")
        .sort({ createdAt: -1 })
        .limit(100),
    );
  }),
);
router.get(
  "/api/farmer/products",
  auth,
  role("farmer"),
  asyncRoute(async (req, res) =>
    res.json(
      await Product.find({ farmer: req.user.id }).sort({ createdAt: -1 }),
    ),
  ),
);
// A farmer can write only products assigned to their own account.
router.post(
  "/api/farmer/products",
  auth,
  role("farmer"),
  asyncRoute(async (req, res) => {
    const data = z
      .object({
        name: z.string().min(2),
        category: z.string().min(2),
        price: z.coerce.number().nonnegative(),
        unit: z.string().min(1),
        stock: z.coerce.number().int().nonnegative(),
        description: z.string().optional(),
        image: z.string().optional(),
        markets: z.array(z.string()).optional(),
        available: z.boolean().optional(),
        weeklyTemplate: z.coerce.number().int().nonnegative().optional(),
      })
      .parse(req.body);
    if (!unitsFor(data.category, data.name).includes(data.unit))
      throw bad("Choose a unit matching the product and category");
    if (!validImage(data.image)) throw bad("Use a secure image URL or upload an image");
    if (
      data.markets?.length &&
      data.markets.some(
        (m) => !req.user.markets.map(String).includes(String(m)),
      )
    )
      throw bad("Select a market in your farmer profile first");
    const p = await Product.create({
      ...data,
      image: data.image || "",
      markets: data.markets?.length ? data.markets : req.user.markets,
      farmer: req.user.id,
    });
    res.status(201).json(p);
  }),
);
router.patch(
  "/api/farmer/products/:id",
  auth,
  role("farmer"),
  asyncRoute(async (req, res) => {
    const allowed = [
      "name",
      "category",
      "description",
      "image",
      "price",
      "unit",
      "stock",
      "weeklyTemplate",
      "available",
      "markets",
    ];
    const patch = {};
    for (const k of allowed)
      if (req.body[k] !== undefined) patch[k] = req.body[k];
    if (!validImage(patch.image)) throw bad("Use a secure image URL or upload an image");
    if (
      patch.markets?.length &&
      patch.markets.some(
        (m) => !req.user.markets.map(String).includes(String(m)),
      )
    )
      throw bad("Product market must belong to your profile");
    const previous = await Product.findOne({
      _id: id(req.params.id),
      farmer: req.user.id,
    });
    if (!previous) throw bad("Product not found", 404);
    if (patch.stock !== undefined && (!Number.isInteger(Number(patch.stock)) ||
        Number(patch.stock) < (previous.reserved || 0)))
      throw bad("Stock cannot be lower than the quantity reserved for open orders", 409);
    if (["category", "name", "unit"].some(key => patch[key] !== undefined) &&
        !unitsFor(patch.category ?? previous.category, patch.name ?? previous.name)
          .includes(patch.unit ?? previous.unit))
      throw bad("Choose a unit matching the product and category");
    const p = await Product.findOneAndUpdate(
      { _id: id(req.params.id), farmer: req.user.id },
      patch,
      { new: true, runValidators: true },
    );
    if (previous?.stock === 0 && p?.stock > 0) {
      const watchers = await User.find({
        role: "customer",
        "favorites.products": p.id,
      }).select("_id");
      await Promise.all(
        watchers.map((w) =>
          notify(w.id, "Back in stock", `${p.name} is available again`),
        ),
      );
    }
    if (!p) throw bad("Product not found", 404);
    res.json(p);
  }),
);
router.delete(
  "/api/farmer/products/:id",
  auth,
  role("farmer"),
  asyncRoute(async (req, res) => {
    const target = id(req.params.id);
    if (
      await Order.exists({
        farmer: req.user.id,
        "items.product": target,
        status: { $in: ["placed", "accepted", "packing", "packed", "out_for_delivery", "ready"] },
      })
    )
      throw bad("Complete open orders before removing this product", 409);
    const p = await Product.findOneAndDelete({
      _id: target,
      farmer: req.user.id,
    });
    if (!p) throw bad("Product not found", 404);
    res.json({ ok: true });
  }),
);
router.post(
  "/api/reviews",
  auth,
  role("customer"),
  asyncRoute(async (req, res) => {
    const data = z
      .object({
        orderId: z.string(),
        rating: z.coerce.number().int().min(1).max(5),
        comment: z.string().max(1000).optional().default(""),
        productId: z.string().optional(),
        marketId: z.string().optional(),
      })
      .parse(req.body);
    const o = await Order.findOne({
      _id: id(data.orderId),
      customer: req.user.id,
      status: "completed",
    });
    if (!o) throw bad("Completed order required", 403);
    if (data.productId && data.marketId) throw bad("Choose one review target");
    if (data.marketId && String(o.market) !== String(id(data.marketId)))
      throw bad("Market not in order");
    if (
      data.productId &&
      !o.items.some((i) => String(i.product) === data.productId)
    )
      throw bad("Product not in order");
    const r = await Review.create({
      customer: req.user.id,
      farmer: o.farmer,
      order: o.id,
      product: data.productId || undefined,
      market: data.marketId || undefined,
      rating: data.rating,
      comment: data.comment.trim(),
    });
    // Both dashboards receive the rating, even when the customer writes no comment.
    const admin = await User.findOne({ role: "admin", status: "active" });
    const message = `Order #${String(o.id).slice(-7).toUpperCase()} received ${r.rating}/5 stars for ${data.marketId ? "market service" : "the farmer"}.`;
    await Promise.all([o.farmer, admin?.id].filter(Boolean).map(userId => notify(userId, "New customer review", message)));
    res.status(201).json(r);
  }),
);
router.patch(
  "/api/farmer/reviews/:id/respond",
  auth,
  role("farmer"),
  asyncRoute(async (req, res) => {
    const r = await Review.findOneAndUpdate(
      { _id: id(req.params.id), farmer: req.user.id },
      { response: String(req.body.response || "").slice(0, 1000) },
      { new: true },
    );
    if (!r) throw bad("Review not found", 404);
    res.json(r);
  }),
);
router.get(
  "/api/farmer/insights",
  auth,
  role("farmer"),
  asyncRoute(async (req, res) => {
    const orders = await Order.find({ farmer: req.user.id });
    const completed = orders.filter((o) => o.status === "completed");
    const best = new Map();
    for (const o of completed)
      for (const item of o.items) {
        const key = String(item.product);
        const row = best.get(key) || { name: item.name, quantity: 0, value: 0 };
        row.quantity += item.qty;
        row.value += item.price * item.qty;
        best.set(key, row);
      }
    res.json({
      totalOrders: orders.length,
      pendingOrders: orders.filter((o) =>
        ["placed", "accepted", "packing", "packed", "out_for_delivery", "ready"].includes(o.status),
      ).length,
      revenue: completed.reduce((n, o) => n + o.total, 0),
      bestSelling: [...best.values()]
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10),
    });
  }),
);

export default router;
