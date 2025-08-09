"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  ThumbsUp, 
  Users, 
  Settings, 
  Share2, 
  SortAsc, 
  SortDesc,
  Clock,
  Crown,
  MessageSquare
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProtectedRoute } from "@/components/protected-route";

// Mock data for demonstration
const mockRoom = {
  id: "room-123",
  title: "Weekly Team Standup Q&A",
  description: "Ask questions about project updates and sprint planning",
  admin: { name: "John Doe", avatar: "/avatars/john.jpg", id: "user-1" },
  participants: 12,
  status: "active",
  createdAt: "2024-01-15T10:00:00Z"
};

const currentUser = { id: "user-1", name: "John Doe", avatar: "/avatars/current.jpg" }; // This should come from auth context

const mockQuestions = [
  {
    id: "q1",
    text: "What's the timeline for the new feature rollout?",
    author: { name: "Alice Johnson", avatar: "/avatars/alice.jpg", id: "user-2" },
    votes: 8,
    timestamp: "2024-01-15T10:05:00Z",
    hasVoted: false,
    isAnswered: false
  },
  {
    id: "q2", 
    text: "Are we planning to refactor the authentication system this quarter?",
    author: { name: "Bob Smith", avatar: "/avatars/bob.jpg", id: "user-3" },
    votes: 12,
    timestamp: "2024-01-15T10:03:00Z",
    hasVoted: true,
    isAnswered: true
  },
  {
    id: "q3",
    text: "What are the performance benchmarks we're aiming for?",
    author: { name: "Carol Williams", avatar: "/avatars/carol.jpg", id: "user-4" },
    votes: 5,
    timestamp: "2024-01-15T10:07:00Z",
    hasVoted: false,
    isAnswered: false
  }
];

export default function RoomPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const [questions, setQuestions] = useState(mockQuestions);
  const [newQuestion, setNewQuestion] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "votes">("votes");
  const [isLoading, setIsLoading] = useState(false);
  const [roomStatus, setRoomStatus] = useState<"active" | "ended">(mockRoom.status as "active");
  const [roomId, setRoomId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Resolve params for Next.js 15
  useEffect(() => {
    params.then((resolvedParams) => {
      setRoomId(resolvedParams.id);
    });
  }, [params]);

  // Check if current user is the room creator/admin
  const isRoomCreator = currentUser.id === mockRoom.admin.id;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [questions]);

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || isLoading) return;

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const question = {
        id: `q${Date.now()}`,
        text: newQuestion,
        author: currentUser,
        votes: 0,
        timestamp: new Date().toISOString(),
        hasVoted: false,
        isAnswered: false
      };
      
      setQuestions(prev => [...prev, question]);
      setNewQuestion("");
      setIsLoading(false);
    }, 500);
  };

  const handleVote = (questionId: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id === questionId) {
        return {
          ...q,
          votes: q.hasVoted ? q.votes - 1 : q.votes + 1,
          hasVoted: !q.hasVoted
        };
      }
      return q;
    }));
  };

  const handleEndSession = async () => {
    if (!isRoomCreator) return;
    
    setIsLoading(true);
    try {
      // TODO: Call API to end session and delete all messages
    //   console.log("Ending session for room:", params.id);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setRoomStatus("ended");
      setQuestions([]); // Clear all questions
      
      // TODO: Redirect to rooms page or show ended state
    } catch (error) {
      console.error('Failed to end session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sortedQuestions = [...questions].sort((a, b) => {
    if (sortBy === "votes") {
      return b.votes - a.votes;
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Room Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="border-0 shadow-lg mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className="bg-green-500 hover:bg-green-600">Live</Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{mockRoom.participants} participants</span>
                    </div>
                  </div>
                  <CardTitle className="text-2xl mb-2">{mockRoom.title}</CardTitle>
                  <CardDescription className="text-base">
                    {mockRoom.description}
                  </CardDescription>
                  <div className="flex items-center gap-2 mt-3">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={mockRoom.admin.avatar} />
                      <AvatarFallback>{mockRoom.admin.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">
                      Hosted by {mockRoom.admin.name}
                    </span>
                    <Crown className="h-4 w-4 text-yellow-500" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  {isRoomCreator && roomStatus === "active" && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleEndSession}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <Settings className="h-4 w-4 mr-2" />
                      )}
                      End Session
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6"
        >
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Sort by:</span>
                  <div className="flex gap-2">
                    <Button
                      variant={sortBy === "votes" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortBy("votes")}
                      className="flex items-center gap-2"
                    >
                      <SortDesc className="h-4 w-4" />
                      Most Voted
                    </Button>
                    <Button
                      variant={sortBy === "newest" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortBy("newest")}
                      className="flex items-center gap-2"
                    >
                      <Clock className="h-4 w-4" />
                      Newest
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {questions.length} questions
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Questions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-4 mb-6"
        >
          <AnimatePresence>
            {sortedQuestions.map((question, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
                  question.isAnswered ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center gap-2">
                        <Button
                          variant={question.hasVoted ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleVote(question.id)}
                          className="flex flex-col h-auto py-2 px-3 min-w-[50px]"
                        >
                          <ThumbsUp className="h-4 w-4 mb-1" />
                          <span className="text-xs font-bold">{question.votes}</span>
                        </Button>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={question.author.avatar} />
                              <AvatarFallback>{question.author.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{question.author.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(question.timestamp)}
                            </span>
                          </div>
                          {question.isAnswered && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Answered
                            </Badge>
                          )}
                        </div>
                        <p className="text-base leading-relaxed">{question.text}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </motion.div>

        {/* New Question Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="sticky bottom-4"
        >
          <Card className="border-0 shadow-xl">
            <CardContent className="p-4">
              <form onSubmit={handleSubmitQuestion} className="flex gap-3">
                <div className="flex-1">
                  <Input
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Ask a question..."
                    className="h-12 text-base"
                    disabled={isLoading}
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={!newQuestion.trim() || isLoading}
                  className="px-6"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      </div>
    </ProtectedRoute>
  );
}
