import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch all sessions
  const fetchSessions = useCallback(async () => {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      return;
    }

    setSessions(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Create new session
  const createSession = useCallback(async (title: string = 'New Chat') => {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({ title })
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return null;
    }

    setSessions(prev => [data, ...prev]);
    setCurrentSessionId(data.id);
    return data;
  }, []);

  // Update session title
  const updateSessionTitle = useCallback(async (id: string, title: string) => {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating session:', error);
      return;
    }

    setSessions(prev => 
      prev.map(s => s.id === id ? { ...s, title, updated_at: new Date().toISOString() } : s)
    );
  }, []);

  // Delete session
  const deleteSession = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting session:', error);
      return;
    }

    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) {
      setCurrentSessionId(null);
    }
  }, [currentSessionId]);

  // Generate title from first message
  const generateTitle = useCallback((firstMessage: string) => {
    // Take first 40 chars or first sentence
    const cleaned = firstMessage.trim();
    const firstSentence = cleaned.split(/[.!?]/)[0];
    const title = firstSentence.length > 40 
      ? firstSentence.slice(0, 37) + '...' 
      : firstSentence || 'New Chat';
    return title;
  }, []);

  return {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    loading,
    createSession,
    updateSessionTitle,
    deleteSession,
    generateTitle,
    refetch: fetchSessions,
  };
}
