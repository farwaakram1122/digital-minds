import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const backend = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const npm =
  process.platform === "win32" ? process.env.ComSpec || "cmd.exe" : "npm";

// A fresh ZIP needs packages, but later runs go straight to the server.
if (["express", "nodemailer", "multer"].some(name => !fs.existsSync(path.join(backend, "node_modules", name)))) {
  console.log("Installing backend packages for the first run...");
  const args =
    process.platform === "win32"
      ? ["/d", "/s", "/c", "npm install --no-audit --no-fund"]
      : ["install", "--no-audit", "--no-fund"];
  const install = spawnSync(npm, args, {
    cwd: backend,
    stdio: "inherit",
  });
  if (install.status !== 0) process.exit(install.status || 1);
}

const envFile = path.join(backend, ".env");
if (!fs.existsSync(envFile)) {
  const secret = () => crypto.randomBytes(48).toString("hex");
  fs.writeFileSync(
    envFile,
    [
      "PORT=5000",
      "MONGODB_URI=mongodb://127.0.0.1:27017/marketlink",
      `JWT_SECRET=${secret()}`,
      "CLIENT_ORIGIN=http://localhost:5173",
      `ADMIN_SETUP_KEY=${secret()}`,
      "# Gmail SMTP (like EduTrack): SMTP_HOST=smtp.gmail.com, SMTP_PORT=587, SMTP_USER=your Gmail, SMTP_PASS=App Password, SMTP_FROM=MarketLink <your Gmail>.",
      "",
    ].join("\n"),
    { flag: "wx" },
  );
  console.log("Created backend/.env for local development.");
}

const child = spawn(process.execPath, ["--watch", "src/server.js"], {
  cwd: backend,
  stdio: "inherit",
  env: process.env,
});
child.on("exit", (code) => {
  process.exitCode = code || 0;
});
process.on("SIGINT", () => child.kill("SIGINT"));
