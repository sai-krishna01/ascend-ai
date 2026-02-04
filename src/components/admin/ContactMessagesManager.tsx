import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Mail, 
  MessageSquare, 
  Loader2, 
  Check, 
  Clock,
  User,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
  responded_at: string | null;
}

export function ContactMessagesManager() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages((data as ContactMessage[]) || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load contact messages");
    } finally {
      setIsLoading(false);
    }
  };

  const markAsResponded = async (messageId: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("contact_messages")
        .update({
          status: "responded",
          responded_at: new Date().toISOString(),
        })
        .eq("id", messageId);

      if (error) throw error;
      
      toast.success("Marked as responded");
      fetchMessages();
      setSelectedMessage(null);
    } catch (error) {
      console.error("Error updating message:", error);
      toast.error("Failed to update message");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "responded":
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20"><Check className="h-3 w-3 mr-1" />Responded</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
      default:
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20"><Mail className="h-3 w-3 mr-1" />New</Badge>;
    }
  };

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
    <>
      <Card className="glass border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Contact Messages
          </CardTitle>
          <CardDescription>
            View and manage messages from the contact form
          </CardDescription>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No contact messages yet</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {messages.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => setSelectedMessage(msg)}
                    className="w-full p-4 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors text-left"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{msg.name}</span>
                          {getStatusBadge(msg.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{msg.email}</p>
                        <p className="text-sm mt-2 line-clamp-2">{msg.message}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(msg.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Contact Message</DialogTitle>
            <DialogDescription>
              Message details and actions
            </DialogDescription>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{selectedMessage.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={`mailto:${selectedMessage.email}`} 
                  className="text-primary hover:underline"
                >
                  {selectedMessage.email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {format(new Date(selectedMessage.created_at), "MMMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Message:</h4>
                <p className="text-sm bg-secondary/50 p-4 rounded-lg whitespace-pre-wrap">
                  {selectedMessage.message}
                </p>
              </div>
              <div className="flex items-center justify-between pt-4">
                {getStatusBadge(selectedMessage.status)}
                {selectedMessage.status !== "responded" && (
                  <Button 
                    onClick={() => markAsResponded(selectedMessage.id)}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Updating...</>
                    ) : (
                      <><Check className="h-4 w-4 mr-2" />Mark as Responded</>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
