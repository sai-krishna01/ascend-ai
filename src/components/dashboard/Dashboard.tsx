import { motion } from "framer-motion";
import { 
  BookOpen, 
  Target, 
  Award, 
  TrendingUp,
  Clock,
  Zap
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface DashboardProps {
  level: string;
  subjects: string[];
}

export function Dashboard({ level, subjects }: DashboardProps) {
  // Mock data for dashboard
  const stats = [
    { label: "Sessions", value: "12", icon: Clock, color: "text-primary" },
    { label: "Topics Covered", value: "48", icon: BookOpen, color: "text-info" },
    { label: "Tests Taken", value: "8", icon: Target, color: "text-warning" },
    { label: "Skill Score", value: "72%", icon: TrendingUp, color: "text-success" },
  ];

  const recentTopics = [
    { name: "Quadratic Equations", progress: 85, subject: "Maths" },
    { name: "Newton's Laws", progress: 70, subject: "Physics" },
    { name: "Python Basics", progress: 95, subject: "Programming" },
    { name: "Data Structures", progress: 45, subject: "Programming" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 rounded-2xl bg-card shadow-soft border"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-6 rounded-2xl bg-card shadow-soft border"
      >
        <div className="flex items-center gap-2 mb-6">
          <Award className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Recent Progress</h3>
        </div>

        <div className="space-y-4">
          {recentTopics.map((topic, index) => (
            <motion.div
              key={topic.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="space-y-2"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{topic.name}</p>
                  <p className="text-xs text-muted-foreground">{topic.subject}</p>
                </div>
                <span className="text-sm font-medium">{topic.progress}%</span>
              </div>
              <Progress value={topic.progress} className="h-2" />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border"
      >
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-accent" />
          <h3 className="font-semibold">Quick Actions</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button className="p-4 rounded-xl bg-card hover:bg-card/80 transition-colors text-left shadow-sm">
            <p className="font-medium text-sm">Continue Learning</p>
            <p className="text-xs text-muted-foreground">Resume where you left off</p>
          </button>
          <button className="p-4 rounded-xl bg-card hover:bg-card/80 transition-colors text-left shadow-sm">
            <p className="font-medium text-sm">Take a Test</p>
            <p className="text-xs text-muted-foreground">Test your knowledge</p>
          </button>
          <button className="p-4 rounded-xl bg-card hover:bg-card/80 transition-colors text-left shadow-sm">
            <p className="font-medium text-sm">Mock Interview</p>
            <p className="text-xs text-muted-foreground">Practice with AI</p>
          </button>
          <button className="p-4 rounded-xl bg-card hover:bg-card/80 transition-colors text-left shadow-sm">
            <p className="font-medium text-sm">Career Guidance</p>
            <p className="text-xs text-muted-foreground">Plan your path</p>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
