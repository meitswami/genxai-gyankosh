import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Document } from './useDocuments';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  documentId?: string;
  documentName?: string;
  createdAt: Date;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-with-document`;

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendMessage = useCallback(async (
    content: string,
    document: Document | null,
    action?: 'summarize' | 'generateFaq',
    faqCount?: number
  ) => {
    if (!content.trim() && !action) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: action === 'generateFaq' 
        ? `Generate ${faqCount} FAQs from ${document?.alias}` 
        : content,
      documentId: document?.id,
      documentName: document?.alias,
      createdAt: new Date(),
    };

    if (!action) {
      setMessages(prev => [...prev, userMessage]);
    }
    
    setIsLoading(true);
    let assistantContent = '';

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: action ? [] : [{ role: 'user', content }],
          documentContent: document?.content_text || '',
          documentName: document?.alias || document?.name,
          action,
          faqCount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const processChunk = () => {
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') return true;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              updateAssistantMessage(assistantContent, document);
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
        return false;
      };

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        if (processChunk()) break;
      }

      // Final flush
      if (buffer.trim()) {
        processChunk();
      }

      return assistantContent;
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get response',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const updateAssistantMessage = (content: string, document: Document | null) => {
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (last?.role === 'assistant') {
        return prev.map((m, i) => 
          i === prev.length - 1 ? { ...m, content } : m
        );
      }
      return [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content,
        documentId: document?.id,
        documentName: document?.alias,
        createdAt: new Date(),
      }];
    });
  };

const clearMessages = () => setMessages([]);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    setMessages,
  };
}
