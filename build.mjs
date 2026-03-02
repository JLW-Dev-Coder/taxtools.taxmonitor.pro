// build.mjs
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

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

  logList("Copying files", rootFiles.filter(f => exists(path.join(ROOT, f))));
  logList("Copying folders", rootDirs.filter(d => exists(path.join(ROOT, d))));

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

  console.log("\n✅ Build complete: dist/ created.");
}

build();