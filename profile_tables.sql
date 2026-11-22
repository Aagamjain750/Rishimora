-- Run in Supabase SQL Editor for Rishmora profile and checkout features.
-- Safe to re-run; checkout columns are added to an existing orders table below.
-- The Flask server accesses these tables with its private DATABASE_URL.
-- Do not store full card numbers, CVV, UPI PINs, or banking passwords here.

CREATE TABLE IF NOT EXISTS orders (
    order_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    order_number text NOT NULL UNIQUE,
    status text NOT NULL DEFAULT 'confirmed'
        CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
    total_amount numeric(12,2) NOT NULL CHECK (total_amount >= 0),
    items jsonb NOT NULL DEFAULT '[]'::jsonb,
    payment_method text,
    payment_status text NOT NULL DEFAULT 'pending',
    payment_label text NOT NULL DEFAULT '',
    address_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
    subtotal numeric(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    delivery_fee numeric(12,2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
    discount numeric(12,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
    cashback_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (cashback_amount >= 0),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Add checkout fields if orders was created from an earlier version of this file.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_label text NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS address_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cashback_amount numeric(12,2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS store_credit_ledger (
    credit_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    order_id uuid REFERENCES orders(order_id) ON DELETE SET NULL,
    amount numeric(12,2) NOT NULL CHECK (amount > 0),
    reason text NOT NULL DEFAULT 'Cashback',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS saved_upi (
    upi_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    label text NOT NULL DEFAULT 'Personal UPI',
    vpa text NOT NULL CHECK (length(vpa) <= 255),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS saved_addresses (
    address_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    label text NOT NULL DEFAULT 'Home',
    recipient_name text NOT NULL,
    phone text NOT NULL,
    address_line1 text NOT NULL,
    address_line2 text NOT NULL DEFAULT '',
    city text NOT NULL,
    state text NOT NULL,
    postal_code text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Card storage is intentionally token/metadata only. A payment provider must
-- tokenize cards before a reusable payment method can be saved.
CREATE TABLE IF NOT EXISTS saved_cards (
    card_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    label text NOT NULL DEFAULT 'Card',
    brand text NOT NULL,
    last_four text NOT NULL CHECK (last_four ~ '^[0-9]{4}$'),
    expiry_month smallint NOT NULL CHECK (expiry_month BETWEEN 1 AND 12),
    expiry_year smallint NOT NULL CHECK (expiry_year BETWEEN 2000 AND 9999),
    provider_token text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_user_date_idx ON orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS credit_user_date_idx ON store_credit_ledger (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS saved_upi_user_idx ON saved_upi (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS saved_addresses_user_idx ON saved_addresses (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS saved_cards_user_idx ON saved_cards (user_id, created_at DESC);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_upi ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_cards ENABLE ROW LEVEL SECURITY;

-- These tables are private to the Flask server; keep them out of direct
-- anon/authenticated Data API access. The server scopes every query by user_id.
REVOKE ALL ON TABLE orders, store_credit_ledger, saved_upi, saved_addresses, saved_cards
    FROM anon, authenticated;
