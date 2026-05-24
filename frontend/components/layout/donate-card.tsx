"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Coffee, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DonateCard() {
  const [isPaying, setIsPaying] = useState(false);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCoffeePayment = async () => {
    setIsPaying(true);
    const loaded = await loadRazorpayScript();
    
    if (!loaded) {
      toast.error("Failed to load Razorpay payment portal. Please check your internet connection.");
      setIsPaying(false);
      return;
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_StHc893qk1s39c";

    const options = {
      key: keyId,
      amount: 10000, // ₹100 in paise
      currency: "INR",
      name: "Student LMS Support",
      description: "Buy the Developer a Coffee ☕",
      image: "/images/logo.png",
      handler: function (response: any) {
        toast.success("Thank you so much for your support! You rock! 🙏💖");
        setIsPaying(false);
      },
      prefill: {
        name: "LMS Supporter",
        email: "support@studentlms.com",
      },
      theme: {
        color: "#2d5da1", // Blue pen color
      },
    };

    try {
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Razorpay initiation error:", err);
      toast.error("Failed to open Razorpay popup.");
      setIsPaying(false);
    }
  };

  return (
    <div 
      style={{ borderRadius: "15px 225px 15px 255px / 255px 15px 225px 15px" }}
      className="bg-card border-2 border-border p-6 mt-8 shadow-hard-md relative"
    >
      <div className="tape-decor" />
      
      {/* Heading */}
      <div className="text-center mb-4 pt-3">
        <h3 className="text-xl text-foreground font-bold flex items-center justify-center gap-2 font-heading">
          <Coffee className="size-5 text-primary animate-sketch-bounce" />
          Buy Me a Coffee?
        </h3>
        <div className="w-16 h-1 bg-border rounded-full mx-auto mt-2" />
      </div>

      {/* Description */}
      <p className="text-muted-foreground text-sm text-center font-bold leading-relaxed mb-6 font-body">
        Keeping this platform running 24/7 costs quite a bit. If you&apos;re finding
        it helpful, any support would be genuinely appreciated! 🙏
      </p>

      {/* QR Code */}
      <div className="flex justify-center mb-6">
        <div 
          style={{ borderRadius: "10px 100px 10px 100px / 100px 10px 100px 10px" }}
          className="relative bg-white p-4 shadow-hard-sm border-2 border-border overflow-hidden"
        >
          <img
            src="/images/payment-qr.png"
            alt="Payment QR Code"
            className="w-36 h-36 object-contain"
          />
        </div>
      </div>

      {/* Razorpay Button */}
      <Button
        onClick={handleCoffeePayment}
        disabled={isPaying}
        variant="default"
        className="w-full font-bold shadow-hard-sm hover:scale-105 active:scale-95 transition-all text-sm h-10 mb-4"
      >
        {isPaying ? (
          "Connecting portal..."
        ) : (
          <span className="flex items-center justify-center gap-1.5">
            <Heart className="size-4 fill-accent text-accent" />
            Support via Razorpay (₹100)
          </span>
        )}
      </Button>

      {/* Info */}
      <div className="flex items-center gap-2 justify-center text-xs font-bold text-muted-foreground italic">
        <p>Scan to contribute via UPI or click above</p>
      </div>
    </div>
  );
}
