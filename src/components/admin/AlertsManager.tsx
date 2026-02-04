import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Plus, Trash2, AlertCircle, AlertTriangle, Info, CheckCircle, Edit2, X, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
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

  const [editData, setEditData] = useState<{
    title: string;
    message: string;
    type: "info" | "warning" | "error" | "success";
    expires_at: string | null;
  }>({
    title: "",
    message: "",
    type: "info",
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

  const startEditing = (alert: SystemAlert) => {
    setEditingId(alert.id);
    setEditData({
      title: alert.title,
      message: alert.message,
      type: alert.type,
      expires_at: alert.expires_at,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditData({ title: "", message: "", type: "info", expires_at: null });
  };

  const saveEditing = (id: string) => {
    onUpdateAlert(id, {
      title: editData.title,
      message: editData.message,
      type: editData.type,
      expires_at: editData.expires_at,
    });
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    onDeleteAlert(id);
    setDeleteConfirmId(null);
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
              {editingId === alert.id ? (
                // Edit mode
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      value={editData.title}
                      onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Title"
                      className="flex-1"
                    />
                    <Select
                      value={editData.type}
                      onValueChange={(value: "info" | "warning" | "error" | "success") => 
                        setEditData(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger className="w-32">
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
                  <Textarea
                    value={editData.message}
                    onChange={(e) => setEditData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Message"
                    rows={2}
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      type="datetime-local"
                      value={editData.expires_at ? new Date(editData.expires_at).toISOString().slice(0, 16) : ""}
                      onChange={(e) => setEditData(prev => ({ 
                        ...prev, 
                        expires_at: e.target.value ? new Date(e.target.value).toISOString() : null 
                      }))}
                      className="flex-1"
                    />
                    <Button size="sm" variant="ghost" onClick={cancelEditing}>
                      <X className="w-4 h-4" />
                    </Button>
                    <Button size="sm" onClick={() => saveEditing(alert.id)}>
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                // View mode
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
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 mr-2">
                      <Label htmlFor={`active-${alert.id}`} className="text-sm">Active</Label>
                      <Switch
                        id={`active-${alert.id}`}
                        checked={alert.is_active}
                        onCheckedChange={(checked) => onUpdateAlert(alert.id, { is_active: checked })}
                      />
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => startEditing(alert)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => setDeleteConfirmId(alert.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Alert</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this alert? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
