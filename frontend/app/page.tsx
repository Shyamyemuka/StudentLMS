import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navigation from "@/components/landing/navigation";
import HeroSection from "@/components/landing/hero-section";
import BenefitsSection from "@/components/landing/benefits-section";
import Footer from "@/components/landing/footer";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  // Check if user is already logged in
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is logged in, redirect to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-background relative overflow-x-hidden">
      <Navigation />
      <HeroSection />
      <BenefitsSection />
      <Footer />
    </main>
  );
}
