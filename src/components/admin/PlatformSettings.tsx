import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";

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
      <CardHeader>
        <CardTitle>Platform Settings</CardTitle>
        <CardDescription>Configure system settings and feature toggles</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Maintenance Mode */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Label htmlFor="maintenance" className="font-medium">Maintenance Mode</Label>
              <Switch
                id="maintenance"
                checked={maintenanceMode?.value?.enabled || false}
                onCheckedChange={() => handleToggle("maintenance_mode", maintenanceMode?.value)}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-1">Temporarily disable access for users</p>
            {editingMessage === "maintenance_mode" ? (
              <div className="flex gap-2 mt-2">
                <Input
                  value={messageValue}
                  onChange={(e) => setMessageValue(e.target.value)}
                  placeholder="Maintenance message..."
                  className="flex-1"
                />
                <Button size="sm" onClick={() => handleMessageSave("maintenance_mode", maintenanceMode?.value)}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingMessage(null)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto mt-1"
                onClick={() => {
                  setEditingMessage("maintenance_mode");
                  setMessageValue(maintenanceMode?.value?.message || "");
                }}
              >
                Edit message
              </Button>
            )}
          </div>
        </div>

        {/* Registration */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
          <div>
            <div className="flex items-center gap-3">
              <Label htmlFor="registration" className="font-medium">New User Registration</Label>
              <Switch
                id="registration"
                checked={registrationEnabled?.value?.enabled || false}
                onCheckedChange={() => handleToggle("registration_enabled", registrationEnabled?.value)}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-1">Allow new users to sign up</p>
          </div>
        </div>

        {/* AI Features */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
          <div>
            <div className="flex items-center gap-3">
              <Label htmlFor="ai" className="font-medium">AI Features</Label>
              <Switch
                id="ai"
                checked={aiFeatures?.value?.enabled || false}
                onCheckedChange={() => handleToggle("ai_features_enabled", aiFeatures?.value)}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-1">Enable AI teacher and mentor</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
