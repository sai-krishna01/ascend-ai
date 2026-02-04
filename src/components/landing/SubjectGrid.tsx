import { motion } from "framer-motion";
import { SUBJECTS, Subject, UserLevel } from "@/lib/types";

interface SubjectGridProps {
  userLevel: UserLevel | null;
  selectedSubjects: string[];
  onToggleSubject: (subjectId: string) => void;
}

const categoryLabels: Record<string, string> = {
  academics: "📚 Academics",
  tech: "💻 Tech & Skills",
  career: "💼 Career",
  language: "🗣️ Languages",
};

export function SubjectGrid({ userLevel, selectedSubjects, onToggleSubject }: SubjectGridProps) {
  // Filter subjects based on user level
  const availableSubjects = userLevel 
    ? SUBJECTS.filter(s => s.availableFor.includes(userLevel))
    : SUBJECTS;

  // Group by category
  const groupedSubjects = availableSubjects.reduce((acc, subject) => {
    if (!acc[subject.category]) acc[subject.category] = [];
    acc[subject.category].push(subject);
    return acc;
  }, {} as Record<string, Subject[]>);

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
            What do you want to learn?
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
            Select your subjects and skills to personalize your learning journey
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 md:space-y-10">
          {Object.entries(groupedSubjects).map(([category, subjects], catIndex) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: catIndex * 0.1 }}
            >
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">{categoryLabels[category]}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                {subjects.map((subject, index) => {
                  const isSelected = selectedSubjects.includes(subject.id);
                  
                  return (
                    <motion.button
                      key={subject.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onToggleSubject(subject.id)}
                      className={`
                        p-3 sm:p-4 rounded-lg sm:rounded-xl text-left transition-all border-2
                        ${isSelected 
                          ? "border-primary bg-primary/5 shadow-sm" 
                          : "border-transparent bg-card hover:border-primary/20 shadow-soft"
                        }
                      `}
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-lg sm:text-xl md:text-2xl shrink-0">{subject.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs sm:text-sm truncate">{subject.name}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground truncate hidden sm:block">{subject.description}</p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
