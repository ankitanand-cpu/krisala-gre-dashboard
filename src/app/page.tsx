"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;
    router.replace(token ? "/dashboard" : "/login");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="md" text="Redirecting..." />
    </div>
  );
}
