import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

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

    const { productId, customerEmail, customerName } = await req.json();
    logStep("Request data", { productId, customerEmail, customerName });

    if (!productId || !customerEmail || !customerName) {
      throw new Error("Missing required fields: productId, customerEmail, customerName");
    }

    // Fetch product from database
    const { data: product, error: productError } = await supabaseClient
      .from("products")
      .select("*")
      .eq("id", productId)
      .eq("is_active", true)
      .single();

    if (productError || !product) {
      logStep("Product not found", { productError });
      throw new Error("Product not found");
    }
    logStep("Product found", { name: product.name, price: product.price });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    // Get or create price in Stripe
    let priceId = product.stripe_price_id;
    
    if (!priceId) {
      // Create product and price in Stripe
      const stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.description || undefined,
      });

      const stripePrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: Math.round(product.price * 100),
        currency: product.currency.toLowerCase(),
      });

      priceId = stripePrice.id;

      // Update product with Stripe IDs
      await supabaseClient
        .from("products")
        .update({
          stripe_product_id: stripeProduct.id,
          stripe_price_id: priceId,
        })
        .eq("id", productId);

      logStep("Created Stripe product and price", { stripeProductId: stripeProduct.id, priceId });
    }

    // Create order in database
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .insert({
        product_id: productId,
        customer_email: customerEmail,
        customer_name: customerName,
        amount: product.price,
        currency: product.currency,
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

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment-canceled`,
      metadata: {
        order_id: order.id,
        product_id: productId,
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
