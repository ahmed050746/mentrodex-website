import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const [htmlPath, outRel, componentName, client] = process.argv.slice(2);
if (!htmlPath || !outRel || !componentName) {
  console.error(
    "Usage: node convert-page-body.mjs <html> <out.tsx> <ComponentName> [client]",
  );
  process.exit(1);
}

const outFile = path.join(root, outRel);
let html = fs.readFileSync(htmlPath, "utf8");
const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
if (!bodyMatch) throw new Error("No body");

let body = bodyMatch[1];
body = body.replace(/<script[\s\S]*?<\/script>/gi, "");
body = body.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
body = body.replace(/<!--[\s\S]*?-->/g, "");

body = body
  .replace(/\bclass=/g, "className=")
  .replace(/\bfor=/g, "htmlFor=")
  .replace(/\btabindex=/g, "tabIndex=")
  .replace(/\bautocomplete=/g, "autoComplete=")
  .replace(/\bmaxlength=/g, "maxLength=")
  .replace(/\binputmode=/g, "inputMode=")
  .replace(/\bviewbox=/gi, "viewBox=")
  .replace(/\bstroke-width=/g, "strokeWidth=")
  .replace(/\bstroke-linecap=/g, "strokeLinecap=")
  .replace(/\bstroke-linejoin=/g, "strokeLinejoin=")
  .replace(/\bsrcset=/g, "srcSet=")
  .replace(/\brows="(\d+)"/g, 'rows={$1}')
  .replace(/\sstyle="[^"]*"/gi, "");

body = body.replace(/\s(onclick|onchange)=[\"'][^\"']*[\"']/gi, "");
body = body
  .replace(/href="index\.html"/g, 'href="/"')
  .replace(/href="pay\.html"/g, 'href="/pay"')
  .replace(/href="contact\.html"/g, 'href="/contact"')
  .replace(/src="img\//g, 'src="/img/')
  .replace(/srcset="img\//g, 'srcset="/img/');

const voidTags = ["img", "input", "br", "source", "meta", "link", "hr"];
for (const tag of voidTags) {
  const re = new RegExp(`<${tag}([^>]*?)(?<!/)>`, "gi");
  body = body.replace(re, (m, attrs) => `<${tag}${attrs} />`);
}

const clientDirective = client === "client" ? `"use client";\n\n` : "";
const out = `${clientDirective}/* Generated from ${path.basename(htmlPath)} */
export default function ${componentName}() {
  return (
    <>
${body
  .split("\n")
  .map((line) => "      " + line)
  .join("\n")}
    </>
  );
}
`;

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, out);
console.log("Wrote", outFile);