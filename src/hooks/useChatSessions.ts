import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import type { AIMode } from "@/lib/types";

export interface ChatSession {
  id: string;
  mode: string;
  subject: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export function useChatSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all sessions for the user
  const fetchSessions = useCallback(async () => {
    if (!user) {
      setSessions([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Create a new session
  const createSession = useCallback(async (mode: AIMode, subject?: string): Promise<string | null> => {
    if (!user) {
      toast.error("Please sign in to save your chat history");
      return null;
    }

    try {
      const title = subject ? `${mode} - ${subject}` : `${mode} session`;
      
      const { data, error } = await supabase
        .from("chat_sessions")
        .insert({
          user_id: user.id,
          mode,
          subject: subject || null,
          title,
        })
        .select()
        .single();

      if (error) throw error;
      
      setSessions(prev => [data, ...prev]);
      return data.id;
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Failed to create chat session");
      return null;
    }
  }, [user]);

  // Update session title
  const updateSessionTitle = useCallback(async (sessionId: string, title: string) => {
    try {
      const { error } = await supabase
        .from("chat_sessions")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", sessionId);

      if (error) throw error;

      setSessions(prev => 
        prev.map(s => s.id === sessionId ? { ...s, title } : s)
      );
    } catch (error) {
      console.error("Error updating session title:", error);
    }
  }, []);

  // Delete a session
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      // First delete all messages in the session
      await supabase
        .from("chat_messages")
        .delete()
        .eq("session_id", sessionId);

      // Then delete the session
      const { error } = await supabase
        .from("chat_sessions")
        .delete()
        .eq("id", sessionId);

      if (error) throw error;

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      toast.success("Session deleted");
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Failed to delete session");
    }
  }, []);

  // Get messages for a session
  const getSessionMessages = useCallback(async (sessionId: string): Promise<ChatMessage[]> => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []).map(msg => ({
        ...msg,
        role: msg.role as "user" | "assistant"
      }));
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  }, []);

  // Save a message to a session
  const saveMessage = useCallback(async (
    sessionId: string, 
    role: "user" | "assistant", 
    content: string
  ): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          session_id: sessionId,
          role,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      // Update session's updated_at
      await supabase
        .from("chat_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sessionId);

      // Update local sessions to move this one to top
      setSessions(prev => {
        const session = prev.find(s => s.id === sessionId);
        if (!session) return prev;
        return [
          { ...session, updated_at: new Date().toISOString() },
          ...prev.filter(s => s.id !== sessionId)
        ];
      });

      return data.id;
    } catch (error) {
      console.error("Error saving message:", error);
      return null;
    }
  }, [user]);

  return {
    sessions,
    isLoading,
    createSession,
    updateSessionTitle,
    deleteSession,
    getSessionMessages,
    saveMessage,
    refetch: fetchSessions,
  };
}
