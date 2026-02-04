import { Card, CardContent } from "@/components/ui/card";
import { Users, BookOpen, BarChart3, Bell } from "lucide-react";
import { motion } from "framer-motion";

interface AdminStatsProps {
  totalUsers: number;
  totalSessions: number;
  activeToday: number;
  pendingAlerts: number;
}

export function AdminStats({ totalUsers, totalSessions, activeToday, pendingAlerts }: AdminStatsProps) {
  const stats = [
    { label: "Total Users", value: totalUsers.toLocaleString(), icon: Users, color: "text-primary" },
    { label: "Total Sessions", value: totalSessions.toLocaleString(), icon: BookOpen, color: "text-green-500" },
    { label: "Sessions Today", value: activeToday.toLocaleString(), icon: BarChart3, color: "text-accent" },
    { label: "Active Alerts", value: pendingAlerts.toString(), icon: Bell, color: "text-yellow-500" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
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
  );
}
