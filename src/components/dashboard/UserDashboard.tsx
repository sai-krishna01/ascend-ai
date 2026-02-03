import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Target, 
  Clock, 
  Trophy,
  TrendingUp,
  MessageSquare,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";

interface LearningProgress {
  id: string;
  subject: string;
  topic: string | null;
  progress_percent: number;
  last_activity_at: string;
}

interface ChatSession {
  id: string;
  mode: string;
  subject: string | null;
  title: string | null;
  created_at: string;
}

export function UserDashboard() {
  const { user, profile } = useAuth();
  const [progress, setProgress] = useState<LearningProgress[]>([]);
  const [recentSessions, setRecentSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [progressResult, sessionsResult] = await Promise.all([
        supabase
          .from("learning_progress")
          .select("*")
          .eq("user_id", user.id)
          .order("last_activity_at", { ascending: false })
          .limit(5),
        supabase
          .from("chat_sessions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      if (progressResult.data) setProgress(progressResult.data);
      if (sessionsResult.data) setRecentSessions(sessionsResult.data);
      setIsLoading(false);
    };

    fetchData();
  }, [user]);

  const stats = [
    {
      label: "Subjects Learning",
      value: progress.length,
      icon: BookOpen,
      color: "text-primary",
    },
    {
      label: "Chat Sessions",
      value: recentSessions.length,
      icon: MessageSquare,
      color: "text-accent",
    },
    {
      label: "Hours Spent",
      value: "12",
      icon: Clock,
      color: "text-green-500",
    },
    {
      label: "Achievements",
      value: "3",
      icon: Trophy,
      color: "text-yellow-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass border-white/10">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-secondary ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Learning Progress */}
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Learning Progress
            </CardTitle>
            <CardDescription>Your subject-wise progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {progress.length > 0 ? (
              progress.map((item) => (
                <div key={item.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium capitalize">{item.subject}</span>
                    <span className="text-sm text-muted-foreground">{item.progress_percent}%</span>
                  </div>
                  <Progress value={item.progress_percent} className="h-2" />
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">No progress yet. Start learning!</p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="#learn">Start Learning</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-accent" />
              Recent Sessions
            </CardTitle>
            <CardDescription>Your chat history with AI mentor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentSessions.length > 0 ? (
              recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center text-lg">
                      {session.mode === "teacher" ? "👨‍🏫" : 
                       session.mode === "mentor" ? "🧭" : 
                       session.mode === "interviewer" ? "🎯" : "📝"}
                    </div>
                    <div>
                      <p className="font-medium capitalize">
                        {session.title || session.subject || session.mode}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(session.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {session.mode}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">No sessions yet. Start chatting!</p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="#learn">Start a Session</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="glass border-white/10 overflow-hidden">
        <div className="p-6 sm:p-8 bg-gradient-to-r from-primary/20 to-accent/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold mb-1">Ready to continue learning?</h3>
              <p className="text-muted-foreground">Pick up where you left off or start something new</p>
            </div>
            <Button variant="hero" className="gap-2 shrink-0">
              Continue Learning
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
