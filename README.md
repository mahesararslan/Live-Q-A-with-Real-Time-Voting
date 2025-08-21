# 🗳️ Live Voting Q&A Chat Platform

A real-time Q&A platform with live voting to ensure the most important questions get noticed and answered during live events.

## ❓ Problem Statement

During live webinars, classrooms, or interactive sessions, important questions often get lost in the flood of chat messages. This makes it difficult for speakers and moderators to identify and address the most valuable queries in real time.

## 🎯 How It Solves The Problem

- **Live Voting**: Attendees can upvote questions they find most relevant
- **Real-time Updates**: Questions and votes are synchronized instantly across all participants
- **Admin Controls**: Moderators can mark questions as answered and manage sessions
- **Top-voted Questions**: The most important questions bubble to the top automatically
- **Scalable Architecture**: Built with Redis Pub/Sub to handle large audiences

## 🛠️ Tech Stack

### Backend
- **NestJS** - Scalable Node.js framework
- **GraphQL** - Flexible API query language
- **Socket.IO** - Real-time WebSocket communication
- **Redis** - Pub/Sub for horizontal scaling
- **PostgreSQL** - Database with TypeORM
- **JWT** - Authentication

### Frontend
- **Next.js** - React framework
- **TailwindCSS** - Utility-first CSS
- **Framer Motion** - Smooth animations
- **Socket.IO Client** - Real-time updates

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Redis (local or cloud)
- Google OAuth credentials

### Option 1: Run with Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/mahesararslan/Live-Q-A-with-Real-Time-Voting.git
   cd Live-Q-A-with-Real-Time-Voting
   ```

2. **Set up environment variables**
   ```bash
   # Copy and fill backend environment
   cp backend/.env.example backend/.env
   
   # Copy and fill frontend environment  
   cp frontend/.env.example frontend/.env.local
   ```

3. **Run with Docker**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3001
   - Backend: http://localhost:3000
   - GraphQL: http://localhost:3000/graphql

### Option 2: Run Locally

1. **Clone and setup environment**
   ```bash
   git clone https://github.com/mahesararslan/Live-Q-A-with-Real-Time-Voting.git
   cd Live-Q-A-with-Real-Time-Voting
   
   # Setup backend environment
   cp backend/.env.example backend/.env
   # Edit backend/.env with your database and OAuth credentials
   
   # Setup frontend environment  
   cp frontend/.env.example frontend/.env.local
   ```

2. **Start PostgreSQL and Redis**
   ```bash
   # Using Docker for databases only
   docker run -d --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:15
   docker run -d --name redis -p 6379:6379 redis:7
   ```

3. **Run Backend**
   ```bash
   cd backend
   npm install
   npm run start:dev
   ```

4. **Run Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3001
   - Backend: http://localhost:3000

## 🔧 Configuration

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
6. Copy Client ID and Secret to your `.env` file

### Redis Cloud (Optional)
If using Redis Cloud instead of local Redis:
1. Get your Redis Cloud connection URL
2. Add `REDIS_URL=your-redis-url` to backend/.env

## 📱 Features

- ✅ Real-time Q&A sessions
- ✅ Live voting on questions
- ✅ Admin session management
- ✅ Participant tracking
- ✅ Horizontal scaling with Redis
- ✅ Responsive design
- ✅ Google OAuth authentication

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

Built with ❤️ by [Arslan Mahesar](https://github.com/mahesararslan)
