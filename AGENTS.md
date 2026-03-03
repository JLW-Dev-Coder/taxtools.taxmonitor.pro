# AGENTS.md

## Authority
- README.md is the authoritative contract for behavior, routes, build output, and configuration.
- If README.md and code disagree, treat it as FAIL and propose the minimal contract-safe fix.

## Commands
- Audit: node ./audit/launch-readiness.mjs
- Build: node ./build.mjs

## Constraints
- Do not invent endpoints, files, or data models.
- Do not “paper over” mismatches by changing the README unless the intent is explicitly to update the contract.

## Outputs
- Write the audit report to: ./audit/launch-readiness.md
- Include exact file paths and line numbers (or best-effort line ranges) for findings.
