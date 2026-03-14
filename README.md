# Tax Tools Arcade (TTTMP)

# Table of Contents

* [Overview](#overview-1)
* [Key Features](#key-features-1)
* [Architecture Overview](#architecture-overview-1)
* [Ecosystem Role](#ecosystem-role-1)
* [Worker Routes](#worker-routes-1)
* [Canonical Storage](#canonical-storage-1)
* [Repository Structure](#repository-structure-1)
* [Environment Setup](#environment-setup-1)
* [Deployment](#deployment-1)
* [Contracts or Data Model](#contracts-or-data-model-1)
* [Development Standards](#development-standards-1)
* [Integrations](#integrations-1)
* [Security and Secrets](#security-and-secrets-1)
* [Contribution Guidelines](#contribution-guidelines-1)
* [License](#license-1)

---

# Overview

Tax Tools Arcade provides **interactive tax education tools** designed to generate discovery traffic and guide users toward diagnostic services and professional engagement.

The platform acts as the **top of the ecosystem funnel**.

---

# Key Features

Capabilities include:

* interactive tax tools
* tax diagnostic utilities
* token-based tool execution
* tool session tracking
* tool usage analytics
* educational tax resources

---

# Architecture Overview

The system runs on:

* Cloudflare Workers
* R2 canonical storage
* D1 query indexes
* static frontend applications

Tools are executed through a token-based access system.

---

# Ecosystem Role

Tax Tools Arcade generates discovery traffic and early user engagement.

Flow:

```
Tax Tools Arcade
→ attracts users

Transcript Tax Monitor
→ provides transcript diagnostics

Tax Monitor Pro
→ connects users with professionals

Virtual Launch Pro
→ manages professional infrastructure
```

---

# Worker Routes

Tool execution

```
POST /v1/tools/{tool_slug}/run
```

Tool sessions

```
GET  /v1/tool-sessions/{session_id}
POST /v1/tool-sessions
```

Token verification

```
GET /vlp/v1/tokens/{account_id}/tools
```

---

# Canonical Storage

```
/r2/tool_sessions/{session_id}.json
/r2/tool_usage/{event_id}.json
```

---

# Repository Structure

```
/games
/site
/assets
/partials
/workers
```

---

# Environment Setup

Required tools:

* Git
* Node.js
* Wrangler

---

# Deployment

```
wrangler deploy
```

---

# Contracts or Data Model

All tool executions must follow defined API contracts.

Contracts validate:

* tool inputs
* token access
* session identifiers

---

# Development Standards

Standards include:

* contract-driven APIs
* canonical Worker headers
* R2-first writes

---

# Integrations

Integrations include:

* Virtual Launch Pro token APIs
* Cloudflare infrastructure

---

# Security and Secrets

Secrets handled through Wrangler secret management.

---

# Contribution Guidelines

Standard Git workflow.

---

# License

Proprietary.

---

