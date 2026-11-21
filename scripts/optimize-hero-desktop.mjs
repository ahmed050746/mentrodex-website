import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = path.join(root, "public", "img", "hero-mentor-desktop.png");
const out = path.join(root, "public", "img", "hero-mentor-desktop.webp");

await sharp(src)
  .webp({ quality: 82, effort: 6 })
  .toFile(out);

const size = fs.statSync(out).size;
console.log(`Wrote ${path.basename(out)} (${Math.round(size / 1024)} KB)`);