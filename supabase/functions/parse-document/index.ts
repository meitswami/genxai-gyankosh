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

    // Handle different file types
    if (fileName.endsWith(".txt")) {
      textContent = await file.text();
    } else if (fileName.endsWith(".pdf")) {
      // For PDF, we'll extract text using a simple approach
      // The actual PDF parsing happens on the client side using pdf.js
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      // Try to extract readable text from PDF (basic extraction)
      let text = "";
      for (let i = 0; i < bytes.length; i++) {
        const char = bytes[i];
        if ((char >= 32 && char <= 126) || char === 10 || char === 13) {
          text += String.fromCharCode(char);
        }
      }
      
      // Clean up extracted text
      textContent = text
        .replace(/\s+/g, " ")
        .replace(/[^\x20-\x7E\u0900-\u097F\s]/g, "") // Keep ASCII and Devanagari
        .trim();
      
      if (textContent.length < 100) {
        textContent = "PDF_NEEDS_CLIENT_PARSING";
      }
    } else if (fileName.endsWith(".doc") || fileName.endsWith(".docx")) {
      // For DOC/DOCX, extract text from the XML content
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      let text = "";
      for (let i = 0; i < bytes.length; i++) {
        const char = bytes[i];
        if ((char >= 32 && char <= 126) || char === 10 || char === 13) {
          text += String.fromCharCode(char);
        }
      }
      
      // Try to find text content between XML tags
      const matches = text.match(/>([^<]+)</g);
      if (matches) {
        textContent = matches
          .map(m => m.slice(1, -1))
          .filter(t => t.trim().length > 0 && !t.includes("xml") && !t.includes("w:"))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
      }
      
      if (textContent.length < 50) {
        textContent = "DOCX_NEEDS_CLIENT_PARSING";
      }
    } else {
      // Try to read as plain text
      try {
        textContent = await file.text();
      } catch {
        textContent = "UNSUPPORTED_FORMAT";
      }
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
