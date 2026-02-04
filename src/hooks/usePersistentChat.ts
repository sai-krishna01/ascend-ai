import { useState, useCallback, useEffect, useRef } from "react";
import { useChatSessions, ChatMessage } from "./useChatSessions";
import { toast } from "sonner";
import type { AIMode, UserLevel, Message } from "@/lib/types";

interface FileAttachment {
  name: string;
  url: string;
  type: string;
}

interface LinkAttachment {
  title: string;
  url: string;
}

interface UsePersistentChatOptions {
  mode: AIMode;
  level: UserLevel;
  subject?: string;
  language?: string;
  existingSessionId?: string;
}

export function usePersistentChat({ 
  mode, 
  level, 
  subject, 
  language,
  existingSessionId 
}: UsePersistentChatOptions) {
  const { createSession, saveMessage, getSessionMessages, updateSessionTitle } = useChatSessions();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(existingSessionId || null);
  const [isInitialized, setIsInitialized] = useState(false);
  const hasGeneratedTitle = useRef(false);

  // Load existing session messages
  useEffect(() => {
    if (existingSessionId && !isInitialized) {
      setSessionId(existingSessionId);
      getSessionMessages(existingSessionId).then((dbMessages) => {
        const formattedMessages: Message[] = dbMessages.map((msg: ChatMessage) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at),
        }));
        setMessages(formattedMessages);
        setIsInitialized(true);
      });
    } else {
      setIsInitialized(true);
    }
  }, [existingSessionId, getSessionMessages, isInitialized]);

  // Generate session title from first user message
  const generateTitle = useCallback(async (content: string, currentSessionId: string) => {
    if (hasGeneratedTitle.current) return;
    hasGeneratedTitle.current = true;
    
    // Create a simple title from the first message
    const title = content.length > 50 
      ? content.substring(0, 47) + "..." 
      : content;
    
    await updateSessionTitle(currentSessionId, title);
  }, [updateSessionTitle]);

  const sendMessage = useCallback(async (
    content: string,
    files?: FileAttachment[],
    links?: LinkAttachment[]
  ) => {
    if (!content.trim() && (!files || files.length === 0) && (!links || links.length === 0)) return;

    let currentSessionId = sessionId;

    // Create session if it doesn't exist
    if (!currentSessionId) {
      currentSessionId = await createSession(mode, subject);
      if (!currentSessionId) {
        toast.error("Failed to create chat session");
        return;
      }
      setSessionId(currentSessionId);
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Save user message to database
    saveMessage(currentSessionId, "user", content.trim());

    // Generate title from first message
    if (messages.length === 0) {
      generateTitle(content.trim(), currentSessionId);
    }

    let assistantContent = "";
    const assistantId = crypto.randomUUID();

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-mentor`;
      
      const allMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      // Build attachments object for the API
      const attachments: { files?: FileAttachment[]; links?: LinkAttachment[] } = {};
      if (files && files.length > 0) {
        attachments.files = files;
      }
      if (links && links.length > 0) {
        attachments.links = links;
      }

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
        }),
      });

      if (response.status === 429) {
        toast.error("Rate limit exceeded. Please wait a moment and try again.");
        setIsLoading(false);
        return;
      }

      if (response.status === 402) {
        toast.error("AI credits exhausted. Please contact support.");
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

      // Add empty assistant message
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

      // Save assistant message to database
      if (assistantContent && currentSessionId) {
        saveMessage(currentSessionId, "assistant", assistantContent);
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to send message. Please try again.");
      // Remove the empty assistant message on error
      setMessages(prev => prev.filter(m => m.id !== assistantId));
    } finally {
      setIsLoading(false);
    }
  }, [messages, mode, level, subject, language, sessionId, createSession, saveMessage, generateTitle]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    hasGeneratedTitle.current = false;
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat,
    sessionId,
    isInitialized,
  };
}
