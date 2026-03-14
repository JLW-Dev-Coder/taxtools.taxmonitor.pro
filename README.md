# Tax Tools Tax Monitor Pro (TTTMP)

## Table of Contents

* [1. Overview](#1-overview)
* [2. Key Features](#2-key-features)
* [3. Architecture Overview](#3-architecture-overview)
* [4. Ecosystem Integration](#4-ecosystem-integration)
* [5. Repository Structure](#5-repository-structure)
* [6. Environment Setup](#6-environment-setup)
* [7. Deployment](#7-deployment)
* [8. Contracts or Data Model](#8-contracts-or-data-model)
* [9. Development Standards](#9-development-standards)
* [10. Integrations](#10-integrations)
* [11. Security and Secrets](#11-security-and-secrets)
* [12. Contribution Guidelines](#12-contribution-guidelines)
* [13. License](#13-license)

---

# 1. Overview

Tax Tools Arcade is the **interactive tool layer** of the tax professional ecosystem.

It provides browser-based tools designed to:

* educate taxpayers
* diagnose tax situations
* generate discovery traffic
* consume purchased tool tokens
* connect taxpayers to professionals in the directory

The platform intentionally sits **before professional engagement**, allowing taxpayers to explore tools while creating demand for professional services.

The system operates using **Cloudflare Workers**, **R2 canonical storage**, and **contract-driven APIs**.

This repository contains the application logic, front-end tool interfaces, and Worker routes required to execute tools and record usage events.

---

# 2. Key Features

Major capabilities include:

* browser-based tax diagnostic tools
* contract-driven tool execution APIs
* tool session tracking
* token consumption for tool usage
* canonical tool usage storage
* integration with professional discovery

Tools are designed to remain **educational and diagnostic**, not advisory.

This preserves compliance while still generating professional demand.

---

# 3. Architecture Overview

The platform uses a **worker-centric architecture** running at the edge.

Core principles:

* canonical records stored in R2
* stateless API Workers
* contract validation before writes
* token verification before tool execution

Major system components include:

* Cloudflare Workers
* R2 object storage
* static tool interfaces
* token verification APIs
* ecosystem discovery integrations

Workers handle execution, validation, and storage while the front-end remains static.

This architecture supports **low latency, high scalability, and strict contract enforcement**.

---

# 4. Ecosystem Integration

Tax Tools Arcade operates as part of a four-platform ecosystem.

Platforms and roles (alphabetical):

| Platform               | Role                                         |
| ---------------------- | -------------------------------------------- |
| Tax Monitor Pro        | professional discovery and taxpayer matching |
| Tax Tools Arcade       | taxpayer education and discovery traffic     |
| Transcript Tax Monitor | transcript diagnostics                       |
| Virtual Launch Pro     | professional infrastructure                  |

Discovery flow:

```
Tax Tools Arcade
→ Transcript Tax Monitor
→ Tax Monitor Pro
→ Virtual Launch Pro
```

This structure allows:

* educational discovery
* diagnostic insight
* professional connection
* infrastructure support

The tools intentionally act as the **entry point for taxpayers**.

---

# 5. Repository Structure

Typical directory layout:

```
/app
/assets
/contracts
/pages
/partials
/site
/workers
```

Descriptions:

| Directory    | Purpose                              |
| ------------ | ------------------------------------ |
| `/app`       | authenticated application interfaces |
| `/assets`    | shared visual resources              |
| `/contracts` | JSON API contracts                   |
| `/pages`     | onboarding and workflow pages        |
| `/partials`  | reusable UI components               |
| `/site`      | public marketing pages               |
| `/workers`   | Cloudflare Worker APIs               |

Each tool interface typically lives in `/site` or `/pages` while execution occurs through Worker routes.

Repository layout follows the canonical README structure defined for platform repositories .

---

# 6. Environment Setup

Required software:

* Git
* Node.js
* Wrangler CLI

Setup steps:

1. Clone the repository
2. Install dependencies
3. Configure environment variables
4. Run local development server

Example commands:

```
git clone <repository>
cd repo
npm install
wrangler dev
```

Workers can be tested locally using Wrangler.

---

# 7. Deployment

Deployment occurs through **Cloudflare Workers**.

Typical deployment command:

```
wrangler deploy
```

Configuration is defined in `wrangler.toml`.

Deployment includes:

* Worker API routes
* R2 bindings
* environment variables
* compatibility configuration

Workers are deployed globally to the Cloudflare edge network.

---

# 8. Contracts or Data Model

Tax Tools Arcade uses **contract-driven APIs**.

Contracts define how tool execution requests are validated and processed.

Typical pipeline:

1. tool request received
2. contract validation
3. token verification
4. canonical record written to R2
5. usage event recorded
6. response returned

Example canonical storage:

```
/r2/tool_sessions/{session_id}.json
/r2/tool_usage/{event_id}.json
```

These records support:

* analytics
* token tracking
* usage auditing

The contract-driven model ensures consistency across all ecosystem services.

---

# 9. Development Standards

Development standards follow the canonical repository rules.

Key principles:

* alphabetical route documentation
* canonical Worker comment headers
* contract-first API design
* deny-by-default routing
* minimal Worker edits for safety

Workers should always list inbound routes and invariants using the canonical header format .

Section dividers inside Worker files follow the standardized format.

---

# 10. Integrations

Primary integrations include:

* Cloudflare infrastructure
* Stripe payments
* Virtual Launch Pro token APIs

Token verification occurs through the VLP token system.

Example token verification request:

```
GET /vlp/v1/tokens/{account_id}/tools
```

This ensures tools only execute when valid tokens are available.

---

# 11. Security and Secrets

Secrets must never be committed to the repository.

Sensitive values are stored using Wrangler secret management.

Examples include:

* API tokens
* OAuth secrets
* Stripe webhook secrets

Secrets are configured using:

```
wrangler secret put <NAME>
```

Workers access secrets through environment bindings.

---

# 12. Contribution Guidelines

Recommended workflow:

1. create branch
2. implement changes
3. test locally
4. submit pull request

All changes must preserve:

* contract compatibility
* Worker route stability
* canonical storage structure

Breaking API changes should always be versioned.

---

# 13. License

This repository is proprietary software owned and maintained by the Virtual Launch Pro platform.

Unauthorized redistribution or modification is not permitted.
