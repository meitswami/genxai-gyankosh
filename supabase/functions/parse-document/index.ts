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
    const fileType = file.type || "";
    let textContent = "";

    console.log(`Parsing file: ${file.name}, type: ${fileType}, size: ${file.size}`);

    // Handle different file types
    if (fileName.endsWith(".txt") || fileName.endsWith(".md")) {
      // Plain text files
      textContent = await file.text();
      console.log("Extracted text file content, length:", textContent.length);
    } else if (isImageFile(fileName, fileType)) {
      // Image files - use OCR via AI vision
      console.log("Processing image file with OCR...");
      textContent = await extractTextFromImageWithAI(file);
    } else if (fileName.endsWith(".pdf")) {
      // PDF files - try AI extraction with vision for scanned PDFs
      console.log("Processing PDF file...");
      textContent = await extractTextFromPdfWithAI(file);
    } else if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
      // Word documents
      console.log("Processing Word document...");
      textContent = await extractTextFromDocWithAI(file);
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

    if (textContent.length < 10) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Could not extract meaningful text from the document. The file may be corrupted or in an unsupported format.",
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
        fileType: fileType
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

function isImageFile(fileName: string, fileType: string): boolean {
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff", ".tif"];
  const imageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp", "image/tiff"];
  
  return imageExtensions.some(ext => fileName.endsWith(ext)) || imageTypes.includes(fileType);
}

async function extractTextFromImageWithAI(file: File): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    console.error("LOVABLE_API_KEY not available for OCR");
    return "";
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = file.type || "image/jpeg";

    console.log("Calling AI for image OCR...");

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
            content: `You are an expert OCR (Optical Character Recognition) system. Extract ALL text from the image provided.

Instructions:
- Extract every piece of text visible in the image
- Preserve the original language (Hindi, English, Hinglish, or any other language)
- Maintain the structure and order of the text as it appears
- For identity documents, extract all fields: name, ID numbers, dates, addresses, etc.
- For forms, extract all labels and their values
- Do NOT summarize or analyze - just extract the raw text content
- If text is partially visible or unclear, make your best attempt
- Return ONLY the extracted text, nothing else`
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64}`
                }
              },
              {
                type: "text",
                text: "Perform OCR and extract all text from this image. Return only the extracted text content."
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI OCR failed:", response.status, errText);
      return "";
    }

    const result = await response.json();
    const extractedText = result.choices?.[0]?.message?.content || "";
    console.log("OCR extraction successful, length:", extractedText.length);
    
    return extractedText;
  } catch (error) {
    console.error("OCR extraction error:", error);
    return "";
  }
}

async function extractTextFromPdfWithAI(file: File): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    console.log("LOVABLE_API_KEY not available, falling back to basic extraction");
    return await basicPdfExtraction(file);
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    console.log("Calling AI for PDF extraction (with OCR support)...");

    // Use Gemini's PDF/document understanding capability
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
            content: `You are an expert document text extractor with OCR capabilities. Extract ALL text from the provided PDF document.

Instructions:
- Extract every piece of text from the document
- If the PDF contains scanned images, perform OCR on them
- Preserve the original language (Hindi, English, Hinglish, or any other)
- Maintain the structure and reading order
- For identity documents, extract all fields: name, ID numbers, dates, addresses, etc.
- For forms, extract labels and their filled values
- Do NOT summarize or analyze - just extract the raw text
- Return ONLY the extracted text content`
          },
          {
            role: "user",
            content: [
              {
                type: "file",
                file: {
                  filename: file.name,
                  file_data: `data:application/pdf;base64,${base64}`
                }
              },
              {
                type: "text",
                text: "Extract all text from this PDF document. If it contains scanned images, perform OCR. Return only the extracted text."
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI PDF extraction failed:", response.status, errText);
      // Fallback to basic extraction
      return await basicPdfExtraction(file);
    }

    const result = await response.json();
    const extractedText = result.choices?.[0]?.message?.content || "";
    console.log("AI PDF extraction successful, length:", extractedText.length);
    
    // If AI extraction returned very little content, try basic extraction as fallback
    if (extractedText.length < 50) {
      console.log("AI extraction returned minimal content, trying basic extraction...");
      const basicText = await basicPdfExtraction(file);
      if (basicText.length > extractedText.length) {
        return basicText;
      }
    }
    
    return extractedText;
  } catch (error) {
    console.error("AI PDF extraction error:", error);
    return await basicPdfExtraction(file);
  }
}

async function extractTextFromDocWithAI(file: File): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    console.log("LOVABLE_API_KEY not available for DOCX");
    return await basicDocxExtraction(file);
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = file.name.endsWith(".docx") 
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "application/msword";

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
            content: `You are a document text extractor. Extract ALL text from the Word document provided.
Preserve the original language and structure. Return ONLY the extracted text content.`
          },
          {
            role: "user",
            content: [
              {
                type: "file",
                file: {
                  filename: file.name,
                  file_data: `data:${mimeType};base64,${base64}`
                }
              },
              {
                type: "text",
                text: "Extract all text from this Word document. Return only the text content."
              }
            ]
          }
        ],
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return result.choices?.[0]?.message?.content || "";
    } else {
      return await basicDocxExtraction(file);
    }
  } catch (error) {
    console.error("DOCX AI extraction error:", error);
    return await basicDocxExtraction(file);
  }
}

async function basicPdfExtraction(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const textBytes = new TextDecoder("latin1").decode(bytes);
  
  let extractedText = "";
  
  // Extract text from PDF text objects
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
  
  // Clean up
  extractedText = extractedText
    .replace(/[^\x20-\x7E\u0900-\u097F\s.,!?()-:;'"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  
  return extractedText;
}

async function basicDocxExtraction(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const textBytes = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  
  let extractedText = "";
  const wtMatches = textBytes.matchAll(/<w:t[^>]*>([^<]+)<\/w:t>/g);
  for (const match of wtMatches) {
    extractedText += match[1] + " ";
  }
  
  return extractedText.trim();
}
