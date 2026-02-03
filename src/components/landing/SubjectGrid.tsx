import { motion } from "framer-motion";
import { SUBJECTS, Subject, UserLevel } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

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
    <section className="py-20 bg-secondary/30">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            What do you want to learn?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Select your subjects and skills to personalize your learning journey
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto space-y-10">
          {Object.entries(groupedSubjects).map(([category, subjects], catIndex) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: catIndex * 0.1 }}
            >
              <h3 className="text-lg font-semibold mb-4">{categoryLabels[category]}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {subjects.map((subject, index) => {
                  const isSelected = selectedSubjects.includes(subject.id);
                  
                  return (
                    <motion.button
                      key={subject.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onToggleSubject(subject.id)}
                      className={`
                        p-4 rounded-xl text-left transition-all border-2
                        ${isSelected 
                          ? "border-primary bg-primary/5 shadow-sm" 
                          : "border-transparent bg-card hover:border-primary/20 shadow-soft"
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{subject.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{subject.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{subject.description}</p>
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
