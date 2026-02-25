import { NextRequest, NextResponse } from "next/server";

interface LoginRequest {
  email: string;
  password: string;
  remember_me: boolean;
}

interface LoginResponse {
  success: boolean;
  data?: {
    salesPerson: {
      user_id: string;
      email: string;
      full_name: string;
      permissions: string[];
    };
    token: {
      access_token: string;
    };
  };
  message?: string;
}

export const GRE_TEAM_MEMBERS = [
  "Mohini Jadhav",
  "Shivam Shelke",
  "Rakhi Sangwan",
];

// Password mapping for frontend users
// Maps email -> { frontendPassword, backendPassword }
const PASSWORD_MAPPING: Record<string, { frontend: string; backend: string }> =
  {
    "chetan@krisala.com": {
      frontend: "chetan@krisala123",
      backend: "chetandhadiwal491",
    },
    "anurag@krisala.com": {
      frontend: "anurag@krisala123",
      backend: "anuraggoyal491",
    },
    "ujjawala.41@krisala.com": {
      frontend: "ujjawala@krisala123",
      backend: "ujjawalabedmutha491",
    },
  };

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password, remember_me } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if user has a password mapping
    let backendPassword = password;
    console.log("Login attempt:", { email: email.toLowerCase(), password });
    console.log("Available mappings:", Object.keys(PASSWORD_MAPPING));

    if (PASSWORD_MAPPING[email.toLowerCase()]) {
      const mapping = PASSWORD_MAPPING[email.toLowerCase()];
      console.log("Found mapping for user:", mapping);
      // Verify frontend password
      if (password === mapping.frontend) {
        backendPassword = mapping.backend;
        console.log("Password match! Using backend password");
      } else {
        console.log(
          "Password mismatch. Expected:",
          mapping.frontend,
          "Got:",
          password
        );
        // Frontend password doesn't match
        return NextResponse.json(
          { success: false, message: "Invalid credentials" },
          { status: 401 }
        );
      }
    } else {
      console.log("No mapping found for email:", email.toLowerCase());
    }

    // Get IP address from headers
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded
      ? forwarded.split(",")[0]
      : request.headers.get("x-real-ip") || "127.0.0.1";

    const deviceInfo = {
      user_agent: request.headers.get("user-agent") || "Unknown",
      platform: "web",
      app_version: "1.0.0",
      system_version: "Unknown",
      network_type: "Unknown",
      screen_resolution: "Unknown",
      device_model: "Unknown",
    };

    // Prepare login payload
    const loginPayload = {
      email,
      password: backendPassword, // Use mapped backend password if available
      business_identifier: "krisala",
      remember_me,
      device_info: deviceInfo,
      device_id: `web_${Date.now()}`,
      session_id: `session_${Date.now()}`,
      ip_address: ip,
      platform: "web",
      app_version: "1.0.0",
      system_version: "Unknown",
      network_type: "Unknown",
      screen_resolution: "Unknown",
      device_model: "Unknown",
      silent_relogin: false,
    };

    // Call the RM login API
    const apiUrl =
      process.env.LOGIN_API_URL ||
      "https://api.floorselector.convrse.ai/api/sales-person/login";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginPayload),
    });

    const result: LoginResponse = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: result.message || "Login failed",
        },
        { status: response.status }
      );
    }

    if (result.success && result.data) {
      // Check if user is authorized to access the system
      const userFullName = result.data.salesPerson.full_name;
      const isAuthorized = GRE_TEAM_MEMBERS.includes(userFullName);

      if (!isAuthorized) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Access denied. You are not authorized to use this system.",
          },
          { status: 403 }
        );
      }

      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message || "Invalid credentials",
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
