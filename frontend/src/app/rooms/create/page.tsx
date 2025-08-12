"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Users, MessageSquare, Settings, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ProtectedRoute } from "@/components/protected-route";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import Link from "next/link";
import { createRoom } from "@/lib/api/room";

const createRoomSchema = z.object({
  title: z.string().min(3, "Room title must be at least 3 characters").max(100, "Title too long"),
  description: z.string().optional(),
});

type CreateRoomForm = z.infer<typeof createRoomSchema>;

export default function CreateRoomPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<CreateRoomForm>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const onSubmit = async (data: CreateRoomForm) => {
    setIsLoading(true);
    try {
      console.log("Creating room:", data);
      
      // Call the backend API
      const room = await createRoom({
        title: data.title,
        description: data.description || undefined,
      });
      
      toast.success(`Room "${room.title}" created successfully!`);
      toast.info(`Room code: ${room.code}`, { duration: 5000 });
      
      // Redirect to the room page
      router.push(`/rooms/${room.code}`);
    } catch (error) {
      console.error('Create room error:', error);
      toast.error("Failed to create room. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Create New Room</h1>
            <p className="text-muted-foreground text-lg">
              Start a new Q&A session and get your unique shareable link
            </p>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Room Details
                </CardTitle>
                <CardDescription>
                  Provide information about your Q&A session to help participants understand the topic
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Room Title</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g., Weekly Team Q&A, Product Launch Discussion"
                              className="h-12"
                            />
                          </FormControl>
                          <FormDescription>
                            Choose a clear, descriptive title for your Q&A session
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Describe what this Q&A session is about, what topics will be covered, and any guidelines for participants..."
                              className="min-h-[120px] resize-none"
                            />
                          </FormControl>
                          <FormDescription>
                            Help participants understand the purpose and scope of this session
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Session Settings
                      </h3>
                      
                      <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                        <div className="flex items-start gap-3">
                          <Users className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium">Participant Access</p>
                            <p className="text-sm text-muted-foreground">
                              Anyone with the room link can join, but they must sign in first
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <LinkIcon className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium">Shareable Link</p>
                            <p className="text-sm text-muted-foreground">
                              You'll get a unique link to share with participants after creating the room
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <p className="font-medium">Real-time Q&A</p>
                            <p className="text-sm text-muted-foreground">
                              Participants can ask questions and vote on important ones
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                          Creating Room...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Create Room & Get Link
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
