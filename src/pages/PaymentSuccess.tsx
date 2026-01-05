import { useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTikTokPixel } from "@/hooks/useTikTokPixel";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { trackCompletePayment } = useTikTokPixel();

  useEffect(() => {
    // Track CompletePayment event when page loads
    trackCompletePayment();
  }, [trackCompletePayment]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="bg-card rounded-2xl card-shadow p-8 max-w-md w-full text-center animate-scale-in">
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-success" />
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-2">
          ¡Pago Exitoso!
        </h1>
        
        <p className="text-muted-foreground mb-6">
          Tu pago ha sido procesado correctamente. Recibirás un correo de confirmación en breve.
        </p>

        <Button onClick={() => navigate("/")} className="w-full">
          Volver al Inicio
        </Button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
