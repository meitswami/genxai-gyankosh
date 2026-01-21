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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, documentId, text, query } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Generate embedding using Lovable AI gateway
    async function generateEmbedding(inputText: string): Promise<number[]> {
      console.log("Generating embedding for text length:", inputText.length);
      
      // Truncate to ~8000 chars to stay within token limits
      const truncatedText = inputText.slice(0, 8000);
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: truncatedText,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Embedding API error:", error);
        throw new Error(`Embedding failed: ${response.status}`);
      }

      const result = await response.json();
      return result.data[0].embedding;
    }

    // Generate tags and category using AI
    async function generateTagsAndCategory(content: string): Promise<{ tags: string[], category: string }> {
      console.log("Generating tags and category...");
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are a document classification expert. Analyze the document and provide:
1. A category (one of: Legal, Financial, Academic, Technical, Medical, Government, Identity, Business, Personal, Educational, Research, Report, Contract, Policy, Manual, Other)
2. 3-6 relevant tags that describe the document's content, topics, and key themes

Respond ONLY with valid JSON in this exact format:
{"category": "Category Name", "tags": ["tag1", "tag2", "tag3"]}

Tags should be:
- Lowercase
- Single words or short phrases (2-3 words max)
- Descriptive and searchable
- In the same language as the document (Hindi tags for Hindi documents)`
            },
            {
              role: "user",
              content: `Classify this document:\n\n${content.slice(0, 4000)}`
            }
          ],
        }),
      });

      if (!response.ok) {
        console.error("Classification failed:", await response.text());
        return { tags: [], category: "Other" };
      }

      const result = await response.json();
      const aiResponse = result.choices?.[0]?.message?.content || "";
      
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            category: parsed.category || "Other",
            tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 6) : []
          };
        }
      } catch (e) {
        console.error("Failed to parse classification:", e);
      }
      
      return { tags: [], category: "Other" };
    }

    if (action === "embed_document" && documentId) {
      // Fetch document content
      const { data: doc, error: docError } = await supabaseClient
        .from("documents")
        .select("content_text, name, alias")
        .eq("id", documentId)
        .single();

      if (docError || !doc?.content_text) {
        throw new Error("Document not found or empty");
      }

      // Generate embedding and tags in parallel
      const [embedding, classification] = await Promise.all([
        generateEmbedding(doc.content_text),
        generateTagsAndCategory(doc.content_text)
      ]);

      // Update document with embedding, tags, and category
      const { error: updateError } = await supabaseClient
        .from("documents")
        .update({
          embedding: embedding,
          tags: classification.tags,
          category: classification.category
        })
        .eq("id", documentId);

      if (updateError) {
        console.error("Update error:", updateError);
        throw new Error("Failed to update document");
      }

      console.log(`Document ${documentId} embedded with ${classification.tags.length} tags`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          tags: classification.tags,
          category: classification.category
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "search" && query) {
      // Generate embedding for search query
      const queryEmbedding = await generateEmbedding(query);
      const userId = claimsData.claims.sub;

      // Search using vector similarity
      const { data: results, error: searchError } = await supabaseClient
        .rpc("match_documents", {
          query_embedding: queryEmbedding,
          match_threshold: 0.5,
          match_count: 5,
          filter_user_id: userId
        });

      if (searchError) {
        console.error("Search error:", searchError);
        throw new Error("Search failed");
      }

      console.log(`Found ${results?.length || 0} matching documents for query`);

      return new Response(
        JSON.stringify({ success: true, results: results || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "embed_text" && text) {
      const embedding = await generateEmbedding(text);
      return new Response(
        JSON.stringify({ success: true, embedding }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Embedding error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
