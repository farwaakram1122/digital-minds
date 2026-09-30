// MongoDB models shared by customer, farmer and admin routes.
import mongoose from "mongoose";
const { Schema, model } = mongoose;
const opts = { timestamps: true };
export const User = model(
  "User",
  new Schema(
    {
      legacyId: String,
      name: { type: String, required: true },
      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
      },
      passwordHash: { type: String, required: true },
      role: {
        type: String,
        enum: ["customer", "farmer", "admin"],
        required: true,
      },
      status: {
        type: String,
        enum: ["active", "pending", "suspended"],
        default: "active",
      },
      phone: String,
      address: String,
      business: String,
      image: String,
      category: String,
      markets: [{ type: Schema.Types.ObjectId, ref: "Market" }],
      operatingDays: [String],
      pickupSlots: [String],
      cutoffHours: { type: Number, default: 2 },
      latitude: Number,
      longitude: Number,
      favorites: {
        products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
        farmers: [{ type: Schema.Types.ObjectId, ref: "User" }],
        markets: [{ type: Schema.Types.ObjectId, ref: "Market" }],
      },
    },
    opts,
  ),
);
User.schema.index({ role: 1 }, { unique: true, partialFilterExpression: { role: "admin" } });
export const Market = model(
  "Market",
  new Schema(
    {
      legacyId: String,
      name: { type: String, required: true },
      address: { type: String, required: true },
      city: String,
      image: String,
      days: [String],
      hours: String,
      latitude: Number,
      longitude: Number,
      active: { type: Boolean, default: true },
    },
    opts,
  ),
);
export const Category = model(
  "Category",
  new Schema({ name: { type: String, required: true, unique: true } }, opts),
);
export const Product = model(
  "Product",
  new Schema(
    {
      legacyId: String,
      farmer: { type: Schema.Types.ObjectId, ref: "User", required: true },
      name: { type: String, required: true },
      category: String,
      description: String,
      image: String,
      price: { type: Number, required: true, min: 0 },
      unit: { type: String, default: "kg" },
      stock: { type: Number, default: 0, min: 0 },
      reserved: { type: Number, default: 0, min: 0 },
      weeklyTemplate: { type: Number, default: 0 },
      available: { type: Boolean, default: true },
      markets: [{ type: Schema.Types.ObjectId, ref: "Market" }],
    },
    opts,
  ),
);
export const Order = model(
  "Order",
  new Schema(
    {
      customer: { type: Schema.Types.ObjectId, ref: "User", required: true },
      farmer: { type: Schema.Types.ObjectId, ref: "User", required: true },
      market: { type: Schema.Types.ObjectId, ref: "Market", required: true },
      items: [
        {
          product: { type: Schema.Types.ObjectId, ref: "Product" },
          name: String,
          image: String,
          price: Number,
          qty: Number,
          unit: String,
        },
      ],
      total: Number,
      pickupDate: Date,
      pickupAt: Date,
      pickupSlot: String,
      notes: String,
      usesReservation: { type: Boolean, default: false },
      status: {
        type: String,
        enum: [
          "placed",
          "accepted",
          "packing",
          "packed",
          "out_for_delivery",
          "ready",
          "completed",
          "declined",
          "cancelled",
        ],
        default: "placed",
      },
    },
    opts,
  ),
);
export const Review = model(
  "Review",
  new Schema(
    {
      customer: { type: Schema.Types.ObjectId, ref: "User", required: true },
      farmer: { type: Schema.Types.ObjectId, ref: "User", required: true },
      product: { type: Schema.Types.ObjectId, ref: "Product" },
      market: { type: Schema.Types.ObjectId, ref: "Market" },
      order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
      rating: { type: Number, min: 1, max: 5, required: true },
      comment: { type: String, default: "" },
      response: String,
    },
    opts,
  ),
);
Review.schema.index({ customer: 1, order: 1, product: 1, market: 1 }, { unique: true });
export const Announcement = model(
  "Announcement",
  new Schema(
    {
      title: { type: String, required: true },
      message: { type: String, required: true },
      active: { type: Boolean, default: true },
    },
    opts,
  ),
);
export const Notification = model(
  "Notification",
  new Schema(
    {
      user: { type: Schema.Types.ObjectId, ref: "User", required: true },
      title: String,
      message: String,
      read: { type: Boolean, default: false },
    },
    opts,
  ),
);
export const Message = model(
  "Message",
  new Schema(
    {
      sender: { type: Schema.Types.ObjectId, ref: "User" },
      recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
      order: { type: Schema.Types.ObjectId, ref: "Order" },
      name: { type: String, required: true },
      email: { type: String, required: true },
      subject: { type: String, required: true },
      message: { type: String, required: true },
      reply: String,
      repliedAt: Date,
    },
    opts,
  ),
);
