import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Trash2, Sparkles, LogIn, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGuestChat } from "@/hooks/useGuestChat";
import { AIMode, UserLevel, AI_MODES, USER_LEVELS } from "@/lib/types";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Progress } from "@/components/ui/progress";

interface GuestChatInterfaceProps {
  mode: AIMode;
  level: UserLevel;
  subject?: string;
  language?: string;
  onBack: () => void;
}

export function GuestChatInterface({
  mode,
  level,
  subject,
  language,
  onBack,
}: GuestChatInterfaceProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    isLoading,
    sendMessage,
    clearChat,
    remainingMessages,
    hasReachedLimit,
  } = useGuestChat({
    mode,
    level,
    subject,
    language,
  });

  const currentMode = AI_MODES.find((m) => m.id === mode);
  const currentLevel = USER_LEVELS.find((l) => l.id === level);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || hasReachedLimit) return;
    sendMessage(input.trim());
    setInput("");
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
    mode === "interviewer" && "Start a mock interview for a software developer role",
    mode === "examiner" && "Test me on basic programming concepts",
  ].filter(Boolean) as string[];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[800px] bg-card rounded-2xl shadow-elevated border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b bg-secondary/50">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0">
            ← Back
          </Button>
          <div className="h-6 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg sm:text-xl">{currentMode?.icon}</span>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate">{currentMode?.name}</h3>
              <p className="text-xs text-muted-foreground truncate">
                {currentLevel?.name} {subject && `• ${subject}`}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-secondary/80 px-2 py-1 rounded-full">
            <span>{remainingMessages} free messages left</span>
          </div>
          <Button variant="ghost" size="sm" onClick={clearChat} className="text-muted-foreground" title="Clear Chat">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Guest Banner */}
      <div className="px-3 py-2 bg-primary/10 border-b flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 text-primary" />
          <span>Guest mode: {remainingMessages} messages remaining</span>
        </div>
        <Link to="/auth">
          <Button size="sm" variant="default" className="gap-2">
            <LogIn className="w-4 h-4" />
            Sign up for unlimited
          </Button>
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl gradient-primary flex items-center justify-center mb-4"
            >
              <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-primary-foreground" />
            </motion.div>
            <h3 className="font-semibold text-base sm:text-lg mb-2">
              Welcome! Try our AI {currentMode?.name}
            </h3>
            <p className="text-muted-foreground text-xs sm:text-sm mb-4 max-w-md">
              You have {remainingMessages} free messages. Sign up for unlimited access!
            </p>

            <div className="grid gap-2 w-full max-w-md">
              {suggestedPrompts.slice(0, 3).map((prompt, index) => (
                <motion.button
                  key={prompt}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => !hasReachedLimit && sendMessage(prompt)}
                  disabled={hasReachedLimit}
                  className="p-2.5 sm:p-3 text-left text-xs sm:text-sm rounded-xl bg-secondary hover:bg-secondary/80 transition-colors border disabled:opacity-50"
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
                    className={`max-w-[90%] sm:max-w-[85%] rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="prose-mentor text-xs sm:text-sm">
                        <ReactMarkdown>{message.content || "..."}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-secondary rounded-2xl px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Limit Reached Banner */}
      {hasReachedLimit && (
        <div className="px-4 py-4 border-t bg-destructive/10 text-center">
          <p className="text-sm font-medium mb-2">You've reached the free message limit!</p>
          <Link to="/auth">
            <Button variant="default" className="gap-2">
              <LogIn className="w-4 h-4" />
              Sign up for unlimited access
            </Button>
          </Link>
        </div>
      )}

      {/* Input */}
      {!hasReachedLimit && (
        <form onSubmit={handleSubmit} className="p-3 sm:p-4 border-t bg-background/50">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1 min-h-[44px] max-h-32 px-4 py-3 rounded-xl bg-secondary border-0 resize-none focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              rows={1}
              disabled={isLoading}
            />
            <Button
              type="submit"
              variant="hero"
              size="icon"
              className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl shrink-0"
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          
          {/* Progress bar */}
          <div className="mt-2">
            <Progress value={(10 - remainingMessages) * 10} className="h-1" />
            <p className="text-xs text-muted-foreground text-center mt-1">
              {remainingMessages}/10 free messages remaining
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
