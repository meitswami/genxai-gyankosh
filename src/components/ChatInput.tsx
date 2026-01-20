import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Paperclip, X, FileText, Loader2, ListOrdered, Image } from 'lucide-react';
import { getSupportedFileTypes, getSupportedFileTypesLabel } from '@/lib/documentParser';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { Document } from '@/hooks/useDocuments';

interface ChatInputProps {
  documents: Document[];
  selectedDocument: Document | null;
  onSelectDocument: (doc: Document | null) => void;
  onSendMessage: (message: string) => void;
  onUploadFile: (file: File) => void;
  onGenerateFaq: (count: number) => void;
  isLoading: boolean;
  isUploading: boolean;
}

export function ChatInput({
  documents,
  selectedDocument,
  onSelectDocument,
  onSendMessage,
  onUploadFile,
  onGenerateFaq,
  isLoading,
  isUploading,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showDocumentPicker, setShowDocumentPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFaqPopover, setShowFaqPopover] = useState(false);
  const [faqCount, setFaqCount] = useState('5');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredDocuments = documents.filter(doc =>
    doc.alias.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    // Check for # trigger
    const hashIndex = message.lastIndexOf('#');
    if (hashIndex !== -1 && !selectedDocument) {
      const textAfterHash = message.slice(hashIndex + 1);
      if (!textAfterHash.includes(' ')) {
        setSearchTerm(textAfterHash);
        setShowDocumentPicker(true);
        return;
      }
    }
    setShowDocumentPicker(false);
  }, [message, selectedDocument]);

  const handleSelectDocumentFromPicker = (doc: Document) => {
    onSelectDocument(doc);
    // Remove the # and search text from message
    const hashIndex = message.lastIndexOf('#');
    if (hashIndex !== -1) {
      setMessage(message.slice(0, hashIndex));
    }
    setShowDocumentPicker(false);
    setSearchTerm('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
      e.target.value = '';
    }
  };

  const handleFaqGenerate = () => {
    const count = parseInt(faqCount) || 5;
    onGenerateFaq(Math.min(Math.max(count, 1), 20));
    setShowFaqPopover(false);
  };

  return (
    <div className="border-t border-border bg-card/50 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Selected Document Chip */}
        {selectedDocument && (
          <div className="mb-3 flex items-center gap-2 animate-fade-in">
            <div className="document-chip">
              <FileText className="w-3.5 h-3.5" />
              <span>{selectedDocument.alias}</span>
              <button
                onClick={() => onSelectDocument(null)}
                className="ml-1 hover:text-primary/70"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            
            {/* FAQ Generation Button */}
            <Popover open={showFaqPopover} onOpenChange={setShowFaqPopover}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                  <ListOrdered className="w-3.5 h-3.5" />
                  Generate FAQ
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="start">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Generate FAQs</h4>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      value={faqCount}
                      onChange={(e) => setFaqCount(e.target.value)}
                      placeholder="Count"
                      className="h-8"
                    />
                    <Button size="sm" onClick={handleFaqGenerate} disabled={isLoading}>
                      Generate
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Document Picker Dropdown */}
        {showDocumentPicker && documents.length > 0 && (
          <div className="mb-2 bg-popover border border-border rounded-lg shadow-lg overflow-hidden animate-fade-in">
            <div className="max-h-48 overflow-y-auto">
              {filteredDocuments.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  No matching documents
                </div>
              ) : (
                filteredDocuments.map((doc) => (
                  <button
                    key={doc.id}
                    className="w-full text-left px-3 py-2 hover:bg-accent flex items-center gap-2 transition-colors"
                    onClick={() => handleSelectDocumentFromPicker(doc)}
                  >
                    <FileText className="w-4 h-4 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{doc.alias}</p>
                      <p className="text-xs text-muted-foreground truncate">{doc.name}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="flex gap-2 items-end">
          {/* File Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept={getSupportedFileTypes()}
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-shrink-0 h-10 w-10"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Paperclip className="w-4 h-4" />
            )}
          </Button>

          {/* Message Input */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedDocument
                  ? `Ask about ${selectedDocument.alias}...`
                  : "Type # to reference a document, or upload new documents..."
              }
              className="min-h-[44px] max-h-32 resize-none pr-12"
              rows={1}
            />
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={!message.trim() || isLoading}
            className="flex-shrink-0 h-10 w-10"
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Hint */}
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Supports {getSupportedFileTypesLabel()} • Hindi, English & Hinglish
        </p>
      </div>
    </div>
  );
}
