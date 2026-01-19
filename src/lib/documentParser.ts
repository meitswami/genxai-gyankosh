import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function parseDocument(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.txt')) {
    return await file.text();
  }
  
  if (fileName.endsWith('.pdf')) {
    return await parsePdf(file);
  }
  
  if (fileName.endsWith('.docx')) {
    return await parseDocx(file);
  }
  
  if (fileName.endsWith('.doc')) {
    // .doc files are harder to parse, try basic extraction
    return await parseDoc(file);
  }
  
  // Fallback: try to read as text
  try {
    return await file.text();
  } catch {
    throw new Error('Unsupported file format');
  }
}

async function parsePdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF. The file might be corrupted or password-protected.');
  }
}

async function parseDocx(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error('DOCX parsing error:', error);
    throw new Error('Failed to parse DOCX file.');
  }
}

async function parseDoc(file: File): Promise<string> {
  // .doc files (old format) are binary and complex
  // We'll try to extract any readable text
  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    let text = '';
    let inText = false;
    let textBuffer = '';
    
    for (let i = 0; i < bytes.length; i++) {
      const char = bytes[i];
      
      // Look for readable ASCII and Devanagari characters
      if ((char >= 32 && char <= 126) || (char >= 0x0900 && char <= 0x097F)) {
        textBuffer += String.fromCharCode(char);
        inText = true;
      } else if (inText && textBuffer.length > 3) {
        text += textBuffer + ' ';
        textBuffer = '';
        inText = false;
      } else {
        textBuffer = '';
        inText = false;
      }
    }
    
    if (textBuffer.length > 3) {
      text += textBuffer;
    }
    
    // Clean up the text
    text = text
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E\u0900-\u097F\s]/g, '')
      .trim();
    
    if (text.length < 50) {
      throw new Error('Could not extract meaningful text from .doc file. Please convert to .docx format.');
    }
    
    return text;
  } catch (error) {
    console.error('DOC parsing error:', error);
    throw new Error('Failed to parse .doc file. Please convert to .docx format for better results.');
  }
}

export function getFileIcon(fileType: string): string {
  if (fileType.includes('pdf')) return '📕';
  if (fileType.includes('word') || fileType.includes('doc')) return '📘';
  if (fileType.includes('text')) return '📄';
  return '📁';
}
