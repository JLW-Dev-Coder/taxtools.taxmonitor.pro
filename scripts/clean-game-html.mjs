#!/usr/bin/env node
// Strip legacy SDK script refs, Cloudflare challenge scripts, and
// the tax-jargon-game login gate from every HTML file in public/games.
// See .claude/CLAUDE.md — frontend is no longer gated by the legacy
// Worker SDKs; those must be removed so games load directly.

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";

const GAMES_DIR = join(process.cwd(), "public", "games");

const SCRIPT_TAG_RE = /<script\b[^>]*>[\s\S]*?<\/script>/gi;
const SCRIPT_SELF_CLOSING_RE = /<script\b[^>]*\/\s*>/gi;

function shouldDropScript(tag) {
  // External SDK script tags
  if (/src\s*=\s*["'][^"']*_sdk\/(element_sdk|data_sdk)\.js[^"']*["']/i.test(tag)) {
    return true;
  }
  // Inline script blocks referencing the SDKs or the CF challenge script
  if (/window\.elementSdk\b/.test(tag)) return true;
  if (/window\.dataSdk\b/.test(tag)) return true;
  if (/challenges\.cloudflare\.com/i.test(tag)) return true;
  return false;
}

function cleanHtml(src, fileName) {
  let out = src;

  // Remove full <script>...</script> blocks that match any drop rule.
  out = out.replace(SCRIPT_TAG_RE, (match) => (shouldDropScript(match) ? "" : match));

  // Remove self-closing <script ... /> tags that match (rare, but safe).
  out = out.replace(SCRIPT_SELF_CLOSING_RE, (match) => (shouldDropScript(match) ? "" : match));

  // Collapse runs of blank lines left behind.
  out = out.replace(/(\r?\n){3,}/g, "\n\n");

  // tax-jargon-game: strip the access-gate hidden class so the home screen
  // renders by default now that the gating JS has been removed.
  if (fileName === "tax-jargon-game.html") {
    out = out.replace(
      /<div id="home-screen" class="hidden /,
      '<div id="home-screen" class="'
    );
  }

  return out;
}

function isPlaceholderOnly(src) {
  // Skip files whose only content is the "<!-- PASTE HTML FROM CANVA ... -->"
  // placeholder comment (no real HTML yet).
  const stripped = src.trim();
  if (!stripped.startsWith("<!-- PASTE HTML FROM CANVA")) return false;
  // If the file is essentially just the comment (no <html> tag), skip.
  return !/<html\b/i.test(stripped);
}

const files = readdirSync(GAMES_DIR).filter((f) => f.endsWith(".html"));

let cleaned = 0;
let skipped = 0;
let unchanged = 0;

for (const name of files) {
  const path = join(GAMES_DIR, name);
  const before = readFileSync(path, "utf8");

  if (isPlaceholderOnly(before)) {
    skipped++;
    console.log(`skip (placeholder): ${name}`);
    continue;
  }

  const after = cleanHtml(before, basename(name));

  if (after !== before) {
    writeFileSync(path, after, "utf8");
    cleaned++;
    console.log(`cleaned: ${name}`);
  } else {
    unchanged++;
  }
}

console.log(`\nDone. cleaned=${cleaned} skipped=${skipped} unchanged=${unchanged} total=${files.length}`);
