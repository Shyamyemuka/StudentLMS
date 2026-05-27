"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Lock, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubjectLockOverlayProps {
  subjectId: number;
  subjectTitle: string;
  userId: string;
  userEmail: string;
  userName: string;
  subjectPrice: number;
  subjectDuration: number | null;
}

export default function SubjectLockOverlay({
  subjectId,
  subjectTitle,
  userId,
  userEmail,
  userName,
  subjectPrice,
  subjectDuration,
}: SubjectLockOverlayProps) {
  const [isPaying, setIsPaying] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const durationText = subjectDuration
    ? subjectDuration % 12 === 0
      ? `${subjectDuration / 12} ${subjectDuration === 12 ? "year" : "years"}`
      : `${subjectDuration} ${subjectDuration === 1 ? "month" : "months"}`
    : "lifetime";

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

  const handleUnlockPayment = async () => {
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
      amount: Math.round(subjectPrice * 100), // convert to paise
      currency: "INR",
      name: "Student LMS",
      description: `Unlock ${durationText} access to ${subjectTitle}`,
      image: "/images/logo.png",
      handler: async function (response: any) {
        try {
          toast.loading("Registering course purchase...");
          
          const { error } = await supabase.from("subject_payments").insert({
            user_id: userId,
            subject_id: subjectId,
            payment_id: response.razorpay_payment_id,
            order_id: response.razorpay_order_id || null,
            amount: subjectPrice,
            currency: "INR",
            status: "completed",
          });

          if (error) {
            console.error("Payment insert error:", error);
            toast.error("Payment verified, but registration failed. Please contact studentlmsofficial@gmail.com.");
          } else {
            toast.dismiss();
            toast.success("Course unlocked successfully! Happy learning!");
            router.refresh(); // Refresh the page to trigger Server Component to fetch the fresh unlock status and unblur
          }
        } catch (err: any) {
          console.error("Payment database capture exception:", err);
          toast.error("Failed to register payment.");
        } finally {
          setIsPaying(false);
        }
      },
      modal: {
        ondismiss: function () {
          setIsPaying(false);
          router.push(`/dashboard?payment_failed=true&subject_title=${encodeURIComponent(subjectTitle)}`);
        }
      },
      prefill: {
        name: userName,
        email: userEmail,
      },
      notes: {
        subject_id: subjectId.toString(),
        student_id: userId,
      },
      theme: {
        color: "#ff4d4d", // Red marker color
      },
    };

    try {
      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        console.error("Razorpay payment failed:", response.error);
        try {
          rzp.close();
        } catch (e) {
          console.error("Error closing Razorpay modal:", e);
        }
        setIsPaying(false);
        window.location.href = `/dashboard?payment_failed=true&subject_title=${encodeURIComponent(subjectTitle)}&reason=${encodeURIComponent(response.error.description || "Transaction rejected.")}`;
      });
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
      className="bg-card border-[3px] border-border p-8 text-center max-w-lg mx-auto shadow-hard-xl relative my-8"
    >
      <div className="tape-decor" />
      
      {/* Icon Lock w/ Wiggle bounce */}
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/15 border-2 border-dashed border-accent mb-6 animate-sketch-bounce">
        <Lock className="size-8 text-accent animate-sketch-bounce" strokeWidth={2.5} />
      </div>

      {/* Heading */}
      <h2 className="text-2xl font-bold text-foreground mb-3 font-heading">
        Unlock {durationText.charAt(0).toUpperCase() + durationText.slice(1)} Access!
      </h2>
      
      {/* Description */}
      <p className="text-foreground/90 font-medium text-base mb-6 leading-relaxed font-body">
        You haven&apos;t purchased <span className="border-b-2 border-dashed border-secondary text-secondary font-bold">{subjectTitle}</span> yet. 
        Unlock {durationText} access to all lectures, bookmarks, PDF slides, study notes, and student communities for this subject!
      </p>

      {/* Price tag badge */}
      <div className="inline-block bg-muted border-2 border-border px-5 py-2 text-xl font-bold text-primary shadow-hard-sm wobbly-border-md mb-8">
        🏷️ Price: ₹{subjectPrice.toFixed(2)}
      </div>

      {/* Pay CTA */}
      <Button
        onClick={handleUnlockPayment}
        disabled={isPaying}
        size="lg"
        className="w-full shadow-hard-lg font-bold hover:scale-105 active:scale-95 transition-all text-lg py-4"
      >
        {isPaying ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin size-5 border-2 border-background border-t-transparent rounded-full" />
            Connecting portal...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Sparkles className="size-5" />
            Unlock Course via Razorpay
          </span>
        )}
      </Button>

      {/* Guarantee disclaimer */}
      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground font-bold italic">
        <AlertCircle className="size-4 text-border" />
        <span>Instant unlock. Verified transactions.</span>
      </div>
    </div>
  );
}
