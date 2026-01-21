import { useState, useEffect, useCallback } from 'react';
import { Keyboard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface ShortcutAction {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
}

interface KeyboardShortcutsProps {
  onNewChat: () => void;
  onToggleSearch: () => void;
  onToggleVoice: () => void;
  onTogglePreview?: () => void;
  onExport?: () => void;
  onToggleKnowledgeBase?: () => void;
}

const shortcuts = [
  { keys: ['Ctrl', 'N'], description: 'New Chat', action: 'newChat' },
  { keys: ['Ctrl', 'K'], description: 'Toggle Search', action: 'search' },
  { keys: ['Ctrl', 'M'], description: 'Voice Input', action: 'voice' },
  { keys: ['Ctrl', 'P'], description: 'Preview Document', action: 'preview' },
  { keys: ['Ctrl', 'E'], description: 'Export Chat', action: 'export' },
  { keys: ['Ctrl', 'B'], description: 'Toggle Knowledge Base', action: 'knowledgeBase' },
  { keys: ['Ctrl', '/'], description: 'Show Shortcuts', action: 'shortcuts' },
  { keys: ['Escape'], description: 'Close Dialog', action: 'close' },
];

export function KeyboardShortcuts({
  onNewChat,
  onToggleSearch,
  onToggleVoice,
  onTogglePreview,
  onExport,
  onToggleKnowledgeBase,
}: KeyboardShortcutsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger when typing in inputs
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      // Only allow escape in inputs
      if (e.key === 'Escape') {
        target.blur();
      }
      return;
    }

    // Ctrl + Key shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'n':
          e.preventDefault();
          onNewChat();
          break;
        case 'k':
          e.preventDefault();
          onToggleSearch();
          break;
        case 'm':
          e.preventDefault();
          onToggleVoice();
          break;
        case 'p':
          e.preventDefault();
          onTogglePreview?.();
          break;
        case 'e':
          e.preventDefault();
          onExport?.();
          break;
        case 'b':
          e.preventDefault();
          onToggleKnowledgeBase?.();
          break;
        case '/':
          e.preventDefault();
          setIsOpen(prev => !prev);
          break;
      }
    }

    // Escape to close dialogs
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, [onNewChat, onToggleSearch, onToggleVoice, onTogglePreview, onExport, onToggleKnowledgeBase]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-1.5 text-muted-foreground"
        title="Keyboard Shortcuts (Ctrl+/)"
      >
        <Keyboard className="w-4 h-4" />
        <span className="hidden lg:inline">Shortcuts</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="w-5 h-5" />
              Keyboard Shortcuts
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-2">
            {shortcuts.map((shortcut) => (
              <div
                key={shortcut.action}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50"
              >
                <span className="text-sm text-foreground">
                  {shortcut.description}
                </span>
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key, i) => (
                    <span key={i}>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {key}
                      </Badge>
                      {i < shortcut.keys.length - 1 && (
                        <span className="text-muted-foreground mx-0.5">+</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              Press <Badge variant="outline" className="font-mono text-xs mx-1">Ctrl</Badge> + 
              <Badge variant="outline" className="font-mono text-xs mx-1">/</Badge> 
              anytime to show this panel
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
