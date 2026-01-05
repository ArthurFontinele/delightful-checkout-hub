import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const PaymentCanceled = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="bg-card rounded-2xl card-shadow p-8 max-w-md w-full text-center animate-scale-in">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="h-10 w-10 text-destructive" />
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Pago Cancelado
        </h1>
        
        <p className="text-muted-foreground mb-6">
          El proceso de pago ha sido cancelado. No se ha realizado ningún cargo.
        </p>

        <Button onClick={() => navigate(-1)} className="w-full">
          Intentar de Nuevo
        </Button>
      </div>
    </div>
  );
};

export default PaymentCanceled;
