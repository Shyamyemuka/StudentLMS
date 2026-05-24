"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { Profile, UserRole } from "@/types/database";
import { createNotificationForRole } from "@/lib/notifications/notification-service";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  // Fetch user profile
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    return data as Profile;
  }, [supabase]);

  // Initialize auth state
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const profile = await fetchProfile(user.id);
        setProfile(profile);
      }

      setLoading(false);
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);

        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setProfile(profile);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  // Sign up with email
  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName: string,
    role: "student" | "faculty"
  ) => {
    setLoading(true);

    // Create auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role === "faculty" ? "faculty_pending" : "student",
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setLoading(false);
      return { error: error.message };
    }

    if (data.user) {
      // Create profile
      const profileRole: UserRole = role === "faculty" ? "faculty_pending" : "student";

      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: data.user.id,
        full_name: fullName,
        role: profileRole,
      });

      if (profileError) {
        console.error("Profile creation error:", profileError);
      }

      // Notify admins about new faculty signup
      if (role === "faculty") {
        await createNotificationForRole(
          "admin",
          "new_faculty_signup",
          "New Faculty Signup 👤",
          `${fullName} has signed up as faculty and is awaiting approval.`,
          "/admin/faculty-approvals"
        );
      }
    }

    setLoading(false);
    return { error: null, user: data.user };
  };

  // Sign in with email
  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      return { error: error.message };
    }

    setLoading(false);
    return { error: null, user: data.user };
  };

  // Sign in with Google
  const signInWithGoogle = async (role?: "student" | "faculty") => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback${role ? `?role=${role}` : ""}`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  };

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push("/");
  };

  // Check role
  const isAdmin = profile?.role === "admin";
  const isFaculty = profile?.role === "faculty";
  const isFacultyPending = profile?.role === "faculty_pending";
  const isStudent = profile?.role === "student";

  return {
    user,
    profile,
    loading,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    isAdmin,
    isFaculty,
    isFacultyPending,
    isStudent,
    isAuthenticated: !!user,
  };
}