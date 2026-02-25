"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

export interface UserData {
  user_id: string;
  email: string;
  full_name: string;
  permissions: string[];
}

interface AuthState {
  userData: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoaded: boolean;
}

interface AuthContextType extends AuthState {
  login: (
    userData: UserData,
    accessToken: string,
    rememberMe?: boolean
  ) => void;
  logout: () => void;
  checkAuth: () => boolean;
  isSalesManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    userData: null,
    isAuthenticated: false,
    isLoading: true,
    isLoaded: false,
  });

  const router = useRouter();

  const checkAuth = (): boolean => {
    if (typeof window === "undefined") return false;

    const token = localStorage.getItem("access_token");
    const userDataStr = localStorage.getItem("user_data");

    if (!token || !userDataStr) {
      return false;
    }

    try {
      const userData = JSON.parse(userDataStr);
      setAuthState((prev) => ({
        ...prev,
        userData,
        isAuthenticated: true,
        isLoading: false,
      }));
      return true;
    } catch (error) {
      console.error("Error parsing user data:", error);
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_data");
      return false;
    }
  };

  const login = (
    userData: UserData,
    accessToken: string,
    rememberMe: boolean = false
  ) => {
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("user_data", JSON.stringify(userData));

    if (rememberMe) {
      localStorage.setItem("remember_me", "true");
    } else {
      localStorage.removeItem("remember_me");
    }

    setAuthState({
      userData,
      isAuthenticated: true,
      isLoading: false,
      isLoaded: true,
    });
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_data");
    localStorage.removeItem("remember_me");
    localStorage.removeItem("remembered_email");

    setAuthState({
      userData: null,
      isAuthenticated: false,
      isLoading: false,
      isLoaded: false,
    });

    router.push("/login");
  };

  useEffect(() => {
    const isAuth = checkAuth();
    if (isAuth) {
      // Add a small delay for better UX
      setTimeout(() => {
        setAuthState((prev) => ({ ...prev, isLoaded: true }));
      }, 300);
    } else {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const isSalesManager =
    authState.userData?.permissions?.includes("sales_manager") ?? false;

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    checkAuth,
    isSalesManager,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Custom hook for protected routes
export function useRequireAuth() {
  const { isAuthenticated, isLoading, userData, isLoaded, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  return { isAuthenticated, isLoading, userData, isLoaded, logout };
}
