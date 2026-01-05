import { Shield, CheckCircle } from "lucide-react";
import tiktokLogo from "@/assets/tiktok-logo.png";

interface CheckoutBannerProps {
  saldo?: string;
}

const CheckoutBanner = ({ saldo = "723,30 €" }: CheckoutBannerProps) => {
  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-6 py-6">
      {/* Header with Logo and Saldo */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <img src={tiktokLogo} alt="TikTok" className="h-10 w-10" />
          <span className="text-2xl font-bold text-foreground">TikTok</span>
        </div>
        
        {/* Saldo with gradient ring */}
        <div className="relative">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 p-[2px]">
            <div className="h-full w-full rounded-xl bg-background"></div>
          </div>
          <div className="relative bg-background rounded-xl px-4 py-2 text-center">
            <span className="text-xs text-muted-foreground">Saldo:</span>
            <p className="text-lg font-bold text-foreground">{saldo}</p>
          </div>
        </div>
      </div>

      {/* Trust Banner */}
      <div className="bg-gray-900 dark:bg-gray-950 rounded-2xl p-4 text-center">
        <p className="text-white font-medium text-sm mb-2">
          Confirmación instantánea • Saque llega en hasta 2 minutos
        </p>
        <div className="flex items-center justify-center gap-2 text-gray-400">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">Transacción Segura</span>
        </div>
      </div>
    </div>
  );
};

export default CheckoutBanner;
