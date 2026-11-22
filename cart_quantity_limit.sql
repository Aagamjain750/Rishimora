-- Run once in Supabase to enforce the per-product quantity cap for existing installs.
-- Existing carts over the cap are reduced to the allowed maximum before enforcement.
UPDATE public.cart SET quantity = 10 WHERE quantity > 10;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'cart_quantity_limit'
          AND conrelid = 'public.cart'::regclass
    ) THEN
        ALTER TABLE public.cart
            ADD CONSTRAINT cart_quantity_limit
            CHECK (quantity BETWEEN 1 AND 10);
    END IF;
END $$;
