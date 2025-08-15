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
  MoreVertical,
  ChevronDown
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoadingState } from "@/components/ui/loading";
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
  const [optimisticVotes, setOptimisticVotes] = useState<Record<string, boolean>>({});
  const [participantCount, setParticipantCount] = useState(0);
  
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const hasJoinedRoom = useRef<boolean>(false);

  // Memoize the socket event handlers to prevent infinite re-renders
  const handleNewMessage = useCallback((newQuestion: Question) => {
    console.log('Received new question via socket:', newQuestion);
    setQuestions(prev => [newQuestion, ...prev]);
    toast.success(`New question from ${newQuestion.user?.firstName || 'Unknown'}`);
    
    // Scroll to top for new messages (newest first)
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = 0;
    }
  }, []);

  const handleUserJoined = useCallback((data: any) => {
    console.log('User joined room:', data);
    toast.info(`${data.user.firstName} joined the room`);
    
    // Update participant count from WebSocket data
    if (data.participantCount !== undefined) {
      setParticipantCount(data.participantCount);
    }
  }, []);

  const handleUserLeft = useCallback((data: any) => {
    console.log('User left room:', data);
    toast.info(`${data.user.firstName} left the room`);
    
    // Update participant count from WebSocket data
    if (data.participantCount !== undefined) {
      setParticipantCount(data.participantCount);
    }
  }, []);

  const handleJoinRoomSuccess = useCallback((data: any) => {
    console.log('Successfully joined room:', data);
    toast.success('Connected to room!');
  }, []);

  const handleJoinRoomError = useCallback((data: any) => {
    console.error('Failed to join room:', data);
    toast.error(data.message || 'Failed to join room');
  }, []);

  const handleVoteUpdated = useCallback((data: {
    questionId: number;
    userId: number;
    voteCount: number;
    hasVoted: boolean;
    action: 'added' | 'removed';
  }) => {
    console.log('Vote updated:', data);
    
    // Clear optimistic vote for this question
    setOptimisticVotes(prev => {
      const newState = { ...prev };
      delete newState[data.questionId];
      return newState;
    });
    
    // Update the question's vote count and user's vote status
    setQuestions(prev => prev.map(q => {
      if (q.id === data.questionId) {
        // Update hasVoted only for the current user
        const isCurrentUser = user && user.id === data.userId;
        return {
          ...q,
          voteCount: data.voteCount,
          hasVoted: isCurrentUser ? data.hasVoted : q.hasVoted
        };
      }
      return q;
    }));
    
    // Show feedback message only for the current user
    if (user && user.id === data.userId) {
      toast.success(data.action === 'added' ? 'Vote added!' : 'Vote removed!');
    }
  }, [user]);

  const handleSessionEnded = useCallback((data: {
    roomCode: string;
    endedBy: { firstName: string; lastName: string };
    message: string;
  }) => {
    console.log('Session ended:', data);
    toast.error(`Session ended: ${data.message}`);
    // Redirect to home page after a short delay
    setTimeout(() => {
      router.push('/');
    }, 2000);
  }, [router]);

  const handleSessionEndError = useCallback((data: { error: string; details?: string }) => {
    console.error('Session end error:', data);
    toast.error(data.details || data.error || 'Failed to end session');
  }, []);

  const handleQuestionAnswered = useCallback((data: {
    questionId: number;
    isAnswered: boolean;
    question: any;
  }) => {
    console.log('Question answered:', data);
    
    // Update the question's answered status in real-time
    setQuestions(prev => prev.map(q => 
      q.id === data.questionId ? { ...q, isAnswered: data.isAnswered } : q
    ));
    
    toast.info(`Question marked as answered!`);
  }, []);

  const handleMarkAsAnsweredError = useCallback((data: { error: string; details?: string }) => {
    console.error('Mark as answered error:', data);
    toast.error(data.details || data.error || 'Failed to mark question as answered');
  }, []);

  // Socket integration with room management
  const { 
    isConnected, 
    connectionError, 
    currentRoom,
    joinRoom: socketJoinRoom,
    leaveRoom: socketLeaveRoom,
    sendMessage: socketSendMessage,
    sendVote: socketSendVote,
    sendMarkAsAnswered: socketSendMarkAsAnswered,
    endSession: socketEndSession,
    userLeaveRoom: socketUserLeaveRoom
  } = useSocket({
    autoConnect: true,
    onNewMessage: handleNewMessage,
    onUserJoined: handleUserJoined,
    onUserLeft: handleUserLeft,
    onJoinRoomSuccess: handleJoinRoomSuccess,
    onJoinRoomError: handleJoinRoomError,
    onVoteUpdated: handleVoteUpdated,
    onSessionEnded: handleSessionEnded,
    onSessionEndError: handleSessionEndError,
    onQuestionAnswered: handleQuestionAnswered,
    onMarkAsAnsweredError: handleMarkAsAnsweredError
  });

  // Resolve params for Next.js 15
  useEffect(() => {
    params.then((resolvedParams) => {
      setRoomCode(resolvedParams.id);
      hasJoinedRoom.current = false; // Reset join status when room changes
    });
  }, [params]);

  // Load room data when room code is available
  useEffect(() => {
    if (roomCode && user) {
      loadRoomData();
    }
  }, [roomCode, user]);

  // Join WebSocket room when socket connects and room/user are available
  useEffect(() => {
    if (isConnected && roomCode && user && room && !hasJoinedRoom.current) {
      console.log('Socket connected, joining WebSocket room:', roomCode);
      socketJoinRoom(roomCode, user.id);
      hasJoinedRoom.current = true;
    }
  }, [isConnected, roomCode, user, room, currentRoom]);

  // Reset join status when socket disconnects
  useEffect(() => {
    if (!isConnected) {
      hasJoinedRoom.current = false;
    }
  }, [isConnected]);

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
      
      // Set initial participant count
      setParticipantCount(roomData.participants?.length || 0);
      
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
      // router.push('/rooms/join');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions
  const isRoomCreator = user && room && room.admin.id === user.id;

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || isSubmitting || !room || !user) return;

    setIsSubmitting(true);
    try {
      // Send message via WebSocket (which will create the question and broadcast it)
      socketSendMessage(newQuestion, roomCode, user.id);
      
      // Clear the input immediately for better UX
      setNewQuestion("");
      toast.success("Question sent!");
      
    } catch (error) {
      console.error('Error submitting question:', error);
      toast.error("Failed to submit question");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (questionId: number) => {
    if (!user || !room) {
      toast.error("Authentication required to vote");
      return;
    }

    try {
      // Optimistic update - immediately update UI
      const wasVoted = optimisticVotes[questionId] ?? 
        questions.find(q => q.id === questionId)?.hasVoted ?? false;
      
      // Set optimistic vote state
      setOptimisticVotes(prev => ({
        ...prev,
        [questionId]: !wasVoted
      }));

      // Optimistically update question vote count in UI
      setQuestions(prev => prev.map(q => {
        if (q.id === questionId) {
          return {
            ...q,
            hasVoted: !wasVoted,
            voteCount: wasVoted ? q.voteCount - 1 : q.voteCount + 1
          };
        }
        return q;
      }));

      // Send vote via WebSocket
      socketSendVote(questionId, room.code, user.id);
      
      // The optimistic update will be corrected when we receive the voteUpdated event
      
    } catch (error) {
      console.error('Error voting:', error);
      toast.error("Failed to vote");
      
      // Revert optimistic update on error
      setOptimisticVotes(prev => {
        const newState = { ...prev };
        delete newState[questionId];
        return newState;
      });
      
      // Revert question state
      setQuestions(prev => prev.map(q => {
        if (q.id === questionId) {
          const originalVoted = q.hasVoted;
          return {
            ...q,
            hasVoted: originalVoted,
            voteCount: originalVoted ? q.voteCount + 1 : q.voteCount - 1
          };
        }
        return q;
      }));
    }
  };

  const handleEndSession = async () => {
    if (!isRoomCreator || !room || !user) return;
    
    try {
      // Send end session via WebSocket
      socketEndSession(room.code, user.id);
      toast.info("Ending session...");
      
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error("Failed to end session");
    }
  };

  const handleLeaveChat = async () => {
    if (!room || !user) return;
    
    try {
      // Send leave room via WebSocket
      socketUserLeaveRoom(room.code, user.id);
      toast.info("Leaving chat...");
      
      // Redirect to home page
      router.push('/');
      
    } catch (error) {
      console.error('Error leaving chat:', error);
      toast.error("Failed to leave chat");
      // Still redirect even if WebSocket fails
      router.push('/');
    }
  };

  const handleMarkAsAnswered = async (questionId: number) => {
    if (!isRoomCreator || !room || !user) return;

    try {
      // Optimistically update the UI
      setQuestions(prev => prev.map(q => 
        q.id === questionId ? { ...q, isAnswered: true } : q
      ));

      // Send mark as answered via WebSocket
      socketSendMarkAsAnswered(questionId, room.code, user.id);
      toast.success("Question marked as answered!");
      
    } catch (error) {
      console.error('Error marking question as answered:', error);
      toast.error("Failed to mark as answered");
      
      // Revert the optimistic update
      setQuestions(prev => prev.map(q => 
        q.id === questionId ? { ...q, isAnswered: false } : q
      ));
    }
  };

  const handleShareRoom = async () => {
    // const shareUrl = `${window.location.origin}/rooms/join?code=${roomCode}`;
    const shareUrl = roomCode;
    
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
      <ProtectedRoute>
          <LoadingState message="Loading room..." />
      </ProtectedRoute>
    );
  }

  // Room not found or error state
  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Room Not Found</h2>
          <p className="text-gray-400 mb-6">The room you're looking for doesn't exist or has ended.</p>
          <Button onClick={() => router.push('/rooms/join')} >
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
          {/* Room Header - Compact Version */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={room.admin.avatarUrl || ""} />
                      <AvatarFallback>{room.admin.firstName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="font-semibold text-lg">{room.title}</h2>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{participantCount} participants</span>
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                      </div>
                    </div>
                  </div>
                  
                  {/* Desktop Action Buttons */}
                  <div className="hidden sm:flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleShareRoom}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    {isRoomCreator ? (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={handleEndSession}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        End Session
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleLeaveChat}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Leave Chat
                      </Button>
                    )}
                  </div>

                  {/* Mobile Dropdown Menu */}
                  <div className="sm:hidden">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleShareRoom}>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        {isRoomCreator ? (
                          <DropdownMenuItem onClick={handleEndSession} className="text-red-600">
                            <Settings className="h-4 w-4 mr-2" />
                            End Session
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={handleLeaveChat} className="text-red-600">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Leave Chat
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Chat Messages - Redesigned */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-4"
          >
            <Card className="border-0 shadow-lg h-[60vh] flex flex-col">
              <CardHeader className="py-3 px-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span className="font-medium">Live Q&A</span>
                    <Badge variant="secondary">{questions.length}</Badge>
                  </div>
                  
                  {/* Desktop Sort Buttons */}
                  <div className="hidden sm:flex gap-1">
                    <Button
                      variant={sortBy === "newest" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSortBy("newest")}
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      Latest
                    </Button>
                    <Button
                      variant={sortBy === "votes" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSortBy("votes")}
                    >
                      <ThumbsUp className="h-3 w-3 mr-1" />
                      Top Voted
                    </Button>
                  </div>

                  {/* Mobile Sort Dropdown */}
                  <div className="sm:hidden">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          {sortBy === "newest" ? (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              Latest
                            </>
                          ) : (
                            <>
                              <ThumbsUp className="h-3 w-3 mr-1" />
                              Top Voted
                            </>
                          )}
                          <ChevronDown className="h-3 w-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => setSortBy("newest")}
                          className={sortBy === "newest" ? "bg-accent" : ""}
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Latest
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setSortBy("votes")}
                          className={sortBy === "votes" ? "bg-accent" : ""}
                        >
                          <ThumbsUp className="h-4 w-4 mr-2" />
                          Top Voted
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 p-0 overflow-hidden">
                <div ref={messagesContainerRef} className="h-full overflow-y-auto p-4 space-y-3">
                  <AnimatePresence>
                    {sortedQuestions.map((question, index) => (
                      <motion.div
                        key={question.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`flex gap-3 p-3 rounded-lg transition-colors hover:bg-muted/50 ${
                          question.isAnswered ? 'bg-green-50 dark:bg-green-950/20' : ''
                        }`}
                      >
                        {/* Avatar */}
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={question.user.avatarUrl || ""} />
                          <AvatarFallback className="text-xs">{question.user.firstName[0]}</AvatarFallback>
                        </Avatar>
                        
                        {/* Message Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate">
                              {question.user.firstName} {question.user.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {formatTimeAgo(question.createdAt)}
                            </span>
                            {question.isAnswered && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                                Answered
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm leading-relaxed break-words">{question.content}</p>
                        </div>
                        
                        {/* Vote Button and Admin Menu */}
                        <div className="flex-shrink-0 flex items-center gap-2">
                          <Button
                            variant={
                              optimisticVotes[question.id] !== undefined 
                                ? optimisticVotes[question.id] 
                                  ? "default" 
                                  : "ghost"
                                : question.hasVoted 
                                  ? "default" 
                                  : "ghost"
                            }
                            size="sm"
                            onClick={() => handleVote(question.id)}
                            className={`h-auto py-1 px-2 flex flex-col items-center gap-0.5 transition-all duration-200 ${
                              optimisticVotes[question.id] !== undefined 
                                ? 'scale-105 shadow-md' 
                                : 'hover:scale-105'
                            }`}
                          >
                            <ThumbsUp className={`h-3 w-3 transition-colors duration-200 ${
                              optimisticVotes[question.id] !== undefined 
                                ? optimisticVotes[question.id]
                                  ? 'text-primary-foreground' 
                                  : 'text-muted-foreground'
                                : question.hasVoted 
                                  ? 'text-primary-foreground' 
                                  : 'text-muted-foreground'
                            }`} />
                            <span className="text-xs font-medium">{question.voteCount}</span>
                          </Button>
                          
                          {/* Admin Options Dropdown */}
                          {isRoomCreator && !question.isAnswered && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleMarkAsAnswered(question.id)}>
                                  <AlertCircle className="h-4 w-4 mr-2" />
                                  Mark as Answered
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {questions.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No questions yet. Be the first to ask!</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Message Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4">
                <form onSubmit={handleSubmitQuestion} className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      placeholder="Ask a question..."
                      className="h-10"
                      disabled={isSubmitting}
                    />
                  </div>
                  <Button
                    type="submit"
                    size="default"
                    disabled={!newQuestion.trim() || isSubmitting}
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
