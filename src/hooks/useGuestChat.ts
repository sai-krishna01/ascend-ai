import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import type { AIMode, UserLevel, Message } from "@/lib/types";

const GUEST_MESSAGE_LIMIT = 10;
const GUEST_SESSION_KEY = "guest_chat_session";

interface GuestSession {
  messageCount: number;
  startedAt: string;
  expiresAt: string;
}

interface FileAttachment {
  name: string;
  url: string;
  type: string;
}

interface LinkAttachment {
  title: string;
  url: string;
}

interface UseGuestChatOptions {
  mode: AIMode;
  level: UserLevel;
  subject?: string;
  language?: string;
}

function getGuestSession(): GuestSession | null {
  try {
    const stored = sessionStorage.getItem(GUEST_SESSION_KEY);
    if (!stored) return null;
    
    const session = JSON.parse(stored) as GuestSession;
    
    // Check if expired (2 hours)
    if (new Date(session.expiresAt) < new Date()) {
      sessionStorage.removeItem(GUEST_SESSION_KEY);
      return null;
    }
    
    return session;
  } catch {
    return null;
  }
}

function saveGuestSession(session: GuestSession) {
  sessionStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
}

function initGuestSession(): GuestSession {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours
  
  const session: GuestSession = {
    messageCount: 0,
    startedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
  
  saveGuestSession(session);
  return session;
}

export function useGuestChat({ mode, level, subject, language }: UseGuestChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<GuestSession | null>(null);

  useEffect(() => {
    const existing = getGuestSession();
    setSession(existing || initGuestSession());
  }, []);

  const remainingMessages = GUEST_MESSAGE_LIMIT - (session?.messageCount || 0);
  const hasReachedLimit = remainingMessages <= 0;

  const sendMessage = useCallback(async (
    content: string,
    files?: FileAttachment[],
    links?: LinkAttachment[]
  ) => {
    if (!content.trim() && (!files || files.length === 0) && (!links || links.length === 0)) return;
    
    if (hasReachedLimit) {
      toast.error("Free message limit reached. Please sign up for unlimited access!");
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Update session message count
    const currentSession = getGuestSession() || initGuestSession();
    currentSession.messageCount += 1;
    saveGuestSession(currentSession);
    setSession(currentSession);

    let assistantContent = "";
    const assistantId = crypto.randomUUID();

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-mentor`;
      
      const allMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const attachments: { files?: FileAttachment[]; links?: LinkAttachment[] } = {};
      if (files && files.length > 0) attachments.files = files;
      if (links && links.length > 0) attachments.links = links;

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages,
          mode,
          level,
          subject,
          language,
          attachments: Object.keys(attachments).length > 0 ? attachments : undefined,
          isGuest: true,
        }),
      });

      if (response.status === 429) {
        toast.error("Rate limit exceeded. Please try again later.");
        setIsLoading(false);
        return;
      }

      if (response.status === 402) {
        toast.error("AI credits exhausted. Please try again later.");
        setIsLoading(false);
        return;
      }

      if (!response.ok || !response.body) {
        throw new Error("Failed to get AI response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      setMessages(prev => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", timestamp: new Date() },
      ]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              assistantContent += delta;
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId ? { ...m, content: assistantContent } : m
                )
              );
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              assistantContent += delta;
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId ? { ...m, content: assistantContent } : m
                )
              );
            }
          } catch { /* ignore */ }
        }
      }
    } catch (error) {
      console.error("Guest chat error:", error);
      toast.error("Failed to send message. Please try again.");
      setMessages(prev => prev.filter(m => m.id !== assistantId));
    } finally {
      setIsLoading(false);
    }
  }, [messages, mode, level, subject, language, hasReachedLimit]);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat,
    remainingMessages,
    hasReachedLimit,
    isGuest: true,
  };
}
