"use client";

import { motion } from "framer-motion";
import { MessageSquare, Users, Vote, Shield, Zap, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: MessageSquare,
    title: "Real-Time Q&A",
    description: "Ask questions and see responses instantly with our live chat interface.",
  },
  {
    icon: Vote,
    title: "Smart Voting",
    description: "Upvote the most important questions to help prioritize what gets answered.",
  },
  {
    icon: Users,
    title: "Collaborative Sessions",
    description: "Join rooms with others and participate in interactive Q&A sessions.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Only authenticated users can join sessions, ensuring quality discussions.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Built with modern tech stack for optimal performance and reliability.",
  },
  {
    icon: Target,
    title: "Focused Discussions",
    description: "Keep valuable questions from getting lost in the chat stream.",
  },
];

const techStack = [
  "Next.js", "TypeScript", "Tailwind CSS", "NestJS", "GraphQL", 
  "Socket.io", "Redis", "PostgreSQL", "JWT Auth"
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            About LiveQnA
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            A modern, real-time interactive Q&A platform designed to transform how audiences 
            engage during live events, presentations, and collaborative sessions.
          </p>
        </motion.div>

        {/* Mission Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-20"
        >
          <Card className="border-0 shadow-xl bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="p-8 md:p-12">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-4xl mx-auto">
                  We believe that every question matters. LiveQnA was created to solve the common problem 
                  of valuable questions getting lost in fast-moving chat streams during live events. 
                  By implementing a democratic voting system, we ensure that the most important questions 
                  rise to the top, creating more meaningful and productive Q&A sessions.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <feature.icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tech Stack Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-20"
        >
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl mb-4">Built with Modern Technology</CardTitle>
              <CardDescription className="text-lg max-w-2xl mx-auto">
                LiveQnA is built using cutting-edge technologies to ensure scalability, 
                performance, and an exceptional user experience.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 justify-center">
                {techStack.map((tech, index) => (
                  <motion.div
                    key={tech}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 * index }}
                  >
                    <Badge 
                      variant="secondary" 
                      className="px-4 py-2 text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors cursor-default"
                    >
                      {tech}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Vision Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center"
        >
          <Card className="border-0 shadow-xl bg-gradient-to-r from-muted/50 to-muted/30">
            <CardContent className="p-8 md:p-12">
              <h2 className="text-3xl font-bold mb-6">Our Vision</h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-4xl mx-auto mb-8">
                We envision a future where every voice is heard and every question has the opportunity 
                to be addressed. LiveQnA aims to democratize the Q&A process, making live events more 
                interactive, inclusive, and productive for everyone involved.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Badge variant="outline" className="px-4 py-2">
                  Democratic Participation
                </Badge>
                <Badge variant="outline" className="px-4 py-2">
                  Enhanced Engagement
                </Badge>
                <Badge variant="outline" className="px-4 py-2">
                  Quality Discussions
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
