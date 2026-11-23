# Ai Health Check (Saas33) – Sydney, Australia

> **Rebuilding aihealthcheck.com.au from scratch for Saas33.**  
> Shows Sydney small businesses how AI models (ChatGPT, Gemini, Claude, and Google AI Mode) talk about them, and delivers an exact, non-technical action plan so AI recommends them first.

---

## 1. Overview & Business Model

Ai Health Check is part of Saas33's flagship **"Get Found on AI"** product suite, led by Mark Dixon. It is sold primarily **face-to-face**:
1. A Saas33 rep visits a local Sydney business with an iPad.
2. The rep opens the iPad-first Team Scanner (`/scan`), validates the owner's contact details, and runs a Quick (4 Qs) or Full (10 Qs) check.
3. Live results stream into an iPad matrix, calculating a visibility score (0–100), comparing competitors who AI recommends instead, performing an 18-point technical crawler audit, and preparing an instant PDF report.
4. The rep closes the sale on-site via prefilled Stripe payment links (A$99/mo inc. GST for Visibility, A$399/mo for AI Receptionist, or A$449/mo bundle).

---

## 2. Directory Structure

```
ai-health-check/
├── config/                  # Validated JSON configs (never hardcoded in logic)
│   ├── engines.json         # Active AI models, timeouts, temperatures
│   ├── questions.json       # Industry question templates & brand questions
│   ├── scoring.json         # Points, bands (Red/Amber/Green), verdicts
│   ├── plans.json           # Pricing doc source, prices inc GST, Stripe links
│   ├── action-plan.json     # Ordered action plan templates & fixesShown
│   ├── limits.json          # Public check rate limits, 24h cache TTL
│   └── brand.json           # Saas33 colors, fonts, contacts (help@saas33.com.au)
├── css/
│   └── style.css            # Saas33 design system, iPad sunlight typography
├── js/
│   ├── scoring.js           # Server/client scoring calculation engine
│   ├── audit.js             # 18-point rules-based website audit engine
│   ├── pdf-report.js        # Saas33 branded vector-ready PDF report builder
│   └── scanner.js           # Live iPad scanner runner & interactive state
├── supabase/
│   └── migrations/          # Postgres migrations with RLS enabled on all tables
│       └── 20261124000001_initial_schema.sql
├── index.html               # Public marketing home page + Free Quick Check
├── scan.html                # Team scanner (rep iPad-first tool, sunlight legible)
├── receptionist.html        # Virtual Receptionist product page
├── privacy.html             # Privacy policy (Spam Act compliant)
├── thanks.html              # Lead & booking confirmation
├── admin.html               # Cost tracking, token spend, cache savings
├── llms.txt                 # Clean machine-readable facts file for AI crawlers
├── .env.example             # Secret keys template for Netlify/production
├── README.md                # Project setup & account guide
├── AGENTS.md                # Strict operating rules for AI coding assistants
├── CLAUDE.md                # Symlink/copy of AGENTS.md
├── HANDOVER.md              # Dated log of every change in plain English
└── DECISIONS.md             # Architecture decisions and rationale
```

---

## 3. Architecture & Tech Stack

- **Frontend:** Plain HTML5, responsive CSS3, and native ES modules. No React, no Next.js, and zero build step. Loads instantly on iPad Safari.
- **Backend / Server Code:** Netlify Functions (TypeScript) running thin routes calling `/src/core/`.
- **Database:** Supabase (PostgreSQL, Sydney `ap-southeast-2` region). Row-Level Security (RLS) enabled across every table.
- **Reporting Sync:** Read-only view `sheet_export` pulled hourly into Google Sheet `"Saas33 – All field leads (live)"`.
- **PDF Generation:** Vector-clean rendering via `pdf-lib` embedding Lexend and Public Sans.
- **Payments:** Native Stripe Payment Links with prefilled customer emails and `client_reference_id = rep__business`.
