import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const srcHtml = "c:/Users/Ahmed/Documents/code/19-nov/shopify-course/index.html";
const outFile = path.join(root, "src/components/home/HomeLegacyMarkup.tsx");

let html = fs.readFileSync(srcHtml, "utf8");
const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
if (!bodyMatch) throw new Error("No body found");
let body = bodyMatch[1];

body = body.replace(/<script[\s\S]*?<\/script>/gi, "");
body = body.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");

// Phase 1: simplified desktop hero instead of React embed mount
body = body.replace(
  /<div class="d-stage m-stage d-stage--react" id="desktop-hero-stage">[\s\S]*?<\/div>\s*(?=<main class="d-main">)/,
  `<div class="d-stage m-stage d-stage--static-fallback" id="desktop-hero-stage">
      <header class="d-header d-header--fallback">
        <div class="d-header__inner">
          <a class="d-logo" href="/" aria-label="Mentrodex home">
            <span class="d-logo__text">Mentrodex</span>
          </a>
          <a href="/pay" class="nav-enroll d-nav-enroll">
            <span class="nav-enroll__label">Enroll Now</span>
          </a>
        </div>
      </header>
      <section class="d-hero-fallback" aria-labelledby="d-hero-fallback-title">
        <div class="d-hero-fallback__inner">
          <h1 id="d-hero-fallback-title" class="d-hero-fallback__title">
            <span>Don&apos;t just build a store,</span>
            <span class="d-hero-fallback__accent">Learn to Drive Sales</span>
          </h1>
          <a class="d-btn d-btn--submit d-hero-fallback__cta" href="/pay">Enroll Now</a>
        </View>
      </section>
    </div>
`,
);

body = body
  .replace(/\bclass=/g, "className=")
  .replace(/\bfor=/g, "htmlFor=")
  .replace(/\btabindex=/g, "tabIndex=")
  .replace(/\breadonly\b/g, "readOnly")
  .replace(/\bautocomplete=/g, "autoComplete=")
  .replace(/\bautofocus\b/g, "autoFocus")
  .replace(/\bmaxlength=/g, "maxLength=")
  .replace(/\bminlength=/g, "minLength=")
  .replace(/\binputmode=/g, "inputMode=")
  .replace(/\bviewbox=/gi, "viewBox=")
  .replace(/\bstroke-width=/g, "strokeWidth=")
  .replace(/\bstroke-linecap=/g, "strokeLinecap=")
  .replace(/\bstroke-linejoin=/g, "strokeLinejoin=")
  .replace(/\bfill-rule=/g, "fillRule=")
  .replace(/\bclip-rule=/g, "clipRule=")
  .replace(/\bxmlns=/g, "xmlns=")
  .replace(/\bfetchpriority=/g, "fetchPriority=")
  .replace(/\bdecoding=/g, "decoding=")
  .replace(/\bloading=/g, "loading=")
  .replace(/\bsrcset=/g, "srcSet=")
  .replace(/\brows="(\d+)"/g, 'rows={$1}')
  .replace(/\sstyle="[^"]*"/gi, "");

body = body.replace(/\s(onclick|onchange)=[\"'][^\"']*[\"']/gi, "");
body = body.replace(/<!--[\s\S]*?-->/g, "");

body = body
  .replace(/href="index\.html"/g, 'href="/"')
  .replace(/href="pay\.html"/g, 'href="/pay"')
  .replace(/href="contact\.html"/g, 'href="/contact"')
  .replace(/src="img\//g, 'src="/img/')
  .replace(/srcset="img\//g, 'srcset="/img/')
  .replace(/data-thumb="img\//g, 'data-thumb="/img/');

// Fix mistaken View tag from template typo
body = body.replace(/<View /g, "<div ");
body = body.replace(/<\/View>/g, "</div>");

// Self-close void tags in JSX
const voidTags = ["img", "input", "br", "source", "meta", "link", "hr", "area", "col", "embed", "wbr"];
for (const tag of voidTags) {
  const re = new RegExp(`<${tag}([^>]*?)(?<!/)>`, "gi");
  body = body.replace(re, (m, attrs) => `<${tag}${attrs} />`);
}

const out = `/* Auto-generated from shopify-course/index.html — edit via scripts/convert-home-body.mjs */
export default function HomeLegacyMarkup() {
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
console.log("Wrote", outFile, "length", out.length);