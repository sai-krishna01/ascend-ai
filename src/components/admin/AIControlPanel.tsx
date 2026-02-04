import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Bot, 
  MessageSquare, 
  BookOpen, 
  Sparkles, 
  Users,
  Shield,
  Loader2,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AISettings {
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

export function AIControlPanel() {
  const [settings, setSettings] = useState<AISettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("platform_settings")
          .select("key, value")
          .eq("key", "ai_controls");

        if (error) throw error;

        if (data && data.length > 0) {
          const aiControls = data[0].value as unknown as AISettings;
          setSettings({ ...defaultSettings, ...aiControls });
        }
      } catch (error) {
        console.error("Error fetching AI settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const updateSetting = useCallback(async (key: keyof AISettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setIsSaving(true);

    try {
      // First check if the setting exists
      const { data: existingData } = await supabase
        .from("platform_settings")
        .select("id")
        .eq("key", "ai_controls")
        .single();

      let error;
      if (existingData) {
        // Update existing record
        const result = await supabase
          .from("platform_settings")
          .update({
            value: newSettings as any,
            description: "AI feature controls for the platform",
          })
          .eq("key", "ai_controls");
        error = result.error;
      } else {
        // Insert new record
        const result = await supabase
          .from("platform_settings")
          .insert([{
            key: "ai_controls",
            value: newSettings as any,
            description: "AI feature controls for the platform",
          }]);
        error = result.error;
      }

      if (error) throw error;
      toast.success("AI settings updated");
    } catch (error) {
      console.error("Error updating AI settings:", error);
      toast.error("Failed to update settings");
      // Revert on error
      setSettings(settings);
    } finally {
      setIsSaving(false);
    }
  }, [settings]);

  if (isLoading) {
    return (
      <Card className="glass border-white/10">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              AI Feature Controls
            </CardTitle>
            <CardDescription>
              Enable or disable AI features across the platform
            </CardDescription>
          </div>
          {isSaving && (
            <Badge variant="secondary" className="animate-pulse">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Saving...
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Module Controls */}
        <div>
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Modules
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <Label htmlFor="ai-mentor" className="font-medium">AI Mentor / Teacher</Label>
                  <p className="text-xs text-muted-foreground">Main AI chat assistant for learning</p>
                </div>
              </div>
              <Switch
                id="ai-mentor"
                checked={settings.ai_mentor_enabled}
                onCheckedChange={(checked) => updateSetting("ai_mentor_enabled", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <Label htmlFor="ai-group" className="font-medium">AI in Group Chats</Label>
                  <p className="text-xs text-muted-foreground">AI assistance in group discussions</p>
                </div>
              </div>
              <Switch
                id="ai-group"
                checked={settings.ai_group_chat_enabled}
                onCheckedChange={(checked) => updateSetting("ai_group_chat_enabled", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <BookOpen className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <Label htmlFor="ai-notes" className="font-medium">AI Notes Generator</Label>
                  <p className="text-xs text-muted-foreground">AI-powered study notes creation</p>
                </div>
              </div>
              <Switch
                id="ai-notes"
                checked={settings.ai_notes_enabled}
                onCheckedChange={(checked) => updateSetting("ai_notes_enabled", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <Label htmlFor="ai-tools" className="font-medium">AI Tools (Quiz, Practice)</Label>
                  <p className="text-xs text-muted-foreground">Quiz & practice question generators</p>
                </div>
              </div>
              <Switch
                id="ai-tools"
                checked={settings.ai_tools_enabled}
                onCheckedChange={(checked) => updateSetting("ai_tools_enabled", checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* User Access Controls */}
        <div>
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            User Access Controls
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Users className="h-4 w-4 text-yellow-500" />
                </div>
                <div>
                  <Label htmlFor="ai-students" className="font-medium">AI for Students</Label>
                  <p className="text-xs text-muted-foreground">Allow students to use AI features</p>
                </div>
              </div>
              <Switch
                id="ai-students"
                checked={settings.ai_for_students}
                onCheckedChange={(checked) => updateSetting("ai_for_students", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Users className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <Label htmlFor="ai-teachers" className="font-medium">AI for Teachers</Label>
                  <p className="text-xs text-muted-foreground">Allow teachers to use AI tools</p>
                </div>
              </div>
              <Switch
                id="ai-teachers"
                checked={settings.ai_for_teachers}
                onCheckedChange={(checked) => updateSetting("ai_for_teachers", checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-500/10">
                  <Sparkles className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <Label htmlFor="ai-free" className="font-medium">AI for Free Plan Users</Label>
                  <p className="text-xs text-muted-foreground">Enable AI features for free tier</p>
                </div>
              </div>
              <Switch
                id="ai-free"
                checked={settings.ai_for_free_plan}
                onCheckedChange={(checked) => updateSetting("ai_for_free_plan", checked)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
