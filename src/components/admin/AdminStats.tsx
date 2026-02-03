import { Card, CardContent } from "@/components/ui/card";
import { Users, BookOpen, BarChart3, Bell } from "lucide-react";

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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => (
        <Card key={stat.label} className="glass border-white/10">
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
      ))}
    </div>
  );
}
