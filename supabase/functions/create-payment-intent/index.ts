import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@13.6.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { session_type_id, amount, credits, packageName } = body

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let paymentAmount: number
    let metadata: Record<string, string>

    // Flow 1: Buy credits (amount + credits provided)
    if (amount && credits) {
      paymentAmount = amount // already in cents from client
      metadata = {
        user_id: user.id,
        type: 'credit_purchase',
        credits: String(credits),
        package_name: packageName || `${credits} Credits`,
      }
    }
    // Flow 2: Book session (session_type_id provided)
    else if (session_type_id) {
      const { data: sessionType, error: typeError } = await supabase
        .from('session_types')
        .select('*')
        .eq('id', session_type_id)
        .eq('is_active', true)
        .single()

      if (typeError || !sessionType) {
        return new Response(
          JSON.stringify({ error: 'Invalid session type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      paymentAmount = sessionType.price_cents
      metadata = {
        user_id: user.id,
        type: 'booking',
        session_type_id: String(session_type_id),
        session_type_name: sessionType.name,
        duration_minutes: String(sessionType.duration_minutes),
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: paymentAmount,
      currency: 'usd',
      metadata,
    })

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (err) {
    console.error('Payment intent error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
