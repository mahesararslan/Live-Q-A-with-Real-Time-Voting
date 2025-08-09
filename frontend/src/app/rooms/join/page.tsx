"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function JoinRoomPage() {
  const [roomCode, setRoomCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) return;

    setIsLoading(true);
    
    // For now, just redirect to the room page
    // In a real implementation, you'd validate the room code first
    router.push(`/rooms/${roomCode.trim()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50">
      <div className="container mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-md mx-auto"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Join a Room</h1>
            <p className="text-muted-foreground">
              Enter the room code to join an active Q&A session
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Room Code</CardTitle>
              <CardDescription>
                Enter the unique room code shared by the session host
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinRoom} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="roomCode">Room Code</Label>
                  <Input
                    id="roomCode"
                    type="text"
                    placeholder="e.g., ABC123"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="text-center text-lg font-mono"
                    maxLength={10}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={!roomCode.trim() || isLoading}
                >
                  {isLoading ? "Joining..." : "Join Room"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground mb-2">
              Don't have a room code?
            </p>
            <Button variant="outline" asChild>
              <a href="/rooms/create">Create New Room</a>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
