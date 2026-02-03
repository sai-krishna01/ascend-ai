import { motion } from "framer-motion";
import { 
  Brain, 
  Sparkles, 
  MessageCircle, 
  FileText, 
  Target, 
  Globe,
  Zap,
  Users
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Teacher",
    description: "Explains concepts like a patient human teacher with examples tailored to your level",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Sparkles,
    title: "Adaptive Learning",
    description: "Automatically adjusts difficulty and teaching style based on your progress",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: MessageCircle,
    title: "Natural Conversations",
    description: "Ask doubts naturally and get instant, detailed explanations",
    color: "text-info",
    bgColor: "bg-info/10",
  },
  {
    icon: FileText,
    title: "Notes & Projects",
    description: "Generate study notes, project ideas, and practice questions instantly",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    icon: Target,
    title: "Interview Prep",
    description: "Practice with AI interviewer for technical and HR rounds",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  {
    icon: Globe,
    title: "Multi-lingual",
    description: "Learn in English, Hindi, or Telugu - your choice",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Zap,
    title: "Instant Feedback",
    description: "Get immediate feedback on your answers and areas to improve",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    icon: Users,
    title: "All Levels",
    description: "From Class 1 to working professionals - we cover everyone",
    color: "text-info",
    bgColor: "bg-info/10",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything You Need to{" "}
            <span className="gradient-text">Succeed</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A complete AI-powered platform for learning, career guidance, and skill development
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="p-6 rounded-2xl bg-card shadow-soft border hover:shadow-elevated transition-all"
            >
              <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
