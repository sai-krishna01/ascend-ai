import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PlatformSettings {
  maintenance_mode: { enabled: boolean; message: string };
  registration_enabled: { enabled: boolean };
  ai_features_enabled: { enabled: boolean };
}

interface AISettings {
  ai_mentor_enabled: boolean;
  ai_group_chat_enabled: boolean;
  ai_notes_enabled: boolean;
  ai_tools_enabled: boolean;
  ai_for_students: boolean;
  ai_for_teachers: boolean;
  ai_for_free_plan: boolean;
  file_upload_enabled: boolean;
  link_upload_enabled: boolean;
  custom_topics_enabled: boolean;
  custom_subjects_enabled: boolean;
}

const defaultPlatformSettings: PlatformSettings = {
  maintenance_mode: { enabled: false, message: "We are currently performing maintenance. Please check back later." },
  registration_enabled: { enabled: true },
  ai_features_enabled: { enabled: true },
};

const defaultAISettings: AISettings = {
  ai_mentor_enabled: true,
  ai_group_chat_enabled: true,
  ai_notes_enabled: true,
  ai_tools_enabled: true,
  ai_for_students: true,
  ai_for_teachers: true,
  ai_for_free_plan: true,
  file_upload_enabled: true,
  link_upload_enabled: true,
  custom_topics_enabled: true,
  custom_subjects_enabled: true,
};

export function usePlatformSettings() {
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(defaultPlatformSettings);
  const [aiSettings, setAISettings] = useState<AISettings>(defaultAISettings);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("key, value");

      if (error) throw error;

      if (data) {
        const settings = { ...defaultPlatformSettings };
        const ai = { ...defaultAISettings };

        data.forEach((row) => {
          if (row.key === "maintenance_mode" && row.value) {
            settings.maintenance_mode = row.value as PlatformSettings["maintenance_mode"];
          }
          if (row.key === "registration_enabled" && row.value) {
            settings.registration_enabled = row.value as PlatformSettings["registration_enabled"];
          }
          if (row.key === "ai_features_enabled" && row.value) {
            settings.ai_features_enabled = row.value as PlatformSettings["ai_features_enabled"];
          }
          if (row.key === "ai_controls" && row.value) {
            Object.assign(ai, row.value);
          }
        });

        setPlatformSettings(settings);
        setAISettings(ai);
      }
    } catch (error) {
      console.error("Error fetching platform settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();

    // Subscribe to changes
    const channel = supabase
      .channel("platform-settings-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "platform_settings",
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

  return {
    platformSettings,
    aiSettings,
    isLoading,
    isMaintenanceMode: platformSettings.maintenance_mode.enabled,
    maintenanceMessage: platformSettings.maintenance_mode.message,
    isRegistrationEnabled: platformSettings.registration_enabled.enabled,
    isAIEnabled: platformSettings.ai_features_enabled.enabled,
    refetch: fetchSettings,
  };
}
