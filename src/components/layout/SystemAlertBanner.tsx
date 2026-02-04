import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DismissibleAlert } from "@/components/ui/dismissible-alert";

interface SystemAlert {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
}

const DISMISSED_ALERTS_KEY = "dismissed_alerts";

export function SystemAlertBanner() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>(() => {
    // Load dismissed alerts from localStorage on mount
    try {
      const stored = localStorage.getItem(DISMISSED_ALERTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const fetchAlerts = async () => {
      const { data } = await supabase
        .from("system_alerts")
        .select("*")
        .eq("is_active", true);
      
      if (data) {
        // Filter out expired alerts
        const activeAlerts = data.filter(alert => {
          if (!alert.expires_at) return true;
          return new Date(alert.expires_at) > new Date();
        });
        setAlerts(activeAlerts as SystemAlert[]);
      }
    };

    fetchAlerts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("public_alerts")
      .on("postgres_changes", { event: "*", schema: "public", table: "system_alerts" }, () => {
        fetchAlerts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setDismissedAlerts(prev => {
      const newDismissed = [...prev, id];
      // Persist to localStorage
      try {
        localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify(newDismissed));
      } catch (e) {
        console.error("Failed to save dismissed alerts:", e);
      }
      return newDismissed;
    });
  }, []);

  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.includes(alert.id));

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-40 space-y-2 px-4 py-2 max-h-[40vh] overflow-y-auto">
      {visibleAlerts.map((alert) => (
        <DismissibleAlert
          key={alert.id}
          id={alert.id}
          title={alert.title}
          message={alert.message}
          type={alert.type}
          onDismiss={dismissAlert}
        />
      ))}
    </div>
  );
}
