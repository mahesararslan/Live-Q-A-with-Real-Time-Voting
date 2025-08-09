"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md mx-auto"
      >
        <Card className="border-0 shadow-2xl">
          <CardContent className="p-8 md:p-12">
            {/* 404 Illustration */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-8"
            >
              <div className="text-9xl font-bold text-primary/20 mb-4">404</div>
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Search className="w-12 h-12 text-primary/60" />
              </div>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                Oops! The page you're looking for doesn't exist. It might have been moved, 
                deleted, or you entered the wrong URL.
              </p>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <Button asChild size="lg" className="flex items-center gap-2">
                <Link href="/">
                  <Home className="h-4 w-4" />
                  Go Home
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="flex items-center gap-2">
                <Link href="/rooms">
                  <ArrowLeft className="h-4 w-4" />
                  Browse Rooms
                </Link>
              </Button>
            </motion.div>

            {/* Help Text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-8 pt-6 border-t border-border"
            >
              <p className="text-sm text-muted-foreground">
                Need help? <Link href="/about" className="text-primary hover:underline">Contact us</Link> or 
                go back to the <Link href="/" className="text-primary hover:underline">homepage</Link>.
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
