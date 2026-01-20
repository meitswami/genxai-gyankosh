import { useState, useCallback, useEffect } from 'react';
import { Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDocuments, type Document } from '@/hooks/useDocuments';
import { useChat } from '@/hooks/useChat';
import { useChatSessions } from '@/hooks/useChatSessions';
import { useAuth } from '@/hooks/useAuth';
import { extractTextFromFile } from '@/lib/documentParser';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ChatArea } from '@/components/ChatArea';
import { ChatInput } from '@/components/ChatInput';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DocumentPreview } from '@/components/DocumentPreview';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const PARSE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-document`;
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-with-document`;

const Index = () => {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { documents, loading: docsLoading, uploadDocument, deleteDocument } = useDocuments();
  const { messages, isLoading, sendMessage, clearMessages, setMessages } = useChat();
  const {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    loading: sessionsLoading,
    createSession,
    updateSessionTitle,
    deleteSession,
    generateTitle,
  } = useChatSessions();
  
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Load messages when session changes
  useEffect(() => {
    if (!currentSessionId) {
      clearMessages();
      return;
    }

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', currentSessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      if (data) {
        setMessages(data.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          documentId: msg.document_id || undefined,
          createdAt: new Date(msg.created_at),
        })));
      }
    };

    loadMessages();
  }, [currentSessionId, clearMessages, setMessages]);

  const handleFileUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    
    try {
      toast({
        title: 'Processing document...',
        description: 'Extracting text and analyzing content',
      });

      let contentText = '';
      
      const clientText = await extractTextFromFile(file);
      
      if (clientText === 'REQUIRES_SERVER_PARSING') {
        const formData = new FormData();
        formData.append('file', file);
        
        const parseResponse = await fetch(PARSE_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        });
        
        const parseResult = await parseResponse.json();
        
        if (!parseResult.success) {
          throw new Error(parseResult.error || 'Failed to parse document');
        }
        
        contentText = parseResult.content;
      } else {
        contentText = clientText;
      }
      
      if (!contentText || contentText.length < 20) {
        throw new Error('Could not extract meaningful text from the document');
      }

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

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response');

      const decoder = new TextDecoder();
      let fullResponse = '';
      
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

      let summary;
      try {
        const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          summary = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found');
        }
      } catch {
        summary = {
          documentType: 'Document',
          summary: fullResponse.slice(0, 200),
          alias: file.name.replace(/\.[^/.]+$/, '').slice(0, 30),
        };
      }

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

  const handleSendMessage = useCallback(async (message: string) => {
    if (!selectedDocument) {
      toast({
        title: 'No document selected',
        description: 'Type # to select a document or upload a new one',
        variant: 'destructive',
      });
      return;
    }

    let sessionId = currentSessionId;

    // Create new session if needed
    if (!sessionId) {
      const newSession = await createSession(generateTitle(message));
      if (!newSession) return;
      sessionId = newSession.id;
    } else if (messages.length === 0) {
      // Update title with first message
      await updateSessionTitle(sessionId, generateTitle(message));
    }

    // Save user message to DB
    await supabase.from('chat_messages').insert({
      session_id: sessionId,
      role: 'user',
      content: message,
      document_id: selectedDocument.id,
    });

    const response = await sendMessage(message, selectedDocument);

    // Save assistant response to DB
    if (response) {
      await supabase.from('chat_messages').insert({
        session_id: sessionId,
        role: 'assistant',
        content: response,
        document_id: selectedDocument.id,
      });
    }
  }, [selectedDocument, sendMessage, toast, currentSessionId, createSession, updateSessionTitle, generateTitle, messages.length]);

  const handleGenerateFaq = useCallback(async (count: number) => {
    if (!selectedDocument) return;

    let sessionId = currentSessionId;

    // Create new session if needed
    if (!sessionId) {
      const newSession = await createSession(`FAQs: ${selectedDocument.alias}`);
      if (!newSession) return;
      sessionId = newSession.id;
    }

    const userContent = `Generate ${count} FAQs from "${selectedDocument.alias}"`;
    
    // Save user message to DB
    await supabase.from('chat_messages').insert({
      session_id: sessionId,
      role: 'user',
      content: userContent,
      document_id: selectedDocument.id,
    });

    // Add user message to UI
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: userContent,
      documentId: selectedDocument.id,
      createdAt: new Date(),
    }]);

    const response = await sendMessage('', selectedDocument, 'generateFaq', count);
    
    // Save assistant response to DB
    if (response) {
      await supabase.from('chat_messages').insert({
        session_id: sessionId,
        role: 'assistant',
        content: response,
        document_id: selectedDocument.id,
      });

      toast({
        title: 'FAQs Generated',
        description: `Created ${count} FAQs from ${selectedDocument.alias}`,
      });
    }
  }, [selectedDocument, sendMessage, toast, currentSessionId, createSession, setMessages]);

  const handleNewChat = useCallback(() => {
    setCurrentSessionId(null);
    clearMessages();
    setSelectedDocument(null);
  }, [setCurrentSessionId, clearMessages]);

  const handleSelectSession = useCallback((id: string | null) => {
    setCurrentSessionId(id);
  }, [setCurrentSessionId]);

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar with Chat History */}
      <ChatSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={deleteSession}
        documents={documents}
        onDeleteDocument={deleteDocument}
        loading={sessionsLoading || docsLoading}
      />

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="border-b border-border bg-card/50 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="font-medium text-foreground truncate">
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
            <div className="flex items-center gap-2 ml-4">
              {selectedDocument && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="gap-1.5"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">{showPreview ? 'Hide' : 'Preview'}</span>
                </Button>
              )}
              <ThemeToggle />
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

      {/* Document Preview Panel */}
      {showPreview && (
        <DocumentPreview
          document={selectedDocument}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

export default Index;
