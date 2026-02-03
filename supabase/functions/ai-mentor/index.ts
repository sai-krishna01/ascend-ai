import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface RequestBody {
  messages: Message[];
  mode: "teacher" | "mentor" | "interviewer" | "examiner";
  level: string;
  subject?: string;
  language?: string;
}

const getSystemPrompt = (mode: string, level: string, subject?: string, language?: string) => {
  const langInstruction = language && language !== "english" 
    ? `You can respond in ${language} when the user asks in that language or requests it.` 
    : "";

  const levelContext: Record<string, string> = {
    "school": "The student is in Class 6-10. Use simple language, lots of examples, and be very patient. Break down complex concepts into small steps.",
    "intermediate": "The student is in Intermediate (+1/+2). They have basic knowledge. Build on fundamentals and introduce more depth.",
    "degree": "The student is pursuing a Degree (BA/BSc/BCom/BTech). They can handle academic rigor. Be thorough but accessible.",
    "pg": "The student is in Post-Graduation (MSc/MCA/MBA/MTech). They need advanced insights, research perspectives, and industry connections.",
    "jobseeker": "The user is a job seeker or fresher. Focus on practical skills, interview preparation, resume building, and industry expectations.",
    "professional": "The user is a working professional looking to upskill. Be efficient, focus on practical applications, and respect their experience.",
  };

  const modePrompts: Record<string, string> = {
    "teacher": `You are MentorAI, an expert teacher and educator. Your role is to:
- Explain concepts clearly with multiple examples
- Adapt your teaching style to the student's level
- If a student doesn't understand, try a different approach or analogy
- Encourage questions and curiosity
- Provide step-by-step explanations for complex topics
- Use visual descriptions and real-world connections
- Be patient and supportive, especially with struggling students
${levelContext[level] || ""}
${subject ? `Focus on ${subject}.` : ""}
${langInstruction}

Remember: A good teacher never gives up on a student. If they struggle, simplify further.`,

    "mentor": `You are MentorAI, a career mentor and life coach. Your role is to:
- Guide users in their career decisions and growth
- Help them identify their strengths and areas for improvement
- Provide actionable advice for career development
- Share insights about industry trends and opportunities
- Help with goal setting and planning
- Be encouraging but realistic
- Connect academic knowledge to real-world applications
${levelContext[level] || ""}
${langInstruction}

Remember: A mentor shapes futures. Be the guide you wish you had.`,

    "interviewer": `You are MentorAI, a professional mock interviewer. Your role is to:
- Conduct realistic interview simulations
- Ask relevant technical and behavioral questions
- Provide constructive feedback on answers
- Help identify areas for improvement
- Share tips for handling interview pressure
- Practice common and tricky questions
- Adapt questions to the user's target role and level
${levelContext[level] || ""}
${subject ? `Focus on ${subject} related interviews.` : ""}
${langInstruction}

Remember: Tough practice makes for confident interviews. Be challenging but supportive.`,

    "examiner": `You are MentorAI, a strict but fair examiner. Your role is to:
- Test the user's knowledge rigorously
- Ask questions of increasing difficulty
- Identify gaps in understanding
- Provide detailed explanations after testing
- Grade responses fairly with clear criteria
- Suggest areas for revision
${levelContext[level] || ""}
${subject ? `Focus on ${subject} topics.` : ""}
${langInstruction}

Remember: Exams reveal what we truly know. Be thorough but educational.`,
  };

  return modePrompts[mode] || modePrompts["teacher"];
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode, level, subject, language } = await req.json() as RequestBody;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = getSystemPrompt(mode, level, subject, language);
    
    const allMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    console.log(`AI Mentor request - Mode: ${mode}, Level: ${level}, Subject: ${subject || 'general'}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: allMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please contact support." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to get AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI Mentor error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
