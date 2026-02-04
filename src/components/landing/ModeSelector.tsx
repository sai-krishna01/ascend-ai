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
    <section className="py-12 sm:py-16 md:py-20">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-10 md:mb-12"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
            Choose Your AI Mode
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
            Different modes for different needs - learn, get guided, or be tested
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto">
          {AI_MODES.map((mode, index) => {
            const Icon = modeIcons[mode.id];
            const isSelected = selectedMode === mode.id;

            return (
              <motion.button
                key={mode.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelectMode(mode.id)}
                className={`
                  relative p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl text-center transition-all border-2
                  ${isSelected 
                    ? `${modeStyles[mode.id]} border-current shadow-glow-sm` 
                    : "border-transparent bg-card shadow-soft hover:shadow-elevated"
                  }
                `}
              >
                <div className="flex flex-col items-center gap-2 sm:gap-3">
                  <div className={`
                    w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl flex items-center justify-center
                    ${isSelected ? "bg-card" : "bg-secondary"}
                  `}>
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base mb-0.5 sm:mb-1">{mode.name}</h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">{mode.description}</p>
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
