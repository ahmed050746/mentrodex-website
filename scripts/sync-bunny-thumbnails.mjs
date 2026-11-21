/**
 * Build-time: refresh Bunny poster URLs in content files (run: npm run sync:bunny-thumbs).
 * Requires network; skips files that fail without failing the process.
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

async function oEmbedThumb(bunnyRef) {
  const m = bunnyRef.match(/^bunny:(\d+)\/(.+)$/i);
  if (!m) return null;
  const embed = `https://player.mediadelivery.net/embed/${m[1]}/${m[2]}`;
  const url = `https://video.bunnycdn.com/oembed?url=${encodeURIComponent(embed)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return data.thumbnail_url?.trim() || null;
}

function upsertThumbnailField(fileText, id, thumbUrl) {
  const idPattern = new RegExp(
    `(id:\\s*"${id}"[\\s\\S]*?bunny:\\s*"[^"]+")(\\s*,?)`,
    "m",
  );
  const match = fileText.match(idPattern);
  if (!match) return fileText;

  const block = match[0];
  if (/thumbnail:\s*"/.test(block)) {
    return fileText.replace(
      new RegExp(`(id:\\s*"${id}"[\\s\\S]*?)thumbnail:\\s*"[^"]*"`),
      `$1thumbnail: "${thumbUrl}"`,
    );
  }
  return fileText.replace(
    idPattern,
    `$1,\n    thumbnail: "${thumbUrl}"$2`,
  );
}

async function main() {
  const testiPath = path.join(root, "src/content/testimonial-videos.ts");
  const lecPath = path.join(root, "src/content/lecture-videos.ts");

  let testi = fs.readFileSync(testiPath, "utf8");
  let lec = fs.readFileSync(lecPath, "utf8");

  const testiIds = [...testi.matchAll(/id:\s*"(testi-\d+)"/g)].map((m) => m[1]);
  const lecIds = [...lec.matchAll(/id:\s*"(lec-\d+)"/g)].map((m) => m[1]);

  for (const id of testiIds) {
    const bunny = testi.match(
      new RegExp(`id:\\s*"${id}"[\\s\\S]*?bunny:\\s*"([^"]+)"`),
    )?.[1];
    if (!bunny) continue;
    const thumb = await oEmbedThumb(bunny);
    if (thumb) testi = upsertThumbnailField(testi, id, thumb);
  }

  for (const id of lecIds) {
    const bunny = lec.match(
      new RegExp(`id:\\s*"${id}"[\\s\\S]*?bunny:\\s*"([^"]+)"`),
    )?.[1];
    if (!bunny) continue;
    const thumb = await oEmbedThumb(bunny);
    if (thumb) lec = upsertThumbnailField(lec, id, thumb);
  }

  fs.writeFileSync(testiPath, testi);
  fs.writeFileSync(lecPath, lec);
  console.log("Bunny thumbnails synced into content files.");
}

main().catch((err) => {
  console.warn("sync-bunny-thumbnails:", err.message);
  process.exit(0);
});