import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, AlertTriangle, Info, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SystemAlert {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
}

export function SystemAlertBanner() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

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

  const getAlertStyles = (type: string) => {
    switch (type) {
      case "error":
        return "bg-destructive/10 border-destructive text-destructive";
      case "warning":
        return "bg-yellow-500/10 border-yellow-500 text-yellow-500";
      case "success":
        return "bg-green-500/10 border-green-500 text-green-500";
      default:
        return "bg-blue-500/10 border-blue-500 text-blue-500";
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertCircle className="w-4 h-4" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4" />;
      case "success":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const dismissAlert = (id: string) => {
    setDismissedAlerts(prev => [...prev, id]);
  };

  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.includes(alert.id));

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-40 space-y-2 px-4 py-2">
      {visibleAlerts.map((alert) => (
        <div
          key={alert.id}
          className={`flex items-center justify-between gap-4 px-4 py-3 rounded-lg border ${getAlertStyles(alert.type)}`}
        >
          <div className="flex items-center gap-3">
            {getAlertIcon(alert.type)}
            <div>
              <span className="font-medium">{alert.title}</span>
              <span className="mx-2">—</span>
              <span>{alert.message}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-white/10"
            onClick={() => dismissAlert(alert.id)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
