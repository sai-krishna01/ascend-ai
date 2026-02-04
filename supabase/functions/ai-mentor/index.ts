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
  isGuest?: boolean;
  attachments?: {
    files?: FileAttachment[];
    links?: LinkAttachment[];
  };
}

// Fetch text content from URL with proper error handling
async function fetchUrlContent(url: string): Promise<{ content: string; type: string; success: boolean }> {
  try {
    console.log(`Fetching content from: ${url}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MentorAI/1.0; Educational Bot)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7",
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return { content: `[Unable to fetch content - HTTP ${response.status}]`, type: "error", success: false };
    }
    
    const contentType = response.headers.get("content-type") || "";
    console.log(`Content-Type for ${url}: ${contentType}`);
    
    // Handle PDF files
    if (contentType.includes("application/pdf") || url.toLowerCase().endsWith(".pdf")) {
      return { 
        content: `[PDF Document: ${url}]\nThis is a PDF file. I can help you understand the topics mentioned. Please describe what you need help with or paste any specific text from the document.`, 
        type: "pdf",
        success: true 
      };
    }
    
    // Handle images
    if (contentType.startsWith("image/")) {
      return { 
        content: `[Image File: ${url}]\nThis is an image. Please describe what you see or what you'd like me to help explain about this image.`, 
        type: "image",
        success: true 
      };
    }
    
    // Handle Word documents
    if (contentType.includes("application/vnd.openxmlformats") || 
        contentType.includes("application/msword") ||
        url.toLowerCase().endsWith(".docx") ||
        url.toLowerCase().endsWith(".doc")) {
      return { 
        content: `[Word Document: ${url}]\nThis is a Word document. Please share the key content or questions you have about this document.`, 
        type: "docx",
        success: true 
      };
    }
    
    // Handle HTML pages
    if (contentType.includes("text/html")) {
      const html = await response.text();
      
      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : "";
      
      // Extract meta description
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
      const description = descMatch ? descMatch[1].trim() : "";
      
      // Extract main content (remove scripts, styles, nav, footer, etc.)
      let textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
        .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "")
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ")
        .trim();
      
      // Limit content length
      if (textContent.length > 12000) {
        textContent = textContent.slice(0, 12000) + "... [content truncated]";
      }
      
      const result = [
        title && `**Title:** ${title}`,
        description && `**Description:** ${description}`,
        `**Content:**\n${textContent || "[No readable content found]"}`
      ].filter(Boolean).join("\n\n");
      
      return { content: result, type: "html", success: true };
    }
    
    // Handle plain text
    if (contentType.includes("text/")) {
      const text = await response.text();
      const limitedText = text.length > 12000 ? text.slice(0, 12000) + "... [content truncated]" : text;
      return { content: limitedText, type: "text", success: true };
    }
    
    // Handle JSON
    if (contentType.includes("application/json")) {
      const text = await response.text();
      const limitedText = text.length > 8000 ? text.slice(0, 8000) + "... [content truncated]" : text;
      return { content: `\`\`\`json\n${limitedText}\n\`\`\``, type: "json", success: true };
    }
    
    // Unknown type
    return { 
      content: `[Binary/Unknown content from ${url} - Type: ${contentType}]`, 
      type: "unknown",
      success: false 
    };
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    return { content: `[Failed to fetch content: ${errorMsg}]`, type: "error", success: false };
  }
}

// Extract YouTube video ID
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Get YouTube video info
function getYouTubeInfo(url: string, providedTitle?: string): string {
  const videoId = extractYouTubeId(url);
  if (!videoId) return "";
  
  return `**YouTube Video**
- Video ID: ${videoId}
- URL: ${url}
${providedTitle ? `- Title: ${providedTitle}` : ""}

*I can help you understand topics related to this video. Please describe what the video is about or ask specific questions about its content.*`;
}

