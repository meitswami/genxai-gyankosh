import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, documentContent, documentName, action, faqCount } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userMessages = messages || [];

    if (action === "summarize") {
      systemPrompt = `You are an expert document analyzer. You will receive the content of a document. 
Your task is to:
1. Identify what type of document this is
2. Provide a brief 2-3 line summary of what the document contains
3. Create a short, memorable alias name for the document (2-4 words in the document's primary language)

Respond in the same language as the document (Hindi, English, or Hinglish).
Format your response as JSON with these fields:
{
  "documentType": "type of document",
  "summary": "brief summary",
  "alias": "short alias name"
}`;
      userMessages = [{ role: "user", content: `Analyze this document:\n\n${documentContent}` }];
    } else if (action === "generateFaq") {
      systemPrompt = `You are an expert at creating FAQs from documents. 
Generate exactly ${faqCount || 5} frequently asked questions and their answers based on the document content.
Respond in the same language as the document (Hindi, English, or Hinglish).
Make questions practical and answers informative.
Format as JSON array:
[{"question": "...", "answer": "..."}]`;
      userMessages = [{ role: "user", content: `Generate FAQs from this document:\n\n${documentContent}` }];
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
- Keep answers clear and concise`;
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
