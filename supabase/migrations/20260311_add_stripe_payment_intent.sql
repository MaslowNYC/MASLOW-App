-- Add Stripe payment intent reference to sessions table
-- This enables linking Stripe payments to session records
alter table public.sessions
  add column if not exists stripe_payment_intent_id text unique;

-- Add index for faster lookups by payment intent
create index if not exists idx_sessions_stripe_payment_intent_id
  on public.sessions(stripe_payment_intent_id);
