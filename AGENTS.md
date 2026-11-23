# AGENTS.md / CLAUDE.md – Operational Rules for Ai Health Check

> **Read this before making any code modifications to this repository.**

## 1. Persona & Communication
- Owner: **Mark Dixon**, Saas33 Sydney. Non-technical. Never ask him to use a terminal, read code, or debug.
- Language: Plain Australian English, dates as `DD/MM/YYYY`, Sydney local time, prices in `A$` including GST.
- Lead with results. Use short bullet points and tables. Skip conversational preamble.
- Ask at most **one question at a time**, and only when a wrong guess causes real rework.
- Never deploy to the live site, spend money, delete files, or send email outside `mark@saas33.com.au` without prior explicit approval.

## 2. Non-Negotiable Business Rules
1. **No Check Runs Without Contact Details:** Every scan (rep scanner, brand check, public check) requires valid name, email, and mobile (>= 8 digits).
2. **One Database Single Source of Truth:** All leads, checks, and audits write to Supabase (Sydney region). Google Sheets is a read-only mirror.
3. **Internal Notifications:** Every completed check notifies `mark@saas33.com.au` and `help@saas33.com.au`.
4. **No Automatic Customer Emails:** Reports are NEVER emailed to business owners automatically. Only when a rep reviews and confirms.
5. **Public Contact:** `help@saas33.com.au` ONLY (never `hello@`).
6. **Pricing from Config:** Prices come exclusively from `config/plans.json` referencing Mark's Google Doc: *Pricing – Saas33 – 21.11.2026*. Always state "inc. GST".
7. **Spam Act:** Marketing tips checkbox must remain UNTICKED by default.
8. **Honest Findings:** Never fake or hallucinate review counts, competitors, or answers. If an engine failed, report it honestly.

## 3. Technical Constraints (Zero Tech Debt)
- **Zero Frontend Frameworks:** No React, Next.js, or complex build steps for pages. Clean HTML5 + CSS + native ES modules only.
- **Thin Functions:** Keep Netlify Functions thin; place reusable logic in `/src/core/`.
- **Zod Validation:** Validate all request payloads on the server.
- **Cache Answers:** Reuse answers for identical website host, question, and engine for 24 hours to prevent API billing spikes.
- **Small Files:** Keep files under 300 lines. Split when growing.
