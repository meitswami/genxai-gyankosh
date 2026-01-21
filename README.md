# ज्ञानकोष (Gyaankosh) - AI Document Knowledge Base

**ज्ञानकोष** (Gyaankosh, meaning "Treasury of Knowledge") is an AI-powered document knowledge base that lets you upload documents and interact with them using natural language in Hindi, English, or Hinglish. Features end-to-end encrypted direct messaging, rich document formatting, and intelligent AI responses.

## ✨ Features

### 📚 Document Management
- **Multi-Format Upload**: Support for PDF, DOCX, DOC, TXT, images (JPG, PNG, WebP), and videos (MP4, WebM, MOV)
- **📦 Batch Upload**: Upload multiple files simultaneously with queue management (3 concurrent uploads)
- **🔍 Advanced OCR**: Extract text from scanned PDFs, images, and videos with multilingual support
- **🏷️ AI-Generated Tags & Categories**: Documents are automatically categorized and tagged
- **📊 Document Comparison**: Compare two documents side-by-side with AI-powered analysis
- **🔗 Document Sharing**: Share documents via public links or email invitations
- **🔎 Smart Search**: Search documents by name, content, tags, or categories

### 💬 AI Chat & Search
- **🌐 Global Knowledge Search**: Ask questions across your entire knowledge base
- **🎯 Document-Specific Chat**: Use `#` to reference and chat with specific documents
- **⚡ Vector Embeddings**: Semantic search using AI embeddings for faster results
- **🎤 Voice Input**: Speech-to-text support for Hindi and English
- **📝 FAQ Generation**: Automatically generate FAQs from documents
- **📤 Chat Export**: Download chats as PDF/Markdown/DOCX or share via public links
- **💡 AI Suggestions**: Get related follow-up questions after each response

### 📝 Professional Formatting
- **📄 Letter & Email Drafting**: AI generates properly formatted letters with salutations, subject lines, and signatures
- **📊 Auto Tables**: Tabular data is automatically formatted in clean markdown tables
- **🔤 Rich Text**: Full support for headings (H1-H6), bold, italics, blockquotes, and code blocks
- **📑 Document Structure**: Proper indentation, bullet points, numbered lists, and section breaks
- **📋 Export to DOCX**: Download AI responses as Word documents with preserved formatting

