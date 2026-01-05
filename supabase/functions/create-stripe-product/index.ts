import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-STRIPE-PRODUCT] ${step}${detailsStr}`);
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

    const { name, description, price, currency, image_url } = await req.json();
    logStep("Request data", { name, price, currency });

    if (!name || !price || !currency) {
      throw new Error("Missing required fields: name, price, currency");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Create product in Stripe
    const productData: Stripe.ProductCreateParams = {
      name,
      description: description || undefined,
    };

    if (image_url) {
      productData.images = [image_url];
    }

    const stripeProduct = await stripe.products.create(productData);
    logStep("Stripe product created", { productId: stripeProduct.id });

    // Create price in Stripe
    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: Math.round(price * 100),
      currency: currency.toLowerCase(),
    });
    logStep("Stripe price created", { priceId: stripePrice.id });

    return new Response(
      JSON.stringify({
        productId: stripeProduct.id,
        priceId: stripePrice.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
