import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChat } from "@/hooks/useChat";
import { AIMode, UserLevel, AI_MODES, USER_LEVELS } from "@/lib/types";
import ReactMarkdown from "react-markdown";

interface ChatInterfaceProps {
  mode: AIMode;
  level: UserLevel;
  subject?: string;
  language?: string;
  onBack: () => void;
}

export function ChatInterface({ mode, level, subject, language, onBack }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, isLoading, sendMessage, clearChat } = useChat({
    mode,
    level,
    subject,
    language,
  });

  const currentMode = AI_MODES.find(m => m.id === mode);
  const currentLevel = USER_LEVELS.find(l => l.id === level);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const suggestedPrompts = [
    mode === "teacher" && "Explain the concept of photosynthesis",
    mode === "teacher" && "What is the Pythagorean theorem?",
    mode === "mentor" && "How do I prepare for my first job interview?",
    mode === "mentor" && "What skills should I learn for a career in tech?",
    mode === "interviewer" && "Start a mock interview for a software developer role",
    mode === "interviewer" && "Ask me behavioral interview questions",
    mode === "examiner" && "Test me on basic programming concepts",
    mode === "examiner" && "Give me a math quiz",
  ].filter(Boolean) as string[];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[800px] bg-card rounded-2xl shadow-elevated border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-secondary/50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Back
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <span className="text-xl">{currentMode?.icon}</span>
            <div>
              <h3 className="font-semibold text-sm">{currentMode?.name}</h3>
              <p className="text-xs text-muted-foreground">
                {currentLevel?.name} {subject && `• ${subject}`}
              </p>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={clearChat} className="text-muted-foreground">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-4"
            >
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </motion.div>
            <h3 className="font-semibold text-lg mb-2">
              Hello! I'm your {currentMode?.name}
            </h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-md">
              {currentMode?.description}. Ask me anything to get started!
            </p>
            
            {/* Suggested prompts */}
            <div className="grid gap-2 w-full max-w-md">
              {suggestedPrompts.slice(0, 3).map((prompt, index) => (
                <motion.button
                  key={prompt}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => sendMessage(prompt)}
                  className="p-3 text-left text-sm rounded-xl bg-secondary hover:bg-secondary/80 transition-colors border"
                >
                  {prompt}
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="prose-mentor text-sm">
                        <ReactMarkdown>{message.content || "..."}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-secondary rounded-2xl px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-background/50">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
            className="flex-1 resize-none rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            style={{ minHeight: "48px", maxHeight: "120px" }}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-12 w-12 rounded-xl"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