const getSystemPrompt = (mode: string, level: string, subject?: string, language?: string) => {
  const langInstruction = language && language !== "english" 
    ? `You MUST respond primarily in ${language}. Mix ${language} naturally when explaining concepts. If the user writes in ${language}, respond in ${language}.` 
    : "";

  const levelContext: Record<string, string> = {
    "primary": `The student is in Class 1-5 (Primary school). CRITICAL INSTRUCTIONS:
- Use VERY SIMPLE language suitable for young children (ages 5-10)
- Use lots of emojis, fun examples, and storytelling 🌟
- Relate concepts to everyday things like toys, animals, food, and cartoons
- Be extremely patient and encouraging
- Use visual descriptions and imagination
- Break everything into tiny, digestible pieces
- Celebrate every small achievement with enthusiasm!
- Use rhymes, songs, and games when teaching
- NEVER use complex vocabulary - explain everything simply`,

    "school": `The student is in Class 6-10 (Secondary school, ages 11-15). Instructions:
- Use simple but educational language
- Provide lots of examples and step-by-step explanations
- Be patient and encouraging
- Break down complex concepts into manageable steps
- Use relatable examples from daily life
- Include practice problems when appropriate`,

    "intermediate": `The student is in Intermediate (+1/+2, ages 16-18). Instructions:
- They have foundational knowledge - build on it
- Introduce more depth and complexity gradually
- Prepare them for competitive exams (JEE, NEET, etc.) when relevant
- Provide detailed explanations with examples
- Include exam-style questions when appropriate`,

    "degree": `The student is pursuing a Degree (BA/BSc/BCom/BTech, ages 18-22). Instructions:
- They can handle academic rigor and technical terminology
- Be thorough but accessible
- Connect theory to practical applications
- Discuss real-world implications and use cases
- Provide industry-relevant examples`,

    "pg": `The student is in Post-Graduation (MSc/MCA/MBA/MTech). Instructions:
- Provide advanced insights and research perspectives
- Use appropriate technical terminology
- Connect concepts to industry applications
- Discuss current trends and research
- Be concise but comprehensive`,

    "jobseeker": `The user is a job seeker or fresher. Instructions:
- Focus on practical skills and interview preparation
- Help with resume building and job applications
- Provide industry-relevant insights
- Be encouraging but realistic about job market
- Cover technical skills, soft skills, and HR rounds`,

    "professional": `The user is a working professional looking to upskill. Instructions:
- Be efficient and focused - they have limited time
- Focus on practical applications
- Respect their experience and build on it
- Provide industry-relevant insights and best practices
- Discuss current trends and technologies`,
  };

  const autonomousInstructions = `
AUTONOMOUS AI CAPABILITIES - You should proactively:
1. **Suggest Related Topics**: After answering, suggest 2-3 related topics the student might want to explore
2. **Identify Knowledge Gaps**: If you notice misunderstandings, address them proactively
3. **Recommend Learning Paths**: Suggest what to learn next based on the conversation
4. **Offer Practice Problems**: Proactively offer to quiz the student or provide practice questions
5. **Adapt Difficulty**: If the student struggles, simplify. If they excel, increase complexity
6. **Encourage Questions**: Prompt students to ask follow-up questions
7. **Make Connections**: Link concepts to real-world applications and other subjects
8. **Provide Study Tips**: Share memory techniques, mnemonics, or study strategies when relevant
9. **Check Understanding**: Periodically ask if the explanation was clear and offer alternatives
10. **Be Encouraging**: Celebrate progress and motivate during difficult topics

FORMAT YOUR RESPONSES WELL:
- Use markdown formatting (headings, bold, lists, code blocks)
- Keep paragraphs short and scannable
- Use emojis sparingly but effectively to highlight key points
- Include visual aids through ASCII art or descriptive language when helpful`;

  const modePrompts: Record<string, string> = {
    "teacher": `You are MentorAI, an expert teacher and educator with deep knowledge across subjects. Your role is to:

TEACHING APPROACH:
- Explain concepts clearly with multiple examples
- Adapt your teaching style to the student's level
- If a student doesn't understand, try different approaches or analogies
- Encourage questions and curiosity
- Provide step-by-step explanations for complex topics
- Use visual descriptions and real-world connections
- Be patient and supportive, especially with struggling students

CONTENT ANALYSIS:
- When files or links are shared, carefully analyze their content
- Provide explanations based on the ACTUAL content shared
- If you cannot access the full content, ask clarifying questions
- Always reference specific parts of shared content when explaining

${levelContext[level] || levelContext["school"]}
${subject ? `PRIMARY SUBJECT FOCUS: ${subject}. Relate all explanations to this subject when possible.` : ""}
${langInstruction}
${autonomousInstructions}

Remember: A good teacher never gives up on a student. If they struggle, simplify further and try different approaches.`,

    "mentor": `You are MentorAI, a career mentor and life coach. Your role is to:

MENTORING APPROACH:
- Guide users in their career decisions and growth
- Help identify strengths and areas for improvement
- Provide actionable advice for career development
- Share insights about industry trends and opportunities
- Help with goal setting and planning
- Be encouraging but realistic

CONTENT ANALYSIS:
- When resumes or job descriptions are shared, provide specific feedback
- Analyze career-related documents thoroughly
- Give constructive, actionable suggestions

${levelContext[level] || ""}
${langInstruction}
${autonomousInstructions}

Remember: A mentor shapes futures. Be the guide you wish you had.`,

    "interviewer": `You are MentorAI, a professional mock interviewer. Your role is to:

INTERVIEW APPROACH:
- Conduct realistic interview simulations
- Ask relevant technical and behavioral questions
- Provide constructive feedback on answers
- Share tips for handling interview pressure
- Practice common and tricky questions
- Adapt questions to the user's target role and level

CONTENT ANALYSIS:
- When resumes or job descriptions are shared, tailor questions accordingly
- Reference specific experiences and skills mentioned
- Ask follow-up questions based on provided information

${levelContext[level] || ""}
${subject ? `FOCUS AREA: ${subject} related interviews and questions.` : ""}
${langInstruction}
${autonomousInstructions}

Remember: Tough practice makes for confident interviews. Be challenging but supportive.`,

    "examiner": `You are MentorAI, a strict but fair examiner. Your role is to:

EXAMINATION APPROACH:
- Test the user's knowledge rigorously
- Ask questions of increasing difficulty
- Identify gaps in understanding
- Provide detailed explanations after testing
- Grade responses fairly with clear criteria
- Suggest areas for revision

CONTENT ANALYSIS:
- When study materials are shared, create questions based on that content
- Reference specific topics from shared materials
- Test understanding of shared content specifically

${levelContext[level] || ""}
${subject ? `SUBJECT FOCUS: ${subject} examination questions.` : ""}
${langInstruction}
${autonomousInstructions}

Remember: Exams reveal what we truly know. Be thorough but educational.`,
  };

  return modePrompts[mode] || modePrompts["teacher"];
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode, level, subject, language, attachments, isGuest } = await req.json() as RequestBody;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build rich context from attachments
    let attachmentContext = "";
    const processedAttachments: string[] = [];
    
    if (attachments?.files && attachments.files.length > 0) {
      console.log(`Processing ${attachments.files.length} file attachments`);
      attachmentContext += "\n\n---\n## 📎 ATTACHED FILES - IMPORTANT: Read and analyze these carefully!\n";
      
      for (let i = 0; i < attachments.files.length; i++) {
        const file = attachments.files[i];
        console.log(`Processing file ${i + 1}: ${file.name} (${file.type})`);
        attachmentContext += `\n### File ${i + 1}: ${file.name}\n`;
        attachmentContext += `- **Type:** ${file.type}\n`;
        attachmentContext += `- **URL:** ${file.url}\n\n`;
        
        // Attempt to fetch and read file content
        if (file.url) {
          const { content, type, success } = await fetchUrlContent(file.url);
          if (success && content.length > 50) {
            attachmentContext += `**Extracted Content:**\n${content}\n\n`;
            processedAttachments.push(`✓ ${file.name} (${type})`);
          } else {
            attachmentContext += `${content}\n\n`;
            processedAttachments.push(`⚠ ${file.name} (partial)`);
          }
        }
      }
      
      attachmentContext += "\n**INSTRUCTION:** Use the above file content to provide accurate, specific answers. Reference the actual content when explaining.\n";
    }
    
    if (attachments?.links && attachments.links.length > 0) {
      console.log(`Processing ${attachments.links.length} link attachments`);
      attachmentContext += "\n\n---\n## 🔗 SHARED LINKS - IMPORTANT: Analyze these resources!\n";
      
      for (let i = 0; i < attachments.links.length; i++) {
        const link = attachments.links[i];
        console.log(`Processing link ${i + 1}: ${link.url}`);
        attachmentContext += `\n### Link ${i + 1}: ${link.title || "Shared Link"}\n`;
        attachmentContext += `**URL:** ${link.url}\n\n`;
        
        // Check for YouTube
        const ytId = extractYouTubeId(link.url);
        if (ytId) {
          attachmentContext += getYouTubeInfo(link.url, link.title) + "\n\n";
          processedAttachments.push(`✓ YouTube: ${link.title || ytId}`);
        } else {
          // Fetch content from the link
          const { content, type, success } = await fetchUrlContent(link.url);
          if (success && content.length > 100) {
            attachmentContext += `**Page Content:**\n${content}\n\n`;
            processedAttachments.push(`✓ ${link.title || "Link"} (${type})`);
          } else {
            attachmentContext += `${content}\n\n`;
            processedAttachments.push(`⚠ ${link.title || "Link"} (partial)`);
          }
        }
      }
      
      attachmentContext += "\n**INSTRUCTION:** Use the information from these links to provide accurate, specific answers. Reference the actual content when relevant.\n";
    }

    const systemPrompt = getSystemPrompt(mode, level, subject, language) + attachmentContext;
    
    const allMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const totalAttachments = (attachments?.files?.length || 0) + (attachments?.links?.length || 0);
    console.log(`AI Mentor Request:
- Mode: ${mode}
- Level: ${level}
- Subject: ${subject || 'general'}
- Language: ${language || 'english'}
- Attachments: ${totalAttachments}
- Processed: ${processedAttachments.join(", ") || "none"}
- Guest: ${isGuest || false}
- Messages: ${messages.length}`);

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
        max_tokens: 8192,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI gateway error: ${response.status} - ${errorText}`);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Stream the response
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("AI Mentor error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
