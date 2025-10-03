# AI Chatbot Client

A modern, responsive AI chatbot client built with Next.js 14, TypeScript, and Tailwind CSS, featuring real-time WebSocket communication.

## Features

🚀 **Modern Tech Stack**
- Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Framer Motion for animations
- React Hot Toast for notifications

🎨 **Beautiful UI/UX**
- Responsive design that works on all devices
- Dark/Light mode support
- Smooth animations and transitions
- Modern gradient backgrounds
- Clean, minimalist interface

⚡ **Real-time Communication**
- WebSocket connection for instant messaging
- Connection status indicators
- Automatic reconnection on network issues
- Typing indicators
- Message persistence during session

🔧 **Advanced Features**
- Custom React hooks for state management
- Error handling and user feedback
- Toast notifications
- Auto-scrolling message list
- Keyboard shortcuts (Enter to send, Shift+Enter for new line)

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Your AI chatbot server running on `localhost:8000`

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**

   The `.env.local` file is already configured for local development:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_WS_URL=ws://localhost:8000
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Welcome Screen**: Click "Get Started" to begin
2. **Enter Your Name**: Provide your name in the welcome modal
3. **Start Chatting**: Send messages and receive AI responses in real-time
4. **Connection Status**: Monitor your connection status in the header
5. **Disconnect**: Use the logout button to end your session

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   └── page.tsx           # Main chat page
├── components/            # Reusable components
│   ├── ConnectionStatus.tsx
│   ├── Message.tsx
│   ├── MessageInput.tsx
│   ├── MessageList.tsx
│   ├── TypingIndicator.tsx
│   └── WelcomeModal.tsx
├── hooks/                 # Custom React hooks
│   └── useChat.ts        # Chat functionality hook
├── lib/                   # Utility functions
│   └── utils.ts          # Common utilities
└── types/                 # TypeScript type definitions
    └── chat.ts           # Chat-related types
```

## Technologies Used

- **[Next.js 14](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Framer Motion](https://www.framer.com/motion/)** - Animation library
- **[Lucide React](https://lucide.dev/)** - Beautiful icons
- **[React Hot Toast](https://react-hot-toast.com/)** - Notifications
- **[clsx](https://github.com/lukeed/clsx)** & **[tailwind-merge](https://github.com/dcastil/tailwind-merge)** - Conditional classes

## WebSocket Integration

The client connects to your WebSocket server using the following flow:

1. **Token Request**: POST to `/token` with user name
2. **WebSocket Connection**: Connect to `/chat?token={token}`
3. **Message Exchange**: Send/receive messages in real-time
4. **Connection Management**: Handle disconnections and reconnections

## Customization

### Styling
- Modify `tailwind.config.js` for custom colors and animations
- Update `src/app/globals.css` for global styles
- Customize component styles in individual component files

### Configuration
- Update `.env.local` for different server endpoints
- Modify `src/hooks/useChat.ts` for connection behavior
- Customize animations in component files

## Server Requirements

Your WebSocket server should support:
- **POST /token** - Accept name parameter, return JSON with token
- **WebSocket /chat** - Accept token query parameter
- **GET /chat_history** - Return chat history for token (optional)

## Browser Support

- Chrome/Chromium 88+
- Firefox 85+
- Safari 14+
- Edge 88+

---

**Built with ❤️ using modern web technologies**
