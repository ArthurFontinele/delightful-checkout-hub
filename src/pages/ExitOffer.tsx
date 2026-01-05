import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Shield, Clock } from "lucide-react";
import { useTikTokPixel } from "@/hooks/useTikTokPixel";
import tiktokLogo from "@/assets/tiktok-logo.png";

const ExitOffer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/";
  const { trackPageView } = useTikTokPixel();

  useEffect(() => {
    trackPageView();
  }, []);

  const handleAcceptOffer = () => {
    navigate(returnUrl);
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full space-y-6">
        {/* TikTok Logo */}
        <div className="flex justify-center">
          <img src={tiktokLogo} alt="TikTok" className="h-16" />
        </div>

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-2xl md:text-3xl font-black text-[#161823]">
            ¡ESPERA! No Te Vayas Todavía...
          </h1>
          <p className="text-lg text-[#FE2C55]">
            Fuiste una de las{" "}
            <span className="bg-[#25F4EE] text-[#161823] px-2 py-0.5 rounded font-bold">
              1000
            </span>{" "}
            personas seleccionadas para un descuento{" "}
            <span className="font-bold">EXCLUSIVO!</span>
          </p>
        </div>

        {/* Price Card */}
        <div className="bg-gradient-to-br from-[#25F4EE]/10 to-[#25F4EE]/20 rounded-2xl p-6 text-center space-y-2 border border-[#25F4EE]/30">
          <p className="text-gray-500 line-through text-lg">De €9,90</p>
          <p className="text-[#161823] font-bold text-xl">Ahora por SOLO</p>
          <p className="text-5xl md:text-6xl font-black text-[#FE2C55]">€4,75</p>
          <p className="text-[#FE2C55] font-bold text-sm">
            ¡Aprovecha 50% de Descuento Inmediato!
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-4">
          {/* Security Benefit */}
          <div className="flex items-start gap-4 bg-white rounded-xl p-4 shadow-sm">
            <div className="shrink-0">
              <Shield className="h-6 w-6 text-[#25F4EE]" />
            </div>
            <div>
              <h3 className="font-bold text-[#161823]">Tu Seguridad Garantizada</h3>
              <p className="text-sm text-gray-600">
                La Tasa Anti-Fraude es esencial para verificar tu identidad y
                proteger tu cuenta. Un pequeño valor para tu tranquilidad.
              </p>
            </div>
          </div>

          {/* Limited Time Benefit */}
          <div className="flex items-start gap-4 bg-white rounded-xl p-4 shadow-sm">
            <div className="shrink-0">
              <Clock className="h-6 w-6 text-[#FE2C55]" />
            </div>
            <div>
              <h3 className="font-bold text-[#161823]">Oferta Por Tiempo Limitado</h3>
              <p className="text-sm text-gray-600">
                Los cupones con este súper descuento son limitados. ¡Asegura el
                tuyo antes de que esta oportunidad exclusiva termine!
              </p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleAcceptOffer}
          className="w-full py-4 px-6 text-white font-bold text-lg rounded-full bg-[#FE2C55] hover:bg-[#e0254c] transition-all duration-200 shadow-lg shadow-[#FE2C55]/30 hover:shadow-xl hover:shadow-[#FE2C55]/40 hover:-translate-y-0.5"
        >
          ¡QUIERO MI DESCUENTO AHORA!
        </button>

        {/* Social Proof */}
        <div className="text-center space-y-1 pt-2">
          <p className="text-sm font-bold text-[#161823]">
            ¡Miles ya aprovecharon este beneficio hoy!
          </p>
          <p className="text-xs text-gray-500 italic">
            No dejes escapar esta oportunidad y finaliza tu experiencia con
            ahorro.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExitOffer;
