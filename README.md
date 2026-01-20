# ज्ञानकोष (Gyaankosh) - AI Document Knowledge Base

**ज्ञानकोष** (Gyaankosh, meaning "Treasury of Knowledge") is an AI-powered document knowledge base that lets you upload documents and interact with them using natural language in Hindi, English, or Hinglish.

## ✨ Features

- **📚 Document Upload**: Support for PDF, DOCX, DOC, TXT, and image files
- **🔍 OCR Support**: Extract text from scanned PDFs and images (JPG, PNG, etc.)
- **💬 Multilingual Chat**: Ask questions in Hindi, English, or Hinglish with 100% accuracy
- **🤖 AI-Powered Responses**: Get intelligent answers based on your document content
- **📝 FAQ Generation**: Automatically generate FAQs from your documents with collapsible accordions
- **📋 Export Options**: Copy FAQs to clipboard or download as text files
- **💾 Chat History**: Auto-save conversations with smart naming like ChatGPT
- **🔐 Simple Authentication**: Quick login to get started
- **🌙 Dark Mode**: Toggle between light and dark themes

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Lovable Cloud (Supabase)
- **AI**: Google Gemini via Lovable AI Gateway
- **Database**: PostgreSQL with Row Level Security

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

### Default Login Credentials

- **Username**: `demo`
- **Password**: `demo123`

## 📖 Usage

1. **Login** with the demo credentials
2. **Upload a document** using the attachment button or drag-and-drop
3. **Select a document** by typing `#` in the chat input
4. **Ask questions** about your document in any language
5. **Generate FAQs** using the "Generate FAQ" button
6. **Export FAQs** by copying to clipboard or downloading

## 🏗️ Project Structure

```
src/
├── components/       # React components
│   ├── ui/          # shadcn/ui components
│   ├── ChatArea.tsx # Main chat display
│   ├── ChatInput.tsx # Message input with document selector
│   ├── ChatSidebar.tsx # Chat history & knowledge base
│   └── FAQRenderer.tsx # FAQ display with accordions
├── hooks/           # Custom React hooks
│   ├── useAuth.ts   # Authentication state
│   ├── useChat.ts   # Chat messaging logic
│   ├── useChatSessions.ts # Session management
│   └── useDocuments.ts # Document CRUD operations
├── pages/           # Route pages
├── lib/             # Utilities
└── integrations/    # Supabase client
```

## 🔧 Configuration

The project uses Lovable Cloud for backend services. All configuration is handled automatically.

## 📄 License

This project is open source and available under the MIT License.

---

Built with ❤️ using [Lovable](https://lovable.dev)
