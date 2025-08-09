"use client";

import { motion } from "framer-motion";
import { ThumbsUp, MessageSquare, Clock, Crown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface QuestionCardProps {
  id: string;
  text: string;
  author: {
    name: string;
    avatar?: string;
    id: string;
  };
  votes: number;
  timestamp: string;
  hasVoted: boolean;
  isAnswered: boolean;
  isAdmin?: boolean;
  onVote: (questionId: string) => void;
  onMarkAnswered?: (questionId: string) => void;
}

export function QuestionCard({
  id,
  text,
  author,
  votes,
  timestamp,
  hasVoted,
  isAnswered,
  isAdmin = false,
  onVote,
  onMarkAnswered
}: QuestionCardProps) {
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      layout
    >
      <Card className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
        isAnswered ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : ''
      }`}>
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Vote Button */}
            <div className="flex flex-col items-center gap-2">
              <Button
                variant={hasVoted ? "default" : "outline"}
                size="sm"
                onClick={() => onVote(id)}
                className="flex flex-col h-auto py-2 px-3 min-w-[50px] hover:scale-105 transition-transform"
              >
                <ThumbsUp className={`h-4 w-4 mb-1 ${hasVoted ? 'fill-current' : ''}`} />
                <span className="text-xs font-bold">{votes}</span>
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={author.avatar} />
                    <AvatarFallback>{author.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{author.name}</span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimeAgo(timestamp)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAnswered && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Answered
                    </Badge>
                  )}
                  {isAdmin && onMarkAnswered && !isAnswered && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onMarkAnswered(id)}
                      className="text-xs h-6"
                    >
                      Mark as Answered
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-base leading-relaxed text-foreground">{text}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
