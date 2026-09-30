// Farmer image uploads are stored in MongoDB GridFS.
import { Router } from "express";
import { Readable } from "node:stream";
import mongoose from "mongoose";
import multer from "multer";
import rateLimit from "express-rate-limit";
import { asyncRoute, auth, bad, id, role } from "../common.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 3 * 1024 * 1024 } });
const bucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "productImages" });

const imageType = (file) => {
  const data = file.buffer;
  if (file.mimetype === "image/jpeg" && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return "image/jpeg";
  if (file.mimetype === "image/png" && data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return "image/png";
  if (file.mimetype === "image/webp" && data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  throw bad("Upload a JPG, PNG or WebP image", 400);
};

router.post("/api/farmer/uploads", auth, role("farmer"),
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 }), upload.single("image"),
  asyncRoute(async (req, res) => {
    if (!req.file) throw bad("Choose an image");
    const contentType = imageType(req.file);
    const stream = bucket().openUploadStream(req.file.originalname, {
      metadata: { farmer: req.user.id, contentType },
    });
    await new Promise((resolve, reject) => {
      Readable.from(req.file.buffer).pipe(stream).on("finish", resolve).on("error", reject);
    });
    res.status(201).json({ image: `/api/uploads/${stream.id}` });
  }),
);

router.get("/api/uploads/:id", asyncRoute(async (req, res) => {
  const fileId = new mongoose.Types.ObjectId(id(req.params.id));
  const file = await bucket().find({ _id: fileId }).next();
  if (!file) throw bad("Image not found", 404);
  res.set({ "Content-Type": file.metadata.contentType, "Cache-Control": "public, max-age=31536000, immutable" });
  bucket().openDownloadStream(fileId).on("error", error => {
    if (!res.headersSent) res.status(500).end();
    else res.destroy(error);
  }).pipe(res);
}));

export default router;
