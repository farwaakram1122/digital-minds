// Registration, login, profiles and account notifications.
import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User, Product, Market, Notification } from "../models.js";
import {
  asyncRoute,
  bad,
  id,
  publicUser,
  tokenFor,
  auth,
  role,
  notify,
} from "../common.js";

const router = Router();
// Farmers paste an OpenStreetMap marker link instead of typing coordinates.
function stallPin(link) {
  let url;
  try { url = new URL(link); } catch { throw bad("Paste a valid OpenStreetMap marker link"); }
  if (url.protocol !== "https:" || !["openstreetmap.org", "www.openstreetmap.org"].includes(url.hostname))
    throw bad("Use an HTTPS OpenStreetMap marker link");
  const latitude = Number(url.searchParams.get("mlat"));
  const longitude = Number(url.searchParams.get("mlon"));
  if (!url.searchParams.has("mlat") || !url.searchParams.has("mlon") ||
      !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      Math.abs(latitude) > 90 || Math.abs(longitude) > 180)
    throw bad("The map link must include a marker (mlat and mlon)");
  return { latitude, longitude };
}
// Public registration never accepts the admin role.
const reg = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["customer", "farmer"]),
  phone: z.string().min(6),
  address: z.string().min(3),
  business: z.string().optional(),
  category: z.string().optional(),
});
router.post(
  "/api/auth/register",
  asyncRoute(async (req, res) => {
    const data = reg.parse(req.body);
    if (data.role === "farmer" && !data.business?.trim())
      throw bad("Stall name required");
    if (await User.exists({ email: data.email.toLowerCase() }))
      throw bad("Email already registered", 409);
    const u = await User.create({
      ...data,
      passwordHash: await bcrypt.hash(data.password, 12),
      status: data.role === "farmer" ? "pending" : "active",
    });
    if (u.role === "farmer") {
      const admin = await User.findOne({ role: "admin" });
      if (admin) await notify(admin.id, "Farmer approval", `${u.business} is waiting for approval`);
    }
    res.status(201).json({
      user: publicUser(u),
      message:
        u.status === "pending" ? "Awaiting admin approval" : "Account created",
    });
  }),
);
// The private setup key can create only the first admin.
router.post(
  "/api/auth/admin/setup",
  asyncRoute(async (req, res) => {
    if (
      !process.env.ADMIN_SETUP_KEY ||
      req.headers["x-setup-key"] !== process.env.ADMIN_SETUP_KEY
    )
      throw bad("Invalid setup key", 403);
    if (await User.exists({ role: "admin" }))
      throw bad("Admin account already exists", 409);
    const data = z
      .object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(8),
      })
      .parse(req.body);
    const u = await User.create({
      ...data,
      role: "admin",
      passwordHash: await bcrypt.hash(data.password, 12),
    });
    res.status(201).json({ user: publicUser(u) });
  }),
);
router.post(
  "/api/auth/login",
  asyncRoute(async (req, res) => {
    const email = String(req.body.email || "").toLowerCase();
    const u = await User.findOne({ email });
    if (
      !u ||
      !(await bcrypt.compare(String(req.body.password || ""), u.passwordHash))
    )
      throw bad("Invalid email or password", 401);
    if ((req.body.area === "admin") !== (u.role === "admin"))
      throw bad(u.role === "admin" ? "Use the admin sign in" : "Use the customer / farmer sign in", 403);
    if (u.status !== "active")
      throw bad(
        u.status === "pending"
          ? "Farmer account awaiting admin approval"
          : "Account suspended",
        403,
      );
    const token = tokenFor(u);
    res.json({ user: publicUser(u), token });
  }),
);
router.post("/api/auth/logout", (req, res) => {
  res.json({ ok: true });
});
router.get("/api/auth/me", auth, (req, res) => res.json(publicUser(req.user)));
router.patch(
  "/api/profile",
  auth,
  asyncRoute(async (req, res) => {
    const allowed = [
      "name",
      "phone",
      "address",
      "business",
      "image",
      "category",
      "markets",
      "operatingDays",
      "pickupSlots",
      "cutoffHours",
    ];
    const updates = {};
    for (const key of allowed)
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    if (req.body.stallMapUrl !== undefined) {
      if (req.user.role !== "farmer") throw bad("Only farmers can set a stall pin", 403);
      if (req.body.stallMapUrl) Object.assign(updates, stallPin(req.body.stallMapUrl));
    }
    if (req.user.role !== "farmer")
      for (const key of ["business", "image", "category", "markets", "operatingDays", "pickupSlots", "cutoffHours"])
        delete updates[key];
    if (updates.image !== undefined &&
        !/^\/api\/uploads\/[0-9a-f]{24}$/i.test(updates.image) &&
        !/^https:\/\/\S+$/i.test(updates.image))
      throw bad("Upload a stall image or use a secure image URL");
    if (updates.markets !== undefined) {
      if (!Array.isArray(updates.markets)) throw bad("Choose valid markets");
      const marketIds = updates.markets.map(id);
      if (await Market.countDocuments({ _id: { $in: marketIds }, active: true }) !== new Set(marketIds).size)
        throw bad("Choose an active market");
      updates.markets = marketIds;
    }
    if (updates.cutoffHours !== undefined && (!Number.isFinite(Number(updates.cutoffHours)) || Number(updates.cutoffHours) < 0)) throw bad("Invalid cutoff hours");
    if (updates.operatingDays !== undefined && !Array.isArray(updates.operatingDays)) throw bad("Invalid operating days");
    if (updates.pickupSlots !== undefined && (!Array.isArray(updates.pickupSlots) || updates.pickupSlots.some(slot => !/^([01]\d|2[0-3]):[0-5]\d[–-]([01]\d|2[0-3]):[0-5]\d$/.test(slot)))) throw bad("Use pickup slots like 09:00–09:30");
    Object.assign(req.user, updates);
    if (req.user.role === "farmer" && !req.user.business)
      throw bad("Business required");
    await req.user.save();
    res.json(publicUser(req.user));
  }),
);
router.get("/api/favorites", auth, role("customer"), (req, res) =>
  res.json(req.user.favorites),
);
router.post(
  "/api/favorites/:type/:id",
  auth,
  role("customer"),
  asyncRoute(async (req, res) => {
    const types = { products: Product, farmers: User, markets: Market };
    const Model = types[req.params.type];
    if (!Model) throw bad("Invalid favorite type");
    const target = id(req.params.id);
    const found = await Model.findById(target);
    if (!found || (req.params.type === "farmers" && found.role !== "farmer"))
      throw bad("Item not found", 404);
    const list = req.user.favorites[req.params.type];
    const index = list.findIndex((x) => String(x) === target);
    if (index < 0) list.push(target);
    else list.splice(index, 1);
    await req.user.save();
    res.json(req.user.favorites);
  }),
);
router.get(
  "/api/notifications",
  auth,
  asyncRoute(async (req, res) =>
    res.json(
      await Notification.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .limit(50),
    ),
  ),
);
router.patch(
  "/api/notifications/:id/read",
  auth,
  asyncRoute(async (req, res) => {
    const n = await Notification.findOneAndUpdate(
      { _id: id(req.params.id), user: req.user.id },
      { read: true },
      { new: true },
    );
    if (!n) throw bad("Notification not found", 404);
    res.json(n);
  }),
);

export default router;
