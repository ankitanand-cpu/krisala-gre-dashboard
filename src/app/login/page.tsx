"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";
import { useAuth } from "@/contexts/UserContext";

interface LoginFormData {
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

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    remember_me: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  // Load saved email on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("remembered_email");
    const rememberMe = localStorage.getItem("remember_me") === "true";

    if (savedEmail && rememberMe) {
      setFormData((prev) => ({
        ...prev,
        email: savedEmail,
        remember_me: rememberMe,
      }));
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      remember_me: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result: LoginResponse = await response.json();

      if (result.success && result.data) {
        // Use context login method
        login(result.data.salesPerson, result.data.token.access_token, formData.remember_me);
        
        // Handle remember me functionality for email
        if (formData.remember_me) {
          localStorage.setItem("remembered_email", formData.email);
        } else {
          localStorage.removeItem("remembered_email");
        }

        router.push("/dashboard");
      } else {
        setError(result.message || "Login failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Logo */}
      <div className="absolute top-3 sm:top-4 md:top-6 left-3 sm:left-4 md:left-6 z-50">
        <Logo />
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center px-3 sm:px-4 py-6 sm:py-8">
        <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
          {/* Welcome Header */}
          <div className="text-center mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-[var(--accent-green)] to-green-300 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-white/70 text-sm sm:text-base md:text-lg">
              Sign in to your account
            </p>
          </div>

          <Card className="bg-[var(--bg-surface)] border-white/10 shadow-[var(--shadow-dark)] p-0">
            <CardHeader className="text-center !p-3 sm:!p-4 md:!p-6 !pb-3 sm:!pb-4">
              <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                Manager Access
              </CardTitle>
              <CardDescription className="text-white/60 text-xs sm:text-sm md:text-base">
                Secure dashboard access
              </CardDescription>
            </CardHeader>

            <CardContent className="!p-3 sm:!p-4 md:!p-6 !pt-0">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-7">
                {/* Email Field */}
                <div className="space-y-2 sm:space-y-4">
                  <Label
                    htmlFor="email"
                    className="text-white font-medium text-sm block"
                  >
                    Email
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="off"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="!bg-[var(--bg-secondary)]/60 !border-white/20 !text-white placeholder:!text-white/50 focus:!border-[var(--accent-green)] focus:!ring-1 focus:!ring-[var(--accent-green)] px-3 sm:px-4 py-2 sm:py-3 h-10 sm:h-12 rounded-lg w-full text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2 sm:space-y-4">
                  <Label
                    htmlFor="password"
                    className="text-white font-medium text-sm block"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="off"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="!bg-[var(--bg-secondary)]/60 !border-white/20 !text-white placeholder:!text-white/50 focus:!border-[var(--accent-green)] focus:!ring-1 focus:!ring-[var(--accent-green)] pl-3 sm:pl-4 pr-10 sm:pr-12 py-2 sm:py-3 h-10 sm:h-12 rounded-lg w-full text-sm sm:text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center pt-2 sm:pt-4">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Checkbox
                      id="remember_me"
                      checked={formData.remember_me}
                      onCheckedChange={handleCheckboxChange}
                      className="border-white/30 data-[state=checked]:bg-[var(--accent-green)] data-[state=checked]:border-[var(--accent-green)] w-4 h-4"
                    />
                    <Label
                      htmlFor="remember_me"
                      className="text-white/80 text-xs sm:text-sm cursor-pointer"
                    >
                      Remember me
                    </Label>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 sm:p-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0"></div>
                      <span className="text-red-300 font-medium text-xs sm:text-sm">
                        {error}
                      </span>
                    </div>
                  </div>
                )}

                {/* Sign In Button */}
                <div className="pt-1 sm:pt-2">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-[var(--accent-green)] to-green-400 hover:from-green-500 hover:to-green-600 text-[var(--bg-primary)] font-semibold h-10 sm:h-12 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm sm:text-base"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
