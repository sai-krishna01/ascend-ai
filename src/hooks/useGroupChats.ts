// Re-export from context for backward compatibility
// This ensures all components use the same singleton provider

import { useGroupChatsContext, GroupChat, GroupMember } from "@/contexts/GroupChatsContext";
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

export type { GroupChat, GroupMember };

export interface GroupMessage {
  id: string;
  group_id: string;
  user_id: string | null;
  sender_name: string | null;
  sender_type: "user" | "ai" | "system";
  content: string;
  message_type: "text" | "file" | "link" | "ai_response";
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  created_at: string;
  reply_to_id: string | null;
}

// Primary hook - uses context for singleton state
export function useGroupChats() {
  return useGroupChatsContext();
}

// Separate hook for group messages - independent of group list state
export function useGroupMessages(groupId: string | null) {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!groupId || !user?.id || !isAuthenticated) {
      setMessages([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("group_chat_messages")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true })
        .limit(200);

      if (error) throw error;
      setMessages((data as GroupMessage[]) || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [groupId, user?.id, isAuthenticated]);

  const sendMessage = useCallback(
    async (
      content: string,
      messageType: "text" | "file" | "link" = "text",
      fileUrl?: string,
      fileName?: string,
      fileType?: string,
      replyToId?: string
    ): Promise<boolean> => {
      if (!groupId || !user?.id) return false;

      try {
        const { error } = await supabase.from("group_chat_messages").insert({
          group_id: groupId,
          user_id: user.id,
          sender_name: user.email?.split("@")[0] || "User",
          sender_type: "user",
          content,
          message_type: messageType,
          file_url: fileUrl || null,
          file_name: fileName || null,
          file_type: fileType || null,
          reply_to_id: replyToId || null,
        });

        if (error) throw error;
        return true;
      } catch (error) {
        console.error("Error sending message:", error);
        toast.error("Failed to send message");
        return false;
      }
    },
    [groupId, user?.id, user?.email]
  );

  const sendAIMessage = useCallback(
    async (content: string): Promise<boolean> => {
      if (!groupId) return false;

      try {
        const { error } = await supabase.from("group_chat_messages").insert({
          group_id: groupId,
          user_id: null,
          sender_name: "MentorAI",
          sender_type: "ai",
          content,
          message_type: "ai_response",
        });

        if (error) throw error;
        return true;
      } catch (error) {
        console.error("Error sending AI message:", error);
        return false;
      }
    },
    [groupId]
  );

  // Real-time subscription for messages - clear on auth change
  useEffect(() => {
    if (!groupId || !user?.id || !isAuthenticated) {
      setMessages([]);
      return;
    }

    fetchMessages();

    const channel = supabase
      .channel(`group-messages-${groupId}-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_chat_messages",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          setMessages((prev) => {
            const newMsg = payload.new as GroupMessage;
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, user?.id, isAuthenticated, fetchMessages]);

  return {
    messages,
    isLoading,
    sendMessage,
    sendAIMessage,
    refetch: fetchMessages,
  };
}
