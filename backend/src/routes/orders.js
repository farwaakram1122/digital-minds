// Pickup orders reserve quantities until the farmer completes collection.
import { Router } from "express";
import { z } from "zod";
import { User, Market, Product, Order } from "../models.js";
import { asyncRoute, bad, id, resolve, auth, role, notify } from "../common.js";

const router = Router();
const orderView = async (o) => {
  const [farmer, market, customer, productDocs] = await Promise.all([
    User.findById(o.farmer),
    Market.findById(o.market),
    User.findById(o.customer),
    Product.find({ _id: { $in: o.items.map((i) => i.product) } }),
  ]);
  const listings = new Map(
    productDocs.map((p) => [String(p.id), p]),
  );
  return {
    id: String(o.id),
    customer: customer?.name || "Customer",
    farmerId: farmer?.legacyId || String(o.farmer),
    marketId: market?.legacyId || String(o.market),
    items: o.items.map((i) => ({
      productId: listings.get(String(i.product))?.legacyId || String(i.product),
      qty: i.qty,
      name: i.name,
      unit: i.unit || listings.get(String(i.product))?.unit || "unit",
      image: i.image || listings.get(String(i.product))?.image,
      price: i.price,
    })),
    total: o.total,
    pickupDate: o.pickupDate?.toISOString().slice(0, 10),
    pickupSlot: o.pickupSlot,
    notes: o.notes,
    status: o.status,
    createdAt: o.createdAt,
  };
};
router.get(
  "/api/orders",
  auth,
  asyncRoute(async (req, res) => {
    const q =
      req.user.role === "admin"
        ? {}
        : req.user.role === "farmer"
          ? { farmer: req.user.id }
          : { customer: req.user.id };
    res.json(
      await Promise.all(
        (await Order.find(q).sort({ createdAt: -1 }).limit(200)).map(orderView),
      ),
    );
  }),
);
// Market day, farmer hours and the cutoff are checked on the server.
const pickupInstant = (day, slot) => {
  const start = /^([01]\d|2[0-3]):[0-5]\d/.exec(slot || "")?.[0];
  if (!start || !/^\d{4}-\d{2}-\d{2}$/.test(day))
    throw bad("Choose a valid pickup date and slot");
  const at = new Date(`${day}T${start}:00+05:00`);
  if (!Number.isFinite(at.getTime()) || at.getTime() <= Date.now())
    throw bad("Pickup must be in the future");
  return at;
};
const pickupAllowed = (farmer, market, day, slot) => {
  const weekday = new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "UTC",
  });
  if (!market.days?.some(value => /Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/i.test(value)))
    throw bad("Market pickup schedule is not confirmed yet", 409);
  if (
    market.days?.length &&
    !market.days.some((d) => d.toLowerCase().includes(weekday.toLowerCase()))
  )
    throw bad(`Market is not open on ${weekday}`, 409);
  if (
    farmer.operatingDays?.length &&
    !farmer.operatingDays.some((d) =>
      d.toLowerCase().includes(weekday.toLowerCase()),
    )
  )
    throw bad(`Farmer is not available on ${weekday}`, 409);
  const slots = farmer.pickupSlots?.length
    ? farmer.pickupSlots
    : ["09:00–09:30", "09:30–10:00", "10:00–10:30"];
  if (!slots.includes(slot))
    throw bad("Select an available farmer pickup slot", 409);
  // Respect published market hours when they are a specific time range.
  const marketHours = /^([0-2]\d:[0-5]\d)[–-]([0-2]\d:[0-5]\d)$/.exec(market.hours || "");
  const selected = /^([0-2]\d:[0-5]\d)[–-]([0-2]\d:[0-5]\d)$/.exec(slot);
  if (marketHours && selected && (selected[1] < marketHours[1] || selected[2] > marketHours[2]))
    throw bad("Pickup slot is outside market opening hours", 409);
  const instant = pickupInstant(day, slot);
  if (instant.getTime() - Date.now() < (farmer.cutoffHours ?? 2) * 3600000)
    throw bad("Order cutoff time has passed", 409);
  return instant;
};
router.post(
  "/api/orders",
  auth,
  role("customer"),
  asyncRoute(async (req, res) => {
    const data = z
      .object({
        marketId: z.string(),
        pickupDate: z.string(),
        pickupSlot: z.string().min(3),
        notes: z.string().optional(),
        items: z
          .array(
            z.object({
              productId: z.string(),
              qty: z.coerce.number().int().positive(),
            }),
          )
          .min(1),
      })
      .parse(req.body);
    const market = await resolve(Market, data.marketId);
    if (!market || !market.active) throw bad("Market unavailable", 409);
    if (new Set(data.items.map((i) => i.productId)).size !== data.items.length)
      throw bad("Duplicate products in cart");
    const groups = new Map();
    for (const item of data.items) {
      const product = await resolve(Product, item.productId);
      if (
        !product ||
        !product.available ||
        product.stock - (product.reserved || 0) < item.qty ||
        !product.markets.map(String).includes(String(market.id))
      )
        throw bad("Item is unavailable at this market", 409);
      const farmer = await User.findById(product.farmer);
      if (!farmer || farmer.status !== "active")
        throw bad("Farmer unavailable", 409);
      pickupAllowed(farmer, market, data.pickupDate, data.pickupSlot);
      if (!groups.has(String(farmer.id))) groups.set(String(farmer.id), []);
      groups.get(String(farmer.id)).push({ product, qty: item.qty });
    }
    // Hold stock until pickup; the sale reduces physical stock on completion.
    const taken = [],
      created = [];
    try {
      for (const [farmer, items] of groups) {
        for (const { product, qty } of items) {
          const result = await Product.updateOne(
            {
              _id: product.id, available: true,
              $expr: { $gte: [
                { $subtract: ["$stock", { $ifNull: ["$reserved", 0] }] }, qty,
              ] },
            },
            { $inc: { reserved: qty } },
          );
          if (!result.modifiedCount)
            throw bad("Stock changed. Refresh cart and retry", 409);
          taken.push({ product: product.id, qty });
        }
        const order = await Order.create({
          customer: req.user.id,
          farmer,
          market: market.id,
          items: items.map(({ product, qty }) => ({
            product: product.id,
            name: product.name,
            image: product.image,
            price: product.price,
            qty,
            unit: product.unit,
          })),
          total: items.reduce(
            (sum, { product, qty }) => sum + product.price * qty,
            0,
          ),
          pickupDate: new Date(`${data.pickupDate}T12:00:00Z`),
          pickupAt: pickupInstant(data.pickupDate, data.pickupSlot),
          pickupSlot: data.pickupSlot,
          notes: data.notes,
          usesReservation: true,
        });
        created.push(order);
      }
    } catch (error) {
      await Order.deleteMany({ _id: { $in: created.map((o) => o.id) } });
      for (const item of taken)
        await Product.updateOne(
          { _id: item.product },
          { $inc: { reserved: -item.qty } },
        );
      throw error;
    }
    for (const order of created) {
      await notify(
        order.farmer,
        "New pre-order",
        `${req.user.name} placed order #${String(order.id).slice(-7).toUpperCase()}: ${order.items.map(item => `${item.qty} ${item.unit} ${item.name}`).join(", ")}. Pickup ${data.pickupDate}, ${data.pickupSlot}.`,
      );
      await notify(
        req.user.id,
        "Pre-order placed",
        `Order #${String(order.id).slice(-7).toUpperCase()} was sent to the farmer. Pickup ${data.pickupDate}, ${data.pickupSlot}. Await acceptance.`,
      );
    }
    res.status(201).json(await Promise.all(created.map(orderView)));
  }),
);
router.patch(
  "/api/orders/:id/status",
  auth,
  asyncRoute(async (req, res) => {
    const o = await Order.findById(id(req.params.id));
    if (!o) throw bad("Order not found", 404);
    const status = req.body.status;
    const farmer = String(o.farmer) === req.user.id,
      customer = String(o.customer) === req.user.id;
    const transitions =
      farmer && req.user.role === "farmer"
        ? {
            placed: ["accepted", "declined"],
            accepted: ["packing"],
            packing: ["packed"],
            packed: ["ready"],
            out_for_delivery: ["ready"], // Earlier orders can reach pickup readiness.
            ready: ["completed"],
          }
        : customer && req.user.role === "customer"
          ? { placed: ["cancelled"], accepted: ["cancelled"] }
          : {};
    if (!transitions[o.status]?.includes(status))
      throw bad("Invalid order status transition", 403);
    if (customer) {
      const owner = await User.findById(o.farmer);
      const cutoff = (owner?.cutoffHours ?? 2) * 3600000;
      if ((o.pickupAt || o.pickupDate).getTime() - Date.now() < cutoff)
        throw bad("Pickup cutoff has passed", 409);
    }
    if (["cancelled", "declined"].includes(status))
      for (const item of o.items)
        await Product.updateOne(
          { _id: item.product },
          { $inc: o.usesReservation ? { reserved: -item.qty } : { stock: item.qty } },
        );
    if (status === "completed" && o.usesReservation)
      for (const item of o.items) {
        const product = await Product.findOneAndUpdate(
          { _id: item.product, stock: { $gte: item.qty }, reserved: { $gte: item.qty } },
          { $inc: { stock: -item.qty, reserved: -item.qty } },
          { new: true },
        );
        if (!product) throw bad("Reserved stock is unavailable", 409);
        if (product.stock <= 5 && product.stock + item.qty > 5)
          await notify(o.farmer, "Low stock", `${product.name}: ${product.stock} ${product.unit} remaining`);
      }
    o.status = status;
    await o.save();
    await notify(
      farmer ? o.customer : o.farmer,
      `Order ${status === "ready" ? "ready for pickup" : status.replaceAll("_", " ")}`,
      `Order #${String(o.id).slice(-7).toUpperCase()} is ${status === "ready" ? "ready for pickup" : status.replaceAll("_", " ")}. ${o.items.map(i => `${i.qty} ${i.unit || "unit"} ${i.name}`).join(", ")}. Pickup ${o.pickupDate.toISOString().slice(0, 10)}, ${o.pickupSlot}.`,
    );
    res.json(await orderView(o));
  }),
);
router.patch(
  "/api/orders/:id",
  auth,
  role("customer"),
  asyncRoute(async (req, res) => {
    const o = await Order.findOne({
      _id: id(req.params.id),
      customer: req.user.id,
    });
    if (!o) throw bad("Order not found", 404);
    if (o.status !== "placed")
      throw bad("Only placed orders can be modified", 409);
    const farmer = await User.findById(o.farmer),
      market = await Market.findById(o.market);
    if (
      (o.pickupAt || o.pickupDate).getTime() - Date.now() <
      (farmer?.cutoffHours ?? 2) * 3600000
    )
      throw bad("Pickup cutoff has passed", 409);
    const day = req.body.pickupDate || o.pickupDate.toISOString().slice(0, 10),
      slot = req.body.pickupSlot || o.pickupSlot;
    const instant = pickupAllowed(farmer, market, day, slot);
    if (req.body.items) {
      const items = z
        .array(
          z.object({
            productId: z.string(),
            qty: z.coerce.number().int().positive(),
          }),
        )
        .min(1)
        .parse(req.body.items);
      if (
        items.length !== o.items.length ||
        new Set(items.map((i) => i.productId)).size !== items.length
      )
        throw bad("Change quantities for all existing order items");
      const changes = [];
      for (const item of items) {
        const product = await resolve(Product, item.productId);
        const old = o.items.find(
          (x) => String(x.product) === String(product?.id),
        );
        if (!old) throw bad("Product not in this order");
        changes.push({ old, delta: item.qty - old.qty });
      }
      const taken = [];
      try {
        for (const change of changes) {
          if (change.delta > 0) {
            const r = await Product.updateOne(
              {
                _id: change.old.product,
                available: true,
                ...(o.usesReservation
                  ? { $expr: { $gte: [
                      { $subtract: ["$stock", { $ifNull: ["$reserved", 0] }] }, change.delta,
                    ] } }
                  : { stock: { $gte: change.delta } }),
              },
              { $inc: o.usesReservation ? { reserved: change.delta } : { stock: -change.delta } },
            );
            if (!r.modifiedCount) throw bad("Insufficient stock", 409);
            taken.push({ product: change.old.product, qty: change.delta });
          }
        }
      } catch (error) {
        for (const x of taken)
          await Product.updateOne(
            { _id: x.product },
            { $inc: o.usesReservation ? { reserved: -x.qty } : { stock: x.qty } },
          );
        throw error;
      }
      for (const change of changes)
        if (change.delta < 0)
          await Product.updateOne(
            { _id: change.old.product },
            { $inc: o.usesReservation ? { reserved: change.delta } : { stock: -change.delta } },
          );
      for (const change of changes) change.old.qty += change.delta;
      o.total = o.items.reduce((n, x) => n + x.price * x.qty, 0);
    }
    o.pickupDate = new Date(`${day}T12:00:00Z`);
    o.pickupAt = instant;
    o.pickupSlot = slot;
    if (req.body.notes !== undefined)
      o.notes = String(req.body.notes).slice(0, 500);
    await o.save();
    await notify(
      o.farmer,
      "Order modified",
      `Order ${o.id} pickup or quantity changed`,
    );
    res.json(await orderView(o));
  }),
);

export default router;
