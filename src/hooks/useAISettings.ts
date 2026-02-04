import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface AISettings {
  ai_mentor_enabled: boolean;
  ai_group_chat_enabled: boolean;
  ai_notes_enabled: boolean;
  ai_tools_enabled: boolean;
  ai_for_students: boolean;
  ai_for_teachers: boolean;
  ai_for_free_plan: boolean;
}

const defaultSettings: AISettings = {
  ai_mentor_enabled: true,
  ai_group_chat_enabled: true,
  ai_notes_enabled: true,
  ai_tools_enabled: true,
  ai_for_students: true,
  ai_for_teachers: true,
  ai_for_free_plan: true,
};

export function useAISettings() {
  const { role, isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<AISettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("key, value")
        .eq("key", "ai_controls")
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const aiControls = data.value as unknown as AISettings;
        setSettings({ ...defaultSettings, ...aiControls });
      }
    } catch (error) {
      console.error("Error fetching AI settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();

    // Subscribe to changes
    const channel = supabase
      .channel("ai-settings-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "platform_settings",
          filter: "key=eq.ai_controls",
        },
        () => {
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSettings]);

  // Check if AI Mentor is accessible for current user
  const canAccessAIMentor = useCallback(() => {
    if (!settings.ai_mentor_enabled) return false;
    if (role === "admin" || role === "founder") return true;
    if (role === "teacher" && !settings.ai_for_teachers) return false;
    if (role === "student" && !settings.ai_for_students) return false;
    return true;
  }, [settings, role]);

  // Check if AI Group Chat is accessible
  const canAccessAIGroupChat = useCallback(() => {
    if (!settings.ai_group_chat_enabled) return false;
    if (role === "admin" || role === "founder") return true;
    if (role === "teacher" && !settings.ai_for_teachers) return false;
    if (role === "student" && !settings.ai_for_students) return false;
    return true;
  }, [settings, role]);

  // Check if AI Notes is accessible
  const canAccessAINotes = useCallback(() => {
    if (!settings.ai_notes_enabled) return false;
    if (role === "admin" || role === "founder") return true;
    if (role === "teacher" && !settings.ai_for_teachers) return false;
    if (role === "student" && !settings.ai_for_students) return false;
    return true;
  }, [settings, role]);

  // Check if AI Tools is accessible
  const canAccessAITools = useCallback(() => {
    if (!settings.ai_tools_enabled) return false;
    if (role === "admin" || role === "founder") return true;
    if (role === "teacher" && !settings.ai_for_teachers) return false;
    if (role === "student" && !settings.ai_for_students) return false;
    return true;
  }, [settings, role]);

  return {
    settings,
    isLoading,
    canAccessAIMentor,
    canAccessAIGroupChat,
    canAccessAINotes,
    canAccessAITools,
    refetch: fetchSettings,
  };
}
