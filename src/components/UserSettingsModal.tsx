import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  User, Pencil, Trash2, Plus, Star, Upload, Building, Phone, Briefcase, Check
} from 'lucide-react';
import { useUserSettings, type UserSignature } from '@/hooks/useUserSettings';

interface UserSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail?: string;
}

export function UserSettingsModal({ open, onOpenChange, userId, userEmail }: UserSettingsModalProps) {
  const { 
    settings, 
    signatures, 
    loading, 
    updateSettings, 
    addSignature, 
    updateSignature, 
    deleteSignature,
    setDefaultSignature,
    uploadLogo 
  } = useUserSettings(userId);

  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    designation: '',
    company: '',
    phone: '',
  });
  const [editingSignature, setEditingSignature] = useState<UserSignature | null>(null);
  const [newSignature, setNewSignature] = useState({
    name: '',
    type: 'formal' as 'formal' | 'semi-formal' | 'casual',
    content: '',
  });
  const [showNewSignatureForm, setShowNewSignatureForm] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Initialize form when settings load
  useState(() => {
    if (settings) {
      setProfileForm({
        first_name: settings.first_name || '',
        last_name: settings.last_name || '',
        designation: settings.designation || '',
        company: settings.company || '',
        phone: settings.phone || '',
      });
    }
  });

  const handleSaveProfile = async () => {
    await updateSettings(profileForm);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadLogo(file);
    }
  };

  const handleAddSignature = async () => {
    if (!newSignature.name || !newSignature.content) return;
    
    const success = await addSignature({
      name: newSignature.name,
      type: newSignature.type,
      content: newSignature.content,
      is_default: signatures.length === 0,
    });
    
    if (success) {
      setNewSignature({ name: '', type: 'formal', content: '' });
      setShowNewSignatureForm(false);
    }
  };

  const handleUpdateSignature = async () => {
    if (!editingSignature) return;
    
    await updateSignature(editingSignature.id, {
      name: editingSignature.name,
      type: editingSignature.type,
      content: editingSignature.content,
    });
    setEditingSignature(null);
  };

  const getInitials = () => {
    const first = settings?.first_name?.[0] || userEmail?.[0] || '?';
    const last = settings?.last_name?.[0] || '';
    return (first + last).toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={settings?.logo_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">
                {[settings?.first_name, settings?.last_name].filter(Boolean).join(' ') || 'Your Profile'}
              </p>
              <p className="text-sm text-muted-foreground font-normal">{userEmail}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="flex-1">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-6">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" /> Profile
            </TabsTrigger>
            <TabsTrigger value="signatures" className="gap-2">
              <Pencil className="w-4 h-4" /> Signatures
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[450px]">
            {/* Profile Tab */}
            <TabsContent value="profile" className="p-6 space-y-6 mt-0">
              {/* Logo Upload */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={settings?.logo_url || undefined} />
                    <AvatarFallback className="bg-muted text-2xl">
                      {settings?.logo_url ? '' : '📷'}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5" />
                  </Button>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </div>
                <div>
                  <p className="font-medium">Profile Photo / Logo</p>
                  <p className="text-sm text-muted-foreground">
                    Used in document templates and invoices
                  </p>
                </div>
              </div>

              {/* Name */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    placeholder="John"
                    value={profileForm.first_name}
                    onChange={e => setProfileForm(p => ({ ...p, first_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    placeholder="Doe"
                    value={profileForm.last_name}
                    onChange={e => setProfileForm(p => ({ ...p, last_name: e.target.value }))}
                  />
                </div>
              </div>

              {/* Professional Info */}
              <div className="space-y-2">
                <Label htmlFor="designation" className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> Designation
                </Label>
                <Input
                  id="designation"
                  placeholder="Software Engineer"
                  value={profileForm.designation}
                  onChange={e => setProfileForm(p => ({ ...p, designation: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="flex items-center gap-2">
                  <Building className="w-4 h-4" /> Company / Organization
                </Label>
                <Input
                  id="company"
                  placeholder="Acme Inc."
                  value={profileForm.company}
                  onChange={e => setProfileForm(p => ({ ...p, company: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Phone Number
                </Label>
                <Input
                  id="phone"
                  placeholder="+1 234 567 8900"
                  value={profileForm.phone}
                  onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                />
              </div>

              <Button onClick={handleSaveProfile} className="w-full">
                <Check className="w-4 h-4 mr-2" /> Save Profile
              </Button>
            </TabsContent>

            {/* Signatures Tab */}
            <TabsContent value="signatures" className="p-6 space-y-4 mt-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Your Signatures</p>
                  <p className="text-sm text-muted-foreground">
                    Create up to 3 signatures for different contexts
                  </p>
                </div>
                {signatures.length < 3 && (
                  <Button 
                    size="sm" 
                    onClick={() => setShowNewSignatureForm(true)}
                    disabled={showNewSignatureForm}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                )}
              </div>

              {/* New Signature Form */}
              {showNewSignatureForm && (
                <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Name</Label>
                      <Input
                        placeholder="e.g., Formal Work"
                        value={newSignature.name}
                        onChange={e => setNewSignature(s => ({ ...s, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Type</Label>
                      <select
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                        value={newSignature.type}
                        onChange={e => setNewSignature(s => ({ 
                          ...s, 
                          type: e.target.value as 'formal' | 'semi-formal' | 'casual' 
                        }))}
                      >
                        <option value="formal">Formal</option>
                        <option value="semi-formal">Semi-formal</option>
                        <option value="casual">Casual</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Signature Content</Label>
                    <Textarea
                      placeholder={`Warm Regards,\\n${settings?.first_name || 'Your Name'} ${settings?.last_name || ''}\\n${settings?.designation || 'Designation'}`}
                      value={newSignature.content}
                      onChange={e => setNewSignature(s => ({ ...s, content: e.target.value }))}
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddSignature}>
                      <Check className="w-4 h-4 mr-1" /> Save
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => {
                        setShowNewSignatureForm(false);
                        setNewSignature({ name: '', type: 'formal', content: '' });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Existing Signatures */}
              <div className="space-y-3">
                {signatures.map(sig => (
                  <div 
                    key={sig.id} 
                    className="border border-border rounded-lg p-4 space-y-2"
                  >
                    {editingSignature?.id === sig.id ? (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            value={editingSignature.name}
                            onChange={e => setEditingSignature(s => s ? { ...s, name: e.target.value } : null)}
                          />
                          <select
                            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
                            value={editingSignature.type}
                            onChange={e => setEditingSignature(s => s ? { 
                              ...s, 
                              type: e.target.value as 'formal' | 'semi-formal' | 'casual' 
                            } : null)}
                          >
                            <option value="formal">Formal</option>
                            <option value="semi-formal">Semi-formal</option>
                            <option value="casual">Casual</option>
                          </select>
                        </div>
                        <Textarea
                          value={editingSignature.content}
                          onChange={e => setEditingSignature(s => s ? { ...s, content: e.target.value } : null)}
                          rows={4}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleUpdateSignature}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingSignature(null)}>
                            Cancel
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{sig.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {sig.type}
                            </Badge>
                            {sig.is_default && (
                              <Badge className="text-xs bg-primary/10 text-primary">
                                <Star className="w-3 h-3 mr-1" /> Default
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {!sig.is_default && (
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8"
                                onClick={() => setDefaultSignature(sig.id)}
                                title="Set as default"
                              >
                                <Star className="w-4 h-4" />
                              </Button>
                            )}
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8"
                              onClick={() => setEditingSignature(sig)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-destructive"
                              onClick={() => deleteSignature(sig.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                          {sig.content}
                        </pre>
                      </>
                    )}
                  </div>
                ))}

                {signatures.length === 0 && !showNewSignatureForm && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Pencil className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p>No signatures yet</p>
                    <p className="text-sm">Add signatures to use in your documents</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
