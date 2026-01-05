import { useEffect } from "react";

const PaymentCanceled = () => {
  useEffect(() => {
    // Redirect to the special offer page on the custom domain
    window.location.href = "https://officialrewards.space/oferta-especial";
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-muted-foreground">Redirigiendo...</p>
      </div>
    </div>
  );
};

export default PaymentCanceled;
