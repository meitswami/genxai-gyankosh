# ज्ञानकोष (Gyaankosh) - AI Document Knowledge Base

**ज्ञानकोष** (Gyaankosh, meaning "Treasury of Knowledge") is an AI-powered document knowledge base that lets you upload documents and interact with them using natural language in Hindi, English, or Hinglish.

## ✨ Features

### 📚 Document Management
- **Multi-Format Upload**: Support for PDF, DOCX, DOC, TXT, images (JPG, PNG, WebP), and videos (MP4, WebM, MOV)
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
- **📤 Chat Export**: Download chats as PDF/Markdown or share via public links

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

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Lovable Cloud (Supabase)
- **AI Models**: 
  - Google Gemini 3 Flash (Chat & Analysis)
  - Text Embedding 3 Small (Semantic Search)
- **Database**: PostgreSQL with pgvector extension
- **Storage**: Supabase Storage with RLS

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
2. Supported formats: PDF, DOCX, DOC, TXT, JPG, PNG, MP4, WebM
3. Documents are automatically analyzed, summarized, and tagged

### Chatting with Documents
1. **Global Search**: Simply type your question to search across all documents
2. **Specific Document**: Type `#` to select a specific document
3. **Voice Input**: Click the 🎤 microphone button for voice queries
4. **Generate FAQs**: Select a document and click "Generate FAQ"

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
│   ├── ChatArea.tsx     # Main chat display
│   ├── ChatInput.tsx    # Message input with voice & document selector
│   ├── ChatSidebar.tsx  # Chat history & knowledge base
│   ├── DocumentComparison.tsx # Side-by-side document comparison
│   ├── DocumentSearch.tsx # Search input component
│   ├── FAQRenderer.tsx  # FAQ display with accordions
│   ├── SpeechButton.tsx # Voice input button
│   ├── TagFilter.tsx    # Tag filtering component
│   └── UploadProgress.tsx # Upload progress indicator
├── hooks/               # Custom React hooks
│   ├── useAuth.ts       # Authentication state
│   ├── useChat.ts       # Chat messaging logic
│   ├── useChatSessions.ts # Session management
│   ├── useDocuments.ts  # Document CRUD operations
│   └── useSpeechToText.ts # Voice input hook
├── pages/               # Route pages
│   ├── Index.tsx        # Main application page
│   └── Auth.tsx         # Authentication page
├── lib/                 # Utilities
│   ├── documentParser.ts # File type handling
│   └── utils.ts         # Helper functions
└── integrations/        # Supabase client
    └── supabase/

supabase/
└── functions/           # Edge Functions
    ├── chat-with-document/ # AI chat endpoint
    ├── parse-document/     # Document parsing & OCR
    └── generate-embedding/ # Vector embeddings & search
```

## 🔒 Security

- **Row Level Security (RLS)**: All data is protected with user-specific access policies
- **JWT Authentication**: Secure token-based authentication
- **Storage Policies**: Documents are stored with user-specific folder structure

## 🔧 Configuration

The project uses Lovable Cloud for backend services. All configuration is handled automatically.

### Environment Variables (Auto-configured)
- `VITE_SUPABASE_URL` - Backend URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Public API key
- `VITE_SUPABASE_PROJECT_ID` - Project identifier

## 📄 License

This project is open source and available under the MIT License.

---

Built with ❤️ using [Lovable](https://lovable.dev)
