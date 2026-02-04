import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { usePlatformSettings } from "./usePlatformSettings";

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
  const { aiSettings, isAIEnabled, isLoading: platformLoading } = usePlatformSettings();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!platformLoading) {
      setIsLoading(false);
    }
  }, [platformLoading]);

  // Check if AI is globally enabled
  const isAIGloballyEnabled = isAIEnabled;

  // Check if AI Mentor is accessible for current user
  const canAccessAIMentor = useCallback(() => {
    // If global AI is disabled, no one except admins can access
    if (!isAIGloballyEnabled) {
      if (role === "admin" || role === "founder") return true;
      return false;
    }
    
    // If AI mentor is specifically disabled
    if (!aiSettings.ai_mentor_enabled) {
      if (role === "admin" || role === "founder") return true;
      return false;
    }
    
    // Admins always have access
    if (role === "admin" || role === "founder") return true;
    
    // Check role-based access
    if (role === "teacher" && !aiSettings.ai_for_teachers) return false;
    if (role === "student" && !aiSettings.ai_for_students) return false;
    
    // Check free plan access (for non-authenticated or basic users)
    if (!isAuthenticated && !aiSettings.ai_for_free_plan) return false;
    
    return true;
  }, [aiSettings, role, isAIGloballyEnabled, isAuthenticated]);

  // Check if AI Group Chat is accessible
  const canAccessAIGroupChat = useCallback(() => {
    if (!isAIGloballyEnabled) {
      if (role === "admin" || role === "founder") return true;
      return false;
    }
    
    if (!aiSettings.ai_group_chat_enabled) {
      if (role === "admin" || role === "founder") return true;
      return false;
    }
    
    if (role === "admin" || role === "founder") return true;
    if (role === "teacher" && !aiSettings.ai_for_teachers) return false;
    if (role === "student" && !aiSettings.ai_for_students) return false;
    
    return true;
  }, [aiSettings, role, isAIGloballyEnabled]);

  // Check if AI Notes is accessible
  const canAccessAINotes = useCallback(() => {
    if (!isAIGloballyEnabled) {
      if (role === "admin" || role === "founder") return true;
      return false;
    }
    
    if (!aiSettings.ai_notes_enabled) {
      if (role === "admin" || role === "founder") return true;
      return false;
    }
    
    if (role === "admin" || role === "founder") return true;
    if (role === "teacher" && !aiSettings.ai_for_teachers) return false;
    if (role === "student" && !aiSettings.ai_for_students) return false;
    
    return true;
  }, [aiSettings, role, isAIGloballyEnabled]);

  // Check if AI Tools is accessible
  const canAccessAITools = useCallback(() => {
    if (!isAIGloballyEnabled) {
      if (role === "admin" || role === "founder") return true;
      return false;
    }
    
    if (!aiSettings.ai_tools_enabled) {
      if (role === "admin" || role === "founder") return true;
      return false;
    }
    
    if (role === "admin" || role === "founder") return true;
    if (role === "teacher" && !aiSettings.ai_for_teachers) return false;
    if (role === "student" && !aiSettings.ai_for_students) return false;
    
    return true;
  }, [aiSettings, role, isAIGloballyEnabled]);

  // Check if guest AI access is allowed
  const canGuestAccessAI = useCallback(() => {
    if (!isAIGloballyEnabled) return false;
    if (!aiSettings.ai_mentor_enabled) return false;
    if (!aiSettings.ai_for_free_plan) return false;
    return true;
  }, [aiSettings, isAIGloballyEnabled]);

  return {
    settings: aiSettings,
    isLoading,
    isAIGloballyEnabled,
    canAccessAIMentor,
    canAccessAIGroupChat,
    canAccessAINotes,
    canAccessAITools,
    canGuestAccessAI,
  };
}
