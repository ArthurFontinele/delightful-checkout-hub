import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Shield, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTikTokPixel } from "@/hooks/useTikTokPixel";

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
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { trackInitiateCheckout, trackPageView } = useTikTokPixel();
  const [formData, setFormData] = useState({
    email: "",
    name: "",
  });

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
      {/* Header */}
      <header className="gradient-header py-4 px-6">
        <h1 className="text-center text-lg font-bold text-primary-foreground">
          Pago Seguro y Rápido
        </h1>
      </header>

      {/* Banner */}
      {product.banner_url && (
        <div className="w-full">
          <img
            src={product.banner_url}
            alt="Banner"
            className="w-full h-auto object-cover"
          />
        </div>
      )}

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Trust Banner */}
        <div className="bg-primary/10 rounded-xl p-3 flex items-center gap-3 animate-fade-in">
          <div className="bg-primary rounded-lg p-2">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Confirmación instantánea • Procesamiento rápido
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-success" />
              Transacción Segura
            </p>
          </div>
        </div>

        {/* Product Card */}
        <div className="bg-card rounded-2xl card-shadow p-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
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
              {product.description && (
                <p className="text-sm text-primary">{product.description}</p>
              )}
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
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl card-shadow p-6 space-y-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary/10 rounded-lg p-2">
              <span className="text-lg">👤</span>
            </div>
            <h3 className="font-bold text-foreground">Identificación</h3>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-primary font-medium">
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
            <Label htmlFor="name" className="text-primary font-medium">
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
            variant="checkout"
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
              "PAGAR AHORA"
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
