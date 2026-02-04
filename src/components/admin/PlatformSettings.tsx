import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Power, UserPlus, Sparkles } from "lucide-react";

interface Setting {
  id: string;
  key: string;
  value: { enabled?: boolean; message?: string } | null;
  description: string | null;
}

interface PlatformSettingsProps {
  settings: Setting[];
  onUpdateSetting: (key: string, value: any) => void;
}

export function PlatformSettings({ settings, onUpdateSetting }: PlatformSettingsProps) {
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [messageValue, setMessageValue] = useState("");

  const getSetting = (key: string) => {
    return settings.find(s => s.key === key);
  };

  // Safely get value with defaults
  const getSettingValue = (key: string, defaultValue: { enabled: boolean; message?: string }) => {
    const setting = getSetting(key);
    if (!setting?.value) return defaultValue;
    return { ...defaultValue, ...setting.value };
  };

  const maintenanceMode = getSetting("maintenance_mode");
  const registrationEnabled = getSetting("registration_enabled");
  const aiFeatures = getSetting("ai_features_enabled");

  const maintenanceValue = getSettingValue("maintenance_mode", { enabled: false, message: "We are currently performing maintenance. Please check back later." });
  const registrationValue = getSettingValue("registration_enabled", { enabled: true });
  const aiValue = getSettingValue("ai_features_enabled", { enabled: true });

  const handleToggle = (key: string, currentValue: { enabled?: boolean; message?: string }) => {
    const safeValue = currentValue || { enabled: false };
    onUpdateSetting(key, { ...safeValue, enabled: !safeValue.enabled });
  };

  const handleMessageSave = (key: string, currentValue: { enabled?: boolean; message?: string }) => {
    const safeValue = currentValue || { enabled: false };
    onUpdateSetting(key, { ...safeValue, message: messageValue });
    setEditingMessage(null);
  };

  return (
    <Card className="glass border-white/10">
      <CardHeader className="pb-4">
        <CardTitle className="text-base sm:text-lg">Platform Settings</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Configure system settings and feature toggles</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {/* Maintenance Mode */}
        <div className="p-3 sm:p-4 rounded-lg bg-secondary/50">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-destructive/10 shrink-0">
                <Power className="w-4 h-4 text-destructive" />
              </div>
              <div className="min-w-0">
                <Label htmlFor="maintenance" className="font-medium text-sm sm:text-base">Maintenance Mode</Label>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Temporarily disable access</p>
              </div>
            </div>
            <Switch
              id="maintenance"
              checked={maintenanceValue.enabled}
              onCheckedChange={() => handleToggle("maintenance_mode", maintenanceValue)}
            />
          </div>
          {editingMessage === "maintenance_mode" ? (
            <div className="flex flex-col sm:flex-row gap-2 mt-3 ml-0 sm:ml-10">
              <Input
                value={messageValue}
                onChange={(e) => setMessageValue(e.target.value)}
                placeholder="Maintenance message..."
                className="flex-1 text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleMessageSave("maintenance_mode", maintenanceValue)}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingMessage(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto mt-2 ml-0 sm:ml-10 text-xs sm:text-sm"
              onClick={() => {
                setEditingMessage("maintenance_mode");
                setMessageValue(maintenanceValue.message || "");
              }}
            >
              Edit message
            </Button>
          )}
        </div>

        {/* Registration */}
        <div className="p-3 sm:p-4 rounded-lg bg-secondary/50">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/10 shrink-0">
                <UserPlus className="w-4 h-4 text-green-500" />
              </div>
              <div className="min-w-0">
                <Label htmlFor="registration" className="font-medium text-sm sm:text-base">New User Registration</Label>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Allow new users to sign up</p>
              </div>
            </div>
            <Switch
              id="registration"
              checked={registrationValue.enabled}
              onCheckedChange={() => handleToggle("registration_enabled", registrationValue)}
            />
          </div>
        </div>

        {/* AI Features */}
        <div className="p-3 sm:p-4 rounded-lg bg-secondary/50">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <Label htmlFor="ai" className="font-medium text-sm sm:text-base">AI Features</Label>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Enable AI teacher and mentor</p>
              </div>
            </div>
            <Switch
              id="ai"
              checked={aiValue.enabled}
              onCheckedChange={() => handleToggle("ai_features_enabled", aiValue)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}