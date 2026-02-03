import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Plus, Trash2, AlertCircle, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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

interface AlertsManagerProps {
  alerts: SystemAlert[];
  onCreateAlert: (alert: Omit<SystemAlert, "id" | "created_at">) => void;
  onUpdateAlert: (id: string, updates: Partial<SystemAlert>) => void;
  onDeleteAlert: (id: string) => void;
}

export function AlertsManager({ alerts, onCreateAlert, onUpdateAlert, onDeleteAlert }: AlertsManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newAlert, setNewAlert] = useState<{
    title: string;
    message: string;
    type: "info" | "warning" | "error" | "success";
    is_active: boolean;
    show_on_pages: string[];
    expires_at: string | null;
  }>({
    title: "",
    message: "",
    type: "info",
    is_active: true,
    show_on_pages: ["all"],
    expires_at: null,
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const handleCreate = () => {
    if (!newAlert.title || !newAlert.message) return;
    onCreateAlert(newAlert);
    setNewAlert({
      title: "",
      message: "",
      type: "info",
      is_active: true,
      show_on_pages: ["all"],
      expires_at: null,
    });
    setIsCreating(false);
  };

  return (
    <Card className="glass border-white/10">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>System Alerts</CardTitle>
          <CardDescription>Manage notifications shown to users</CardDescription>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Alert
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Alert</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="alert-title">Title</Label>
                <Input
                  id="alert-title"
                  value={newAlert.title}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Alert title..."
                />
              </div>
              <div>
                <Label htmlFor="alert-message">Message</Label>
                <Textarea
                  id="alert-message"
                  value={newAlert.message}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Alert message..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={newAlert.type}
                  onValueChange={(value: "info" | "warning" | "error" | "success") => 
                    setNewAlert(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="alert-expires">Expires At (optional)</Label>
                <Input
                  id="alert-expires"
                  type="datetime-local"
                  value={newAlert.expires_at || ""}
                  onChange={(e) => setNewAlert(prev => ({ 
                    ...prev, 
                    expires_at: e.target.value ? new Date(e.target.value).toISOString() : null 
                  }))}
                />
              </div>
              <Button onClick={handleCreate} className="w-full">Create Alert</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No alerts created yet</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="p-4 rounded-lg bg-secondary/50">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.type)}
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Created: {new Date(alert.created_at).toLocaleString()}
                      {alert.expires_at && ` • Expires: ${new Date(alert.expires_at).toLocaleString()}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`active-${alert.id}`} className="text-sm">Active</Label>
                    <Switch
                      id={`active-${alert.id}`}
                      checked={alert.is_active}
                      onCheckedChange={(checked) => onUpdateAlert(alert.id, { is_active: checked })}
                    />
                  </div>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => onDeleteAlert(alert.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
