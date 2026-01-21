# ज्ञानकोष (Gyaankosh) - AI Document Knowledge Base

**ज्ञानकोष** (Gyaankosh, meaning "Treasury of Knowledge") is an AI-powered document knowledge base that lets you upload documents and interact with them using natural language in Hindi, English, or Hinglish. Features end-to-end encrypted messaging, smart mentions, RBAC, and enterprise-grade security.

## 🆚 ChatGPT vs Gyaankosh Comparison

| Feature | ChatGPT | Gyaankosh |
|---------|---------|-----------|
| **Document Upload** | ✅ Limited (paid) | ✅ Unlimited (PDF, DOCX, Images, Videos) |
| **Knowledge Base** | ❌ No persistent storage | ✅ Personal document library with semantic search |
| **Multi-Language** | ✅ Many languages | ✅ Hindi/English/Hinglish optimized |
| **Document Comparison** | ❌ Not available | ✅ AI-powered side-by-side analysis |
| **Chat History** | ✅ Basic | ✅ Sessions with export (PDF/DOCX/Markdown) |
| **Voice Input** | ✅ Mobile only | ✅ Browser-based, Hindi + English |
| **End-to-End Encryption** | ❌ Not available | ✅ RSA-OAEP + AES-GCM messaging |
| **Team Collaboration** | ❌ Enterprise only | ✅ Built-in with RBAC |
| **Smart Mentions** | ❌ Not available | ✅ @users, #documents, !APIs |
| **API Integrations** | ❌ Plugins (limited) | ✅ Custom API connections |
| **Web Search** | ✅ Paid feature | ✅ Google & Bing integration |
| **Professional Templates** | ❌ Not available | ✅ Letters, Emails, Reports, Invoices |
| **Dynamic Signatures** | ❌ Not available | ✅ Auto-inserted based on context |
| **2FA Security** | ✅ Available | ✅ Microsoft Authenticator |
| **Activity Logs** | ❌ Limited | ✅ Detailed audit trail |
| **Self-Hosted Option** | ❌ Not available | ✅ Full control |
| **Pricing** | $20/month+ | Free / Self-hosted |

## ✨ Features

### 📚 Document Management
- **Multi-Format Upload**: PDF, DOCX, DOC, TXT, images (JPG, PNG, WebP), videos (MP4, WebM, MOV)
- **📦 Batch Upload**: Multiple files with queue management (3 concurrent)
- **🔍 Advanced OCR**: Extract text from scanned documents with multilingual support
- **🏷️ AI-Generated Tags**: Automatic categorization and tagging
- **📊 Document Comparison**: Side-by-side AI analysis
- **🔗 Sharing**: Public links with view tracking

### 💬 AI Chat & Smart Mentions
- **🌐 Global Search**: Query across entire knowledge base
- **@ User Mentions**: Reference friends in conversations
- **# Document Mentions**: Link specific documents
- **! API/Search Mentions**: Query external APIs or web search
- **⚡ Semantic Search**: Vector embeddings for intelligent results
- **🎤 Voice Input**: Hindi and English speech-to-text
- **📝 FAQ Generation**: Auto-generate FAQs from documents
- **💡 AI Suggestions**: Follow-up question recommendations

### 📝 Professional Formatting & Templates
- **📄 Letter Templates**: Formal, resignation, recommendation, leave requests
- **📧 Email Templates**: Professional, follow-up, thank you, cold outreach
- **📊 Business Documents**: Invoices, memos, meeting notes, reports
- **🔤 Rich Text**: H1-H6 headings, tables, lists, code blocks
- **✍️ Dynamic Signatures**: Auto-inserted based on document type
- **📋 DOCX Export**: Download any AI response as Word document

### 🔐 Security & Enterprise Features
- **👥 RBAC**: Role-based access (Admin, Moderator, User)
- **🏢 Organizations**: Multi-tenant team management
- **🔒 2FA**: Microsoft Authenticator support
- **📊 Activity Logs**: Complete audit trail
- **🔑 API Integrations**: Connect external services
- **📈 Usage Limits**: Configurable per organization

### 💬 E2E Encrypted Messaging
- **🔐 Hybrid Encryption**: RSA-OAEP + AES-GCM
- **📎 Encrypted Files**: Secure file sharing
- **🎤 Voice/Video Notes**: Encrypted media messages
- **✅ Read Receipts**: Sent → Delivered → Read
- **⌨️ Typing Indicators**: Real-time status
- **😀 Reactions**: Emoji reactions on messages
- **👥 Group Chats**: Multi-participant encrypted rooms

### ⌨️ Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New Chat |
| `Ctrl+K` | Focus Search |
| `Ctrl+M` | Voice Input |
| `Ctrl+P` | Preview Document |
| `Ctrl+E` | Export Chat |
| `Ctrl+/` | Show Shortcuts |

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Lovable Cloud (Supabase)
- **AI**: Google Gemini 3 Flash, Multi-model adaptive
- **Database**: PostgreSQL with pgvector
- **Encryption**: Web Crypto API (RSA-OAEP + AES-GCM)
- **Real-time**: Supabase Realtime

## 🚀 Getting Started

```sh
# Clone and install
git clone <YOUR_GIT_URL>
cd gyaankosh
npm install
npm run dev
```

## 📖 Usage

### Smart Mentions
- **@username** - Mention a connected friend
- **#document** - Reference a specific document
- **!google** - Search the web via Google
- **!bing** - Search via Bing
- **!apiname** - Query your custom API integrations

### Document Templates
1. Open Settings → Signatures to set up your signatures
2. Ask AI: "Write a formal letter requesting leave"
3. AI auto-fills date, salutation, and your signature

### Settings & Security
- Click ⚙️ Settings in header
- **Profile**: Name, company, logo for templates
- **Signatures**: 3 types (formal, semi-formal, casual)
- **Security**: Enable 2FA, view backup codes
- **Integrations**: Add custom APIs
- **Activity**: View your action history

## 🔒 Security

- **RLS Policies**: User-scoped data access
- **JWT Auth**: Secure token authentication
- **RBAC**: Role-based permissions
- **2FA**: TOTP-based second factor
- **E2E Encryption**: Messages never readable by server
- **Audit Logs**: Complete activity tracking

## 📄 License

MIT License - Free for personal and commercial use.

---

Built with ❤️ using [Lovable](https://lovable.dev)
