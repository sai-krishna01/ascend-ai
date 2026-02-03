import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PlatformSetting {
  id: string;
  key: string;
  value: { enabled?: boolean; message?: string };
  description: string | null;
  updated_at: string;
}

interface CustomPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  is_published: boolean;
  updated_at: string;
}

interface SystemAlert {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  is_active: boolean;
  show_on_pages: string[];
  expires_at: string | null;
  created_at: string;
}

interface UserStats {
  totalUsers: number;
  totalSessions: number;
  activeToday: number;
}

export function useAdminData() {
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<UserStats>({ totalUsers: 0, totalSessions: 0, activeToday: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      // Fetch platform settings
      const { data: settingsData } = await supabase
        .from("platform_settings")
        .select("*");
      
      if (settingsData) {
        setSettings(settingsData as PlatformSetting[]);
      }

      // Fetch custom pages
      const { data: pagesData } = await supabase
        .from("custom_pages")
        .select("*");
      
      if (pagesData) {
        setPages(pagesData as CustomPage[]);
      }

      // Fetch system alerts
      const { data: alertsData } = await supabase
        .from("system_alerts")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (alertsData) {
        setAlerts(alertsData as SystemAlert[]);
      }

      // Fetch users with profiles and roles
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*");
      
      if (profilesData) {
        // Fetch roles for each user
        const usersWithRoles = await Promise.all(
          profilesData.map(async (profile) => {
            const { data: roleData } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", profile.user_id)
              .single();
            
            return {
              ...profile,
              role: roleData?.role || "student"
            };
          })
        );
        setUsers(usersWithRoles);
        setStats(prev => ({ ...prev, totalUsers: usersWithRoles.length }));
      }

      // Fetch session count
      const { count: sessionCount } = await supabase
        .from("chat_sessions")
        .select("*", { count: "exact", head: true });
      
      if (sessionCount !== null) {
        setStats(prev => ({ ...prev, totalSessions: sessionCount }));
      }

      // Fetch today's active sessions
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayCount } = await supabase
        .from("chat_sessions")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString());
      
      if (todayCount !== null) {
        setStats(prev => ({ ...prev, activeToday: todayCount }));
      }

    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      const { error } = await supabase
        .from("platform_settings")
        .update({ value, updated_at: new Date().toISOString() })
        .eq("key", key);
      
      if (error) throw error;
      
      toast({
        title: "Setting updated",
        description: `${key.replace(/_/g, " ")} has been updated.`,
      });
      
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updatePage = async (id: string, updates: Partial<CustomPage>) => {
    try {
      const { error } = await supabase
        .from("custom_pages")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      
      if (error) throw error;
      
      toast({
        title: "Page updated",
        description: "The page has been saved.",
      });
      
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createAlert = async (alert: Omit<SystemAlert, "id" | "created_at">) => {
    try {
      const { error } = await supabase
        .from("system_alerts")
        .insert(alert);
      
      if (error) throw error;
      
      toast({
        title: "Alert created",
        description: "New system alert has been created.",
      });
      
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateAlert = async (id: string, updates: Partial<SystemAlert>) => {
    try {
      const { error } = await supabase
        .from("system_alerts")
        .update(updates)
        .eq("id", id);
      
      if (error) throw error;
      
      toast({
        title: "Alert updated",
        description: "System alert has been updated.",
      });
      
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteAlert = async (id: string) => {
    try {
      const { error } = await supabase
        .from("system_alerts")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      toast({
        title: "Alert deleted",
        description: "System alert has been removed.",
      });
      
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to realtime updates
    const settingsChannel = supabase
      .channel("platform_settings_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "platform_settings" }, () => {
        fetchData();
      })
      .subscribe();

    const alertsChannel = supabase
      .channel("system_alerts_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "system_alerts" }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(alertsChannel);
    };
  }, []);

  return {
    settings,
    pages,
    alerts,
    users,
    stats,
    isLoading,
    updateSetting,
    updatePage,
    createAlert,
    updateAlert,
    deleteAlert,
    refetch: fetchData,
  };
}
