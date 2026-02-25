"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Activity,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  Search,
  UserCheck,
  Clock,
  Wifi,
  WifiOff,
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import Header from "@/components/Header";
import { useRequireAuth } from "@/contexts/UserContext";

interface ActiveSession {
  sessionId: string;
  salesPersonId: string;
  salesPersonName: string;
  customerId: string;
  customerName: string;
  projectId: string;
  isActive: boolean;
  startTime?: string;
}

interface ActiveSessionsClientProps {
  initialSessions: ActiveSession[];
}

export default function ActiveSessionsClient({
  initialSessions,
}: ActiveSessionsClientProps) {
  const { userData, isLoading, isLoaded, logout } = useRequireAuth();
  const [activeSessions, setActiveSessions] =
    useState<ActiveSession[]>(initialSessions);
  const [filteredSessions, setFilteredSessions] =
    useState<ActiveSession[]>(initialSessions);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [nextRefresh, setNextRefresh] = useState<number>(30);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] =
    useState<boolean>(false);
  const router = useRouter();

  const fetchActiveSessions = useCallback(
    async (isBackgroundRefresh = false) => {
      if (isBackgroundRefresh) {
        setIsBackgroundRefreshing(true);
      } else {
        setSessionsLoading(true);
      }

      setError(null);

      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        const url = `https://api.floorselector.convrse.ai/api/sales-person/active-sessions?project_id=krisala`;

        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Authentication failed. Please login again.");
          } else if (response.status >= 500) {
            throw new Error("Server error. Please try again later.");
          } else {
            throw new Error(
              `Failed to fetch active sessions: ${response.statusText}`
            );
          }
        }

        const data = await response.json();

        // Handle the actual API response structure
        let sessionsData = [];
        if (
          data.success &&
          data.data &&
          data.data.activeSessions &&
          Array.isArray(data.data.activeSessions)
        ) {
          sessionsData = data.data.activeSessions;
        } else if (Array.isArray(data)) {
          sessionsData = data;
        } else if (data.data && Array.isArray(data.data)) {
          sessionsData = data.data;
        } else if (data.sessions && Array.isArray(data.sessions)) {
          sessionsData = data.sessions;
        } else if (
          data.active_sessions &&
          Array.isArray(data.active_sessions)
        ) {
          sessionsData = data.active_sessions;
        } else {
          console.log("Unexpected data structure:", data);
          sessionsData = [];
        }

        // Update state
        setActiveSessions(sessionsData);
        setFilteredSessions(sessionsData);
        setLastUpdated(new Date());
        setRetryCount(0); // Reset retry count on successful fetch
        setIsOnline(true);

        // Re-apply search filter if there's an active search
        if (searchTerm) {
          const filtered = searchSessions(sessionsData, searchTerm);
          setFilteredSessions(filtered);
        }
      } catch (error) {
        console.error("Error fetching active sessions:", error);

        if (error instanceof Error && error.name === "AbortError") {
          setError("Request timeout. Please check your connection.");
        } else if (
          error instanceof TypeError &&
          error.message.includes("fetch")
        ) {
          setError("Network error: Unable to connect to the server.");
          setIsOnline(false);
        } else {
          setError(
            error instanceof Error ? error.message : "Unknown error occurred"
          );
        }

        // Increment retry count for exponential backoff
        setRetryCount((prev) => prev + 1);
      } finally {
        setSessionsLoading(false);
        setIsBackgroundRefreshing(false);
      }
    },
    [searchTerm]
  );

  const searchSessions = (
    sessions: ActiveSession[],
    term: string
  ): ActiveSession[] => {
    if (!term.trim()) {
      return sessions;
    }

    const searchLower = term.toLowerCase();
    return sessions.filter(
      (session) =>
        session.salesPersonName.toLowerCase().includes(searchLower) ||
        session.customerName.toLowerCase().includes(searchLower)
    );
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    const filtered = searchSessions(activeSessions, term);
    console.log("Search term:", term);
    console.log("Active sessions for search:", activeSessions);
    console.log("Filtered sessions:", filtered);
    setFilteredSessions(filtered);
  };

  useEffect(() => {
    if (isLoaded && userData) {
      fetchActiveSessions();
    }
  }, [isLoaded, userData, fetchActiveSessions]);

  // Smart auto-refresh with exponential backoff
  useEffect(() => {
    if (!isLoaded || !userData) return;

    let intervalId: NodeJS.Timeout;
    let countdownId: NodeJS.Timeout;

    const scheduleNextRefresh = () => {
      // Calculate refresh interval based on retry count and online status
      let refreshInterval = 30000; // Default 30 seconds

      if (!isOnline) {
        // If offline, try every 5 minutes
        refreshInterval = 300000;
      } else if (retryCount > 0) {
        // Exponential backoff: 30s, 60s, 120s, 300s (max 5 minutes)
        refreshInterval = Math.min(30000 * Math.pow(2, retryCount - 1), 300000);
      }

      // Clear existing intervals
      if (intervalId) clearInterval(intervalId);
      if (countdownId) clearInterval(countdownId);

      // Set up countdown timer
      const timeLeft = Math.floor(refreshInterval / 1000);
      setNextRefresh(timeLeft);

      countdownId = setInterval(() => {
        setNextRefresh((prev) => {
          if (prev <= 1) {
            return timeLeft; // Reset when it reaches 0
          }
          return prev - 1;
        });
      }, 1000);

      // Set up refresh interval
      intervalId = setTimeout(() => {
        fetchActiveSessions(true); // Background refresh
        scheduleNextRefresh(); // Schedule next refresh
      }, refreshInterval);
    };

    // Start the refresh cycle
    scheduleNextRefresh();

    return () => {
      if (intervalId) clearTimeout(intervalId);
      if (countdownId) clearInterval(countdownId);
    };
  }, [isLoaded, userData, isOnline, retryCount, fetchActiveSessions]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setError(null);
      // Immediately try to fetch data when coming back online
      fetchActiveSessions(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setError(
        "You are offline. Data will refresh when connection is restored."
      );
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [fetchActiveSessions]);

  const refreshData = () => {
    fetchActiveSessions();
    setRetryCount(0); // Reset retry count on manual refresh
  };

  const goBack = () => {
    router.push("/dashboard");
  };

  const formatStartTime = (startTime: string) => {
    if (!startTime) return "Not available";

    // Parse the date as UTC and convert to IST
    const date = new Date(startTime);

    if (isNaN(date.getTime())) {
      return "Invalid date";
    }

    // Convert to IST (UTC+5:30)
    return date.toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });
  };

  const formatSessionDuration = (startTime: string) => {
    if (!startTime) return "Not available";

    const now = new Date();
    const start = new Date(startTime);

    if (isNaN(start.getTime())) {
      return "Invalid date";
    }

    const diffInMinutes = Math.floor(
      (now.getTime() - start.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 0) return "Just started";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)}h ${diffInMinutes % 60}m`;
    return `${Math.floor(diffInMinutes / 1440)}d ${Math.floor(
      (diffInMinutes % 1440) / 60
    )}h`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading Active Sessions..." />
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <Header showLogout={true} onLogoutClick={logout} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12">
        <div
          className={`transition-all duration-1000 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Page Title */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            <div className="flex items-center space-x-2 mb-2 sm:mb-3">
              <Button
                onClick={goBack}
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white hover:bg-white/10 p-1 sm:p-2 -ml-1 sm:-ml-2"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="text-xs sm:text-sm">Back to Dashboard</span>
              </Button>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                Active Sessions
              </h1>
            </div>
            <p className="text-sm sm:text-base text-white/80 mt-1 sm:mt-2">
              View Relationship Managers currently having active sessions
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
              <span className="text-red-400 text-sm sm:text-base">{error}</span>
            </div>
          )}

          {/* Search and Controls */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-[var(--bg-secondary)] to-[var(--bg-surface)] border border-white/10 rounded-2xl p-6 mb-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                {/* Search Bar */}
                <div className="flex-1">
                  <Label className="text-white/90 text-sm font-medium mb-3 block">
                    Search Active Sessions
                  </Label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search by sales person name or customer name..."
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-4 pr-12 py-3 bg-[var(--bg-primary)] border-white/20 text-white placeholder-white/50 focus:border-[var(--accent-green)] focus:ring-2 focus:ring-[var(--accent-green)]/20 rounded-xl text-sm w-full shadow-inner"
                    />
                    <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--accent-green)]" />
                  </div>
                </div>

                {/* Refresh Button and Status */}
                <div className="flex flex-col items-center lg:items-end space-y-2">
                  <Label className="text-white/90 text-sm font-medium mb-3 block lg:invisible">
                    Actions
                  </Label>
                  <Button
                    onClick={refreshData}
                    variant="outline"
                    className="border-[var(--accent-green)] text-[var(--accent-green)] hover:bg-[var(--accent-green)] hover:text-[var(--bg-primary)] px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-[var(--accent-green)]/20 transition-all duration-300"
                    disabled={sessionsLoading || isBackgroundRefreshing}
                  >
                    <RefreshCw
                      className={`w-4 h-4 mr-2 ${
                        sessionsLoading || isBackgroundRefreshing
                          ? "animate-spin"
                          : ""
                      }`}
                    />
                    {sessionsLoading
                      ? "Refreshing..."
                      : isBackgroundRefreshing
                      ? "Updating..."
                      : `Refresh (${nextRefresh}s)`}
                  </Button>

                  {/* Status indicators */}
                  <div className="flex items-center space-x-2 text-xs">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isOnline ? "bg-green-400" : "bg-red-400"
                      }`}
                    ></div>
                    <span className="text-white/60">
                      {isOnline ? "Online" : "Offline"}
                    </span>
                    {retryCount > 0 && (
                      <span className="text-yellow-400">
                        (Retry {retryCount})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Active Sessions List */}
            <Card className="bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-secondary)] border border-white/10 shadow-2xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-[var(--bg-primary)] to-[var(--bg-secondary)] border-b border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-green)] to-green-400 flex items-center justify-center shadow-lg">
                      <Activity className="w-6 h-6 text-[var(--bg-primary)]" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-white font-bold">
                        Live Active Sessions
                      </CardTitle>
                      <CardDescription className="text-white/70 text-base mt-1">
                        {filteredSessions.length} active session
                        {filteredSessions.length !== 1 ? "s" : ""} found
                        {searchTerm && (
                          <span className="text-[var(--accent-green)] ml-1 font-medium">
                            matching &ldquo;{searchTerm}&rdquo;
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div
                      className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                        isOnline
                          ? "bg-[var(--accent-green)]/20"
                          : "bg-red-500/20"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full animate-pulse ${
                          isOnline ? "bg-[var(--accent-green)]" : "bg-red-400"
                        }`}
                      ></div>
                      <span
                        className={`text-xs font-bold ${
                          isOnline
                            ? "text-[var(--accent-green)]"
                            : "text-red-400"
                        }`}
                      >
                        {isOnline ? "LIVE" : "OFFLINE"}
                      </span>
                    </div>
                    {lastUpdated && (
                      <div className="text-xs text-white/60">
                        Last updated: {lastUpdated.toLocaleTimeString()}
                        {isBackgroundRefreshing && (
                          <span className="ml-2 text-[var(--accent-green)]">
                            • Updating...
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {sessionsLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--accent-green)] to-green-400 flex items-center justify-center mb-4 animate-pulse">
                      <Activity className="w-8 h-8 text-[var(--bg-primary)]" />
                    </div>
                    <LoadingSpinner
                      size="md"
                      text="Loading active sessions..."
                    />
                    <p className="text-white/60 text-sm mt-2">
                      Fetching live session data
                    </p>
                  </div>
                ) : filteredSessions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredSessions.map((session) => (
                      <Card
                        key={session.sessionId}
                        className="group relative overflow-hidden bg-gradient-to-br from-[var(--bg-secondary)] via-[var(--bg-surface)] to-[var(--bg-secondary)] border border-white/10 hover:border-[var(--accent-green)]/50 transition-all duration-500 hover:shadow-2xl hover:shadow-[var(--accent-green)]/20"
                      >
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-green)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <CardContent className="relative p-6">
                          {/* Header with name and status */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-white group-hover:text-[var(--accent-green)] transition-colors duration-300 truncate">
                                {session.salesPersonName}
                              </h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <div className="w-2 h-2 bg-[var(--accent-green)] rounded-full animate-pulse"></div>
                                <span className="text-xs text-[var(--accent-green)] font-medium">
                                  Active Session
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className="bg-gradient-to-r from-[var(--accent-green)] to-green-400 text-[var(--bg-primary)] text-xs font-bold px-3 py-1 shadow-lg">
                                <Wifi className="w-3 h-3 mr-1" />
                                Online
                              </Badge>
                            </div>
                          </div>

                          {/* Session Information */}
                          <div className="space-y-3 mb-4">
                            {/* Customer Information */}
                            <div className="flex items-center space-x-3 p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors duration-300">
                              <div className="w-8 h-8 rounded-full bg-[var(--accent-green)]/20 flex items-center justify-center">
                                <UserCheck className="w-4 h-4 text-[var(--accent-green)]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-white/60">
                                  Customer
                                </p>
                                <p className="text-sm text-white/90 font-medium truncate">
                                  {session.customerName}
                                </p>
                              </div>
                            </div>

                            {/* Meeting Start Time */}
                            <div className="flex items-center space-x-3 p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors duration-300">
                              <div className="w-8 h-8 rounded-full bg-[var(--accent-green)]/20 flex items-center justify-center">
                                <Clock className="w-4 h-4 text-[var(--accent-green)]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-white/60">
                                  Meeting Started
                                </p>
                                <p className="text-sm text-white/90 font-medium">
                                  {formatStartTime(session.startTime || "")}
                                </p>
                              </div>
                            </div>

                            {/* Session Duration */}
                            <div className="flex items-center space-x-3 p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors duration-300">
                              <div className="w-8 h-8 rounded-full bg-[var(--accent-green)]/20 flex items-center justify-center">
                                <Activity className="w-4 h-4 text-[var(--accent-green)]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-white/60">
                                  Duration
                                </p>
                                <p className="text-sm text-white/90 font-medium">
                                  {formatSessionDuration(
                                    session.startTime || ""
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center mb-6">
                      <WifiOff className="w-10 h-10 text-white/30" />
                    </div>
                    <h3 className="text-xl text-white/80 font-semibold mb-2">
                      {searchTerm
                        ? "No Active Sessions Found"
                        : "No Active Sessions"}
                    </h3>
                    <p className="text-white/60 text-center max-w-md">
                      {searchTerm ? (
                        <>
                          No active sessions found matching{" "}
                          <span className="text-[var(--accent-green)] font-medium">
                            &ldquo;{searchTerm}&rdquo;
                          </span>
                          . Try adjusting your search terms.
                        </>
                      ) : (
                        "No Relationship Managers are currently having active sessions."
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
