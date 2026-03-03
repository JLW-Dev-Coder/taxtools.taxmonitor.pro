# AGENTS.md

## Audit goal
- Fail the audit if README.md and repo behavior disagree.
- Prefer minimal fixes that preserve documented contracts.

## Build
- Build command: node ./build.mjs
- Output directory: ./dist

## Checks
- Dist completeness: every href/src in dist HTML must resolve to a file in dist.
- Routes: every frontend call to /v1/* must have a matching Worker handler.
- Stripe: webhook signature verification required; dedupe by Stripe Checkout Session ID.
- SKU mapping: frontend must not use Stripe price_ ids; Worker maps SKU -> price id and rejects unknown SKU.

## Output
- Write audit report to: ./audit/launch-readiness.md
- Include: blockers, non-blockers, and file+line references for every finding.
