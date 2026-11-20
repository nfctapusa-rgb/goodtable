import { neon } from "@neondatabase/serverless";

const url = () => process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
export const dbReady = () => !!url();

let _sql: ReturnType<typeof neon> | null = null;
let migrated = false;

export async function db() {
  if (!url()) throw new Error("Database not connected. Add a Postgres database to this Vercel project.");
  _sql ??= neon(url());
  if (!migrated) { await migrate(_sql); migrated = true; }
  return _sql;
}

// Idempotent schema. Every tenant-owned row carries business_id; all queries
// filter by a business the current user is a member of (see lib/auth.ts).
async function migrate(sql: ReturnType<typeof neon>) {
  await sql`CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    name text,
    password_hash text NOT NULL,
    is_admin boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS sessions (
    token text PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at timestamptz NOT NULL)`;
  await sql`CREATE TABLE IF NOT EXISTS businesses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    website text,
    place_id text,
    address text,
    city text,
    category text,
    plan text NOT NULL DEFAULT 'free',
    stripe_customer_id text,
    created_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS memberships (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'owner',
    PRIMARY KEY (user_id, business_id))`;
  await sql`CREATE TABLE IF NOT EXISTS reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    score int NOT NULL,
    data jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now())`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stats_url text`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS leadsnap_id text`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_subscription_id text`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS setup jsonb`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS phone text`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS assets jsonb`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS social jsonb`;
  await sql`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS addons jsonb NOT NULL DEFAULT '[]'::jsonb`;
  await sql`CREATE TABLE IF NOT EXISTS posts (
    id bigserial PRIMARY KEY,
    business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    kind text NOT NULL,
    caption text NOT NULL,
    photo text,
    scheduled_for timestamptz NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    ayrshare_id text,
    error text,
    week int NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (business_id, week, kind))`;
  await sql`CREATE TABLE IF NOT EXISTS results (
    id bigserial PRIMARY KEY,
    business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    kind text NOT NULL,
    title text NOT NULL,
    detail text,
    url text,
    created_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS tasks (
    id bigserial PRIMARY KEY,
    business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    key text NOT NULL,
    title text NOT NULL,
    who text NOT NULL DEFAULT 'team',
    done boolean NOT NULL DEFAULT false,
    done_at timestamptz,
    sort int NOT NULL DEFAULT 0,
    UNIQUE (business_id, key))`;
  await sql`CREATE TABLE IF NOT EXISTS billing_events (
    id text PRIMARY KEY,
    type text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE INDEX IF NOT EXISTS reports_biz ON reports(business_id, created_at DESC)`;
  await sql`CREATE TABLE IF NOT EXISTS leads (
    id bigserial PRIMARY KEY,
    kind text NOT NULL,
    source text,
    business_name text,
    website text,
    place_id text,
    city text,
    score int,
    contact_name text,
    email text,
    phone text,
    plan text,
    data jsonb,
    created_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE INDEX IF NOT EXISTS leads_created ON leads(created_at DESC)`;
  await sql`CREATE TABLE IF NOT EXISTS audit_log (
    id bigserial PRIMARY KEY,
    business_id uuid,
    user_id uuid,
    action text NOT NULL,
    meta jsonb,
    created_at timestamptz NOT NULL DEFAULT now())`;
  // Growth funnel: one row per step (click, ig_comment, grade, register, paid, canceled).
  await sql`CREATE TABLE IF NOT EXISTS funnel_events (
    id bigserial PRIMARY KEY,
    event text NOT NULL,
    source text,
    medium text,
    campaign text,
    visitor_id text,
    user_id uuid,
    business_id uuid,
    meta jsonb,
    created_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE INDEX IF NOT EXISTS funnel_events_ev ON funnel_events(event, created_at DESC)`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS source text`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS attribution jsonb`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_opt_out boolean NOT NULL DEFAULT false`;
  await sql`CREATE TABLE IF NOT EXISTS payments (
    id text PRIMARY KEY,
    business_id uuid,
    amount_cents int NOT NULL,
    currency text NOT NULL DEFAULT 'usd',
    paid_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS email_log (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template text NOT NULL,
    sent_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, template))`;
}

export function reportScore(r: { scores: Record<string, { got: number; max: number }> }) {
  const v = Object.values(r.scores);
  const max = v.reduce((a, s) => a + s.max, 0);
  return max ? Math.round((v.reduce((a, s) => a + s.got, 0) / max) * 100) : 0;
}
