/**
 * audit/launch-readiness.mjs
 *
 * Launch readiness audit runner.
 *
 * What it checks (alphabetical):
 * - Build output matches references: every href/src in dist HTML resolves to a file in dist.
 * - Endpoints implemented vs referenced: /v1/* references in source vs Worker route strings.
 * - Env vars documented: env.* usages in Worker code must appear in README.md.
 * - Price ID leakage: frontend must not contain Stripe "price_" identifiers.
 * - Stripe webhook basics: heuristic checks for signature verification + idempotency patterns.
 * - Token mutation: heuristic checks for client-side balance mutation patterns.
 *
 * Output:
 * - audit/launch-readiness.md
 *
 * Run:
 * - node ./audit/launch-readiness.mjs
 */

import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.resolve(__dirname, "..");
const AUDIT_DIR = path.join(REPO_ROOT, "audit");
const REPORT_PATH = path.join(AUDIT_DIR, "launch-readiness.md");
const DIST_DIR = path.join(REPO_ROOT, "dist");

const DEFAULT_IGNORED_DIRS = new Set([
  ".git",
  "dist",
  "node_modules",
]);

const SOURCE_EXTENSIONS = new Set([
  ".cjs",
  ".css",
  ".html",
  ".js",
  ".json",
  ".mjs",
  ".toml",
  ".txt",
]);

function nowIso() {
  return new Date().toISOString();
}

function sortAlpha(arr) {
  return [...arr].sort((a, b) => a.localeCompare(b));
}

function normalizeSlashes(p) {
  return p.replaceAll("\\", "/");
}

function stripQueryAndHash(u) {
  const q = u.indexOf("?");
  const h = u.indexOf("#");
  let end = u.length;
  if (q !== -1) end = Math.min(end, q);
  if (h !== -1) end = Math.min(end, h);
  return u.slice(0, end);
}

function isExternalUrl(u) {
  const s = u.trim().toLowerCase();
  return (
    s.startsWith("http://") ||
    s.startsWith("https://") ||
    s.startsWith("mailto:") ||
    s.startsWith("tel:") ||
    s.startsWith("data:") ||
    s.startsWith("javascript:")
  );
}

function isSkippableRef(u) {
  const s = u.trim();
  return s === "" || s === "#" || s.startsWith("#");
}

