import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

interface AIResponse {
  content: string;
  success: boolean;
}

export function useAIFeatures() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const callAI = async (
    prompt: string,
    systemContext: string
  ): Promise<string> => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-mentor`;

    const response = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemContext },
          { role: "user", content: prompt },
        ],
        mode: "teacher",
        level: "school",
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please wait a moment.");
      }
      if (response.status === 402) {
        throw new Error("AI credits exhausted. Please contact support.");
      }
      throw new Error("Failed to get AI response");
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let result = "";
    let textBuffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) result += delta;
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    return result;
  };

  const solveDoubt = useCallback(async (
    question: string,
    subject?: string
  ): Promise<AIResponse> => {
    if (!user?.id) return { content: "", success: false };

    setIsLoading(true);
    try {
      const systemContext = `You are MentorAI, an expert teacher. The student has a doubt about ${subject || "a topic"}.
Your job is to:
1. Understand the question clearly
2. Break down the concept into simple parts
3. Provide a clear, step-by-step explanation
4. Give examples to illustrate
5. Check if there's anything else to clarify

Be patient, thorough, and encouraging.`;

      const content = await callAI(question, systemContext);

      // Save interaction
      await supabase.from("ai_interactions").insert({
        user_id: user.id,
        interaction_type: "doubt_solving",
        subject: subject || null,
        prompt: question,
        response: content,
      });

      return { content, success: true };
    } catch (error) {
      console.error("Doubt solving error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to solve doubt");
      return { content: "", success: false };
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const generateQuiz = useCallback(async (
    topic: string,
    numQuestions: number = 5,
    difficulty: "easy" | "medium" | "hard" = "medium"
  ): Promise<AIResponse> => {
    if (!user?.id) return { content: "", success: false };

    setIsLoading(true);
    try {
      const systemContext = `You are MentorAI quiz generator. Create exactly ${numQuestions} ${difficulty} level questions about "${topic}".

Format each question as:
**Question [number]:** [question text]
A) [option]
B) [option]
C) [option]
D) [option]
**Answer:** [correct option letter]
**Explanation:** [brief explanation]

---

Make questions challenging but fair. Include a mix of concept-based and application questions.`;

      const content = await callAI(`Generate a ${difficulty} quiz on: ${topic}`, systemContext);

      await supabase.from("ai_interactions").insert({
        user_id: user.id,
        interaction_type: "quiz",
        subject: topic,
        prompt: `${numQuestions} ${difficulty} questions on ${topic}`,
        response: content,
        metadata: { numQuestions, difficulty },
      });

      return { content, success: true };
    } catch (error) {
      console.error("Quiz generation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate quiz");
      return { content: "", success: false };
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const generatePracticeQuestions = useCallback(async (
    topic: string,
    count: number = 10
  ): Promise<AIResponse> => {
    if (!user?.id) return { content: "", success: false };

    setIsLoading(true);
    try {
      const systemContext = `You are MentorAI practice question generator. Create ${count} practice questions on "${topic}".

Mix question types:
- Multiple choice (with 4 options)
- Fill in the blank
- True/False
- Short answer

For each question, provide:
1. The question
2. The answer
3. A brief hint for solving

Format clearly with numbering.`;

      const content = await callAI(`Generate ${count} practice questions on: ${topic}`, systemContext);

      await supabase.from("ai_interactions").insert({
        user_id: user.id,
        interaction_type: "practice",
        subject: topic,
        prompt: `${count} practice questions on ${topic}`,
        response: content,
      });

      return { content, success: true };
    } catch (error) {
      console.error("Practice generation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate practice questions");
      return { content: "", success: false };
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const explainConcept = useCallback(async (
    concept: string,
    level: string = "school"
  ): Promise<AIResponse> => {
    if (!user?.id) return { content: "", success: false };

    setIsLoading(true);
    try {
      const levelDescriptions: Record<string, string> = {
        primary: "a young child (Class 1-5) with simple words and fun examples",
        school: "a school student (Class 6-10) with clear explanations",
        intermediate: "an intermediate student with moderate depth",
        degree: "a degree student with academic rigor",
        pg: "a post-graduate with advanced concepts",
        professional: "a working professional with practical applications",
      };

      const systemContext = `You are MentorAI, explaining concepts to ${levelDescriptions[level] || levelDescriptions.school}.

