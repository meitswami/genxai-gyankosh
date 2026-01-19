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
    if (fileName.endsWith(".txt") || fileName.endsWith(".md")) {
      textContent = await file.text();
    } else if (fileName.endsWith(".pdf")) {
      textContent = await extractPdfText(file);
    } else if (fileName.endsWith(".docx")) {
      textContent = await extractDocxText(file);
    } else if (fileName.endsWith(".doc")) {
      textContent = await extractDocText(file);
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

    if (textContent.length < 20) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Could not extract meaningful text from the document. Please try a different file format.",
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

async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  
  // Simple PDF text extraction
  // Look for text between stream/endstream and BT/ET markers
  const textBytes = new TextDecoder("latin1").decode(bytes);
  
  let extractedText = "";
  
  // Method 1: Extract text from between parentheses (common PDF text format)
  const textMatches = textBytes.matchAll(/\(([^)]+)\)/g);
  for (const match of textMatches) {
    const text = match[1];
    // Filter out obvious non-text
    if (text.length > 1 && !/^[\\\/\d\s.]+$/.test(text)) {
      extractedText += text + " ";
    }
  }
  
  // Method 2: Look for Tj and TJ operators (PDF text show operators)
  const tjMatches = textBytes.matchAll(/\[([^\]]+)\]\s*TJ/g);
  for (const match of tjMatches) {
    const content = match[1];
    const innerMatches = content.matchAll(/\(([^)]+)\)/g);
    for (const inner of innerMatches) {
      if (inner[1].length > 0) {
        extractedText += inner[1];
      }
    }
    extractedText += " ";
  }
  
  // Method 3: Extract readable ASCII text sequences
  let currentWord = "";
  for (let i = 0; i < bytes.length; i++) {
    const char = bytes[i];
    // Include ASCII printable chars, Devanagari, and common punctuation
    if ((char >= 32 && char <= 126) || (char >= 0xC0 && char <= 0xFF)) {
      currentWord += String.fromCharCode(char);
    } else if (currentWord.length > 3) {
      // Filter out likely binary data
      if (!/^[\d.]+$/.test(currentWord) && !/obj|endobj|stream|xref/.test(currentWord)) {
        extractedText += currentWord + " ";
      }
      currentWord = "";
    } else {
      currentWord = "";
    }
  }
  
  // Clean up the extracted text
  extractedText = extractedText
    .replace(/\\[nrt]/g, " ")
    .replace(/[^\x20-\x7E\u0900-\u097F\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  
  // Remove duplicates and very short fragments
  const words = extractedText.split(" ").filter(w => w.length > 2);
  const uniqueWords = [...new Set(words)];
  
  return uniqueWords.join(" ");
}

async function extractDocxText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  
  // DOCX is a ZIP file containing XML
  // We'll look for text content in the XML
  const textBytes = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  
  let extractedText = "";
  
  // Look for text between XML tags, specifically <w:t> tags
  const wtMatches = textBytes.matchAll(/<w:t[^>]*>([^<]+)<\/w:t>/g);
  for (const match of wtMatches) {
    extractedText += match[1] + " ";
  }
  
  // Also look for generic text between > and <
  if (extractedText.length < 50) {
    const genericMatches = textBytes.matchAll(/>([^<]{2,})</g);
    for (const match of genericMatches) {
      const text = match[1].trim();
      // Filter out XML-like content
      if (text && !/^[\d.]+$/.test(text) && !/xmlns|w:|xml/.test(text)) {
        extractedText += text + " ";
      }
    }
  }
  
  return extractedText.trim();
}

async function extractDocText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  
  // Old .doc format - extract readable text sequences
  let extractedText = "";
  let currentWord = "";
  
  for (let i = 0; i < bytes.length; i++) {
    const char = bytes[i];
    
    // Look for readable ASCII and extended chars
    if ((char >= 32 && char <= 126) || (char >= 0xC0 && char <= 0xFF)) {
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
  
  // Clean up
  extractedText = extractedText
    .replace(/[^\x20-\x7E\u0900-\u097F\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  
  return extractedText;
}
