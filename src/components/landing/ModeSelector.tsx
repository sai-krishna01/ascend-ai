import { motion } from "framer-motion";
import { AI_MODES, AIMode } from "@/lib/types";
import { 
  GraduationCap, 
  Compass, 
  Target, 
  FileText 
} from "lucide-react";

interface ModeSelectorProps {
  selectedMode: AIMode;
  onSelectMode: (mode: AIMode) => void;
}

const modeIcons: Record<AIMode, typeof GraduationCap> = {
  teacher: GraduationCap,
  mentor: Compass,
  interviewer: Target,
  examiner: FileText,
};

const modeStyles: Record<AIMode, string> = {
  teacher: "mode-teacher",
  mentor: "mode-mentor",
  interviewer: "mode-interviewer",
  examiner: "mode-exam",
};

export function ModeSelector({ selectedMode, onSelectMode }: ModeSelectorProps) {
  return (
    <section className="py-20">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Choose Your AI Mode
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Different modes for different needs - learn, get guided, or be tested
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {AI_MODES.map((mode, index) => {
            const Icon = modeIcons[mode.id];
            const isSelected = selectedMode === mode.id;

            return (
              <motion.button
                key={mode.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelectMode(mode.id)}
                className={`
                  relative p-6 rounded-2xl text-center transition-all border-2
                  ${isSelected 
                    ? `${modeStyles[mode.id]} border-current shadow-glow-sm` 
                    : "border-transparent bg-card shadow-soft hover:shadow-elevated"
                  }
                `}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={`
                    w-14 h-14 rounded-xl flex items-center justify-center
                    ${isSelected ? "bg-card" : "bg-secondary"}
                  `}>
                    <Icon className={`w-7 h-7 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{mode.name}</h3>
                    <p className="text-xs text-muted-foreground">{mode.description}</p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
