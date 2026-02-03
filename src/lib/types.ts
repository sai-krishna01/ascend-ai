export type UserLevel = 
  | "school" 
  | "intermediate" 
  | "degree" 
  | "pg" 
  | "jobseeker" 
  | "professional";

export type AIMode = 
  | "teacher" 
  | "mentor" 
  | "interviewer" 
  | "examiner";

export type Language = "english" | "hindi" | "telugu";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface UserProfile {
  level: UserLevel;
  preferredLanguage: Language;
  subjects: string[];
  aiMode: AIMode;
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  category: "academics" | "tech" | "career" | "language";
  description: string;
  availableFor: UserLevel[];
}

export const USER_LEVELS: { id: UserLevel; name: string; description: string; icon: string }[] = [
  { id: "school", name: "School (6-10)", description: "Class 6 to 10 students", icon: "🎒" },
  { id: "intermediate", name: "Intermediate", description: "+1 / +2 / Inter students", icon: "📚" },
  { id: "degree", name: "Degree", description: "BA / BSc / BCom / BTech", icon: "🎓" },
  { id: "pg", name: "Post Graduation", description: "MSc / MCA / MBA / MTech", icon: "🏆" },
  { id: "jobseeker", name: "Job Seeker", description: "Freshers & placement prep", icon: "💼" },
  { id: "professional", name: "Professional", description: "Working & upskilling", icon: "🚀" },
];

export const AI_MODES: { id: AIMode; name: string; description: string; icon: string }[] = [
  { id: "teacher", name: "AI Teacher", description: "Learn concepts with patient explanations", icon: "👨‍🏫" },
  { id: "mentor", name: "Career Mentor", description: "Get career guidance and advice", icon: "🧭" },
  { id: "interviewer", name: "Mock Interview", description: "Practice with AI interviewer", icon: "🎯" },
  { id: "examiner", name: "Exam Mode", description: "Test your knowledge rigorously", icon: "📝" },
];

export const SUBJECTS: Subject[] = [
  // Academics
  { id: "maths", name: "Mathematics", icon: "📐", category: "academics", description: "Algebra, Calculus, Geometry & more", availableFor: ["school", "intermediate", "degree", "pg"] },
  { id: "physics", name: "Physics", icon: "⚛️", category: "academics", description: "Mechanics, Optics, Modern Physics", availableFor: ["school", "intermediate", "degree", "pg"] },
  { id: "chemistry", name: "Chemistry", icon: "🧪", category: "academics", description: "Organic, Inorganic, Physical", availableFor: ["school", "intermediate", "degree", "pg"] },
  { id: "biology", name: "Biology", icon: "🧬", category: "academics", description: "Botany, Zoology, Biotechnology", availableFor: ["school", "intermediate", "degree", "pg"] },
  { id: "commerce", name: "Commerce", icon: "💹", category: "academics", description: "Accounts, Economics, Business", availableFor: ["intermediate", "degree", "pg"] },
  
  // Tech
  { id: "programming", name: "Programming", icon: "💻", category: "tech", description: "C, Java, Python, JavaScript", availableFor: ["school", "intermediate", "degree", "pg", "jobseeker", "professional"] },
  { id: "webdev", name: "Web Development", icon: "🌐", category: "tech", description: "HTML, CSS, React, Node.js", availableFor: ["intermediate", "degree", "pg", "jobseeker", "professional"] },
  { id: "aiml", name: "AI & ML", icon: "🤖", category: "tech", description: "Machine Learning, Deep Learning, AI", availableFor: ["degree", "pg", "jobseeker", "professional"] },
  { id: "datascience", name: "Data Science", icon: "📊", category: "tech", description: "Analytics, Statistics, Visualization", availableFor: ["degree", "pg", "jobseeker", "professional"] },
  { id: "cloud", name: "Cloud & DevOps", icon: "☁️", category: "tech", description: "AWS, Azure, Docker, Kubernetes", availableFor: ["degree", "pg", "jobseeker", "professional"] },
  
  // Career
  { id: "resume", name: "Resume Building", icon: "📄", category: "career", description: "ATS-friendly resume creation", availableFor: ["degree", "pg", "jobseeker", "professional"] },
  { id: "aptitude", name: "Aptitude", icon: "🧠", category: "career", description: "Quantitative, Logical, Verbal", availableFor: ["intermediate", "degree", "pg", "jobseeker"] },
  { id: "interview", name: "Interview Prep", icon: "🎤", category: "career", description: "Technical & HR rounds", availableFor: ["degree", "pg", "jobseeker", "professional"] },
  
  // Languages
  { id: "english", name: "English", icon: "🇬🇧", category: "language", description: "Grammar, Communication, Writing", availableFor: ["school", "intermediate", "degree", "pg", "jobseeker", "professional"] },
  { id: "hindi", name: "Hindi", icon: "🇮🇳", category: "language", description: "हिंदी सीखें और सुधारें", availableFor: ["school", "intermediate", "degree", "pg", "jobseeker", "professional"] },
  { id: "telugu", name: "Telugu", icon: "🏛️", category: "language", description: "తెలుగు నేర్చుకోండి", availableFor: ["school", "intermediate", "degree", "pg", "jobseeker", "professional"] },
];
