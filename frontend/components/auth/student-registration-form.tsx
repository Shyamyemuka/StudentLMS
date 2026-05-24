"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RegistrationData {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
}

export function StudentRegistrationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<RegistrationData>({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const validateForm = () => {
    if (!formData.full_name.trim()) return "Full name is required";
    if (!formData.email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      return "Invalid email address";
    if (formData.password.length < 8)
      return "Password must be at least 8 characters";
    if (formData.password !== formData.confirm_password)
      return "Passwords do not match";
    return null;
  };

  const submitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // Create auth user
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            role: "student",
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        console.error("Registration error:", authError);
        throw new Error(authError.message);
      }

      if (!data.user) {
        throw new Error("Failed to create account");
      }

      // Wait for database trigger to create profile
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Check if profile exists, if not create manually
      const { data: existingProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("user_id", data.user.id)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Profile fetch error:", fetchError);
      }

      if (!existingProfile) {
        // Create profile manually
        const { error: insertError } = await supabase.from("profiles").insert({
          user_id: data.user.id,
          full_name: formData.full_name,
          role: "student",
        });

        if (insertError) {
          console.error("Profile insert error:", insertError);
          throw new Error(`Profile creation failed: ${insertError.message}`);
        }
      }

      setSuccess(true);
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(
        err.message || "Failed to submit registration. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card
        style={{ borderRadius: "15px 225px 15px 255px / 255px 15px 225px 15px" }}
        className="w-full max-w-2xl mx-auto bg-card border-2 border-border shadow-hard-md relative"
      >
        <div className="tape-decor" />
        <CardHeader className="text-center pt-8">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-secondary animate-sketch-bounce" />
          </div>
          <CardTitle className="text-2xl text-foreground font-bold">
            Registration Successful!
          </CardTitle>
          <CardDescription className="text-muted-foreground font-medium">
            Your student account is ready!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-secondary/15 border-2 border-secondary">
            <CheckCircle2 className="h-4 w-4 text-secondary" />
            <AlertDescription className="text-foreground">
              <div className="space-y-2 font-medium">
                <p className="font-bold text-lg">Account Ready 🎉</p>
                <p>
                  Your student account has been created successfully. You can
                  now log in and access the student dashboard immediately!
                </p>
                <p className="text-sm text-muted-foreground">
                  Make sure to check your email to verify your address for a
                  secure login experience.
                </p>
              </div>
            </AlertDescription>
          </Alert>

          <div className="bg-background p-5 rounded-lg space-y-2 border-2 border-dashed border-border wobbly-border-md">
            <h3 className="font-bold text-foreground">What You Can Do Now:</h3>
            <ol className="list-decimal list-inside space-y-1 text-base text-muted-foreground font-medium">
              <li>Log in using your email and password</li>
              <li>Browse all approved courses in the marketplace dashboard</li>
              <li>Unlock any subject via test payment to start learning!</li>
            </ol>
          </div>

          <Button
            onClick={() => router.push("/")}
            size="lg"
            className="w-full"
          >
            Back to Home
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      style={{ borderRadius: "15px 225px 15px 255px / 255px 15px 225px 15px" }}
      className="w-full max-w-2xl mx-auto bg-card border-2 border-border shadow-hard-md relative"
    >
      <div className="tape-decor" />
      <CardHeader className="pt-8">
        {/* Back Button */}
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-4 transition-colors group w-fit font-bold"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Back</span>
        </Link>

        <CardTitle className="text-foreground font-bold text-2xl">
          Student Registration
        </CardTitle>
        <CardDescription className="text-muted-foreground font-medium">
          Fill in your details to apply for student registration
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4 border-2 border-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-bold">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={submitRegistration} className="space-y-4">
          <div>
            <Label htmlFor="full_name" className="text-foreground font-bold">
              Full Name *
            </Label>
            <Input
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-foreground font-bold">
              Email Address *
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your.email@example.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-foreground font-bold">
              Password *
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleInputChange}
                placeholder="At least 8 characters"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirm_password" className="text-foreground font-bold">
              Confirm Password *
            </Label>
            <div className="relative">
              <Input
                id="confirm_password"
                name="confirm_password"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirm_password}
                onChange={handleInputChange}
                placeholder="Re-enter your password"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
          </div>

          <Alert className="bg-accent/5 border-2 border-accent border-dashed">
            <AlertCircle className="h-4 w-4 text-accent" />
            <AlertDescription className="text-foreground font-medium text-sm">
              <strong>Note:</strong> You will get instant access to the student dashboard! No upfront registration fee is required. You can pay to unlock individual subjects whenever you are ready.
            </AlertDescription>
          </Alert>

          <Button
            type="submit"
            disabled={loading}
            size="lg"
            className="w-full mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Registration"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
