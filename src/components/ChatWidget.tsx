import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  MessageCircle, X, Send, Users, ArrowLeft, Search, 
  Paperclip, FileText, Lock, Circle
} from 'lucide-react';
import { FriendsList } from './FriendsList';
import { useUserPresence, type UserProfile } from '@/hooks/useUserPresence';
import { useDirectMessages } from '@/hooks/useDirectMessages';
import { highlightText } from '@/lib/highlightText';
import { format, isToday, isYesterday } from 'date-fns';
import type { Document } from '@/hooks/useDocuments';

interface ChatWidgetProps {
  documents: Document[];
  onShareDocument?: (doc: Document, friendId: string) => void;
}

function getInitials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatMessageTime(dateStr: string) {
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return 'Yesterday ' + format(date, 'HH:mm');
  return format(date, 'MMM d, HH:mm');
}

export function ChatWidget({ documents, onShareDocument }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<UserProfile | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDocPicker, setShowDocPicker] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    currentUser,
    friends,
    pendingRequests,
    allUsers,
    sendFriendRequest,
    respondToRequest,
    removeFriend,
  } = useUserPresence();

  const { messages, unreadCount, sendMessage, markAsRead } = useDirectMessages(
    currentUser?.user_id || null,
    activeChat
  );

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark as read when opening chat
  useEffect(() => {
    if (activeChat) {
      markAsRead();
    }
  }, [activeChat, markAsRead]);

  const handleSend = async () => {
    if (!messageInput.trim() || !activeChat) return;
    
    const success = await sendMessage(messageInput.trim());
    if (success) {
      setMessageInput('');
    }
  };

  const handleShareDocument = (doc: Document) => {
    if (activeChat && onShareDocument) {
      onShareDocument(doc, activeChat.user_id);
      sendMessage(`📄 Shared document: ${doc.alias || doc.name}`, 'document');
    }
    setShowDocPicker(false);
  };

  const filteredMessages = searchTerm
    ? messages.filter(m => m.content.toLowerCase().includes(searchTerm.toLowerCase()))
    : messages;

  if (!currentUser) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            <MessageCircle className="w-6 h-6" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 flex items-center justify-center"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent 
          side="top" 
          align="end" 
          className="w-96 h-[500px] p-0 rounded-2xl overflow-hidden shadow-2xl"
        >
          {activeChat ? (
            // Chat View
            <div className="flex flex-col h-full">
              {/* Chat Header */}
              <div className="flex items-center gap-3 p-3 border-b border-border bg-muted/30">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setActiveChat(null)}
                  className="h-8 w-8"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                
                <div className="relative">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={activeChat.avatar_url || undefined} />
                    <AvatarFallback>{getInitials(activeChat.display_name)}</AvatarFallback>
                  </Avatar>
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background ${
                    activeChat.status === 'online' ? 'bg-green-500' : 'bg-muted-foreground'
                  }`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm">{activeChat.display_name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    End-to-end encrypted
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchTerm(searchTerm ? '' : ' ')}
                  className="h-8 w-8"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>

              {/* Search Bar (conditional) */}
              {searchTerm !== '' && (
                <div className="p-2 border-b border-border">
                  <Input
                    placeholder="Search in chat..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                    className="h-8 text-sm"
                  />
                </div>
              )}

              {/* Messages */}
              <ScrollArea className="flex-1 p-3" ref={scrollRef}>
                <div className="space-y-3">
                  {filteredMessages.map((msg) => {
                    const isOwn = msg.sender_id === currentUser.user_id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] ${isOwn ? 'order-1' : ''}`}>
                          <div
                            className={`px-3 py-2 rounded-2xl ${
                              isOwn 
                                ? 'bg-primary text-primary-foreground rounded-br-md' 
                                : 'bg-muted rounded-bl-md'
                            }`}
                          >
                            {msg.content_type === 'document' ? (
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                <span className="text-sm">{msg.content}</span>
                              </div>
                            ) : searchTerm ? (
                              <p className="text-sm">{highlightText(msg.content, searchTerm)}</p>
                            ) : (
                              <p className="text-sm">{msg.content}</p>
                            )}
                          </div>
                          <p className={`text-[10px] text-muted-foreground mt-1 ${isOwn ? 'text-right' : ''}`}>
                            {formatMessageTime(msg.created_at)}
                            {msg.read_at && isOwn && ' ✓✓'}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Lock className="w-10 h-10 text-muted-foreground mb-3" />
                      <p className="text-sm font-medium">Messages are end-to-end encrypted</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        No one outside of this chat can read them
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Document Picker */}
              {showDocPicker && (
                <div className="border-t border-border p-2 max-h-40 overflow-auto">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Share a document</p>
                  {documents.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => handleShareDocument(doc)}
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-sm truncate">{doc.alias || doc.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Message Input */}
              <div className="p-3 border-t border-border flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDocPicker(!showDocPicker)}
                  className="h-9 w-9 shrink-0"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  className="flex-1"
                />
                
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!messageInput.trim()}
                  className="h-9 w-9 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            // Friends List View
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="font-semibold">Messages</span>
                </div>
                <div className="flex items-center gap-1">
                  <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
              </div>

              <FriendsList
                friends={friends}
                pendingRequests={pendingRequests}
                allUsers={allUsers}
                currentUserId={currentUser.user_id}
                onSendRequest={sendFriendRequest}
                onRespondRequest={respondToRequest}
                onRemoveFriend={removeFriend}
                onStartChat={setActiveChat}
              />
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
