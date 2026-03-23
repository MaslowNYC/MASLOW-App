import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * PHASE 2 PLACEHOLDER — AI Concierge
 *
 * Disabled for MVP launch. Not yet implemented.
 *
 * When enabled:
 * - Uses ANTHROPIC_API_KEY (already in secrets)
 * - Estimated cost: ~$0.75 per conversation
 * - Budget cap: $500/month before enabling
 * - Model: claude-sonnet-4-20250514
 *
 * To activate: remove the 503 return and implement the Claude API call below.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({
      error: 'Feature Not Available',
      message: 'The AI Concierge will be available soon. For assistance, email hello@maslow.nyc',
    }),
    { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