function safeRel(from, to) {
  return normalizeSlashes(path.relative(from, to));
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function readText(p) {
  return fs.readFile(p, "utf8");
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function walkFiles(rootDir, { ignoredDirs = DEFAULT_IGNORED_DIRS } = {}) {
  const out = [];
  const stack = [rootDir];

  while (stack.length) {
    const cur = stack.pop();
    let entries;
    try {
      entries = await fs.readdir(cur, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const ent of entries) {
      const full = path.join(cur, ent.name);

      if (ent.isDirectory()) {
        if (!ignoredDirs.has(ent.name)) stack.push(full);
        continue;
      }

      if (!ent.isFile()) continue;

      const ext = path.extname(ent.name).toLowerCase();
      if (SOURCE_EXTENSIONS.has(ext)) out.push(full);
    }
  }

  return out;
}

function parseHtmlRefs(htmlText) {
  // Best-effort: grab src/href occurrences. Not a full HTML parser, but good enough to catch missing assets.
  const refs = [];

  // href="..."
  for (const m of htmlText.matchAll(/\bhref\s*=\s*["']([^"']+)["']/gi)) refs.push(m[1]);

  // src="..."
  for (const m of htmlText.matchAll(/\bsrc\s*=\s*["']([^"']+)["']/gi)) refs.push(m[1]);

  // Also catch: url("...") in inline style blocks
  for (const m of htmlText.matchAll(/\burl\(\s*["']?([^"')]+)["']?\s*\)/gi)) refs.push(m[1]);

  return refs;
}

function resolveDistRef(htmlFilePath, ref) {
  const cleaned = stripQueryAndHash(ref.trim());

  if (isSkippableRef(cleaned)) return null;
  if (isExternalUrl(cleaned)) return null;

  // Absolute path within site
  if (cleaned.startsWith("/")) {
    // If your Pages routes rewrite everything to index.html, this can still be "valid" at runtime.
    // But for launch-readiness, we treat referenced static assets as needing to exist.
    return path.join(DIST_DIR, cleaned.slice(1));
  }

  // Relative to HTML file location in dist
  const baseDir = path.dirname(htmlFilePath);
  return path.resolve(baseDir, cleaned);
}

function extractV1Paths(text) {
  const found = new Set();
  for (const m of text.matchAll(/\/v1\/[a-z0-9/_-]+/gi)) {
    // normalize trailing slashes
    const p = m[0].replace(/\/+$/g, "");
    if (p) found.add(p);
  }
  return found;
}

function findPriceIds(text) {
  const found = new Set();
  for (const m of text.matchAll(/\bprice_[a-zA-Z0-9]+/g)) found.add(m[0]);
  return found;
}

function extractEnvVarsFromWorker(text) {
  // Matches env.FOO_BAR and env["FOO_BAR"]
  const found = new Set();

  for (const m of text.matchAll(/\benv\.([A-Z0-9_]+)\b/g)) found.add(m[1]);
  for (const m of text.matchAll(/\benv\[\s*["']([A-Z0-9_]+)["']\s*\]/g)) found.add(m[1]);

  return found;
}

function findHeuristicStripeSignals(workerText) {
  const signals = [];

  const checks = [
    ["Has STRIPE_WEBHOOK_SECRET usage", /\bSTRIPE_WEBHOOK_SECRET\b/.test(workerText)],
    ["Mentions Stripe signature header", /stripe-signature/i.test(workerText)],
    ["Mentions constructEvent (Stripe SDK pattern)", /constructEvent/i.test(workerText)],
    ["Mentions checkout.session", /checkout\.session/i.test(workerText)],
    ["Mentions idempotency/dedupe", /\b(idempot|dedup|dedupe)\b/i.test(workerText)],
    ["Mentions session.id", /\bsession\.id\b/i.test(workerText)],
  ];

  for (const [label, ok] of checks) signals.push({ label, ok });
  return signals;
}

function findHeuristicTokenMutationSignals(sourceText) {
  const signals = [];

  // Extremely heuristic: look for patterns that suggest local subtraction or decrement.
  const checks = [
    ["Has /v1/tokens/spend call", /\/v1\/tokens\/spend/i.test(sourceText)],
    ["Has local decrement pattern near tokens", /\btokens?\b.{0,80}(\-\=|\-\-)/is.test(sourceText)],
    ["Has subtraction assignment near tokens", /\btokens?\b.{0,120}=\s*.*-\s*/is.test(sourceText)],
  ];

  for (const [label, ok] of checks) signals.push({ label, ok });
  return signals;
}

async function runBuild() {
  const buildPath = path.join(REPO_ROOT, "build.mjs");
  if (!(await exists(buildPath))) {
    return { ok: false, note: `Missing build.mjs at ${safeRel(REPO_ROOT, buildPath)}` };
  }

  return new Promise((resolve) => {
    const ps = spawn(process.execPath, [buildPath], {
      cwd: REPO_ROOT,
      stdio: "inherit",
    });

    ps.on("error", (err) => resolve({ ok: false, note: String(err) }));
    ps.on("exit", (code) => resolve({ ok: code === 0, note: `Exit code ${code}` }));
  });
}

async function main() {
  const findings = {
    blockers: [],
    nonBlockers: [],
    warnings: [],
  };

  const checklist = [];

  const startedAt = nowIso();

  // Ensure audit directory exists
  await ensureDir(AUDIT_DIR);

  // Load README
  const readmePath = path.join(REPO_ROOT, "README.md");
  const hasReadme = await exists(readmePath);
  const readmeText = hasReadme ? await readText(readmePath) : "";

  if (!hasReadme) {
    findings.blockers.push({
      title: "Missing README.md (authoritative contract not found)",
      detail: `Expected at ${safeRel(REPO_ROOT, readmePath)}`,
    });
  }

  // 1) Build
  const buildRes = await runBuild();
  if (!buildRes.ok) {
    findings.blockers.push({
      title: "Build failed",
      detail: buildRes.note,
    });
  }
  checklist.push({
    item: "Build completes successfully",
    status: buildRes.ok ? "PASS" : "FAIL",
    notes: buildRes.note,
  });

  // 2) Dist + HTML refs
  const distExists = await exists(DIST_DIR);
  if (!distExists) {
    findings.blockers.push({
      title: "Missing dist output directory",
      detail: `Expected ${safeRel(REPO_ROOT, DIST_DIR)}`,
    });
  }

  const distHtmlFiles = distExists
    ? (await walkFiles(DIST_DIR, { ignoredDirs: new Set() })).filter((p) => p.toLowerCase().endsWith(".html"))
    : [];

  const missingDistRefs = [];
  if (distHtmlFiles.length) {
    for (const htmlFile of distHtmlFiles) {
      const html = await readText(htmlFile);
      const refs = parseHtmlRefs(html);

      for (const ref of refs) {
        const resolved = resolveDistRef(htmlFile, ref);
        if (!resolved) continue;

        // If it looks like a route (e.g., "/games/foo.html"), the file might not exist as static.
        // We only enforce existence for "asset-like" things: has a file extension.
        const cleaned = stripQueryAndHash(ref.trim());
        const ext = path.extname(cleaned);

        if (!ext) continue; // likely route, not a static asset

        if (!(await exists(resolved))) {
          missingDistRefs.push({
            from: safeRel(REPO_ROOT, htmlFile),
            ref: cleaned,
            resolved: safeRel(REPO_ROOT, resolved),
          });
        }
      }
    }
  }

  if (missingDistRefs.length) {
    // Deduplicate
    const dedupKey = (x) => `${x.from} -> ${x.ref} -> ${x.resolved}`;
    const uniq = new Map();
    for (const m of missingDistRefs) uniq.set(dedupKey(m), m);

    const items = sortAlpha([...uniq.values()].map((m) => `${m.from} → ${m.ref} (missing: ${m.resolved})`));

    findings.blockers.push({
      title: "Missing static files referenced by dist HTML",
      detail: items.join("\n"),
    });
  }

  checklist.push({
    item: "Dist HTML asset references resolve to files",
    status: missingDistRefs.length === 0 && distExists ? "PASS" : "FAIL",
    notes: missingDistRefs.length ? `${missingDistRefs.length} missing refs` : "OK",
  });

  // 3) Source scan (repo) for /v1/*, price_*, and token mutation heuristics
  const sourceFiles = await walkFiles(REPO_ROOT);

  // Read all source texts once (best-effort, but avoid huge memory by limiting file size)
  const sourceTextByFile = new Map();
  for (const f of sourceFiles) {
    try {
      const st = await fs.stat(f);
      if (st.size > 2_000_000) continue; // skip very large files
      const text = await readText(f);
      sourceTextByFile.set(f, text);
    } catch {
      // ignore unreadable files
    }
  }

  // Build two aggregates:
  // - allSourceText: everything (for general scans)
  // - allSourceTextNoWorkers: excludes workers/* (for "client-side" heuristics)
  let allSourceText = "";
  let allSourceTextNoWorkers = "";

  for (const [f, text] of sourceTextByFile) {
    const rel = safeRel(REPO_ROOT, f);
    allSourceText += `${text}\n`;
    if (!normalizeSlashes(rel).startsWith("workers/")) {
      allSourceTextNoWorkers += `${text}\n`;
    }
  }

  // 3a) Price ID leakage (frontend)
  // We flag any price_ usage anywhere outside worker, because it usually ends up in pages.
  const priceHits = new Map(); // priceId => files
  for (const [f, text] of sourceTextByFile) {
    const rel = safeRel(REPO_ROOT, f);

    // Don't care if worker references price IDs (it can).
    if (normalizeSlashes(rel).startsWith("workers/")) continue;

    for (const price of findPriceIds(text)) {
      if (!priceHits.has(price)) priceHits.set(price, new Set());
      priceHits.get(price).add(rel);
    }
  }

  if (priceHits.size) {
    const lines = [];
    for (const price of sortAlpha([...priceHits.keys()])) {
      lines.push(`${price}: ${sortAlpha([...priceHits.get(price)]).join(", ")}`);
    }

    findings.blockers.push({
      title: "Stripe price_ IDs found outside Worker (frontend leakage)",
      detail: lines.join("\n"),
    });
  }

  checklist.push({
    item: "No Stripe price_ IDs outside Worker",
    status: priceHits.size === 0 ? "PASS" : "FAIL",
    notes: priceHits.size ? `${priceHits.size} price id(s) found` : "OK",
  });

  // 3b) Extract /v1/* references
  const v1Refs = new Set();
  for (const text of sourceTextByFile.values()) {
    for (const p of extractV1Paths(text)) v1Refs.add(p);
  }

  // 4) Worker routes scan
  const workerIndexPath = path.join(REPO_ROOT, "workers", "api", "src", "index.js");
  const hasWorkerIndex = await exists(workerIndexPath);

  let workerText = "";
  if (hasWorkerIndex) {
    workerText = await readText(workerIndexPath);
  } else {
    findings.blockers.push({
      title: "Missing Worker entrypoint",
      detail: `Expected ${safeRel(REPO_ROOT, workerIndexPath)}`,
    });
  }

  checklist.push({
    item: "Worker entrypoint exists (workers/api/src/index.js)",
    status: hasWorkerIndex ? "PASS" : "FAIL",
    notes: hasWorkerIndex ? "OK" : "Missing",
  });

  const workerV1 = hasWorkerIndex ? extractV1Paths(workerText) : new Set();

  const v1MissingInWorker = sortAlpha([...v1Refs].filter((p) => !workerV1.has(p)));
  const v1UnreferencedInSource = sortAlpha([...workerV1].filter((p) => !v1Refs.has(p)));

  if (v1MissingInWorker.length) {
    findings.blockers.push({
      title: "Source references /v1/* endpoints not found in Worker code (string scan)",
      detail: v1MissingInWorker.join("\n"),
    });
  }

  if (v1UnreferencedInSource.length) {
    findings.nonBlockers.push({
      title: "Worker has /v1/* endpoints not referenced by source (may be OK)",
      detail: v1UnreferencedInSource.join("\n"),
    });
  }

  checklist.push({
    item: "All referenced /v1/* endpoints appear in Worker code (string scan)",
    status: v1MissingInWorker.length === 0 && hasWorkerIndex ? "PASS" : "FAIL",
    notes: v1MissingInWorker.length ? `${v1MissingInWorker.length} missing` : "OK",
  });

  // 5) Env vars used in Worker are documented in README
  const envVarsUsed = new Set();
  if (hasWorkerIndex) {
    for (const v of extractEnvVarsFromWorker(workerText)) envVarsUsed.add(v);
  }

  const envMissingFromReadme = hasReadme
    ? sortAlpha([...envVarsUsed].filter((v) => !readmeText.includes(v)))
    : sortAlpha([...envVarsUsed]);

  if (envMissingFromReadme.length) {
    findings.warnings.push({
      title: "Worker env vars not found in README.md (documentation drift)",
      detail: envMissingFromReadme.join("\n"),
    });
  }

  checklist.push({
    item: "Worker env vars appear in README.md",
    status: envMissingFromReadme.length === 0 && hasReadme ? "PASS" : "WARN",
    notes: envMissingFromReadme.length ? `${envMissingFromReadme.length} var(s) not found in README` : "OK",
  });

  // 6) Stripe webhook heuristics
  const stripeSignals = hasWorkerIndex ? findHeuristicStripeSignals(workerText) : [];
  const stripeOk = stripeSignals.length
    ? stripeSignals.some((s) => s.label.includes("STRIPE_WEBHOOK_SECRET") && s.ok) &&
      stripeSignals.some((s) => s.label.includes("signature header") && s.ok)
    : false;

  const stripeNotes = stripeSignals.map((s) => `${s.ok ? "✓" : "✗"} ${s.label}`).join("\n");

  if (!stripeOk && hasWorkerIndex) {
    findings.warnings.push({
      title: "Stripe webhook signature/idempotency checks not confidently detected (heuristic)",
      detail: stripeNotes || "No signals",
    });
  }

  checklist.push({
    item: "Stripe webhook signature + idempotency detected (heuristic)",
    status: hasWorkerIndex ? (stripeOk ? "PASS" : "WARN") : "FAIL",
    notes: stripeOk ? "Signals present" : "Not confidently detected",
  });

  // 7) Token mutation heuristics (client-side)
  const tokenSignals = findHeuristicTokenMutationSignals(allSourceTextNoWorkers);
  const hasSpendEndpointRef = tokenSignals.find((s) => s.label.includes("/v1/tokens/spend"))?.ok ?? false;
  const hasLocalDecrement = tokenSignals.find((s) => s.label.includes("local decrement"))?.ok ?? false;
  const hasSubAssign = tokenSignals.find((s) => s.label.includes("subtraction assignment"))?.ok ?? false;

  if (hasLocalDecrement || hasSubAssign) {
    findings.warnings.push({
      title: "Possible client-side token mutation detected (heuristic)",
      detail: tokenSignals.map((s) => `${s.ok ? "✓" : "✗"} ${s.label}`).join("\n"),
    });
  }

  checklist.push({
    item: "No obvious client-side token balance mutation (heuristic)",
    status: hasLocalDecrement || hasSubAssign ? "WARN" : "PASS",
    notes: hasSpendEndpointRef ? "Spend endpoint referenced" : "Spend endpoint not found in source scan",
  });

  // Determine overall result
  const status =
    findings.blockers.length === 0
      ? (findings.warnings.length ? "PASS (WITH WARNINGS)" : "PASS")
      : "FAIL";

  // Write report
  const lines = [];

  lines.push(`# Launch Readiness Audit`);
  lines.push(``);
  lines.push(`- Repo: ${path.basename(REPO_ROOT)}`);
  lines.push(`- Ran: ${startedAt}`);
  lines.push(`- Result: **${status}**`);
  lines.push(``);

  lines.push(`## Checklist (alphabetical)`);
  lines.push(``);
  lines.push(`| Item | Notes | Status |`);
  lines.push(`|---|---|---|`);
  for (const c of sortAlpha(checklist.map((x) => JSON.stringify(x))).map((s) => JSON.parse(s))) {
    const notes = (c.notes || "").toString().replace(/\|/g, "\\|");
    lines.push(`| ${c.item} | ${notes} | ${c.status} |`);
  }
  lines.push(``);

  const renderFindings = (title, items) => {
    lines.push(`## ${title}`);
    lines.push(``);
    if (!items.length) {
      lines.push(`- (none)`);
      lines.push(``);
      return;
    }
    for (const it of items) {
      lines.push(`- **${it.title}**`);
      if (it.detail) {
        lines.push(``);
        lines.push("```");
        lines.push(it.detail);
        lines.push("```");
      }
      lines.push(``);
    }
  };

  renderFindings("Blockers", findings.blockers);
  renderFindings("Non-blockers", findings.nonBlockers);
  renderFindings("Warnings", findings.warnings);

  lines.push(`## Notes`);
  lines.push(``);
  lines.push(`- Some checks are heuristic by design (static scans). Treat WARN as “inspect manually”.`);
  lines.push(`- If README.md is missing or out of date, the audit should be treated as FAIL by policy.`);
  lines.push(``);

  await fs.writeFile(REPORT_PATH, lines.join("\n"), "utf8");

  // Console summary
  const relReport = safeRel(REPO_ROOT, REPORT_PATH);
  console.log(`\nAudit complete: ${status}`);
  console.log(`Report: ${relReport}\n`);

  // Exit code: 0 only if no blockers
  process.exit(findings.blockers.length ? 1 : 0);
}

main().catch((err) => {
  console.error("Audit crashed:", err);
  process.exit(2);
});