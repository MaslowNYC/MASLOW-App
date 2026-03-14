import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@13.6.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

// Generate a unique QR code token
function generateQRCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed ambiguous characters
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return new Response(`Webhook signature error: ${err.message}`, { status: 400 })
  }

  console.log('Received Stripe event:', event.type)

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    const { user_id, session_type_id, duration_minutes } = paymentIntent.metadata

    if (!user_id || !session_type_id) {
      console.error('Missing metadata in payment intent:', paymentIntent.id)
      return new Response('Missing required metadata', { status: 400 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Generate unique QR code
    const qrCode = generateQRCode()

    const { error } = await supabase.from('sessions').insert({
      user_id,
      status: 'paid',
      stripe_payment_intent_id: paymentIntent.id,
      payment_status: paymentIntent.status,
      amount_paid: paymentIntent.amount / 100, // Store as dollars (numeric field)
      duration_minutes: parseInt(duration_minutes) || 15,
      qr_code: qrCode,
      // suite_id and location_id are null until guest checks in
    })

    if (error) {
      console.error('Session insert error:', error)
      return new Response(`DB error: ${error.message}`, { status: 500 })
    }

    console.log('Session created for payment:', paymentIntent.id)
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    console.log('Payment failed:', paymentIntent.id, paymentIntent.last_payment_error?.message)
    // No session created for failed payments (by design)
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
