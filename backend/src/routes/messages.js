// Contact messages and replies are scoped to the right participants.
import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User, Order, Message } from "../models.js";
import { asyncRoute, auth, bad, id, notify } from "../common.js";
import { sendMail } from "../mail.js";

const router = Router();

// The homepage accepts guest messages. Order-specific messages require the order owner.
router.post("/api/contact", asyncRoute(async (req, res) => {
  const data = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    subject: z.string().min(2).max(120),
    message: z.string().min(5).max(2000),
    target: z.enum(["admin", "farmer", "customer"]).default("admin"),
    farmerId: z.string().optional(),
    orderId: z.string().optional(),
  }).parse(req.body);
  const token = /^Bearer (.+)$/i.exec(req.headers.authorization || "")?.[1];
  let sender;
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      sender = await User.findById(payload.sub);
    } catch { throw bad("Sign in again to send your message", 401); }
  }
  let order;
  if (data.orderId) {
    if (!sender) throw bad("Sign in to ask about an order", 401);
    order = await Order.findById(id(data.orderId));
    if (!order || ![String(order.customer), String(order.farmer)].includes(String(sender.id)))
      throw bad("Order not found", 404);
  }
  let recipient;
  if (data.target === "admin") recipient = await User.findOne({ role: "admin", status: "active" });
  if (data.target === "farmer") {
    const farmerId = order ? order.farmer : id(data.farmerId);
    recipient = await User.findOne({ _id: farmerId, role: "farmer", status: "active" });
    if (order && String(sender.id) !== String(order.customer)) throw bad("Customer order required", 403);
  }
  if (data.target === "customer") {
    if (!order || String(sender.id) !== String(order.farmer)) throw bad("Farmer order required", 403);
    recipient = await User.findById(order.customer);
  }
  if (!recipient || recipient.status !== "active") throw bad("Recipient unavailable", 404);
  const message = await Message.create({
    sender: sender?.id,
    recipient: recipient.id,
    order: order?.id,
    name: sender?.name || data.name,
    email: sender?.email || data.email,
    subject: data.subject,
    message: data.message,
  });
  await notify(recipient.id, `Message: ${data.subject}`,
    `${message.name} (${message.email})${order ? ` · Order #${String(order.id).slice(-7).toUpperCase()}` : ""}: ${message.message}`);
  res.status(201).json({ id: message.id, message: "Message sent" });
}));

router.get("/api/messages", auth, asyncRoute(async (req, res) => {
  res.json(await Message.find({ $or: [{ sender: req.user.id }, { recipient: req.user.id }] })
    .sort({ createdAt: -1 }).limit(100));
}));

router.patch("/api/messages/:id/reply", auth, asyncRoute(async (req, res) => {
  const reply = z.string().min(2).max(2000).parse(req.body.reply);
  const message = await Message.findOne({ _id: id(req.params.id), recipient: req.user.id });
  if (!message) throw bad("Message not found", 404);
  if (message.reply) throw bad("Already replied", 409);
  message.reply = reply;
  message.repliedAt = new Date();
  await message.save();
  if (message.sender) await notify(message.sender, `Reply: ${message.subject}`, reply);
  else void sendMail(message.email, `Reply: ${message.subject}`, reply);
  res.json(message);
}));

export default router;
