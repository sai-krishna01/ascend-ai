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
    <section className="py-12 sm:py-16 md:py-20">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-12 md:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
            Everything You Need to{" "}
            <span className="gradient-text">Succeed</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
            A complete AI-powered platform for learning, career guidance, and skill development
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-card shadow-soft border hover:shadow-elevated transition-all"
            >
              <div className={`w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-lg sm:rounded-xl ${feature.bgColor} flex items-center justify-center mb-3 sm:mb-4`}>
                <feature.icon className={`w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 ${feature.color}`} />
              </div>
              <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2">{feature.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
