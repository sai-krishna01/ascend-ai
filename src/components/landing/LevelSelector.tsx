import { motion } from "framer-motion";
import { USER_LEVELS, UserLevel } from "@/lib/types";

interface LevelSelectorProps {
  selectedLevel: UserLevel | null;
  onSelectLevel: (level: UserLevel) => void;
}

export function LevelSelector({ selectedLevel, onSelectLevel }: LevelSelectorProps) {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Where are you in your journey?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Select your level and we'll personalize your learning experience
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {USER_LEVELS.map((level, index) => (
            <motion.button
              key={level.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectLevel(level.id)}
              className={`
                relative p-6 rounded-2xl text-left transition-all border-2
                ${selectedLevel === level.id 
                  ? "border-primary bg-primary/5 shadow-glow" 
                  : "border-transparent bg-card shadow-soft hover:shadow-elevated hover:border-primary/20"
                }
              `}
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">{level.icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{level.name}</h3>
                  <p className="text-sm text-muted-foreground">{level.description}</p>
                </div>
              </div>
              
              {selectedLevel === level.id && (
                <motion.div
                  layoutId="selected-level"
                  className="absolute inset-0 border-2 border-primary rounded-2xl"
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
