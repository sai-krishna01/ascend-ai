import { useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LevelSelector } from "@/components/landing/LevelSelector";
import { ModeSelector } from "@/components/landing/ModeSelector";
import { SubjectGrid } from "@/components/landing/SubjectGrid";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { UserDashboard } from "@/components/dashboard/UserDashboard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserLevel, AIMode, SUBJECTS } from "@/lib/types";
import { ChatSession } from "@/hooks/useChatSessions";
import { ArrowRight, MessageCircle, LayoutDashboard, BookOpen, Loader2 } from "lucide-react";

type View = "dashboard" | "learn" | "chat";

export default function Dashboard() {
  const { user, profile, isLoading, isAuthenticated } = useAuth();
  const [view, setView] = useState<View>("dashboard");
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [selectedLevel, setSelectedLevel] = useState<UserLevel | null>(
    (profile?.user_level as UserLevel) || null
  );
  const [selectedMode, setSelectedMode] = useState<AIMode>("teacher");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [chatSubject, setChatSubject] = useState<string | undefined>();
  const [resumeSessionId, setResumeSessionId] = useState<string | undefined>();

  const handleToggleSubject = useCallback((subjectId: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectId) 
        ? prev.filter(s => s !== subjectId)
        : [...prev, subjectId]
    );
  }, []);

  const handleStartChat = useCallback((subject?: string) => {
    if (!selectedLevel) return;
    setChatSubject(subject);
    setResumeSessionId(undefined);
    setView("chat");
  }, [selectedLevel]);

  const handleResumeSession = useCallback((session: ChatSession) => {
    setSelectedMode(session.mode as AIMode);
    setChatSubject(session.subject || undefined);
    setResumeSessionId(session.id);
    setView("chat");
  }, []);

  const handleBackFromChat = useCallback(() => {
    setView("dashboard");
    setActiveTab("dashboard");
    setResumeSessionId(undefined);
  }, []);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    if (value === "dashboard" || value === "learn") {
      setView(value as View);
    }
  }, []);

  const getSubjectName = (id: string) => {
    return SUBJECTS.find(s => s.id === id)?.name;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-8">
        <div className="container px-4">
          <AnimatePresence mode="wait">
            {view === "chat" ? (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-4xl mx-auto"
              >
                <ChatInterface
                  mode={selectedMode}
                  level={selectedLevel!}
                  subject={chatSubject ? getSubjectName(chatSubject) : chatSubject}
                  onBack={handleBackFromChat}
                  existingSessionId={resumeSessionId}
                />
              </motion.div>
            ) : (
              <motion.div
                key="main"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Welcome Section */}
                <div className="mb-6 sm:mb-8">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">
                    Welcome back, {profile?.full_name || user?.email?.split("@")[0]}! 👋
                  </h1>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Continue your learning journey with MentorAI
                  </p>
                </div>

                {/* Main Navigation */}
                <Tabs value={activeTab} className="w-full" onValueChange={handleTabChange}>
                  <TabsList className="grid w-full max-w-md grid-cols-2 mb-6 sm:mb-8">
                    <TabsTrigger value="dashboard" className="gap-1.5 sm:gap-2 text-sm">
                      <LayoutDashboard className="w-4 h-4" />
                      <span className="hidden xs:inline">Dashboard</span>
                    </TabsTrigger>
                    <TabsTrigger value="learn" className="gap-1.5 sm:gap-2 text-sm">
                      <BookOpen className="w-4 h-4" />
                      <span className="hidden xs:inline">Start Learning</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="dashboard" className="mt-0">
                    <UserDashboard onResumeSession={handleResumeSession} />
                  </TabsContent>

                  <TabsContent value="learn" className="mt-0 space-y-6 sm:space-y-8">
                    <LevelSelector 
                      selectedLevel={selectedLevel} 
                      onSelectLevel={setSelectedLevel} 
                    />

                    {selectedLevel && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <ModeSelector 
                          selectedMode={selectedMode} 
                          onSelectMode={setSelectedMode} 
                        />
                      </motion.div>
                    )}

                    {selectedLevel && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <SubjectGrid
                          userLevel={selectedLevel}
                          selectedSubjects={selectedSubjects}
                          onToggleSubject={handleToggleSubject}
                        />
                      </motion.div>
                    )}

                    {/* Start Chat CTA */}
                    {selectedLevel && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="py-6 sm:py-8 text-center"
                      >
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">
                          Ready to Start Learning?
                        </h2>
                        
                        <div className="flex flex-wrap gap-2 sm:gap-3 justify-center mb-4 sm:mb-6">
                          {selectedSubjects.length > 0 ? (
                            selectedSubjects.map(subjectId => (
                              <Button
                                key={subjectId}
                                variant="secondary"
                                onClick={() => handleStartChat(subjectId)}
                                className="gap-1.5 sm:gap-2 text-sm"
                              >
                                <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                Start with {getSubjectName(subjectId)}
                              </Button>
                            ))
                          ) : null}
                        </div>

                        <Button
                          variant="hero"
                          size="xl"
                          onClick={() => handleStartChat()}
                          className="gap-2"
                        >
                          Start General Chat
                          <ArrowRight className="w-5 h-5" />
                        </Button>
                      </motion.div>
                    )}
                  </TabsContent>
                </Tabs>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
}
