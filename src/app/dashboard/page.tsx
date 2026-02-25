"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Calendar, ArrowRight, UserCheck, Activity } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import Header from "@/components/Header";
import { useRequireAuth } from "@/contexts/UserContext";

export default function DashboardPage() {
  const { userData, isLoading, isLoaded, logout } = useRequireAuth();
  const router = useRouter();

  const navigateToCustomers = () => {
    router.push("/dashboard/customers");
  };

  const navigateToSalesPeople = () => {
    router.push("/dashboard/sales-people");
  };

  const navigateToAllCustomers = () => {
    router.push("/dashboard/all-customers");
  };

  const navigateToActiveSessions = () => {
    router.push("/dashboard/active-sessions");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading Dashboard..." />
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
          <div className="mb-6 sm:mb-8 md:mb-12"></div>

          {/* Welcome Section */}
          <div className="text-center mb-6 sm:mb-8 md:mb-12">
            <h2 className="font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl glow-gold-text mb-2 sm:mb-3 md:mb-4">
              Krisala Dashboard
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/80 px-4">
              Welcome back, {userData.full_name}
            </p>
          </div>

          {/* Option Cards */}
          <div className="flex justify-center gap-3 sm:gap-4 md:gap-6 lg:gap-8 max-w-7xl mx-auto flex-wrap">
            {/* Customers Card */}
            <Card
              className="w-full max-w-sm bg-[var(--bg-surface)] border-white/20 cursor-pointer hover:scale-105 transition-all duration-300 hover:border-[var(--accent-green)] group"
              onClick={navigateToCustomers}
            >
              <CardHeader className="text-center pb-3 sm:pb-4 p-4 sm:p-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-full bg-[var(--accent-green)] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--bg-primary)]" />
                </div>
                <CardTitle className="text-lg sm:text-xl lg:text-2xl text-white mb-1 sm:mb-2">
                  Customers by Date
                </CardTitle>
                <CardDescription className="text-white/60 text-sm sm:text-base">
                  View and manage customer data filtered by specific dates
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center p-4 sm:p-6 pt-0">
                <div className="flex items-center justify-center space-x-2 text-[var(--accent-green)] group-hover:text-white transition-colors duration-300">
                  <span className="font-medium text-sm sm:text-base">
                    View Customers
                  </span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </CardContent>
            </Card>

            {/* Sales People Card */}
            {/* <Card
              className="bg-[var(--bg-surface)] border-white/20 cursor-pointer hover:scale-105 transition-all duration-300 hover:border-[var(--accent-green)] group"
              onClick={navigateToSalesPeople}
            >
              <CardHeader className="text-center pb-3 sm:pb-4 p-4 sm:p-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-full bg-[var(--accent-green)] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--bg-primary)]" />
                </div>
                <CardTitle className="text-lg sm:text-xl lg:text-2xl text-white mb-1 sm:mb-2">
                  Sales Team
                </CardTitle>
                <CardDescription className="text-white/60 text-sm sm:text-base">
                  View and manage sales team members and their performance
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center p-4 sm:p-6 pt-0">
                <div className="flex items-center justify-center space-x-2 text-[var(--accent-green)] group-hover:text-white transition-colors duration-300">
                  <span className="font-medium text-sm sm:text-base">
                    View Sales Team
                  </span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </CardContent>
            </Card> */}

            {/* All Customers Card */}
            {/* <Card
              className="bg-[var(--bg-surface)] border-white/20 cursor-pointer hover:scale-105 transition-all duration-300 hover:border-[var(--accent-green)] group"
              onClick={navigateToAllCustomers}
            >
              <CardHeader className="text-center pb-3 sm:pb-4 p-4 sm:p-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-full bg-[var(--accent-green)] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <UserCheck className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--bg-primary)]" />
                </div>
                <CardTitle className="text-lg sm:text-xl lg:text-2xl text-white mb-1 sm:mb-2">
                  All Customers
                </CardTitle>
                <CardDescription className="text-white/60 text-sm sm:text-base">
                  View all customers with advanced filtering options
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center p-4 sm:p-6 pt-0">
                <div className="flex items-center justify-center space-x-2 text-[var(--accent-green)] group-hover:text-white transition-colors duration-300">
                  <span className="font-medium text-sm sm:text-base">
                    View All Customers
                  </span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </CardContent>
            </Card> */}

            {/* Active Sessions Card */}
            {/* <Card
              className="bg-[var(--bg-surface)] border-white/20 cursor-pointer hover:scale-105 transition-all duration-300 hover:border-[var(--accent-green)] group"
              onClick={navigateToActiveSessions}
            >
              <CardHeader className="text-center pb-3 sm:pb-4 p-4 sm:p-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-full bg-[var(--accent-green)] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Activity className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--bg-primary)]" />
                </div>
                <CardTitle className="text-lg sm:text-xl lg:text-2xl text-white mb-1 sm:mb-2">
                  Active Sessions
                </CardTitle>
                <CardDescription className="text-white/60 text-sm sm:text-base">
                  View RMs currently having active sessions
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center p-4 sm:p-6 pt-0">
                <div className="flex items-center justify-center space-x-2 text-[var(--accent-green)] group-hover:text-white transition-colors duration-300">
                  <span className="font-medium text-sm sm:text-base">
                    View Active Sessions
                  </span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </CardContent>
            </Card> */}
          </div>
        </div>
      </main>
    </div>
  );
}
