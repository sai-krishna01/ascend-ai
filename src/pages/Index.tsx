import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { LevelSelector } from "@/components/landing/LevelSelector";
import { ModeSelector } from "@/components/landing/ModeSelector";
import { SubjectGrid } from "@/components/landing/SubjectGrid";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { Button } from "@/components/ui/button";
import { UserLevel, AIMode, SUBJECTS } from "@/lib/types";
import { ArrowRight, MessageCircle } from "lucide-react";

type View = "landing" | "chat";

const Index = () => {
  const [view, setView] = useState<View>("landing");
  const [selectedLevel, setSelectedLevel] = useState<UserLevel | null>(null);
  const [selectedMode, setSelectedMode] = useState<AIMode>("teacher");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [chatSubject, setChatSubject] = useState<string | undefined>();

  const handleGetStarted = useCallback(() => {
    setTimeout(() => {
      document.getElementById("level-selector")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

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
    setView("chat");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedLevel]);

  const handleBackFromChat = useCallback(() => {
    setView("landing");
  }, []);

  const getSubjectName = (id: string) => {
    return SUBJECTS.find(s => s.id === id)?.name;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        <AnimatePresence mode="wait">
          {view === "chat" ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="container px-4 py-8 max-w-4xl mx-auto"
            >
              <ChatInterface
                mode={selectedMode}
                level={selectedLevel!}
                subject={chatSubject ? getSubjectName(chatSubject) : undefined}
                onBack={handleBackFromChat}
              />
            </motion.div>
          ) : (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <HeroSection onGetStarted={handleGetStarted} />
              
              {/* Onboarding flow */}
              <div id="level-selector">
                <LevelSelector 
                  selectedLevel={selectedLevel} 
                  onSelectLevel={setSelectedLevel} 
                />
              </div>

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
                  id="subjects"
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
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-12 sm:py-16 bg-gradient-to-b from-background to-secondary/30"
                >
                  <div className="container px-4 text-center">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4">
                      Ready to Start Learning?
                    </h2>
                    <p className="text-muted-foreground mb-8 max-w-xl mx-auto text-sm sm:text-base">
                      Your AI {selectedMode === "teacher" ? "Teacher" : selectedMode === "mentor" ? "Mentor" : selectedMode === "interviewer" ? "Interviewer" : "Examiner"} is ready to help you learn and grow.
                    </p>
                    
                    <div className="flex flex-wrap gap-2 sm:gap-3 justify-center mb-6">
                      {selectedSubjects.length > 0 ? (
                        selectedSubjects.slice(0, 3).map(subjectId => (
                          <Button
                            key={subjectId}
                            variant="secondary"
                            size="sm"
                            onClick={() => handleStartChat(subjectId)}
                            className="gap-2 text-xs sm:text-sm"
                          >
                            <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            {getSubjectName(subjectId)}
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
                  </div>
                </motion.section>
              )}

              <div id="features">
                <FeaturesSection />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
