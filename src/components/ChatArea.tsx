import { useRef, useEffect } from 'react';
import { Bot, User, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ChatMessage } from '@/hooks/useChat';

interface ChatAreaProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export function ChatArea({ messages, isLoading }: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <span className="text-4xl">📚</span>
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            ज्ञानकोष में स्वागत है
          </h2>
          <p className="text-muted-foreground mb-6">
            Welcome to Gyaankosh - Your AI-powered document knowledge base
          </p>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
              <FileText className="w-5 h-5 text-primary" />
              <span>Upload documents to build your knowledge base</span>
            </div>
            <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
              <span className="font-mono text-primary">#</span>
              <span>Type # to reference any document in chat</span>
            </div>
            <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
              <Bot className="w-5 h-5 text-primary" />
              <span>Ask questions in Hindi, English, or Hinglish</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1" ref={scrollRef}>
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 animate-fade-in ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}
            
            <div className={`max-w-[80%] ${
              message.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'
            }`}>
              {message.documentName && (
                <div className="document-chip mb-2">
                  <FileText className="w-3 h-3" />
                  {message.documentName}
                </div>
              )}
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.content}
              </div>
            </div>

            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="chat-bubble-assistant">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
