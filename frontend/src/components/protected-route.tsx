"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingState } from "@/components/ui/loading";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: string;
}

export function ProtectedRoute({ children, fallback = "/auth/signin" }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(fallback);
    }
  }, [isAuthenticated, isLoading, router, fallback]);

  if (isLoading) {
    return <LoadingState message="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
