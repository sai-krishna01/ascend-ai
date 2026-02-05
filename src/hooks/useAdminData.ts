import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PlatformSetting {
  id: string;
  key: string;
  value: { enabled?: boolean; message?: string } | null;
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

   const fetchData = useCallback(async () => {
     try {
       // Parallel fetch for better performance
       const [
         { data: settingsData },
         { data: pagesData },
         { data: alertsData },
         { data: profilesData },
         { count: sessionCount },
       ] = await Promise.all([
         supabase.from("platform_settings").select("*"),
         supabase.from("custom_pages").select("*"),
         supabase.from("system_alerts").select("*").order("created_at", { ascending: false }),
         supabase.from("profiles").select("*"),
         supabase.from("chat_sessions").select("*", { count: "exact", head: true }),
       ]);
       
       if (settingsData) {
         setSettings(settingsData as PlatformSetting[]);
       }
 
       if (pagesData) {
         setPages(pagesData as CustomPage[]);
       }
 
       if (alertsData) {
         setAlerts(alertsData as SystemAlert[]);
       }
 
       if (profilesData) {
         // Fetch all roles at once instead of per-user
         const { data: rolesData } = await supabase
           .from("user_roles")
           .select("user_id, role");
         
         const rolesMap = new Map(rolesData?.map(r => [r.user_id, r.role]) || []);
         
         const usersWithRoles = profilesData.map((profile) => ({
           ...profile,
           role: rolesMap.get(profile.user_id) || "student"
         }));
         
         setUsers(usersWithRoles);
         setStats(prev => ({ ...prev, totalUsers: usersWithRoles.length }));
       }
 
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
   }, []);

  const updateSetting = async (key: string, value: any) => {
    try {
      // Check if setting exists first
      const existing = settings.find(s => s.key === key);
      
      if (existing) {
        const { error } = await supabase
          .from("platform_settings")
          .update({ value, updated_at: new Date().toISOString() })
          .eq("key", key);
        
        if (error) throw error;
      } else {
        // Insert new setting
        const { error } = await supabase
          .from("platform_settings")
          .insert({ key, value, updated_at: new Date().toISOString() });
        
        if (error) throw error;
      }
      
      toast({
        title: "Setting updated",
        description: `${key.replace(/_/g, " ")} has been updated.`,
      });
      
      // Optimistic update
      setSettings(prev => {
        const idx = prev.findIndex(s => s.key === key);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], value, updated_at: new Date().toISOString() };
          return updated;
        }
        return [...prev, { id: '', key, value, description: null, updated_at: new Date().toISOString() }];
      });
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
      
      setAlerts(prev => prev.filter(a => a.id !== id));
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
      .channel("admin-platform_settings_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "platform_settings" }, (payload) => {
        if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
          setSettings(prev => {
            const newSetting = payload.new as PlatformSetting;
            const idx = prev.findIndex(s => s.id === newSetting.id || s.key === newSetting.key);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = newSetting;
              return updated;
            }
            return [...prev, newSetting];
          });
        } else if (payload.eventType === "DELETE") {
          setSettings(prev => prev.filter(s => s.id !== payload.old?.id));
        }
      })
      .subscribe();

    const alertsChannel = supabase
      .channel("admin-system_alerts_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "system_alerts" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setAlerts(prev => [payload.new as SystemAlert, ...prev]);
        } else if (payload.eventType === "UPDATE") {
          setAlerts(prev => prev.map(a => a.id === (payload.new as SystemAlert).id ? payload.new as SystemAlert : a));
        } else if (payload.eventType === "DELETE") {
          setAlerts(prev => prev.filter(a => a.id !== payload.old?.id));
        }
      })
      .subscribe();

    const pagesChannel = supabase
      .channel("admin-custom_pages_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "custom_pages" }, () => {
        fetchData();
      })
      .subscribe();

    const profilesChannel = supabase
      .channel("admin-profiles_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(alertsChannel);
      supabase.removeChannel(pagesChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [fetchData]);

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