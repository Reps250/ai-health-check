# DECISIONS.md – Architecture Rationale

### Decision 1: Plain HTML5, CSS & Native JavaScript Modules (Zero Frameworks)
We opted for plain modern HTML, CSS, and native ES modules rather than React, Vue, or Next.js. This guarantees near-instant initial page loads on mobile Safari when reps demo on iPads in the field, eliminates npm dependency vulnerabilities, prevents framework breaking changes, and allows any AI assistant to modify pages without complex build pipelines.

### Decision 2: Centralised JSON Configuration in `/config/`
All business logic subject to change—including AI models, question templates, scoring formulas, verdict text, pricing inc. GST, and rate limits—resides exclusively in `/config/*.json`. This enables Mark or any AI to tweak copy, update Stripe links, or add new Sydney trades without altering core application code.

### Decision 3: Supabase (Postgres, Sydney Region) as the Single Source of Truth
To prevent fractured lead data across emails and loose spreadsheets, all checks (whether completed, stopped, or failed) write directly to Supabase with Row Level Security enabled. The existing Google Sheet (`"Saas33 – All field leads (live)"`) acts purely as a read-only mirror via the automated `sheet_export` view.

### Decision 4: Rules-Based Website Audit (Zero AI Cost)
Rather than paying third-party SEO APIs or burning LLM tokens for basic site evaluation, our 18-point crawler audit uses deterministic checks (robots.txt permissions for GPTBot/ClaudeBot, schema validation, meta tags, and builder identification). This runs in milliseconds at zero marginal cost.

### Decision 5: Client-Side Vector PDF Preview for Immediate iPad Delivery
To avoid heavy, fragile server-side headless browsers (such as Puppeteer), we designed reports to render directly via vector CSS print stylesheets and `pdf-lib`. A rep on an iPad can immediately preview the report, print it, or save it to PDF directly within Safari.
