import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Shield, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTikTokPixel } from "@/hooks/useTikTokPixel";

const ExitOffer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/";
  const { trackPageView } = useTikTokPixel();

  useEffect(() => {
    trackPageView();
  }, []);

  const handleAcceptOffer = () => {
    // Navigate back to checkout with the discount applied
    navigate(returnUrl);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-2 rounded-full text-sm font-bold animate-pulse">
            <Clock className="h-4 w-4" />
            ¡ESPERA! No Te Vayas Todavía...
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl p-6 space-y-6">
          {/* Selection Message */}
          <div className="text-center">
            <p className="text-lg text-muted-foreground">
              Fuiste una de las{" "}
              <span className="font-bold text-foreground">1000</span> personas
              seleccionadas para un descuento{" "}
              <span className="text-primary font-bold">¡EXCLUSIVO!</span>
            </p>
          </div>

          {/* Price Display */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-6 text-center space-y-2">
            <p className="text-muted-foreground line-through text-lg">
              De €21,34
            </p>
            <p className="text-sm text-muted-foreground font-medium">
              Ahora por SOLO
            </p>
            <p className="text-5xl font-black text-primary">€11,82</p>
            <div className="inline-block bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold">
              ¡40% de Descuento Inmediato!
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
              <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Tu Seguridad Garantizada</h3>
                <p className="text-sm text-muted-foreground">
                  La Tasa de Verificación es esencial para proteger tu identidad
                  y asegurar tu cuenta. Un pequeño valor para tu tranquilidad.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
              <div className="bg-amber-100 p-2 rounded-lg shrink-0">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Oferta Por Tiempo Limitado</h3>
                <p className="text-sm text-muted-foreground">
                  Los cupones con este súper descuento son limitados. ¡Asegura
                  el tuyo antes de que termine esta oportunidad exclusiva!
                </p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleAcceptOffer}
            className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all hover:-translate-y-0.5"
          >
            ¡QUIERO MI DESCUENTO AHORA!
          </Button>

          {/* Social Proof */}
          <div className="text-center space-y-1 pt-2">
            <p className="text-sm font-medium text-foreground flex items-center justify-center gap-1">
              <CheckCircle className="h-4 w-4 text-success" />
              Miles ya aprovecharon este beneficio hoy
            </p>
            <p className="text-xs text-muted-foreground">
              No dejes escapar esta oportunidad y finaliza tu experiencia con
              ahorro.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExitOffer;
