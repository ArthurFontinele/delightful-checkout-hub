import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTikTokPixel } from "@/hooks/useTikTokPixel";
import CheckoutBanner from "@/components/CheckoutBanner";
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  banner_url: string | null;
  slug: string | null;
}

const Checkout = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [hasShownExitOffer, setHasShownExitOffer] = useState(false);
  const { trackInitiateCheckout, trackPageView } = useTikTokPixel();
  const [formData, setFormData] = useState({
    email: "",
    name: "",
  });

  // Handle back button interception
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (!hasShownExitOffer) {
        event.preventDefault();
        setHasShownExitOffer(true);
        // Push current state back and navigate to exit offer
        window.history.pushState(null, "", window.location.href);
        navigate(`/oferta-especial?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      }
    };

    // Push initial state to enable back button detection
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [hasShownExitOffer, navigate]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (error) {
        console.error("Error fetching product:", error);
        toast.error("Producto no encontrado");
      } else {
        setProduct(data);
      }
      setLoading(false);
    };

    fetchProduct();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.name) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    if (!product) {
      toast.error("Producto no encontrado");
      return;
    }

    setProcessing(true);

    // Track InitiateCheckout event
    trackInitiateCheckout({
      content_id: product.id,
      content_name: product.name,
      value: product.price,
      currency: product.currency,
    });

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          productId: product.id,
          customerEmail: formData.email,
          customerName: formData.name,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No fue posible crear la sesión de pago");
      }
    } catch (error: any) {
      console.error("Error creating checkout:", error);
      toast.error(error.message || "Error al procesar el pago");
    } finally {
      setProcessing(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: currency,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Producto no encontrado</h1>
          <p className="text-muted-foreground">El producto que buscas no está disponible.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Checkout Banner */}
      <CheckoutBanner />

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">

        {/* Product Card */}
        <div className="bg-card rounded-2xl card-shadow p-6 animate-slide-up font-tiktok" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center gap-4">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-16 h-16 rounded-xl object-cover bg-foreground"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
            )}
            <div className="flex-1">
              <h2 className="font-bold text-foreground">{product.name}</h2>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
            <span className="text-muted-foreground font-medium">Total</span>
            <span className="text-xl font-bold text-foreground">
              {formatPrice(product.price, product.currency)}
            </span>
          </div>
        </div>

        {/* Identification Form */}
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl card-shadow p-6 space-y-4 animate-slide-up font-tiktok" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-tiktok/10 rounded-lg p-2">
              <span className="text-lg">👤</span>
            </div>
            <h3 className="font-bold text-foreground">Identificación</h3>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-tiktok font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="h-12 bg-background border-border"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-tiktok font-medium">
              Nombre completo
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Nombre y apellido"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-12 bg-background border-border"
              required
            />
          </div>

          <Button
            type="submit"
            variant="tiktok"
            size="xl"
            className="w-full mt-6"
            disabled={processing}
          >
            {processing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Procesando...
              </>
            ) : (
              "PAGAR Y RECIBIR SALDO"
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Al finalizar el pago aceptas nuestros términos de uso y privacidad.
          </p>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
