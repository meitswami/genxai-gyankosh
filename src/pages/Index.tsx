import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useDocuments, type Document } from '@/hooks/useDocuments';
import { useChat } from '@/hooks/useChat';
import { parseDocument } from '@/lib/documentParser';
import { DocumentSidebar } from '@/components/DocumentSidebar';
import { ChatArea } from '@/components/ChatArea';
import { ChatInput } from '@/components/ChatInput';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-with-document`;

const Index = () => {
  const { toast } = useToast();
  const { documents, loading: docsLoading, uploadDocument, deleteDocument } = useDocuments();
  const { messages, isLoading, sendMessage, clearMessages } = useChat();
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    
    try {
      // Parse the document
      toast({
        title: 'Processing document...',
        description: 'Extracting text and analyzing content',
      });

      const contentText = await parseDocument(file);
      
      if (!contentText || contentText.length < 20) {
        throw new Error('Could not extract meaningful text from the document');
      }

      // Get AI summary
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          documentContent: contentText.slice(0, 10000),
          action: 'summarize',
        }),
      });

      if (!response.ok) throw new Error('Failed to analyze document');

      // Parse streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response');

      const decoder = new TextDecoder();
      let fullResponse = '';
      
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices?.[0]?.delta?.content;
              if (content) fullResponse += content;
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      // Parse the JSON response
      let summary;
      try {
        // Find JSON in the response
        const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          summary = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found');
        }
      } catch {
        // Fallback if parsing fails
        summary = {
          documentType: 'Document',
          summary: fullResponse.slice(0, 200),
          alias: file.name.replace(/\.[^/.]+$/, '').slice(0, 30),
        };
      }

      // Save to database
      const savedDoc = await uploadDocument(file, contentText, summary);
      
      if (savedDoc) {
        setSelectedDocument(savedDoc);
        toast({
          title: '✅ Document Added!',
          description: `"${summary.alias}" is now in your knowledge base`,
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Could not process document',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  }, [toast, uploadDocument]);

  const handleSendMessage = useCallback((message: string) => {
    if (!selectedDocument) {
      toast({
        title: 'No document selected',
        description: 'Type # to select a document or upload a new one',
        variant: 'destructive',
      });
      return;
    }
    sendMessage(message, selectedDocument);
  }, [selectedDocument, sendMessage, toast]);

  const handleGenerateFaq = useCallback(async (count: number) => {
    if (!selectedDocument) return;

    const response = await sendMessage('', selectedDocument, 'generateFaq', count);
    
    if (response) {
      toast({
        title: 'FAQs Generated',
        description: `Created ${count} FAQs from ${selectedDocument.alias}`,
      });
    }
  }, [selectedDocument, sendMessage, toast]);

  const handleSelectDocument = useCallback((doc: Document | null) => {
    setSelectedDocument(doc);
    if (doc && messages.length > 0) {
      clearMessages();
    }
  }, [messages.length, clearMessages]);

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <DocumentSidebar
        documents={documents}
        selectedDocument={selectedDocument}
        onSelectDocument={handleSelectDocument}
        onDeleteDocument={deleteDocument}
        loading={docsLoading}
      />

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="border-b border-border bg-card/50 px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium text-foreground">
                {selectedDocument 
                  ? `Chatting with: ${selectedDocument.alias}` 
                  : 'Select or upload a document'
                }
              </h2>
              {selectedDocument?.summary && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {selectedDocument.summary}
                </p>
              )}
            </div>
          </div>
        </header>

        {/* Chat Messages */}
        <ChatArea messages={messages} isLoading={isLoading} />

        {/* Input */}
        <ChatInput
          documents={documents}
          selectedDocument={selectedDocument}
          onSelectDocument={setSelectedDocument}
          onSendMessage={handleSendMessage}
          onUploadFile={handleFileUpload}
          onGenerateFaq={handleGenerateFaq}
          isLoading={isLoading}
          isUploading={isUploading}
        />
      </main>
    </div>
  );
};

export default Index;
