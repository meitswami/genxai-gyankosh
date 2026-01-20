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
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: "No file provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fileName = file.name.toLowerCase();
    let textContent = "";

    console.log(`Parsing file: ${file.name}, type: ${file.type}, size: ${file.size}`);

    // Handle different file types
    if (fileName.endsWith(".txt") || fileName.endsWith(".md")) {
      textContent = await file.text();
      console.log("Extracted text file content, length:", textContent.length);
    } else if (fileName.endsWith(".pdf") || fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
      // Use Lovable's document parsing API for complex documents
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      
      if (!LOVABLE_API_KEY) {
        console.log("LOVABLE_API_KEY not available, falling back to basic extraction");
        textContent = await basicTextExtraction(file);
      } else {
        try {
          // Convert file to base64
          const arrayBuffer = await file.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          
          console.log("Calling Lovable AI for document extraction...");
          
          // Use AI to extract text by describing what we see
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
                  content: `You are a document text extractor. Extract and return ONLY the readable text content from the document data provided. 
Do not include any analysis, just the raw text content. 
Preserve the original language (Hindi, English, Hinglish, etc.).
If the document appears to be an identity document, extract all visible text fields.
Format output as clean, readable text.`
                },
                {
                  role: "user",
                  content: [
                    {
                      type: "file",
                      file: {
                        filename: file.name,
                        file_data: `data:${file.type || "application/pdf"};base64,${base64}`
                      }
                    },
                    {
                      type: "text",
                      text: "Extract all readable text from this document. Return only the text content, no analysis."
                    }
                  ]
                }
              ],
            }),
          });

          if (response.ok) {
            const result = await response.json();
            textContent = result.choices?.[0]?.message?.content || "";
            console.log("AI extraction successful, content length:", textContent.length);
          } else {
            const errText = await response.text();
            console.error("AI extraction failed:", response.status, errText);
            textContent = await basicTextExtraction(file);
          }
        } catch (aiError) {
          console.error("AI extraction error:", aiError);
          textContent = await basicTextExtraction(file);
        }
      }
    } else {
      // Try to read as plain text
      try {
        textContent = await file.text();
      } catch {
        textContent = "";
      }
    }

    // Clean up extracted text
    textContent = textContent
      .replace(/\s+/g, " ")
      .trim();

    console.log("Final content length:", textContent.length);

    if (textContent.length < 20) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Could not extract meaningful text from the document. The file may be scanned or image-based. Please try uploading a text-based document.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        content: textContent,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Parse error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to parse document" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function basicTextExtraction(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const fileName = file.name.toLowerCase();
  
  let extractedText = "";
  
  if (fileName.endsWith(".pdf")) {
    // Try to extract text from PDF text objects
    const textBytes = new TextDecoder("latin1").decode(bytes);
    
    // Look for text between parentheses in PDF
    const textMatches = textBytes.matchAll(/\(([^)]{2,})\)/g);
    for (const match of textMatches) {
      const text = match[1]
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "")
        .replace(/\\/g, "");
      if (text.length > 1 && /[a-zA-Z\u0900-\u097F]/.test(text)) {
        extractedText += text + " ";
      }
    }
    
    // Also look for TJ operator content
    const tjMatches = textBytes.matchAll(/\[([^\]]+)\]\s*TJ/g);
    for (const match of tjMatches) {
      const innerMatches = match[1].matchAll(/\(([^)]+)\)/g);
      for (const inner of innerMatches) {
        if (/[a-zA-Z\u0900-\u097F]/.test(inner[1])) {
          extractedText += inner[1];
        }
      }
      extractedText += " ";
    }
  } else if (fileName.endsWith(".docx")) {
    const textBytes = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    const wtMatches = textBytes.matchAll(/<w:t[^>]*>([^<]+)<\/w:t>/g);
    for (const match of wtMatches) {
      extractedText += match[1] + " ";
    }
  } else {
    // Generic text extraction
    let currentWord = "";
    for (let i = 0; i < bytes.length; i++) {
      const char = bytes[i];
      if ((char >= 32 && char <= 126)) {
        currentWord += String.fromCharCode(char);
      } else if (currentWord.length > 3) {
        extractedText += currentWord + " ";
        currentWord = "";
      } else {
        currentWord = "";
      }
    }
    if (currentWord.length > 3) {
      extractedText += currentWord;
    }
  }
  
  // Clean up
  extractedText = extractedText
    .replace(/[^\x20-\x7E\u0900-\u097F\s.,!?()-:;'"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  
  console.log("Basic extraction result length:", extractedText.length);
  return extractedText;
}
