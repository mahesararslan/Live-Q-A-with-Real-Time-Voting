"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
  MessageSquare,
  Copy,
  ExternalLink,
  AlertCircle,
  Loader2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/contexts/auth-context";
import { getRoomByCode, joinRoom, leaveRoom, type Room } from "@/lib/api/room";
import { questionApi, type Question, type CreateQuestionInput } from "@/lib/api/question";
import { useSocket } from "@/hooks/useSocket";

export default function RoomPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { user } = useAuth();
  const router = useRouter();
  
  // State management
  const [room, setRoom] = useState<Room | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "votes">("votes");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roomCode, setRoomCode] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Memoize the new message handler to prevent infinite re-renders
  const handleNewMessage = useCallback((newQuestion: Question) => {
    console.log('Received new question via socket:', newQuestion);
    setQuestions(prev => [newQuestion, ...prev]);
    toast.success(`New question from ${newQuestion.user.firstName}!`);
  }, []);

  // Socket integration
  const { isConnected, connectionError } = useSocket({
    autoConnect: true,
    onNewMessage: handleNewMessage
  });

  // Resolve params for Next.js 15
  useEffect(() => {
    params.then((resolvedParams) => {
      setRoomCode(resolvedParams.id);
    });
  }, [params]);

  // Load room data when room code is available
  useEffect(() => {
    if (roomCode && user) {
      loadRoomData();
    }
  }, [roomCode, user]);

  const loadRoomData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch room data
      const roomData = await getRoomByCode(roomCode);
      
      if (!roomData) {
        toast.error("Room not found");
        router.push('/rooms/join');
        return;
      }

      if (!roomData.isActive || roomData.isEnded) {
        toast.error("This room is no longer active");
        router.push('/rooms/join');
        return;
      }

      setRoom(roomData);
      
      // Check if user is already a participant
      const isParticipant = roomData.participants?.some(p => p.id === user?.id);
      
      if (!isParticipant) {
        // Auto-join the room if not already a participant
        await joinRoom(roomCode);
        // Reload room data to get updated participant list
        const updatedRoom = await getRoomByCode(roomCode);
        setRoom(updatedRoom);
      }
      
      // Load existing questions for the room
      try {
        const roomQuestions = await questionApi.getQuestionsByRoom(roomData.id);
        setQuestions(roomQuestions);
      } catch (questionError) {
        console.error('Error loading questions:', questionError);
        // Continue without questions if they fail to load
      }
      
      toast.success(`Welcome to "${roomData.title}"!`);
      
    } catch (error) {
      console.error('Error loading room:', error);
      toast.error("Failed to load room data");
      router.push('/rooms/join');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions
  const isRoomCreator = user && room && room.admin.id === user.id;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [questions]);

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || isSubmitting || !room || !user) return;

    setIsSubmitting(true);
    try {
      // Create question using GraphQL mutation
      const createQuestionInput: CreateQuestionInput = {
        content: newQuestion,
        roomId: room.id,
        userId: user.id
      };

      const createdQuestion = await questionApi.createQuestion(createQuestionInput);
      
      // Add to local state optimistically (the socket will also broadcast this)
      setQuestions(prev => [createdQuestion, ...prev]);
      setNewQuestion("");
      toast.success("Question submitted successfully!");
      
    } catch (error) {
      console.error('Error submitting question:', error);
      toast.error("Failed to submit question");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (questionId: number) => {
    try {
      // TODO: Replace with actual API call for voting
      setQuestions(prev => prev.map(q => 
        q.id === questionId 
          ? { 
              ...q, 
              voteCount: q.hasVoted ? q.voteCount - 1 : q.voteCount + 1, 
              hasVoted: !q.hasVoted 
            }
          : q
      ));
      
    } catch (error) {
      console.error('Error voting:', error);
      toast.error("Failed to vote");
    }
  };

  const handleEndSession = async () => {
    if (!isRoomCreator || !room) return;
    
    try {
      // TODO: Replace with actual API call to end room
      toast.success("Session ended successfully");
      router.push('/');
      
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error("Failed to end session");
    }
  };

  const handleShareRoom = async () => {
    const shareUrl = `${window.location.origin}/rooms/join?code=${roomCode}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Room link copied to clipboard!");
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error("Failed to copy link");
    }
  };

  const sortedQuestions = [...questions].sort((a, b) => {
    if (sortBy === "votes") {
      return b.voteCount - a.voteCount;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-500" />
          <p className="text-gray-400">Loading room...</p>
        </div>
      </div>
    );
  }

  // Room not found or error state
  if (!room) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-white mb-2">Room Not Found</h2>
          <p className="text-gray-400 mb-6">The room you're looking for doesn't exist or has ended.</p>
          <Button onClick={() => router.push('/rooms/join')} className="bg-purple-600 hover:bg-purple-700">
            Join Another Room
          </Button>
        </div>
      </div>
    );
  }

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
                      <span>{room.participants?.length || 0} participants</span>
                    </div>
                    {/* Socket connection status */}
                    <div className="flex items-center gap-1 text-xs">
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-muted-foreground">
                        {isConnected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                    {connectionError && (
                      <span className="text-xs text-red-500" title={connectionError}>
                        Connection Error
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-2xl mb-2">{room.title}</CardTitle>
                  <CardDescription className="text-base">
                    {room.description}
                  </CardDescription>
                  <div className="flex items-center gap-2 mt-3">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={room.admin.avatarUrl || ""} />
                      <AvatarFallback>{room.admin.firstName[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">
                      Hosted by {room.admin.firstName} {room.admin.lastName}
                    </span>
                    <Crown className="h-4 w-4 text-yellow-500" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleShareRoom}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  {isRoomCreator && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleEndSession}
                    >
                      <Settings className="h-4 w-4 mr-2" />
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
                          <span className="text-xs font-bold">{question.voteCount}</span>
                        </Button>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={question.user.avatarUrl || ""} />
                              <AvatarFallback>{question.user.firstName[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{question.user.firstName} {question.user.lastName}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(question.createdAt)}
                            </span>
                          </div>
                          {question.isAnswered && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Answered
                            </Badge>
                          )}
                        </div>
                        <p className="text-base leading-relaxed">{question.content}</p>
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
                    disabled={isSubmitting}
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={!newQuestion.trim() || isSubmitting}
                  className="px-6"
                >
                  {isSubmitting ? (
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
