import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SPECIAL-OFFER-CHECKOUT] ${step}${detailsStr}`);
};

// Price ID for the special offer product "Pay Second Chance" at €4.75
const SPECIAL_OFFER_PRICE_ID = "price_1Sm5yKEC5PUVqzd6I6et3tom";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { customerEmail, customerName } = await req.json();
    logStep("Request data", { customerEmail, customerName });

    if (!customerEmail || !customerName) {
      throw new Error("Missing required fields: customerEmail, customerName");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    // Create order in database
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .insert({
        customer_email: customerEmail,
        customer_name: customerName,
        amount: 4.75,
        currency: "EUR",
        status: "pending",
      })
      .select()
      .single();

    if (orderError) {
      logStep("Error creating order", { orderError });
      throw new Error("Failed to create order");
    }
    logStep("Order created", { orderId: order.id });

    const origin = req.headers.get("origin") || "http://localhost:5173";

    // Create checkout session with special offer price
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      line_items: [
        {
          price: SPECIAL_OFFER_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment-canceled`,
      metadata: {
        order_id: order.id,
        special_offer: "true",
      },
    });

    // Update order with session ID
    await supabaseClient
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order.id);

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
