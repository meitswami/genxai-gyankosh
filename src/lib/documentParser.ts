// Browser-compatible document text extraction
// Note: For proper PDF/DOCX parsing, we use the edge function

export async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();
  
  // Plain text files - read directly
  if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
    return await file.text();
  }
  
  // For PDF and DOCX, we'll send to the edge function for parsing
  // Return a marker so the caller knows to use server-side parsing
  if (fileName.endsWith('.pdf') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
    return 'REQUIRES_SERVER_PARSING';
  }
  
  // Try to read as text for unknown formats
  try {
    const text = await file.text();
    if (text && text.length > 20 && isPrintableText(text)) {
      return text;
    }
    return 'REQUIRES_SERVER_PARSING';
  } catch {
    return 'REQUIRES_SERVER_PARSING';
  }
}

function isPrintableText(text: string): boolean {
  // Check if the text is mostly printable characters
  const printable = text.replace(/[^\x20-\x7E\u0900-\u097F\s]/g, '');
  return printable.length > text.length * 0.8;
}

export function getFileIcon(fileType: string): string {
  if (fileType.includes('pdf')) return '📕';
  if (fileType.includes('word') || fileType.includes('doc')) return '📘';
  if (fileType.includes('text')) return '📄';
  return '📁';
}
