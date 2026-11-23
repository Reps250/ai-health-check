-- ==============================================================================
-- Migration: 20261124000001_initial_schema.sql
-- Ai Health Check (Saas33) - Sydney Region
-- Postgres with Row Level Security enabled on all tables
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Reps table
CREATE TABLE IF NOT EXISTS reps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    mobile TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'rep' CHECK (role IN ('rep', 'admin')),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Australia/Sydney', now())
);

-- 2. Businesses table
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    industry TEXT NOT NULL,
    category TEXT,
    suburb TEXT NOT NULL,
    website TEXT,
    website_host TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Australia/Sydney', now())
);
CREATE INDEX IF NOT EXISTS idx_businesses_host ON businesses (website_host);

-- 3. Contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    mobile TEXT NOT NULL,
    marketing_opt_in BOOLEAN NOT NULL DEFAULT false,
    source TEXT NOT NULL CHECK (source IN ('scanner', 'public_check', 'booking')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Australia/Sydney', now())
);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts (email);

-- 4. Checks table
CREATE TABLE IF NOT EXISTS checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    rep_id UUID REFERENCES reps(id) ON DELETE SET NULL,
    kind TEXT NOT NULL CHECK (kind IN ('quick', 'full', 'brand', 'public')),
    engines TEXT[] NOT NULL DEFAULT '{}',
    questions TEXT[] NOT NULL DEFAULT '{}',
    extra_terms TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'finished', 'stopped', 'failed')),
    score INT,
    verdict TEXT,
    summary JSONB DEFAULT '{}'::jsonb,
    cost_usd NUMERIC(10, 4) DEFAULT 0.0000,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Australia/Sydney', now()),
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Australia/Sydney', now())
);

-- 5. Answers table
CREATE TABLE IF NOT EXISTS answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    check_id UUID REFERENCES checks(id) ON DELETE CASCADE,
    engine TEXT NOT NULL,
    question TEXT NOT NULL,
    model TEXT NOT NULL,
    searched BOOLEAN NOT NULL DEFAULT true,
    text TEXT NOT NULL,
    sources JSONB DEFAULT '[]'::jsonb,
    mentioned BOOLEAN NOT NULL DEFAULT false,
    rank INT,
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', null)),
    businesses_named TEXT[] DEFAULT '{}',
    error TEXT,
    ms INT,
    cost_usd NUMERIC(10, 4) DEFAULT 0.0000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Australia/Sydney', now())
);
CREATE INDEX IF NOT EXISTS idx_answers_check ON answers (check_id);

-- 6. Site Audits table
CREATE TABLE IF NOT EXISTS site_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    check_id UUID REFERENCES checks(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    platform TEXT,
    reachable BOOLEAN NOT NULL DEFAULT true,
    checks JSONB DEFAULT '[]'::jsonb,
    issues JSONB DEFAULT '[]'::jsonb,
    passed INT NOT NULL DEFAULT 0,
    total INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Australia/Sydney', now())
);

-- 7. Brand Results table
CREATE TABLE IF NOT EXISTS brand_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    check_id UUID REFERENCES checks(id) ON DELETE CASCADE,
    result JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Australia/Sydney', now())
);

-- 8. Reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    check_id UUID REFERENCES checks(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    emailed_to TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Australia/Sydney', now())
);

-- 9. Leads table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    rep_id UUID REFERENCES reps(id) ON DELETE SET NULL,
    form TEXT NOT NULL CHECK (form IN ('save_lead', 'booking', 'public_check')),
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'follow_up', 'booked', 'sold', 'not_interested')),
    plan_wanted TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Australia/Sydney', now())
);

-- 10. Email Log table
CREATE TABLE IF NOT EXISTS email_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "to" TEXT NOT NULL,
    subject TEXT NOT NULL,
    kind TEXT NOT NULL,
    check_id UUID REFERENCES checks(id) ON DELETE SET NULL,
    provider_id TEXT,
    ok BOOLEAN NOT NULL DEFAULT true,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Australia/Sydney', now())
);

-- Enable RLS on all tables
ALTER TABLE reps ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

-- Read-only sheet_export view for hourly Google Sheet sync
CREATE OR REPLACE VIEW sheet_export AS
SELECT 
    to_char(timezone('Australia/Sydney', c.created_at), 'DD/MM/YYYY HH24:MI') as date_sydney,
    ct.source as source,
    b.name as business,
    b.suburb as suburb,
    b.website as website,
    ct.name as contact,
    ct.email as email,
    ct.mobile as mobile,
    COALESCE(r.name, 'Public Web') as rep,
    c.kind as check_kind,
    c.score as score,
    COALESCE(c.summary->>'top_competitor', 'None') as top_competitor,
    COALESCE(l.status, 'new') as status,
    COALESCE(rp.storage_path, '') as report_link
FROM checks c
LEFT JOIN businesses b ON c.business_id = b.id
LEFT JOIN contacts ct ON c.contact_id = ct.id
LEFT JOIN reps r ON c.rep_id = r.id
LEFT JOIN leads l ON l.business_id = b.id
LEFT JOIN reports rp ON rp.check_id = c.id
ORDER BY c.created_at DESC;
