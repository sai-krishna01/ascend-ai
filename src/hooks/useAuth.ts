import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import type { AppRole, UserProfile } from "@/lib/types";

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: AppRole | null;
  isLoading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    role: null,
    isLoading: true,
  });

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      // Use maybeSingle() to handle 0 rows gracefully
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      }

      // If no profile exists, create one
      if (!profile && !profileError) {
        const { data: session } = await supabase.auth.getSession();
        const userMeta = session?.session?.user?.user_metadata;
        
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({
            user_id: userId,
            full_name: userMeta?.full_name || null,
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating profile:", createError);
        }

        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();

        return {
          profile: newProfile as UserProfile | null,
          role: (roleData?.role as AppRole) || "student",
        };
      }

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (roleError) {
        console.error("Error fetching role:", roleError);
      }

      return {
        profile: profile as UserProfile | null,
        role: (roleData?.role as AppRole) || "student",
      };
    } catch (error) {
      console.error("Error in fetchProfile:", error);
      return { profile: null, role: "student" as AppRole };
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setState(prev => ({ ...prev, session, user: session?.user ?? null }));

        if (session?.user) {
          setTimeout(async () => {
            const { profile, role } = await fetchProfile(session.user.id);
            setState(prev => ({ ...prev, profile, role, isLoading: false }));
          }, 0);
        } else {
          setState(prev => ({ ...prev, profile: null, role: null, isLoading: false }));
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setState(prev => ({ ...prev, session, user: session?.user ?? null }));
      
      if (session?.user) {
        const { profile, role } = await fetchProfile(session.user.id);
        setState(prev => ({ ...prev, profile, role, isLoading: false }));
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName },
      },
    });

    if (error) {
      toast.error(error.message);
      return { error };
    }

    toast.success("Check your email to confirm your account!");
    return { data };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      return { error };
    }

    toast.success("Welcome back!");
    return { data };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return { error };
    }
    toast.success("Signed out successfully");
    return {};
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!state.user) return { error: new Error("Not authenticated") };

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", state.user.id)
      .select()
      .single();

    if (error) {
      toast.error("Failed to update profile");
      return { error };
    }

    setState(prev => ({ ...prev, profile: data as UserProfile }));
    toast.success("Profile updated!");
    return { data };
  }, [state.user]);

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isAuthenticated: !!state.session,
  };
}
