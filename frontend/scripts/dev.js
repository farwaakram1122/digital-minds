import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const frontend = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const vite = path.join(frontend, "node_modules", "vite", "bin", "vite.js");

// A fresh ZIP has no node_modules. Install packages once, then start Vite.
if (!fs.existsSync(vite)) {
  console.log("Installing frontend packages for the first run...");
  const windows = process.platform === "win32";
  const command = windows ? process.env.ComSpec || "cmd.exe" : "npm";
  const args = windows
    ? ["/d", "/s", "/c", "npm install --no-audit --no-fund"]
    : ["install", "--no-audit", "--no-fund"];
  const install = spawnSync(command, args, { cwd: frontend, stdio: "inherit" });
  if (install.status !== 0) process.exit(install.status || 1);
}

const child = spawn(process.execPath, [vite, "--host", "localhost"], {
  cwd: frontend,
  stdio: "inherit",
});
child.on("exit", (code) => {
  process.exitCode = code || 0;
});
process.on("SIGINT", () => child.kill("SIGINT"));
