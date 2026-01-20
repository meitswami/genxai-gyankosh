import { useState } from 'react';
import { MessageSquare, Plus, Trash2, BookOpen, ChevronDown, ChevronUp, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ChatSession } from '@/hooks/useChatSessions';
import type { Document } from '@/hooks/useDocuments';
import { getFileIcon } from '@/lib/documentParser';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string | null) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  documents: Document[];
  onDeleteDocument: (id: string) => void;
  loading: boolean;
}

export function ChatSidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  documents,
  onDeleteDocument,
  loading,
}: ChatSidebarProps) {
  const [knowledgeBaseOpen, setKnowledgeBaseOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('gyaankosh_logged_in');
    localStorage.removeItem('gyaankosh_user');
    navigate('/auth');
  };

  return (
    <aside className="w-72 border-r border-border bg-sidebar flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-lg text-sidebar-foreground">ज्ञानकोष</h1>
              <p className="text-[10px] text-muted-foreground/60">by GenXAI</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Knowledge Base Toggle */}
      <Collapsible open={knowledgeBaseOpen} onOpenChange={setKnowledgeBaseOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between px-4 py-3 h-auto rounded-none border-b border-sidebar-border"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <BookOpen className="w-4 h-4" />
              Knowledge Base ({documents.length})
            </span>
            {knowledgeBaseOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="max-h-48 overflow-y-auto bg-muted/30">
            {documents.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No documents uploaded yet
              </p>
            ) : (
              <div className="p-2 space-y-1">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="group flex items-center gap-2 p-2 rounded-md hover:bg-sidebar-accent text-sm"
                  >
                    <span>{getFileIcon(doc.file_type)}</span>
                    <span className="flex-1 truncate text-sidebar-foreground">{doc.alias}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => onDeleteDocument(doc.id)}
                    >
                      <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* New Chat Button */}
      <div className="p-3">
        <Button onClick={onNewChat} className="w-full gap-2" variant="outline">
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      {/* Chat Sessions List */}
      <ScrollArea className="flex-1">
        <div className="px-3 pb-3 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No chats yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Start a new conversation
              </p>
            </div>
          ) : (
            <TooltipProvider delayDuration={300}>
              {sessions.map((session) => (
                <Tooltip key={session.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={`
                        group relative rounded-lg p-3 cursor-pointer transition-all
                        ${currentSessionId === session.id
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-sidebar-accent border border-transparent'
                        }
                      `}
                      onClick={() => onSelectSession(session.id)}
                    >
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-sidebar-foreground truncate block">
                            {session.title}
                          </span>
                          {currentSessionId === session.id && (
                            <span className="text-[10px] text-muted-foreground/60">
                              {format(new Date(session.created_at), 'MMM d, yyyy • h:mm a')}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    Started: {format(new Date(session.created_at), 'MMM d, yyyy • h:mm a')}
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <p className="text-xs text-muted-foreground text-center">
          Type <span className="font-mono bg-muted px-1 py-0.5 rounded">#</span> to reference documents
        </p>
        <p className="text-[10px] text-muted-foreground/50 text-center">
          Gyankosh in Hindi or English by GenXAI
        </p>
      </div>
    </aside>
  );
}
