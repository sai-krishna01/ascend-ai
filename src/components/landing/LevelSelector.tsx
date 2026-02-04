import { motion } from "framer-motion";
import { USER_LEVELS, UserLevel } from "@/lib/types";

interface LevelSelectorProps {
  selectedLevel: UserLevel | null;
  onSelectLevel: (level: UserLevel) => void;
}

export function LevelSelector({ selectedLevel, onSelectLevel }: LevelSelectorProps) {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-secondary/30">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-10 md:mb-12"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
            Where are you in your journey?
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
            Select your level and we'll personalize your learning experience
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-w-5xl mx-auto">
          {USER_LEVELS.map((level, index) => (
            <motion.button
              key={level.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectLevel(level.id)}
              className={`
                relative p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl text-left transition-all border-2
                ${selectedLevel === level.id 
                  ? "border-primary bg-primary/5 shadow-glow" 
                  : "border-transparent bg-card shadow-soft hover:shadow-elevated hover:border-primary/20"
                }
              `}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="text-2xl sm:text-3xl md:text-4xl">{level.icon}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base md:text-lg mb-0.5 sm:mb-1">{level.name}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{level.description}</p>
                </div>
              </div>
              
              {selectedLevel === level.id && (
                <motion.div
                  layoutId="selected-level"
                  className="absolute inset-0 border-2 border-primary rounded-xl sm:rounded-2xl"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
