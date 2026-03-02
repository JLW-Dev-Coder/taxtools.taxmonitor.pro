// build.mjs
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const WRANGLER_TOML = path.join(ROOT, "workers", "api", "wrangler.toml");

function exists(p) {
  try { fs.accessSync(p); return true; } catch { return false; }
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function emptyDir(dir) {
  if (!exists(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true });
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDir(srcDir, destDir) {
  if (!exists(srcDir)) return;
  ensureDir(destDir);

  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);

    if (entry.isDirectory()) copyDir(src, dest);
    if (entry.isFile()) copyFile(src, dest);
  }
}

function logList(title, items) {
  const sorted = [...items].sort((a, b) => a.localeCompare(b));
  console.log(`\n${title}`);
  for (const i of sorted) console.log(`- ${i}`);
}

function readText(p) {
  return fs.readFileSync(p, "utf8");
}

function writeText(p, content) {
  fs.writeFileSync(p, content, "utf8");
}

function walkFiles(dir, predicate) {
  const out = [];
  if (!exists(dir)) return out;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full, predicate));
    if (entry.isFile() && predicate(full)) out.push(full);
  }
  return out;
}

function injectPartialsIntoHtml(distRoot) {
  const footerPath = path.join(ROOT, "partials", "footer.html");
  const headerPath = path.join(ROOT, "partials", "header.html");

  const hasFooter = exists(footerPath);
  const hasHeader = exists(headerPath);

  if (!hasFooter || !hasHeader) {
    const missing = [
      !hasFooter ? "partials/footer.html" : null,
      !hasHeader ? "partials/header.html" : null,
    ].filter(Boolean);
    throw new Error(`Missing partial(s): ${missing.join(", ")}`);
  }

  const footerHtml = readText(footerPath);
  const headerHtml = readText(headerPath);

  const htmlFiles = walkFiles(distRoot, (p) => {
    const rel = path.relative(distRoot, p).replace(/\\/g, "/");
    if (!rel.endsWith(".html")) return false;
    if (rel.startsWith("partials/")) return false;
    return true;
  }).sort((a, b) => a.localeCompare(b));

  let changedCount = 0;

  for (const file of htmlFiles) {
    const original = readText(file);

    const needsFooter = original.includes("<!-- PARTIAL:footer -->");
    const needsHeader = original.includes("<!-- PARTIAL:header -->");
    if (!needsFooter && !needsHeader) continue;

    let updated = original;
    if (needsHeader) updated = updated.replace("<!-- PARTIAL:header -->", headerHtml);
    if (needsFooter) updated = updated.replace("<!-- PARTIAL:footer -->", footerHtml);

    if (updated !== original) {
      writeText(file, updated);
      changedCount++;
    }
  }

  console.log(`\n✅ Partials injected into HTML files: ${changedCount}`);
}

function parseWranglerOrganizationVars(wranglerTomlPath) {
  if (!exists(wranglerTomlPath)) {
    throw new Error(`wrangler.toml not found at: ${wranglerTomlPath}`);
  }

  const raw = readText(wranglerTomlPath);

  // Only parse simple string assignments:
  // MY_ORGANIZATION_FOO = "bar"
  // (We intentionally ignore arrays/tables/etc.)
  const vars = {};

  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*(MY_ORGANIZATION_[A-Z0-9_]+)\s*=\s*"(.*)"\s*$/);
    if (!m) continue;

    const key = m[1];
    const value = m[2].replace(/\\"/g, "\"");
    vars[key] = value;
  }

  return vars;
}

function replaceTokensInHtml(html, vars) {
  return html.replace(/\{\{([A-Z0-9_]+)\}\}/g, (full, key) => {
    if (Object.prototype.hasOwnProperty.call(vars, key)) return String(vars[key]);
    return full; // leave unknown tokens intact
  });
}

function injectWranglerVarsIntoDistHtml(distRoot, wranglerTomlPath) {
  const vars = parseWranglerOrganizationVars(wranglerTomlPath);

  const keys = Object.keys(vars).sort((a, b) => a.localeCompare(b));
  if (keys.length === 0) {
    console.log(`\nℹ️ No MY_ORGANIZATION_* vars found in ${path.relative(ROOT, wranglerTomlPath)}`);
    return;
  }

  logList("Injecting build tokens from wrangler.toml", keys);

  const htmlFiles = walkFiles(distRoot, (p) => p.toLowerCase().endsWith(".html"))
    .sort((a, b) => a.localeCompare(b));

  let changedCount = 0;

  for (const file of htmlFiles) {
    const original = readText(file);
    const updated = replaceTokensInHtml(original, vars);

    if (updated !== original) {
      writeText(file, updated);
      changedCount++;
    }
  }

  console.log(`\n✅ Build tokens injected into HTML files: ${changedCount}`);
}

function build() {
  // Clean
  emptyDir(DIST);
  ensureDir(DIST);

  // Files (root)
  const rootFiles = [
    "_redirects",
    "about.html",
    "faq.html",
    "help-center.html",
    "index.html",
    "robots.txt",
    "sitemap.xml",
    "support.html",
    "tools.html",
  ];

  // Folders (root)
  const rootDirs = [
    "_sdk",
    "assets",
    "legal",
    "partials",
    "scripts",
    "styles",
  ];

  logList("Copying files", rootFiles.filter((f) => exists(path.join(ROOT, f))));
  logList("Copying folders", rootDirs.filter((d) => exists(path.join(ROOT, d))));

  for (const file of rootFiles) {
    const src = path.join(ROOT, file);
    if (exists(src)) copyFile(src, path.join(DIST, file));
  }

  for (const dir of rootDirs) {
    const src = path.join(ROOT, dir);
    if (exists(src)) copyDir(src, path.join(DIST, dir));
  }

  // Sanity check
  const distIndex = path.join(DIST, "index.html");
  if (!exists(distIndex)) {
    throw new Error("dist/index.html missing after build. Check index.html exists at repo root.");
  }

  // Inject partials (header/footer markers)
  injectPartialsIntoHtml(DIST);

  // Inject MY_ORGANIZATION_* tokens into dist HTML from workers/api/wrangler.toml
  injectWranglerVarsIntoDistHtml(DIST, WRANGLER_TOML);

  console.log("\n✅ Build complete: dist/ created.");
}

build();
