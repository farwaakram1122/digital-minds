// Shared authentication, validation and notification helpers.
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { User, Notification } from "./models.js";
import { sendMail } from "./mail.js";

export const asyncRoute = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
export const bad = (message, code = 400) =>
  Object.assign(new Error(message), { status: code });
export const id = (value) => {
  if (!mongoose.isValidObjectId(value)) throw bad("Invalid ID");
  return value;
};
export const resolve = async (Model, value) =>
  mongoose.isValidObjectId(value)
    ? Model.findById(value)
    : Model.findOne({ legacyId: value });
export const publicUser = (u) => ({
  id: String(u._id),
  legacyId: u.legacyId,
  name: u.name,
  email: u.email,
  role: u.role,
  status: u.status,
  phone: u.phone,
  address: u.address,
  business: u.business,
  image: u.image,
  category: u.category,
  markets: u.markets,
  operatingDays: u.operatingDays,
  pickupSlots: u.pickupSlots,
  cutoffHours: u.cutoffHours,
  latitude: u.latitude,
  longitude: u.longitude,
  favorites: u.favorites,
});
export const tokenFor = (u) =>
  jwt.sign({ sub: String(u._id) }, process.env.JWT_SECRET, {
    expiresIn: "12h",
  });
export const auth = asyncRoute(async (req, res, next) => {
  const token = /^Bearer (.+)$/i.exec(req.headers.authorization || "")?.[1];
  if (!token) throw bad("Sign in required", 401);
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw bad("Session expired", 401);
  }
  req.user = await User.findById(payload.sub);
  if (!req.user || req.user.status !== "active")
    throw bad("Account unavailable", 403);
  next();
});
export const role =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.user.role) ? next() : next(bad("Access denied", 403));
export const notify = async (user, title, message) => {
  const saved = await Notification.create({ user, title, message });
  const account = await User.findById(user).select("email");
  if (account?.email) void sendMail(account.email, title, message);
  return saved;
};
