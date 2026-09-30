// Admin-only routes for accounts, markets, announcements and reports.
import { Router } from "express";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import {
  User,
  Market,
  Category,
  Product,
  Order,
  Review,
  Announcement,
} from "../models.js";
import { asyncRoute, bad, id, publicUser, auth, role, notify } from "../common.js";

const router = Router();
// Published announcements reach every active farmer and customer.
const publish = async announcement => {
  if (!announcement.active) return;
  const people = await User.find({ role: { $in: ["farmer", "customer"] }, status: "active" }).select("_id");
  await Promise.all(people.map(person => notify(person.id, announcement.title, announcement.message)));
};
router.get(
  "/api/admin/users",
  auth,
  role("admin"),
  asyncRoute(async (req, res) => {
    const q = req.query.role ? { role: req.query.role } : {};
    res.json(
      (await User.find(q).select("-passwordHash").sort({ createdAt: -1 })).map(
        publicUser,
      ),
    );
  }),
);
router.patch(
  "/api/admin/users/:id/status",
  auth,
  role("admin"),
  asyncRoute(async (req, res) => {
    if (!["active", "suspended"].includes(req.body.status))
      throw bad("Invalid status");
    const u = await User.findById(id(req.params.id));
    if (!u || u.role === "admin") throw bad("User unavailable", 404);
    u.status = req.body.status;
    await u.save();
    if (u.role === "farmer" && u.status === "active")
      await notify(u.id, "Account approved", "Your stall is ready. Add your market and weekly products.");
    res.json(publicUser(u));
  }),
);
// Existing passwords are hashed. An admin can issue a new one for a farmer.
router.post(
  "/api/admin/users/:id/reset-password",
  auth,
  role("admin"),
  asyncRoute(async (req, res) => {
    const farmer = await User.findById(id(req.params.id));
    if (!farmer || farmer.role !== "farmer") throw bad("Farmer unavailable", 404);
    const password = randomBytes(15).toString("base64url");
    farmer.passwordHash = await bcrypt.hash(password, 12);
    await farmer.save();
    res.set("Cache-Control", "no-store");
    res.json({ email: farmer.email, password }); // Shown only once to this admin.
  }),
);
// Markets, categories and announcements share simple admin CRUD routes.
const adminCrud = (path, Model, fields) => {
  router.get(
    "/api/admin/" + path,
    auth,
    role("admin"),
    asyncRoute(async (req, res) =>
      res.json(await Model.find().sort({ createdAt: -1 })),
    ),
  );
  router.post(
    "/api/admin/" + path,
    auth,
    role("admin"),
    asyncRoute(async (req, res) => {
      const data = {};
      for (const k of fields)
        if (req.body[k] !== undefined) data[k] = req.body[k];
      const doc = await Model.create(data);
      if (path === "announcements") await publish(doc);
      res.status(201).json(doc);
    }),
  );
  router.patch(
    "/api/admin/" + path + "/:id",
    auth,
    role("admin"),
    asyncRoute(async (req, res) => {
      const data = {};
      for (const k of fields)
        if (req.body[k] !== undefined) data[k] = req.body[k];
      const doc = await Model.findByIdAndUpdate(id(req.params.id), data, {
        new: true,
        runValidators: true,
      });
      if (!doc) throw bad("Not found", 404);
      if (path === "announcements" && (data.title !== undefined || data.message !== undefined || data.active === true))
        await publish(doc);
      res.json(doc);
    }),
  );
  router.delete(
    "/api/admin/" + path + "/:id",
    auth,
    role("admin"),
    asyncRoute(async (req, res) => {
      const target = id(req.params.id);
      if (
        path === "markets" &&
        ((await Order.exists({ market: target })) ||
          (await Product.exists({ markets: target })))
      )
        throw bad(
          "This market is used by orders or products. Mark it inactive instead.",
          409,
        );
      if (path === "categories") {
        const category = await Category.findById(target);
        if (category && (await Product.exists({ category: category.name })))
          throw bad("This category is used by products", 409);
      }
      const doc = await Model.findByIdAndDelete(target);
      if (!doc) throw bad("Not found", 404);
      res.json({ ok: true });
    }),
  );
};
adminCrud("markets", Market, [
  "name",
  "address",
  "city",
  "image",
  "days",
  "hours",
  "latitude",
  "longitude",
  "active",
]);
adminCrud("categories", Category, ["name"]);
adminCrud("announcements", Announcement, ["title", "message", "active"]);
router.get(
  "/api/admin/products",
  auth,
  role("admin"),
  asyncRoute(async (req, res) =>
    res.json(await Product.find().sort({ createdAt: -1 })),
  ),
);
router.delete(
  "/api/admin/products/:id",
  auth,
  role("admin"),
  asyncRoute(async (req, res) => {
    const target = id(req.params.id);
    if (await Order.exists({ "items.product": target, status: { $in: ["placed", "accepted", "packing", "packed", "out_for_delivery", "ready"] } }))
      throw bad("Complete open orders before removing this product", 409);
    const p = await Product.findByIdAndDelete(target);
    if (!p) throw bad("Not found", 404);
    res.json({ ok: true });
  }),
);
router.get(
  "/api/admin/reviews",
  auth,
  role("admin"),
  asyncRoute(async (req, res) => {
    const reviews = await Review.find().populate("customer", "name").populate("farmer", "business name")
      .populate("product", "name").populate("market", "name").sort({ createdAt: -1 });
    res.json(reviews.map(review => ({
      ...review.toObject(),
      customerName: review.customer?.name || "Customer",
      farmerName: review.farmer?.business || review.farmer?.name || "Farmer",
      target: review.market?.name || review.product?.name || "Farmer service",
    })));
  }),
);
router.delete(
  "/api/admin/reviews/:id",
  auth,
  role("admin"),
  asyncRoute(async (req, res) => {
    const r = await Review.findByIdAndDelete(id(req.params.id));
    if (!r) throw bad("Not found", 404);
    res.json({ ok: true });
  }),
);
router.get(
  "/api/admin/reports",
  auth,
  role("admin"),
  asyncRoute(async (req, res) => {
    const [farmers, customers, markets, orders, revenue, activeFarmers] =
      await Promise.all([
        User.countDocuments({ role: "farmer" }),
        User.countDocuments({ role: "customer" }),
        Market.countDocuments(),
        Order.countDocuments(),
        Order.aggregate([
          { $match: { status: "completed" } },
          { $group: { _id: null, total: { $sum: "$total" } } },
        ]),
        Order.aggregate([
          {
            $group: {
              _id: "$farmer",
              orders: { $sum: 1 },
              value: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$total", 0] } },
            },
          },
          { $sort: { orders: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "_id",
              as: "farmer",
            },
          },
          {
            $project: {
              orders: 1,
              value: 1,
              business: { $first: "$farmer.business" },
            },
          },
        ]),
      ]);
    const byMarket = await Order.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: "$market",
          orders: { $sum: 1 },
          revenue: { $sum: "$total" },
        },
      },
      {
        $lookup: {
          from: "markets",
          localField: "_id",
          foreignField: "_id",
          as: "market",
        },
      },
      { $project: { orders: 1, revenue: 1, name: { $first: "$market.name" } } },
    ]);
    res.json({
      farmers,
      customers,
      markets,
      orders,
      revenue: revenue[0]?.total || 0,
      activeFarmers,
      byMarket,
    });
  }),
);

export default router;
