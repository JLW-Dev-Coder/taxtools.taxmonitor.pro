# STYLE.md — taxtools.taxmonitor.pro

Last updated: 2026-04-04

---

## Stack

- CSS Modules (per-page `.module.css` files)
- CSS custom properties (design tokens in `app/globals.css`)
- Google Fonts: Raleway (400, 500, 600, 700)
- NO Tailwind — this repo uses CSS Modules only

## Design Tokens

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--accent` | `#f59e0b` | Primary amber accent |
| `--accent-light` | `#fffbeb` | Amber-50 background tint |
| `--accent-dark` | `#b45309` | Amber-700 dark variant |
| `--accent-text` | `#92400e` | Amber-900 on light backgrounds |
| `--accent-border` | `#fde68a` | Amber-200 borders |
| `--accent-hover` | `#d97706` | Amber-500 hover state |
| `--bg` | `#0F0F1A` | Dark navy page background |
| `--surface` | `#1A1A2E` | Card/container background |
| `--surface-border` | `#2D2D44` | Divider/border color |
| `--text` | `#F1F1F5` | Primary light text |
| `--text-muted` | `#9494B0` | Secondary/muted text |
| `--error` | `#ef4444` | Error states |
| `--success` | `#10b981` | Success states |

### Typography
- Font Family: `'Raleway', sans-serif`
- h1: 2rem, weight 700
- h2: 1.5rem, weight 600
- Body: 1rem, weight 400
- Muted: 0.875rem, `var(--text-muted)`

### Layout
| Token | Value |
|-------|-------|
| `--max-width` | `1280px` |
| `--max-content` | `1200px` |
| `--page-gutter` | `clamp(1.25rem, 5vw, 3rem)` |
| `--header-height` | `68px` |
| `--radius` | `8px` |

## Button Patterns

- **Primary:** `background: var(--accent)`, white text, hover `var(--accent-hover)`
- **Secondary:** `border: 1px solid var(--surface-border)`, transparent bg
- **Small:** `padding: 0.5rem 1rem`, `font-size: 0.875rem`

## Existing Components

| Component | Purpose |
|-----------|---------|
| `Header` | Site nav, token balance, auth state |
| `SiteFooter` | Footer with links, legal, ecosystem |
| `LegalPage` | Reusable legal content renderer |
| `SupportModal` | Token purchase modal in games |

## Page File Pattern

Each page requires:
- `app/{route}/page.tsx` — component
- `app/{route}/page.module.css` — styles
- Use `'use client'` directive for interactive pages

## Self-Check

Before delivering any styled page:
- [ ] Uses CSS Modules (not inline styles or Tailwind)
- [ ] References design tokens from globals.css
- [ ] Dark theme — light text on dark backgrounds
- [ ] Responsive at mobile, tablet, desktop
- [ ] Buttons follow primary/secondary pattern
- [ ] Typography uses Raleway via CSS variables
