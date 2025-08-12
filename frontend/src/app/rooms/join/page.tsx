"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { MessageSquare, ArrowRight, Users, Crown, Clock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProtectedRoute } from "@/components/protected-route";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Link from "next/link";
import { getRoomByCode, joinRoom, type Room } from "@/lib/api/room";

const joinRoomSchema = z.object({
  code: z.string().min(6, "Room code must be at least 6 characters").max(6, "Room code must be exactly 6 characters"),
});

type JoinRoomForm = z.infer<typeof joinRoomSchema>;

function JoinRoomContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [roomDetails, setRoomDetails] = useState<Room | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get('code');

  const form = useForm<JoinRoomForm>({
    resolver: zodResolver(joinRoomSchema),
    defaultValues: {
      code: codeFromUrl?.toUpperCase() || "",
    },
  });

  // Auto-validate if code comes from URL
  useEffect(() => {
    if (codeFromUrl && codeFromUrl.length === 6) {
      validateRoomCode(codeFromUrl);
    }
  }, [codeFromUrl]);

  const validateRoomCode = async (code: string) => {
    setIsValidating(true);
    try {
      const room = await getRoomByCode(code.toUpperCase());
      
      if (!room) {
        toast.error("Room not found. Please check the code and try again.");
        setRoomDetails(null);
        return;
      }

      if (!room.isActive || room.isEnded) {
        toast.error("This room is no longer active.");
        setRoomDetails(null);
        return;
      }

      setRoomDetails(room);
      toast.success("Room found! You can now join the session.");
    } catch (error) {
      console.error('Room validation error:', error);
      toast.error("Failed to validate room code. Please try again.");
      setRoomDetails(null);
    } finally {
      setIsValidating(false);
    }
  };

  const onSubmit = async (data: JoinRoomForm) => {
    if (!roomDetails) {
      await validateRoomCode(data.code);
      return;
    }

    setIsLoading(true);
    try {
      // Join the room via API
      await joinRoom(roomDetails.code);
      
      toast.success(`Successfully joined "${roomDetails.title}"!`);
      
      // Redirect to the room page
      router.push(`/rooms/${roomDetails.code}`);
    } catch (error) {
      console.error('Join room error:', error);
      toast.error("Failed to join room. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
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
                  Enter the 6-character room code shared by the session admin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Room Code</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="ABC123"
                              className="h-12 text-center text-lg font-mono tracking-wider uppercase"
                              maxLength={6}
                              onChange={(e) => {
                                const value = e.target.value.toUpperCase();
                                field.onChange(value);
                                if (value.length === 6) {
                                  validateRoomCode(value);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {roomDetails && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                              {roomDetails.title}
                            </h3>
                            {roomDetails.description && (
                              <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                                {roomDetails.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-green-600 dark:text-green-400">
                              <span className="flex items-center gap-1">
                                <Crown className="h-3 w-3" />
                                Admin: {roomDetails.admin.firstName} {roomDetails.admin.lastName}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {roomDetails.participants?.length || 0} participants
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Active
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base" 
                      disabled={isLoading || isValidating || !roomDetails}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                          Joining Room...
                        </>
                      ) : isValidating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                          Validating Code...
                        </>
                      ) : roomDetails ? (
                        <>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Join "{roomDetails.title}"
                        </>
                      ) : (
                        <>
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Validate Room Code
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground mb-2">
                Don't have a room code?
              </p>
              <Button variant="outline" asChild>
                <Link href="/rooms/create">Create New Room</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

// Loading component for Suspense fallback
function JoinRoomLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

// Main page component with Suspense wrapper
export default function JoinRoomPage() {
  return (
    <Suspense fallback={<JoinRoomLoading />}>
      <JoinRoomContent />
    </Suspense>
  );
}
