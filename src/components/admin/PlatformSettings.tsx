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
  value: { enabled?: boolean; message?: string };
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

  const maintenanceMode = getSetting("maintenance_mode");
  const registrationEnabled = getSetting("registration_enabled");
  const aiFeatures = getSetting("ai_features_enabled");

  const handleToggle = (key: string, currentValue: any) => {
    onUpdateSetting(key, { ...currentValue, enabled: !currentValue.enabled });
  };

  const handleMessageSave = (key: string, currentValue: any) => {
    onUpdateSetting(key, { ...currentValue, message: messageValue });
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
              checked={maintenanceMode?.value?.enabled || false}
              onCheckedChange={() => handleToggle("maintenance_mode", maintenanceMode?.value)}
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
                <Button size="sm" onClick={() => handleMessageSave("maintenance_mode", maintenanceMode?.value)}>
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
                setMessageValue(maintenanceMode?.value?.message || "");
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
              checked={registrationEnabled?.value?.enabled !== false}
              onCheckedChange={() => handleToggle("registration_enabled", registrationEnabled?.value || { enabled: true })}
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
              checked={aiFeatures?.value?.enabled !== false}
              onCheckedChange={() => handleToggle("ai_features_enabled", aiFeatures?.value || { enabled: true })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
