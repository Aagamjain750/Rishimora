-- Apply once in Supabase SQL Editor if orders already existed before checkout was added.
-- profile_tables.sql also contains these idempotent ALTER statements.

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_label text NOT NULL DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS address_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cashback_amount numeric(12,2) NOT NULL DEFAULT 0;

SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'orders'
  AND column_name IN (
      'payment_method', 'payment_status', 'payment_label', 'address_snapshot',
      'subtotal', 'delivery_fee', 'discount', 'cashback_amount'
  )
ORDER BY column_name;
