import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const role = searchParams.get("role");
  const next = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  console.log("=== OAuth Callback Debug ===");
  console.log("URL:", request.url);
  console.log("Code present:", !!code);
  console.log("Role:", role);
  console.log("Error:", error);
  console.log("Error Description:", errorDescription);

  // If there's an error from the provider, redirect to login with error
  if (error) {
    console.error("OAuth error from provider:", error, errorDescription);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error)}&message=${encodeURIComponent(errorDescription || "Authentication failed")}`
    );
  }

  if (code) {
    const supabase = await createClient();
    
    try {
      console.log("Attempting to exchange code for session...");
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error("Session exchange error:", exchangeError.message, exchangeError);
        return NextResponse.redirect(
          `${origin}/login?error=session_error&message=${encodeURIComponent(exchangeError.message)}`
        );
      }

      if (!data.user) {
        console.error("No user data after exchange");
        return NextResponse.redirect(`${origin}/login?error=no_user&message=No user data returned`);
      }

      console.log("Session exchange successful. User ID:", data.user.id);
      console.log("User metadata:", data.user.user_metadata);

      // Check if profile exists first
      const { data: existingProfile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", data.user.id)
        .single();

      console.log("Profile check - exists:", !!existingProfile, "error:", profileError?.message);

      // If profile exists, check if role needs correction
      if (existingProfile) {
        console.log("Existing profile found. Role:", existingProfile.role);
        
        // FIX: If existing profile has wrong role (student/faculty instead of pending), correct it
        if (role && (existingProfile.role === "student" || existingProfile.role === "faculty")) {
          const correctRole = role === "faculty" ? "faculty_pending" : 
                             (role === "student" ? "student" : existingProfile.role);
          
          // Only update if it's different from current role
          if (correctRole !== existingProfile.role) {
            console.log(`Correcting existing profile role from ${existingProfile.role} to ${correctRole}`);
            
            await supabase
              .from("profiles")
              .update({ role: correctRole })
              .eq("user_id", data.user.id);
            
            if (correctRole === "faculty_pending") {
              return NextResponse.redirect(`${origin}/pending-approval`);
            }
          }
        }
        
        // Redirect pending faculty to approval page (students bypass approval)
        if (existingProfile.role === "faculty_pending") {
          return NextResponse.redirect(`${origin}/pending-approval`);
        }
        
        // Auto-upgrade legacy student_pending accounts
        if (existingProfile.role === "student_pending") {
          await supabase
            .from("profiles")
            .update({ role: "student" })
            .eq("user_id", data.user.id);
        }
        
        // Existing approved user - redirect to dashboard
        return NextResponse.redirect(`${origin}${next}`);
      }

      // For NEW users: determine the correct role from metadata or URL
      const metadataRole = data.user.user_metadata?.role;
      const urlRole = role === "faculty" ? "faculty_pending" : (role === "student" ? "student" : null);
      const userRole = metadataRole === "student_pending" ? "student" : (metadataRole || urlRole || "student");
      
      console.log("Creating new profile. Role:", userRole);
      
      const fullName = data.user.user_metadata?.full_name || 
                      data.user.user_metadata?.name || 
                      data.user.email?.split("@")[0] || 
                      "User";

      // Wait a moment for the trigger to potentially create the profile
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check again if profile was created by trigger
      const { data: triggerProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", data.user.id)
        .single();

      if (triggerProfile) {
        console.log("Profile created by trigger. Role:", triggerProfile.role);
        
        // FIX: If profile was created with wrong role, update it
        if (triggerProfile.role === "student" || triggerProfile.role === "faculty") {
          const correctRole = role === "faculty" ? "faculty_pending" : 
                             (role === "student" ? "student" : triggerProfile.role);
          
          console.log(`Correcting role from ${triggerProfile.role} to ${correctRole}`);
          
          await supabase
            .from("profiles")
            .update({ role: correctRole })
            .eq("user_id", data.user.id);
          
          if (correctRole === "faculty_pending") {
            return NextResponse.redirect(`${origin}/pending-approval`);
          }
        }
        
        if (triggerProfile.role === "faculty_pending") {
          return NextResponse.redirect(`${origin}/pending-approval`);
        }

        // Auto-upgrade legacy student_pending trigger profiles
        if (triggerProfile.role === "student_pending") {
          await supabase
            .from("profiles")
            .update({ role: "student" })
            .eq("user_id", data.user.id);
        }
        
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Create new profile manually if trigger didn't create it
      const { error: insertError } = await supabase.from("profiles").insert({
        user_id: data.user.id,
        full_name: fullName,
        role: userRole,
      });

      if (insertError) {
        console.error("Profile creation error:", insertError.message, insertError);
        // Continue anyway, profile might exist
      } else {
        console.log("Profile created successfully");
      }

      // Redirect based on role
      if (userRole === "faculty_pending") {
        console.log("Redirecting to pending approval");
        return NextResponse.redirect(`${origin}/pending-approval`);
      }

      console.log("Redirecting to:", next);
      return NextResponse.redirect(`${origin}${next}`);
    } catch (err) {
      console.error("Callback exception:", err);
      return NextResponse.redirect(`${origin}/login?error=callback_exception&message=${encodeURIComponent(String(err))}`);
    }
  }

  // No code and no error - invalid callback
  console.error("No code in callback URL");
  return NextResponse.redirect(`${origin}/login?error=no_code&message=Invalid callback - no authorization code`);
}