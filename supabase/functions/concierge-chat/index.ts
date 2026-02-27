// Maslow AI Concierge - Supabase Edge Function
// Calls Claude API and tracks costs

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const CLAUDE_MODEL = 'claude-sonnet-4-20250514'; // Latest Claude Sonnet 4

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  systemPrompt: string;
  messages: Message[];
  maxTokens?: number;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // PHASE 1: Concierge disabled for MVP launch
  // TODO PHASE 2: Remove this block and implement budget cap ($500/month)
  // Cost: ~$0.75 per conversation
  return new Response(
    JSON.stringify({
      error: 'Feature Not Available',
      message: 'The AI Concierge will be available soon! For assistance, email hello@maslow.nyc'
    }),
    {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );

  try {
    if (!ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY not configured. Check supabase secrets.');
      return new Response(
        JSON.stringify({ error: 'AI service not configured', debug: 'Missing API key' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { systemPrompt, messages, maxTokens = 2000 }: RequestBody = await req.json();

    console.log(`Concierge request: ${messages.length} messages, maxTokens: ${maxTokens}`);

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI service temporarily unavailable', debug: `API status: ${response.status}`, details: errorText }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    // Extract content and usage
    const content = data.content?.[0]?.text || '';
    const usage = {
      input_tokens: data.usage?.input_tokens || 0,
      output_tokens: data.usage?.output_tokens || 0,
    };

    // Log for monitoring
    console.log(`Concierge response: ${usage.input_tokens} in, ${usage.output_tokens} out`);

    return new Response(
      JSON.stringify({
        content,
        usage,
        model: CLAUDE_MODEL,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Concierge function error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', debug: String(error) }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
