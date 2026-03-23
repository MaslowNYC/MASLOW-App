-- Credit packages table
-- Source of truth for credit package pricing.
-- The server looks up prices here — clients never send amounts.

CREATE TABLE IF NOT EXISTS public.credit_packages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  credits     integer NOT NULL,
  price_cents integer NOT NULL,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Seed with current packages (prices in cents)
INSERT INTO public.credit_packages (name, credits, price_cents) VALUES
  ('Single Visit',    1,   500),
  ('Starter Pack',   10,  4500),
  ('Weekly Pass',    10,  4200),
  ('Monthly Pass',   40, 14000),
  ('Unlimited Month',60, 18000)
ON CONFLICT (name) DO UPDATE
  SET credits     = EXCLUDED.credits,
      price_cents = EXCLUDED.price_cents,
      is_active   = EXCLUDED.is_active;

-- Only authenticated users can read packages (for price lookups in edge functions)
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read credit packages"
  ON public.credit_packages
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admins can manage packages
CREATE POLICY "Admins can manage credit packages"
  ON public.credit_packages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
