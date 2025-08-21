# LiveQnA Frontend

A modern, professional React/Next.js frontend for the LiveQnA real-time interactive Q&A platform.

## 🚀 Features

### Core Functionality
- **Real-time Q&A Interface** - Interactive chat with live updates
- **Question Voting System** - Upvote important questions to prioritize them
- **Room Management** - Create and join Q&A sessions with unique links
- **Authentication** - Secure sign-in/sign-up with email/password and Google OAuth
- **Admin Controls** - Session management and participant monitoring
- **Mobile Responsive** - Optimized for all devices and screen sizes

### UI/UX Features
- **Dark/Light Mode** - Seamless theme switching with smooth transitions
- **Modern Design** - Clean, minimal interface built with Tailwind CSS
- **Accessibility First** - ARIA labels, keyboard navigation, high contrast
- **Smooth Animations** - Framer Motion for elegant page transitions
- **Professional Components** - Built with shadcn/ui for consistency

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── about/             # About page
│   ├── admin/             # Admin control panel
│   ├── auth/              # Authentication pages
│   │   ├── signin/        # Sign-in page
│   │   └── signup/        # Sign-up page
│   ├── rooms/             # Room management
│   │   ├── [id]/          # Dynamic room page
│   │   └── page.tsx       # Rooms listing
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── not-found.tsx      # 404 error page
│   └── page.tsx           # Landing page
├── components/            # Reusable components
│   ├── questions/         # Question-related components
│   ├── ui/                # shadcn/ui components
│   ├── footer.tsx         # Footer component
│   ├── navbar.tsx         # Navigation bar
│   ├── theme-provider.tsx # Theme context provider
│   └── theme-toggle.tsx   # Dark/light mode toggle
└── lib/
    └── utils.ts           # Utility functions
```

## 🛠 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod validation
- **Theme**: next-themes for dark/light mode
- **Real-time**: Socket.io (client)

## 🔧 Setup & Development

### Prerequisites
- Node.js 
- npm/yarn/pnpm

### Installation
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables
Create a `.env.local` file:
```bash
# Port configuration
PORT=3001

# Auth configuration (when implementing)
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3001

# Google OAuth (when implementing)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 🎯 Key Features Implemented

### Responsive Design
- Mobile-first approach
- Fluid layouts that adapt to any screen size
- Touch-friendly interface elements
- Optimized for both desktop and mobile usage

### Accessibility
- ARIA labels and semantic HTML
- Keyboard navigation support
- High contrast color ratios
- Screen reader compatible
- Focus management for modals and forms

### Performance
- Next.js App Router for optimal loading
- Image optimization
- Code splitting and lazy loading
- Efficient re-renders with proper React patterns

### User Experience
- Smooth page transitions
- Loading states and skeleton screens
- Error boundaries and fallbacks
- Intuitive navigation patterns
- Visual feedback for user actions

## 🔮 Future Enhancements

### Planned Features
- Real-time notifications
- File upload support for questions
- Advanced moderation tools
- Analytics dashboard
- Multi-language support
- PWA capabilities

### Integration Points
- Socket.io for real-time communication
- REST API for authentication
- GraphQL for data fetching
- Redis for session management
- Database integration for persistence

## 📝 Development Guidelines

### Code Style
- TypeScript strict mode enabled
- ESLint and Prettier for consistency
- Component composition over inheritance
- Custom hooks for shared logic
- Proper error handling and loading states

### Component Architecture
- Atomic design principles
- Reusable, composable components
- Props interfaces for type safety
- Consistent naming conventions
- Separation of concerns

### State Management
- React hooks for local state
- Context for global state when needed
- Server state with proper caching
- Optimistic updates for better UX

This frontend provides a solid foundation for the LiveQnA platform with modern React practices, excellent UX/UI design, and scalable architecture ready for backend integration.
