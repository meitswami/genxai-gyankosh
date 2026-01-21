import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized - Missing token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      console.error("JWT validation failed:", claimsError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`Authenticated request from user: ${userId}`);

    const { messages, documentContent, documentName, action, faqCount } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userMessages = messages || [];

    if (action === "summarize") {
      systemPrompt = `You are an expert document analyzer. Analyze the provided document content and return a JSON response.

Your task:
1. Identify the document type (e.g., "Identity Document", "Government Form", "Legal Contract", "Academic Paper", etc.)
2. Write a clear 2-3 sentence summary of what the document contains
3. Create a short memorable alias (2-4 words in the document's primary language)

IMPORTANT: 
- Respond in the same language as the document (Hindi, English, or Hinglish)
- Return ONLY a valid JSON object, no markdown formatting
- If the content seems corrupted or unreadable, still provide your best analysis

JSON format:
{"documentType": "type", "summary": "brief summary", "alias": "short name"}`;
      userMessages = [{ role: "user", content: `Analyze this document content and provide a JSON summary:\n\n${documentContent}` }];
    } else if (action === "generateFaq") {
      systemPrompt = `You are an expert at creating FAQs from documents. 
Generate exactly ${faqCount || 5} frequently asked questions and their answers based on the document content.
Respond in the same language as the document (Hindi, English, or Hinglish).
Make questions practical and answers informative.
Format as JSON array:
[{"question": "...", "answer": "..."}]`;
      userMessages = [{ role: "user", content: `Generate FAQs from this document:\n\n${documentContent}` }];
    } else {
      // Check if this is a global search (multiple documents)
      const isGlobalSearch = documentName === 'Knowledge Base' || documentContent.includes('--- Document:');
      
      const suggestionInstruction = `

After your main answer, add a section with 2-3 related follow-up questions the user might want to ask.
Format them like this:
---
**Related questions:**
- [First follow-up question]
- [Second follow-up question]
- [Third follow-up question]`;
      
      if (isGlobalSearch) {
        systemPrompt = `You are ज्ञानकोष (Gyaankosh), a powerful AI assistant that searches across the user's entire knowledge base.

You have access to multiple documents in the knowledge base:
${documentContent}

Instructions:
- Search across ALL documents to find the most relevant information
- Synthesize information from multiple documents when applicable
- Always cite which document(s) you're referencing in your answer
- Be accurate and provide comprehensive answers
- Respond in the same language as the user's question (Hindi, English, or Hinglish)
- If the answer isn't in any document, politely say so
- Keep answers clear, well-structured, and fast to read
- Use bullet points or numbered lists for clarity when appropriate
${suggestionInstruction}`;
      } else {
        systemPrompt = `You are ज्ञानकोष (Gyaankosh), a helpful AI assistant specialized in answering questions from documents.
You have access to the following document: "${documentName}"

Document Content:
${documentContent}

Instructions:
- Answer questions ONLY based on the document content provided
- Be accurate and cite relevant parts of the document
- Respond in the same language as the user's question (Hindi, English, or Hinglish)
- If the answer is not in the document, politely say so
- Keep answers clear and concise
${suggestionInstruction}`;
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...userMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
