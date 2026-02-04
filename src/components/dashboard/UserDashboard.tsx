import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useChatSessions, ChatSession } from "@/hooks/useChatSessions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Clock, 
  Trophy,
  TrendingUp,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Trash2,
  Play,
  Users,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface LearningProgress {
  id: string;
  subject: string;
  topic: string | null;
  progress_percent: number;
  last_activity_at: string;
}

interface UserDashboardProps {
  onResumeSession?: (session: ChatSession) => void;
}

export function UserDashboard({ onResumeSession }: UserDashboardProps) {
  const { user, profile } = useAuth();
  const { sessions, deleteSession, isLoading: sessionsLoading, refetch } = useChatSessions();
  const [progress, setProgress] = useState<LearningProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchProgress = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("learning_progress")
        .select("*")
        .eq("user_id", user.id)
        .order("last_activity_at", { ascending: false })
        .limit(5);

      if (!error && data) {
        setProgress(data);
      }

      // Estimate time spent based on number of sessions (rough estimate: 10 min per session)
      if (sessions.length > 0) {
        setTotalTimeSpent(sessions.length * 10);
      }
    } catch (error) {
      console.error("Error fetching progress:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, sessions.length]);

  useEffect(() => {
    fetchProgress();

    // Subscribe to real-time progress updates
    if (user?.id) {
      const channel = supabase
        .channel("learning-progress-updates")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "learning_progress",
            filter: `user_id=eq.${user.id}`,
          },
          () => fetchProgress()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchProgress, user?.id]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchProgress(), refetch()]);
    setIsRefreshing(false);
  };

  const stats = [
    {
      label: "Subjects Learning",
      value: progress.length || 0,
      icon: BookOpen,
      color: "text-primary",
    },
    {
      label: "Chat Sessions",
      value: sessions.length || 0,
      icon: MessageSquare,
      color: "text-accent",
    },
    {
      label: "Minutes Spent",
      value: totalTimeSpent,
      icon: Clock,
      color: "text-green-500",
    },
    {
      label: "Achievements",
      value: Math.floor(sessions.length / 5) || 0,
      icon: Trophy,
      color: "text-yellow-500",
    },
  ];

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "teacher": return "👨‍🏫";
      case "mentor": return "🧭";
      case "interviewer": return "🎯";
      case "examiner": return "📝";
      default: return "💬";
    }
  };

  if (sessionsLoading && isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass border-white/10">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`p-1.5 sm:p-2 rounded-lg bg-secondary ${stat.color}`}>
                    <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg sm:text-xl md:text-2xl font-bold">{stat.value}</p>
                    <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground truncate">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Learning Progress */}
        <Card className="glass border-white/10">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Learning Progress
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Your subject-wise progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2 animate-pulse">
                    <div className="h-4 bg-secondary rounded w-1/3" />
                    <div className="h-2 bg-secondary rounded" />
                  </div>
                ))}
              </div>
            ) : progress.length > 0 ? (
              progress.map((item) => (
                <div key={item.id} className="space-y-1.5 sm:space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium capitalize text-sm sm:text-base">{item.subject}</span>
                    <span className="text-xs sm:text-sm text-muted-foreground">{item.progress_percent}%</span>
                  </div>
                  <Progress value={item.progress_percent} className="h-1.5 sm:h-2" />
                </div>
              ))
            ) : (
              <div className="text-center py-6 sm:py-8">
                <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground/50 mb-3 sm:mb-4" />
                <p className="text-muted-foreground mb-3 sm:mb-4 text-sm sm:text-base">No progress yet. Start learning!</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const event = new CustomEvent('switch-to-learn-tab');
                    window.dispatchEvent(event);
                  }}
                >
                  Start Learning
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Sessions - Now with Resume Functionality */}
        <Card className="glass border-white/10">
          <CardHeader className="pb-2 sm:pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                  Recent Sessions
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Continue where you left off</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3">
            {sessionsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-secondary/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : sessions.length > 0 ? (
              sessions.slice(0, 5).map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="group flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg gradient-primary flex items-center justify-center text-base sm:text-lg shrink-0">
                      {getModeIcon(session.mode)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium capitalize text-sm sm:text-base truncate">
                        {session.title || session.subject || session.mode}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    <Badge variant="secondary" className="capitalize text-[10px] sm:text-xs hidden sm:inline-flex">
                      {session.mode}
                    </Badge>
                    {onResumeSession && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onResumeSession(session)}
                        title="Resume"
                      >
                        <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 sm:h-8 sm:w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={() => deleteSession(session.id)}
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-6 sm:py-8">
                <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground/50 mb-3 sm:mb-4" />
                <p className="text-muted-foreground mb-3 sm:mb-4 text-sm sm:text-base">No sessions yet. Start chatting!</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const event = new CustomEvent('switch-to-learn-tab');
                    window.dispatchEvent(event);
                  }}
                >
                  Start a Session
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="glass border-white/10 overflow-hidden group hover:border-primary/30 transition-colors">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/20 text-primary">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-semibold">Group Chats</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Join study groups and collaborate with peers
            </p>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to="/groups">
                Open Groups
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="glass border-white/10 overflow-hidden group hover:border-accent/30 transition-colors">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-accent/20 text-accent">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-semibold">AI Tools</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Generate quizzes, notes, and get AI help
            </p>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to="/ai-tools">
                Open AI Tools
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="glass border-white/10 overflow-hidden sm:col-span-2 lg:col-span-1">
          <div className="p-4 sm:p-6 bg-gradient-to-r from-primary/20 to-accent/20 h-full flex flex-col justify-center">
            <h3 className="text-lg font-bold mb-1">Ready to continue?</h3>
            <p className="text-muted-foreground text-sm mb-4">Pick up where you left off</p>
            <Button 
              variant="hero" 
              className="gap-2 w-full"
              onClick={() => {
                const event = new CustomEvent('switch-to-learn-tab');
                window.dispatchEvent(event);
              }}
            >
              Continue Learning
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
