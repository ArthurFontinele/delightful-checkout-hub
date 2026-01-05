import checkoutBanner from "@/assets/checkout-banner.jpg";

const CheckoutBanner = () => {
  return (
    <div className="w-full">
      <img 
        src={checkoutBanner} 
        alt="TikTok - Confirmación instantánea" 
        className="w-full h-auto max-w-[922px] mx-auto"
        style={{ aspectRatio: '922/389' }}
      />
    </div>
  );
};

export default CheckoutBanner;
