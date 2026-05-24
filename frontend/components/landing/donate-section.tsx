"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Coffee, Heart, AlertCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DonateSection() {
  const [isPaying, setIsPaying] = useState(false);
  const [customAmount, setCustomAmount] = useState("200");

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

  const handleSupportPayment = async (amount: number) => {
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
      amount: amount * 100, // in paise
      currency: "INR",
      name: "Student LMS Support",
      description: "Support Student Learning Platform ☕",
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
        color: "#ff4d4d", // Red marker color
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
    <section className="py-20 bg-background relative">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <div 
          style={{ borderRadius: "15px 225px 15px 255px / 255px 15px 225px 15px" }}
          className="bg-card border-[3px] border-border p-8 md:p-12 shadow-hard-xl relative"
        >
          <div className="tape-decor" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center pt-4">
            {/* Left - Text Content */}
            <div className="space-y-6">
              {/* Heading */}
              <div>
                <h2 className="text-3xl md:text-4xl text-foreground font-bold flex items-center gap-3 font-heading">
                  <Coffee className="size-8 text-primary animate-sketch-bounce" />
                  Support Student LMS?
                </h2>
                <div className="w-24 h-1 bg-border rounded-full mt-3" />
              </div>

              {/* Description */}
              <div className="space-y-4 text-foreground/90 font-medium leading-relaxed font-body">
                <p className="text-lg">
                  Hey there! Running this platform isn&apos;t exactly cheap. Between
                  cloud servers, real-time databases, audio/video storage, and keeping everything
                  running smoothly 24/7 — it all adds up pretty quick.
                </p>
                <p>
                  If you&apos;re finding this helpful and want to support keeping it
                  alive (and maybe help me grab a coffee while pushing updates
                  at 3 AM 😅), any contribution would be genuinely appreciated!
                </p>
              </div>

              {/* Additional Info */}
              <div className="flex items-start gap-3 pt-2">
                <div className="w-10 h-10 rounded-lg bg-secondary/15 border border-secondary/30 flex items-center justify-center flex-shrink-0 animate-sketch-bounce">
                  <Heart className="w-5 h-5 text-secondary fill-secondary" />
                </div>
                <div>
                  <p className="text-foreground font-bold text-base leading-tight">Every bit helps!</p>
                  <p className="text-sm text-muted-foreground font-bold italic mt-0.5">
                    Scan the QR code or choose a custom amount below to pay via Razorpay.
                  </p>
                </div>
              </div>

              {/* Preset Contributions */}
              <div className="pt-4 space-y-4">
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleSupportPayment(100)}
                    disabled={isPaying}
                    style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
                    className="px-4 py-2 bg-background border-2 border-border text-foreground font-bold text-sm shadow-hard-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    ☕ Coffee (₹100)
                  </button>
                  <button
                    onClick={() => handleSupportPayment(200)}
                    disabled={isPaying}
                    style={{ borderRadius: "15px 225px 15px 255px / 255px 15px 225px 15px" }}
                    className="px-4 py-2 bg-background border-2 border-border text-foreground font-bold text-sm shadow-hard-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    🍕 Pizza (₹200)
                  </button>
                  <button
                    onClick={() => handleSupportPayment(500)}
                    disabled={isPaying}
                    style={{ borderRadius: "10px 100px 10px 100px / 100px 10px 100px 10px" }}
                    className="px-4 py-2 bg-background border-2 border-border text-foreground font-bold text-sm shadow-hard-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    🚀 Server (₹500)
                  </button>
                </div>
              </div>
            </div>

            {/* Right - QR Code / Custom Razorpay Option */}
            <div className="flex flex-col items-center justify-center lg:items-end gap-6">
              <div className="relative">
                {/* QR Code Container */}
                <div 
                  style={{ borderRadius: "15px 255px 15px 225px / 255px 15px 225px 15px" }}
                  className="relative bg-white p-6 shadow-hard-lg border-4 border-border overflow-hidden"
                >
                  <img
                    src="/images/payment-qr.png"
                    alt="Payment QR Code"
                    className="w-56 h-56 object-contain"
                  />

                  {/* Label below QR */}
                  <div className="mt-4 text-center">
                    <p className="text-gray-800 font-bold text-sm font-heading">
                      Scan to Donate
                    </p>
                  </div>
                </div>
              </div>

              {/* Custom Amount Razorpay Pay CTA */}
              <div className="w-full max-w-[268px] flex items-center gap-2">
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Custom"
                  style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }}
                  className="w-24 border-2 border-border bg-background px-3 py-2 text-sm font-bold font-body text-center outline-none"
                />
                <Button
                  onClick={() => handleSupportPayment(Number(customAmount) || 100)}
                  disabled={isPaying || !customAmount}
                  size="sm"
                  className="flex-1 font-bold h-10 shadow-hard-sm"
                >
                  {isPaying ? "Connecting..." : "Support (₹)"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