Explain the concept "${concept}" with:
1. Simple definition
2. Key points (bullet list)
3. Real-world examples
4. Common misconceptions
5. Memory tips or mnemonics
6. Related concepts to explore

Make it engaging and memorable!`;

      const content = await callAI(`Explain: ${concept}`, systemContext);

      await supabase.from("ai_interactions").insert({
        user_id: user.id,
        interaction_type: "explanation",
        subject: concept,
        prompt: `Explain ${concept} for ${level} level`,
        response: content,
        metadata: { level },
      });

      return { content, success: true };
    } catch (error) {
      console.error("Explanation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to explain concept");
      return { content: "", success: false };
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const getRecommendations = useCallback(async (
    currentSubject: string,
    completedTopics: string[]
  ): Promise<AIResponse> => {
    if (!user?.id) return { content: "", success: false };

    setIsLoading(true);
    try {
      const systemContext = `You are MentorAI learning advisor. Based on the student's progress in ${currentSubject} and completed topics, recommend next steps.

Completed topics: ${completedTopics.join(", ") || "None yet"}

Provide:
1. 3-5 recommended topics to study next
2. Resources or approaches for each
3. Estimated time to complete
4. How it connects to what they've learned
5. Tips for better retention`;

      const content = await callAI(
        `What should I study next in ${currentSubject}?`,
        systemContext
      );

      await supabase.from("ai_interactions").insert({
        user_id: user.id,
        interaction_type: "recommendation",
        subject: currentSubject,
        prompt: `Recommendations for ${currentSubject}`,
        response: content,
        metadata: { completedTopics },
      });

      return { content, success: true };
    } catch (error) {
      console.error("Recommendations error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to get recommendations");
      return { content: "", success: false };
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const generateNotes = useCallback(async (
    topic: string,
    style: "detailed" | "summary" | "bullet" = "detailed"
  ): Promise<AIResponse> => {
    if (!user?.id) return { content: "", success: false };

    setIsLoading(true);
    try {
      const styleInstructions: Record<string, string> = {
        detailed: "Create comprehensive, detailed notes with explanations, examples, and diagrams descriptions.",
        summary: "Create a concise summary capturing key points in 1-2 pages.",
        bullet: "Create organized bullet-point notes with hierarchical structure.",
      };

      const systemContext = `You are MentorAI note generator for teachers. ${styleInstructions[style]}

Create notes on "${topic}" including:
1. Title and overview
2. Key concepts with definitions
3. Important formulas/facts (if applicable)
4. Examples and illustrations
5. Summary points
6. Quick revision tips

Format with proper headings (##), bullet points, and emphasis (**bold**, *italic*).
Make notes student-friendly and exam-focused.`;

      const content = await callAI(`Generate ${style} notes on: ${topic}`, systemContext);

      await supabase.from("ai_interactions").insert({
        user_id: user.id,
        interaction_type: "note_generation",
        subject: topic,
        prompt: `${style} notes on ${topic}`,
        response: content,
        metadata: { style },
      });

      return { content, success: true };
    } catch (error) {
      console.error("Note generation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate notes");
      return { content: "", success: false };
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const answerInGroupChat = useCallback(async (
    question: string,
    groupContext: string
  ): Promise<string> => {
    try {
      const systemContext = `You are MentorAI participating in a group study chat about ${groupContext}.
You've been mentioned or asked a question. Respond helpfully but briefly (2-4 paragraphs max).
Be friendly, educational, and encourage discussion among students.
If you don't know something, admit it and suggest how to find out.`;

      return await callAI(question, systemContext);
    } catch (error) {
      console.error("Group chat AI error:", error);
      throw error;
    }
  }, []);

  return {
    isLoading,
    solveDoubt,
    generateQuiz,
    generatePracticeQuestions,
    explainConcept,
    getRecommendations,
    generateNotes,
    answerInGroupChat,
  };
}
