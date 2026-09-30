// Add starting markets and categories without replacing user data.
import "dotenv/config";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { seedMarkets, categories } from "../../frontend/src/data/platformData.js";
import { User, Market, Product, Category, Order, Review, Notification, Message } from "./models.js";

// Remove only the known demo accounts from earlier ZIP versions, keeping real registrations.
export async function prepareCatalog() {
  // Earlier versions indexed only product reviews. Allow a separate market review.
  try { await Review.collection.dropIndex("customer_1_order_1_product_1"); }
  catch (error) { if (![26, 27].includes(error.code) && !["IndexNotFound", "NamespaceNotFound"].includes(error.codeName)) throw error; }
  await Review.collection.createIndex({ customer: 1, order: 1, product: 1, market: 1 }, { unique: true });
  const demo = await User.find({ email: /@marketlink\.demo$/ }).select("_id");
  if (demo.length) {
    const users = demo.map((u) => u.id);
    const related = { $or: [{ farmer: { $in: users } }, { customer: { $in: users } }] };
    await Review.deleteMany(related);
    await Order.deleteMany(related);
    await Product.deleteMany({ farmer: { $in: users } });
    await Notification.deleteMany({ user: { $in: users } });
    await Message.deleteMany({ $or: [{ sender: { $in: users } }, { recipient: { $in: users } }] });
    await User.deleteMany({ _id: { $in: users } });
    console.log("Old demo accounts and listings removed.");
  }
  const existing = await Market.find({ legacyId: { $in: seedMarkets.map(m => m.id) } }).select("legacyId image");
  const known = new Map(existing.map(m => [m.legacyId, m]));
  const missing = seedMarkets.filter(m => !known.has(m.id));
  if (missing.length) await Market.insertMany(missing.map((market) => ({
      legacyId: market.id,
      name: market.name,
      address: market.address,
      city: market.city || market.address.split(",").at(-1)?.trim(),
      days: /^(Schedule to be confirmed|Event-based|Online catalogue)/.test(market.day) ? [] : [market.day],
      hours: market.hours,
      image: market.image,
      latitude: market.lat,
      longitude: market.lng,
    })));
  for (const market of seedMarkets) {
    if (known.get(market.id) && !known.get(market.id).image)
      await Market.updateOne({ legacyId: market.id, image: { $in: [null, ""] } }, { $set: { image: market.image } });
  }
  await Market.updateOne(
    { legacyId: "m7", latitude: 31.5204, longitude: 74.3587 },
    { $set: { latitude: 31.50245, longitude: 74.47272, city: "Lahore", address: "Rosa Vista Farms, Burki Road, Lahore" } },
  );
  if (!(await Category.estimatedDocumentCount()))
    await Category.insertMany(categories.map((name) => ({ name })));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!process.env.MONGODB_URI)
    throw new Error("Set MONGODB_URI in backend/.env");
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    await prepareCatalog();
  } finally {
    await mongoose.disconnect();
  }
}