### 🔐 End-to-End Encrypted Messaging
- **👥 Friend System**: Send friend requests to connect with other users
- **🔒 E2E Encryption**: RSA-OAEP + AES-GCM hybrid encryption for all messages
- **📎 Encrypted Files**: Share files securely with automatic encryption/decryption
- **🎤 Voice Notes**: Record and send encrypted voice messages
- **🎥 Video Notes**: Record and send encrypted video messages
- **✅ Read Receipts**: See when messages are sent, delivered, and read
  - ✓ Single tick: Message sent
  - ✓✓ Double tick: Message delivered (recipient's app received it)
  - ✓✓ Blue ticks: Message read by recipient
- **⌨️ Typing Indicators**: See when friends are typing in real-time
- **😀 Message Reactions**: Add emoji reactions to messages
- **🔍 Chat Search**: Search across all your encrypted conversations
- **🔔 Push Notifications**: Browser notifications for new messages with unread counts

### ⌨️ Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New Chat |
| `Ctrl+K` | Focus Search |
| `Ctrl+M` | Voice Input |
| `Ctrl+P` | Preview Document |
| `Ctrl+E` | Export Chat |
| `Ctrl+B` | Toggle Knowledge Base |
| `Ctrl+/` | Show Shortcuts |

### 🔧 User Experience
- **💾 Chat History**: Auto-save conversations with smart naming
- **🔐 Secure Authentication**: User authentication with row-level security
- **🌙 Dark Mode**: Toggle between light and dark themes
- **📱 Responsive Design**: Works on desktop and mobile devices
- **👤 User Presence**: See online/offline/away status of friends

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Lovable Cloud (Supabase)
- **AI Models**: 
  - Google Gemini 3 Flash (Chat & Analysis)
  - Text Embedding 3 Small (Semantic Search)
- **Database**: PostgreSQL with pgvector extension
- **Storage**: Supabase Storage with RLS
- **Encryption**: Web Crypto API (RSA-OAEP + AES-GCM)
- **Real-time**: Supabase Realtime for messaging & presence

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ & npm

### Local Development

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd gyaankosh

# Install dependencies
npm install

# Start development server
npm run dev
```

## 📖 Usage

### Document Upload
1. **Drag & drop** files onto the chat input area, or click the 📎 button
2. **Batch upload**: Select multiple files to queue them for processing
3. Supported formats: PDF, DOCX, DOC, TXT, JPG, PNG, MP4, WebM
4. Documents are automatically analyzed, summarized, and tagged

### Chatting with Documents
1. **Global Search**: Simply type your question to search across all documents
2. **Specific Document**: Type `#` to select a specific document
3. **Voice Input**: Click the 🎤 microphone button for voice queries
4. **Generate FAQs**: Select a document and click "Generate FAQ"
5. **Follow-up Questions**: Click suggested questions after AI responses

### Writing Letters & Emails
Ask the AI to draft professional documents:
- "Write a formal letter to the HR department requesting leave"
- "Draft a job application email for a software developer position"
- "Create a professional thank you letter after an interview"

The AI will format with proper:
- Salutation (Dear Sir/Madam, To Whom It May Concern)
- Subject line
- Body paragraphs
- Closing (Yours sincerely, Best regards)
- Signature block

### Direct Messaging
1. Click the 💬 chat button in the bottom-right corner
2. Search for users and send friend requests
3. Accept incoming requests to start messaging
4. Messages are end-to-end encrypted automatically
5. Send files, voice notes, or video notes securely

### Message Status Indicators
- **✓ (gray)**: Message sent to server
- **✓✓ (gray)**: Message delivered to recipient's device
- **✓✓ (blue)**: Message has been read

### Document Comparison
1. Click **"Compare"** in the Knowledge Base section
2. Select two documents to compare
3. AI will analyze similarities, differences, and unique content

### Searching Documents
- Use the search bar in the Knowledge Base to find documents by:
  - Name or alias
  - Content text
  - Tags or category
  - Summary

## 🏗️ Project Structure

```
src/
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   ├── ChatArea.tsx     # Main chat display with markdown
│   ├── ChatInput.tsx    # Message input with voice & document selector
│   ├── ChatSidebar.tsx  # Chat history & knowledge base
│   ├── ChatWidget.tsx   # E2E encrypted direct messaging
│   ├── MarkdownRenderer.tsx # Rich text formatting
│   ├── MessageReactions.tsx # Emoji reactions
│   ├── MessageStatusIndicator.tsx # Read receipts
│   ├── VoiceVideoRecorder.tsx # Media recording
│   └── ...
├── hooks/               # Custom React hooks
│   ├── useAuth.ts       # Authentication state
│   ├── useChat.ts       # Chat messaging logic
│   ├── useDirectMessages.ts # E2E encrypted messages
│   ├── useMessageNotifications.ts # Push notifications
│   ├── useTypingIndicator.ts # Real-time typing
│   ├── useMessageReactions.ts # Emoji reactions
│   ├── useUserPresence.ts # Online status & friends
│   └── ...
├── lib/                 # Utilities
│   ├── encryption.ts    # RSA + AES encryption
│   ├── encryptedFileUpload.ts # Secure file handling
│   ├── docxExport.ts    # Word document export
│   └── ...
└── integrations/        # Supabase client

supabase/
└── functions/           # Edge Functions
    ├── chat-with-document/ # AI chat with formatting
    ├── parse-document/     # Document parsing & OCR
    └── generate-embedding/ # Vector embeddings & search
```

## 🔒 Security

### Document Security
- **Row Level Security (RLS)**: All data is protected with user-specific access policies
- **JWT Authentication**: Secure token-based authentication
- **Storage Policies**: Documents are stored with user-specific folder structure

### Message Encryption
- **RSA-OAEP (2048-bit)**: Asymmetric encryption for key exchange
- **AES-GCM (256-bit)**: Symmetric encryption for message content
- **Hybrid Encryption**: Each message uses a unique AES key, encrypted with recipient's public key
- **Local Key Storage**: Private keys stored in browser's IndexedDB, never transmitted
- **Forward Secrecy**: Compromising one key doesn't expose past messages

## 🔧 Configuration

The project uses Lovable Cloud for backend services. All configuration is handled automatically.

### Environment Variables (Auto-configured)
- `VITE_SUPABASE_URL` - Backend URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Public API key
- `VITE_SUPABASE_PROJECT_ID` - Project identifier

## 🎯 Can This Project Do...?

### ✅ Yes, it can:
- Draft formal letters, emails, and professional correspondence
- Create properly formatted documents with tables, lists, and headings
- Search across multiple documents simultaneously
- Generate FAQs from any document
- Compare two documents side-by-side
- Send encrypted messages with files
- Record and send voice/video notes
- Show real-time typing indicators
- Track message delivery and read status
- Export responses as DOCX files

### 🔜 Coming Soon:
- Group chats with multiple participants
- Document collaboration and annotations
- Calendar integration for scheduling
- Mobile app versions

## 📄 License

This project is open source and available under the MIT License.

---

Built with ❤️ using [Lovable](https://lovable.dev)
