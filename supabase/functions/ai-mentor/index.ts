import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface FileAttachment {
  name: string;
  url: string;
  type: string;
}

interface LinkAttachment {
  title: string;
  url: string;
}

interface RequestBody {
  messages: Message[];
  mode: "teacher" | "mentor" | "interviewer" | "examiner";
  level: string;
  subject?: string;
  language?: string;
  attachments?: {
    files?: FileAttachment[];
    links?: LinkAttachment[];
  };
}

const getSystemPrompt = (mode: string, level: string, subject?: string, language?: string) => {
  const langInstruction = language && language !== "english" 
    ? `You can respond in ${language} when the user asks in that language or requests it. Mix ${language} naturally when explaining concepts to make learning easier.` 
    : "";

  const levelContext: Record<string, string> = {
    "primary": `The student is in Class 1-5 (Primary school). CRITICAL INSTRUCTIONS:
- Use VERY SIMPLE language suitable for young children
- Use lots of emojis, fun examples, and storytelling 🌟
- Relate concepts to everyday things like toys, animals, and cartoons
- Be extremely patient and encouraging
- Use visual descriptions and imagination
- Break everything into tiny, digestible pieces
- Celebrate every small achievement with enthusiasm!
- Use rhymes and songs when teaching`,

    "school": "The student is in Class 6-10. Use simple language, lots of examples, and be very patient. Break down complex concepts into small steps. Use relatable examples from daily life.",

    "intermediate": "The student is in Intermediate (+1/+2). They have basic knowledge. Build on fundamentals and introduce more depth. Prepare them for competitive exams when relevant.",

    "degree": "The student is pursuing a Degree (BA/BSc/BCom/BTech). They can handle academic rigor. Be thorough but accessible. Connect theory to practical applications.",

    "pg": "The student is in Post-Graduation (MSc/MCA/MBA/MTech). They need advanced insights, research perspectives, and industry connections. Use technical terminology appropriately.",

    "jobseeker": "The user is a job seeker or fresher. Focus on practical skills, interview preparation, resume building, and industry expectations. Be encouraging but realistic about job market.",

    "professional": "The user is a working professional looking to upskill. Be efficient, focus on practical applications, and respect their experience. Provide industry-relevant insights.",
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
- For Primary students: Use stories, games, and fun activities to teach
${levelContext[level] || levelContext["school"]}
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
- For students in Telangana/Andhra Pradesh, understand local job markets and universities
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
- Include company-specific preparation when asked (TCS, Infosys, Wipro, etc.)
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
- For Primary students: Make tests fun with quiz-style questions
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
    const { messages, mode, level, subject, language, attachments } = await req.json() as RequestBody;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context from attachments
    let attachmentContext = "";
    if (attachments?.files && attachments.files.length > 0) {
      attachmentContext += "\n\n## Attached Files (User has shared these for context):\n";
      attachments.files.forEach((file, i) => {
        attachmentContext += `${i + 1}. **${file.name}** (${file.type}) - URL: ${file.url}\n`;
      });
      attachmentContext += "\nPlease acknowledge these files and help the user with questions about them. If they are documents (PDF, DOC), summarize key points or answer questions about their content.";
    }
    
    if (attachments?.links && attachments.links.length > 0) {
      attachmentContext += "\n\n## Attached Links (User has shared these for context):\n";
      attachments.links.forEach((link, i) => {
        attachmentContext += `${i + 1}. [${link.title}](${link.url})\n`;
      });
      attachmentContext += "\nPlease acknowledge these links. If they are YouTube videos, help explain the topic. For other resources, help the user understand or learn from them.";
    }

    const systemPrompt = getSystemPrompt(mode, level, subject, language) + attachmentContext;
    
    const allMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const hasAttachments = (attachments?.files?.length || 0) + (attachments?.links?.length || 0);
    console.log(`AI Mentor request - Mode: ${mode}, Level: ${level}, Subject: ${subject || 'general'}, Language: ${language || 'english'}, Attachments: ${hasAttachments}`);

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
