// Express serves the HTML panels and JSON API from one backend.
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import { z } from "zod";
import authRoutes from "./routes/auth.js";
import catalogRoutes from "./routes/catalog.js";
import orderRoutes from "./routes/orders.js";
import adminRoutes from "./routes/admin.js";
import messageRoutes from "./routes/messages.js";
import uploadRoutes from "./routes/uploads.js";
import { prepareCatalog } from "./seed.js";

const app = express();
if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);


app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        frameSrc: ["https://www.openstreetmap.org"],
        connectSrc: ["'self'"],
      },
    },
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      const localVite = /^http:\/\/(localhost|127\.0\.0\.1):51\d{2}$/.test(
        origin || "",
      );
      if (!origin || localVite || origin === process.env.CLIENT_ORIGIN)
        return callback(null, true);
      callback(new Error("Frontend origin not allowed"));
    },
  }),
);
app.use(express.json({ limit: "1mb" }));


// These HTML pages and assets are served by the backend itself.
app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "MarketLink API is running",
  });
});

app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 60 }));
app.use("/api/contact", rateLimit({ windowMs: 15 * 60 * 1000, limit: 10 }));
app.use(authRoutes, catalogRoutes, orderRoutes, adminRoutes, messageRoutes, uploadRoutes);
app.get("/api/health", (req, res) =>
  res.json({ ok: true, database: "connected" }),
);

app.use((error, req, res, next) => {
  const status =
    error.status ||
    (error instanceof z.ZodError ? 400 : error.code === 11000 ? 409 : error.code === "LIMIT_FILE_SIZE" ? 413 : 500);
  if (status === 500) console.error(error);
  const message =
    error instanceof z.ZodError
      ? error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; ")
      : error.code === 11000
        ? "Duplicate record"
        : error.message;
  res
    .status(status)
    .json({ error: status === 500 ? "Internal server error" : message });
});

if (
  !process.env.MONGODB_URI ||
  !process.env.JWT_SECRET ||
  process.env.JWT_SECRET.length < 32
) {
  throw new Error("Missing backend/.env. Run npm run dev to create it.");
}

try {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 8000,
  });
  await prepareCatalog();
} catch (error) {
  console.error(
    "MongoDB connection failed. Start MongoDB Community Server and retry.",
  );
  console.error(error.message);
  process.exit(1);
}

// Another MarketLink copy may already use 5000. Print the port actually selected.
const firstPort = Number(process.env.PORT) || 5000;
let started = false;
for (let port = firstPort; port < firstPort + 10; port++) {
  const result = await new Promise((resolve) => {
    const server = app.listen(port);
    server.once("listening", () => resolve({ server }));
    server.once("error", (error) => resolve({ error }));
  });
  if (result.server) {
    console.log(`MarketLink running: http://localhost:${port}`);
    started = true;
    break;
  }
  if (result.error.code !== "EADDRINUSE") throw result.error;
  console.log(`Port ${port} is busy. Trying ${port + 1}...`);
}
if (!started) {
  console.error(
    "No available port from 5000 to 5009. Close an older server and retry.",
  );
  process.exitCode = 1;
}
