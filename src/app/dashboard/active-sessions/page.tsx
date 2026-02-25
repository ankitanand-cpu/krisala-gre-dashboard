import { Suspense } from "react";
import { fetchActiveSessions } from "@/lib/activeSessions";
import ActiveSessionsClient from "./ActiveSessionsClient";
import LoadingSpinner from "@/components/LoadingSpinner";

export default async function ActiveSessionsPage() {
  // Fetch data on the server side
  const initialSessions = await fetchActiveSessions();

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading Active Sessions..." />
      </div>
    }>
      <ActiveSessionsClient initialSessions={initialSessions} />
    </Suspense>
  );
}