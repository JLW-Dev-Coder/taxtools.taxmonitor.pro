// build.mjs
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const WRANGLER_TOML = path.join(ROOT, "workers", "api", "wrangler.toml");

/* ------------------------------------------
 * Shared Utilities
 * ------------------------------------------ */

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
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

    if (entry.isDirectory()) {
      copyDir(src, dest);
      continue;
    }

    if (entry.isFile()) {
      copyFile(src, dest);
    }
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

    if (entry.isDirectory()) {
      out.push(...walkFiles(full, predicate));
      continue;
    }

    if (entry.isFile() && predicate(full)) out.push(full);
  }

  return out;
}

/* ------------------------------------------
 * Partials Injection
 * ------------------------------------------ */

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

/* ------------------------------------------
 * Build Token Injection (wrangler.toml)
 * ------------------------------------------ */

function parseWranglerOrganizationVars(wranglerTomlPath) {
  if (!exists(wranglerTomlPath)) {
    // Not fatal for a static build, but keep behavior explicit.
    console.log(`\nℹ️ wrangler.toml not found at: ${wranglerTomlPath}`);
    return {};
  }

  const raw = readText(wranglerTomlPath);
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
    return full;
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

/* ------------------------------------------
 * Build
 * ------------------------------------------ */

function build() {
  emptyDir(DIST);
  ensureDir(DIST);

  // Root files to publish (based on your current tree).
  // Excludes README/MARKET/AGENTS by default since those are not site assets.
  const rootFiles = [
    "_redirects",
    "about.html",
    "contact.html",
    "faq.html",
    "help-center.html",
    "index.html",
    "login.html",
    "robots.txt",
    "sitemap.xml",
  ];

  // Root folders to publish (based on your current tree).
  // Excludes audit/ and workers/ (not site output).
  const rootDirs = [
    "_sdk",
    "about-games",
    "assets",
    "games",
    "legal",
    "partials",
    "scripts",
    "styles",
  ];

  const existingFiles = rootFiles.filter((f) => exists(path.join(ROOT, f)));
  const existingDirs = rootDirs.filter((d) => exists(path.join(ROOT, d)));

  logList("Copying files", existingFiles);
  logList("Copying folders", existingDirs);

  for (const file of existingFiles) {
    copyFile(path.join(ROOT, file), path.join(DIST, file));
  }

  for (const dir of existingDirs) {
    copyDir(path.join(ROOT, dir), path.join(DIST, dir));
  }

  const distIndex = path.join(DIST, "index.html");
  if (!exists(distIndex)) {
    throw new Error("dist/index.html missing after build. Check index.html exists at repo root.");
  }

  injectPartialsIntoHtml(DIST);
  injectWranglerVarsIntoDistHtml(DIST, WRANGLER_TOML);

  console.log("\n✅ Build complete: dist/ created.");
}

build();

