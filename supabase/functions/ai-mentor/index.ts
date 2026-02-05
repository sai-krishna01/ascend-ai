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
  aiSettings?: {
    file_upload_enabled?: boolean;
    link_upload_enabled?: boolean;
  };
}

// Fetch file bytes and convert to base64 for Gemini
async function fetchFileAsBase64(url: string): Promise<{ base64: string; mimeType: string } | null> {
  try {
    console.log(`Fetching file bytes from: ${url}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MentorAI/1.0; Educational Bot)",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return null;
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Convert to base64
    let binary = "";
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);

    console.log(`Fetched ${url}: ${uint8Array.length} bytes, type: ${contentType}`);
    return { base64, mimeType: contentType };
  } catch (error) {
    console.error(`Error fetching file ${url}:`, error);
    return null;
  }
}

// Fetch HTML page and extract text
async function fetchHtmlContent(url: string): Promise<string | null> {
  try {
    console.log(`Fetching HTML from: ${url}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MentorAI/1.0; Educational Bot)",
        Accept: "text/html,application/xhtml+xml,*/*",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return null;
    }

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";

    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const description = descMatch ? descMatch[1].trim() : "";

    // Strip scripts, styles, nav, footer and extract text
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

    if (textContent.length > 20000) {
      textContent = textContent.slice(0, 20000) + "... [content truncated]";
    }

    const result = [
      title && `**Title:** ${title}`,
      description && `**Description:** ${description}`,
      `**Content:**\n${textContent || "[No readable content found]"}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    return result;
  } catch (error) {
    console.error(`Error fetching HTML ${url}:`, error);
    return null;
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

// Attempt to fetch YouTube transcript (unofficial approach)
async function fetchYouTubeTranscript(videoId: string): Promise<string | null> {
  try {
    // Try the unofficial transcript approach via video page
    const pageUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(pageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Extract title from page
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(" - YouTube", "").trim() : "";

    // Try to find captions track URL in the page
    const captionsMatch = html.match(/"captionTracks":\s*\[([^\]]+)\]/);
    if (captionsMatch) {
      const tracksJson = `[${captionsMatch[1]}]`;
      try {
        const tracks = JSON.parse(tracksJson);
        if (tracks.length > 0) {
          // Prefer English
          const englishTrack = tracks.find((t: any) => t.languageCode === "en") || tracks[0];
          if (englishTrack?.baseUrl) {
            const captionsResponse = await fetch(englishTrack.baseUrl);
            if (captionsResponse.ok) {
              const captionsXml = await captionsResponse.text();
              // Extract text from XML
              const textContent = captionsXml
                .replace(/<[^>]+>/g, " ")
                .replace(/&amp;/g, "&")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&#39;/g, "'")
                .replace(/&quot;/g, '"')
                .replace(/\s+/g, " ")
                .trim();

              if (textContent.length > 100) {
                return `**YouTube Video:** ${title}\n**Video ID:** ${videoId}\n\n**Transcript:**\n${textContent}`;
              }
            }
          }
        }
      } catch {
        // JSON parse failed
      }
    }

    // If no transcript, return basic info
    return `**YouTube Video:** ${title}\n**Video ID:** ${videoId}\n\n*No automatic transcript available. Please describe the video content or paste the transcript manually for me to help you.*`;
  } catch (error) {
    console.error(`Error fetching YouTube transcript for ${videoId}:`, error);
    return null;
  }
}

// Get system prompt based on mode and level
const getSystemPrompt = (mode: string, level: string, subject?: string, language?: string) => {
  const langInstruction =
    language && language !== "english"
      ? `You MUST respond primarily in ${language}. Mix ${language} naturally when explaining concepts. If the user writes in ${language}, respond in ${language}.`
      : "";

  const levelContext: Record<string, string> = {
    primary: `The student is in Class 1-5 (Primary school). CRITICAL INSTRUCTIONS:
- Use VERY SIMPLE language suitable for young children (ages 5-10)
- Use lots of emojis, fun examples, and storytelling 🌟
- Relate concepts to everyday things like toys, animals, food, and cartoons
- Be extremely patient and encouraging
- Use visual descriptions and imagination
- Break everything into tiny, digestible pieces
- Celebrate every small achievement with enthusiasm!
- Use rhymes, songs, and games when teaching
- NEVER use complex vocabulary - explain everything simply`,

    school: `The student is in Class 6-10 (Secondary school, ages 11-15). Instructions:
- Use simple but educational language
- Provide lots of examples and step-by-step explanations
- Be patient and encouraging
- Break down complex concepts into manageable steps
- Use relatable examples from daily life
- Include practice problems when appropriate`,

    intermediate: `The student is in Intermediate (+1/+2, ages 16-18). Instructions:
- They have foundational knowledge - build on it
- Introduce more depth and complexity gradually
- Prepare them for competitive exams (JEE, NEET, etc.) when relevant
- Provide detailed explanations with examples
- Include exam-style questions when appropriate`,

    degree: `The student is pursuing a Degree (BA/BSc/BCom/BTech, ages 18-22). Instructions:
- They can handle academic rigor and technical terminology
- Be thorough but accessible
- Connect theory to practical applications
- Discuss real-world implications and use cases
- Provide industry-relevant examples aligned with Indian universities (AICTE, UGC, IITs, NITs)`,

    pg: `The student is in Post-Graduation (MSc/MCA/MBA/MTech). Instructions:
- Provide advanced insights and research perspectives
- Use appropriate technical terminology
- Connect concepts to industry applications
- Discuss current trends and research
- Be concise but comprehensive`,

    jobseeker: `The user is a job seeker or fresher. Instructions:
- Focus on practical skills and interview preparation
- Help with resume building and job applications
- Provide industry-relevant insights for Indian job market
- Be encouraging but realistic about job market
- Cover technical skills, soft skills, and HR rounds`,

    professional: `The user is a working professional looking to upskill. Instructions:
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

CRITICAL QUALITY GUIDELINES:
- NEVER hallucinate or make up facts - if you're unsure, say so and ask for clarification
- If you receive files or links, you MUST analyze the ACTUAL EXTRACTED CONTENT before responding
- If extraction failed or content is missing, ASK the user to provide the content manually
- Validate all facts before presenting them
- If asked about current events or real-time data, clarify your knowledge cutoff

FORMAT YOUR RESPONSES WELL:
- Use markdown formatting (headings, bold, lists, code blocks)
- Keep paragraphs short and scannable
- Use emojis sparingly but effectively to highlight key points
- For math/science, use clear step-by-step solutions with visual ASCII diagrams when helpful`;

  const modePrompts: Record<string, string> = {
    teacher: `You are MentorAI, an expert teacher and educator with deep knowledge across subjects. Your role is to:

TEACHING APPROACH:
- Explain concepts clearly with multiple examples
- Adapt your teaching style to the student's level
- If a student doesn't understand, try different approaches or analogies
- Encourage questions and curiosity
- Provide step-by-step explanations for complex topics
- Use visual descriptions and real-world connections
- Be patient and supportive, especially with struggling students

CONTENT ANALYSIS - CRITICAL:
- When files (PDF, DOCX, images) are shared, you MUST analyze the EXTRACTED CONTENT provided
- When links are shared, you MUST use the EXTRACTED TEXT from those pages
- Base your explanations on the ACTUAL content shared, not assumptions
- Reference specific parts of the content when explaining
- If extraction failed, tell the user and ask them to paste the content manually

${levelContext[level] || levelContext["school"]}
${subject ? `PRIMARY SUBJECT FOCUS: ${subject}. Relate all explanations to this subject when possible.` : ""}
${langInstruction}
${autonomousInstructions}

Remember: A good teacher never gives up on a student. If they struggle, simplify further and try different approaches.`,

    mentor: `You are MentorAI, a career mentor and life coach. Your role is to:

MENTORING APPROACH:
- Guide users in their career decisions and growth
- Help identify strengths and areas for improvement
- Provide actionable advice for career development
- Share insights about industry trends and opportunities in India
- Help with goal setting and planning
- Be encouraging but realistic

CONTENT ANALYSIS:
- If the user shares documents (resume, cover letter, etc.), analyze the EXTRACTED content
- Provide specific feedback based on actual content, not generic advice

${levelContext[level] || ""}
${langInstruction}
${autonomousInstructions}

Remember: A mentor shapes futures. Be the guide you wish you had.`,

    interviewer: `You are MentorAI, a professional mock interviewer. Your role is to:

INTERVIEW APPROACH:
- Conduct realistic interview simulations
- Ask relevant technical and behavioral questions
- Provide constructive feedback on answers
- Share tips for handling interview pressure
- Practice common and tricky questions
- Adapt questions to the user's target role and level
- Focus on placements at Indian companies and MNCs

${levelContext[level] || ""}
${subject ? `FOCUS AREA: ${subject} related interviews and questions.` : ""}
${langInstruction}
${autonomousInstructions}

Remember: Tough practice makes for confident interviews. Be challenging but supportive.`,

    examiner: `You are MentorAI, a strict but fair examiner. Your role is to:

EXAMINATION APPROACH:
- Test the user's knowledge rigorously
- Ask questions of increasing difficulty
- Identify gaps in understanding
- Provide detailed explanations after testing
- Grade responses fairly with clear criteria
- Suggest areas for revision

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
    const body = (await req.json()) as RequestBody;
    const { messages, mode, level, subject, language, attachments, isGuest, aiSettings } = body;

    // Check admin toggles for file/link uploads
    const fileUploadEnabled = aiSettings?.file_upload_enabled !== false;
    const linkUploadEnabled = aiSettings?.link_upload_enabled !== false;

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!GEMINI_API_KEY && !LOVABLE_API_KEY) {
      console.error("No AI API key configured");
      return new Response(JSON.stringify({ error: "AI service not configured. Please contact support." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build rich context from attachments using REAL extraction
    let attachmentContext = "";
    const processedAttachments: string[] = [];
    const geminiFileParts: Array<{ inlineData: { mimeType: string; data: string } }> = [];

    // Process file attachments
    if (attachments?.files && attachments.files.length > 0) {
      if (!fileUploadEnabled) {
        console.log("File uploads disabled by admin - ignoring files");
        attachmentContext += "\n\n⚠️ File upload is currently disabled by the administrator.\n";
      } else {
        console.log(`Processing ${attachments.files.length} file attachments`);
        attachmentContext += "\n\n---\n## 📎 ATTACHED FILES - Analyze these carefully!\n";

        for (let i = 0; i < attachments.files.length; i++) {
          const file = attachments.files[i];
          console.log(`Processing file ${i + 1}: ${file.name} (${file.type})`);

          const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
          const isImage = file.type.startsWith("image/");
          const isDocx =
            file.type.includes("wordprocessingml") ||
            file.type.includes("msword") ||
            file.name.toLowerCase().endsWith(".docx") ||
            file.name.toLowerCase().endsWith(".doc");

          if (file.url) {
            const fileData = await fetchFileAsBase64(file.url);

            if (fileData && GEMINI_API_KEY) {
              // For Gemini, we can send PDFs and images as inline data
              if (isPdf || isImage) {
                geminiFileParts.push({
                  inlineData: {
                    mimeType: fileData.mimeType,
                    data: fileData.base64,
                  },
                });
                attachmentContext += `\n### File ${i + 1}: ${file.name}\n- **Type:** ${file.type}\n- **Status:** ✅ Uploaded for analysis\n\n`;
                processedAttachments.push(`✓ ${file.name} (binary)`);
              } else if (isDocx) {
                // For DOCX, we add to context as text note (Gemini can't directly read DOCX)
                attachmentContext += `\n### File ${i + 1}: ${file.name}\n- **Type:** Word Document\n- **Note:** Please describe the document content or paste key sections for me to analyze.\n\n`;
                processedAttachments.push(`⚠ ${file.name} (ask for content)`);
              } else {
                // Plain text files - try to fetch as text
                try {
                  const textResponse = await fetch(file.url);
                  if (textResponse.ok) {
                    let text = await textResponse.text();
                    if (text.length > 15000) text = text.slice(0, 15000) + "...[truncated]";
                    attachmentContext += `\n### File ${i + 1}: ${file.name}\n**Content:**\n\`\`\`\n${text}\n\`\`\`\n\n`;
                    processedAttachments.push(`✓ ${file.name} (text)`);
                  }
                } catch {
                  attachmentContext += `\n### File ${i + 1}: ${file.name}\n- **Status:** Failed to read content\n\n`;
                  processedAttachments.push(`✗ ${file.name}`);
                }
              }
            } else if (!fileData) {
              attachmentContext += `\n### File ${i + 1}: ${file.name}\n- **Status:** ❌ Failed to fetch file\n- Please re-upload or paste the content manually.\n\n`;
              processedAttachments.push(`✗ ${file.name} (fetch failed)`);
            }
          }
        }

        attachmentContext += "\n**INSTRUCTION:** Use the above file content to provide accurate, specific answers.\n";
      }
    }

    // Process link attachments
    if (attachments?.links && attachments.links.length > 0) {
      if (!linkUploadEnabled) {
        console.log("Link uploads disabled by admin - ignoring links");
        attachmentContext += "\n\n⚠️ Link sharing is currently disabled by the administrator.\n";
      } else {
        console.log(`Processing ${attachments.links.length} link attachments`);
        attachmentContext += "\n\n---\n## 🔗 SHARED LINKS - Extracted content:\n";

        for (let i = 0; i < attachments.links.length; i++) {
          const link = attachments.links[i];
          console.log(`Processing link ${i + 1}: ${link.url}`);
          attachmentContext += `\n### Link ${i + 1}: ${link.title || "Shared Link"}\n**URL:** ${link.url}\n\n`;

          const ytId = extractYouTubeId(link.url);
          if (ytId) {
            // Try to get YouTube transcript
            const ytContent = await fetchYouTubeTranscript(ytId);
            if (ytContent) {
              attachmentContext += ytContent + "\n\n";
              if (ytContent.includes("Transcript:")) {
                processedAttachments.push(`✓ YouTube: ${link.title || ytId} (transcript)`);
              } else {
                processedAttachments.push(`⚠ YouTube: ${link.title || ytId} (no transcript)`);
              }
            } else {
              attachmentContext += `*Could not fetch transcript for this video. Please describe the content or paste the transcript.*\n\n`;
              processedAttachments.push(`⚠ YouTube: ${link.title || ytId}`);
            }
          } else {
            // Regular webpage - extract HTML content
            const htmlContent = await fetchHtmlContent(link.url);
            if (htmlContent) {
              attachmentContext += `**Extracted Page Content:**\n${htmlContent}\n\n`;
              processedAttachments.push(`✓ ${link.title || "Link"} (html)`);
            } else {
              attachmentContext += `*Could not fetch page content. Please paste the relevant text.*\n\n`;
              processedAttachments.push(`✗ ${link.title || "Link"}`);
            }
          }
        }

        attachmentContext += "\n**INSTRUCTION:** Use the above extracted content to provide accurate, contextual answers.\n";
      }
    }

    // Build system prompt
    const systemPrompt = getSystemPrompt(mode, level, subject, language);

    // Prepare messages with attachment context
    const enrichedMessages = [...messages];
    if (attachmentContext && enrichedMessages.length > 0) {
      const lastUserMsgIndex = enrichedMessages.findLastIndex((m) => m.role === "user");
      if (lastUserMsgIndex >= 0) {
        enrichedMessages[lastUserMsgIndex] = {
          ...enrichedMessages[lastUserMsgIndex],
          content: enrichedMessages[lastUserMsgIndex].content + attachmentContext,
        };
      }
    }

    // Log request details
    console.log(`AI Mentor Request:
- Mode: ${mode}
- Level: ${level || "null"}
- Subject: ${subject || "general"}
- Language: ${language || "english"}
- Attachments: ${processedAttachments.length}
- Processed: ${processedAttachments.join(", ") || "none"}
- Guest: ${isGuest}
- Messages: ${messages.length}
- Files for Gemini: ${geminiFileParts.length}
`);

    let response: Response;
    let usedGemini = false;

    if (GEMINI_API_KEY) {
      // Use Gemini with file parts if available
      console.log("Using Gemini API...");
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

      // Build Gemini contents with inline file data
      const geminiContents: any[] = [];

      for (const msg of enrichedMessages) {
        const parts: any[] = [{ text: msg.content }];

        // Add file parts to the last user message
        if (msg.role === "user" && msg === enrichedMessages[enrichedMessages.length - 1]) {
          for (const filePart of geminiFileParts) {
            parts.push(filePart);
          }
        }

        geminiContents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts,
        });
      }

      try {
        response = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: geminiContents,
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: {
              maxOutputTokens: 8192,
              temperature: 0.7,
            },
          }),
        });

        if (response.ok) {
          usedGemini = true;
          console.log("Gemini API success, streaming response...");
        } else {
          const errText = await response.text();
          console.error(`Gemini API error ${response.status}: ${errText}`);
        }
      } catch (e) {
        console.error("Gemini API fetch error:", e);
      }
    }

    // Fall back to Lovable AI if Gemini failed
    if (!usedGemini) {
      if (!LOVABLE_API_KEY) {
        return new Response(JSON.stringify({ error: "AI service unavailable. Gemini quota exceeded." }), {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("Using Lovable AI Gateway...");
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "system", content: systemPrompt }, ...enrichedMessages.map((m) => ({ role: m.role, content: m.content }))],
          stream: true,
        }),
      });
    }

    if (!response!.ok) {
      const errorText = await response!.text();
      console.error(`AI Gateway error: ${response!.status}`, errorText);

      if (response!.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (response!.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please contact support." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "AI service temporarily unavailable. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Transform Gemini SSE to OpenAI-compatible format if using Gemini
    if (usedGemini && response!.body) {
      const reader = response!.body.getReader();
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      const transformStream = new ReadableStream({
        async start(controller) {
          let buffer = "";

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
                break;
              }

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const jsonStr = line.slice(6).trim();
                  if (!jsonStr || jsonStr === "[DONE]") continue;

                  try {
                    const geminiData = JSON.parse(jsonStr);
                    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

                    if (text) {
                      const openAIFormat = {
                        choices: [
                          {
                            delta: { content: text },
                            index: 0,
                          },
                        ],
                      };
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify(openAIFormat)}\n\n`));
                    }
                  } catch {
                    // Skip malformed JSON
                  }
                }
              }
            }
          } catch (error) {
            console.error("Stream transform error:", error);
            controller.error(error);
          }
        },
      });

      return new Response(transformStream, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Stream Lovable AI response directly
    return new Response(response!.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("AI Mentor error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    return new Response(JSON.stringify({ error: "Something went wrong. Please try again.", details: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
