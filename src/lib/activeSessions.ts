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

export async function fetchActiveSessions(): Promise<ActiveSession[]> {
  try {
    const response = await fetch(
      `https://api.floorselector.convrse.ai/api/sales-person/active-sessions?project_id=krisala`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        // Add cache control for better performance
        next: { revalidate: 30 }, // Revalidate every 30 seconds
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch active sessions: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Server-side active sessions API response:", data);

    // Handle the actual API response structure
    let sessionsData: ActiveSession[] = [];
    if (data.success && data.data && data.data.activeSessions && Array.isArray(data.data.activeSessions)) {
      sessionsData = data.data.activeSessions;
    } else if (Array.isArray(data)) {
      sessionsData = data;
    } else if (data.data && Array.isArray(data.data)) {
      sessionsData = data.data;
    } else if (data.sessions && Array.isArray(data.sessions)) {
      sessionsData = data.sessions;
    } else if (data.active_sessions && Array.isArray(data.active_sessions)) {
      sessionsData = data.active_sessions;
    } else {
      console.log("Unexpected data structure:", data);
      sessionsData = [];
    }

    console.log("Server-side parsed sessions data:", sessionsData);
    return sessionsData;
  } catch (error) {
    console.error("Error fetching active sessions on server:", error);
    return []; // Return empty array on error
  }
}
