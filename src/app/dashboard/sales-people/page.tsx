"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, RefreshCw, AlertCircle, ArrowLeft, Search, Mail, Phone, ArrowRight } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import Header from "@/components/Header";
import { useRequireAuth } from "@/contexts/UserContext";

interface SalesPerson {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  project?: string;
  status?: string;
}

export default function SalesPeoplePage() {
  const { userData, isLoading, isLoaded, logout } = useRequireAuth();
  const [salesPeople, setSalesPeople] = useState<SalesPerson[]>([]);
  const [filteredSalesPeople, setFilteredSalesPeople] = useState<SalesPerson[]>([]);
  const [salesPeopleLoading, setSalesPeopleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const router = useRouter();

  const fetchSalesPeople = async () => {
    setSalesPeopleLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `https://api.floorselector.convrse.ai/sales-people/project/krisala`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch sales people: ${response.statusText}`);
      }

      const data = await response.json();
      const salesData = data.data || data;
      setSalesPeople(salesData);
      setFilteredSalesPeople(salesData);
    } catch (error) {
      console.error("Error fetching sales people:", error);
      setError("Failed to fetch sales people data");
    } finally {
      setSalesPeopleLoading(false);
    }
  };

  const searchSalesPeople = (people: SalesPerson[], term: string): SalesPerson[] => {
    if (!term.trim()) {
      return people;
    }

    const searchLower = term.toLowerCase();
    return people.filter(person =>
      person.name.toLowerCase().includes(searchLower) ||
      (person.email && person.email.toLowerCase().includes(searchLower)) ||
      (person.phone && person.phone.includes(searchLower)) ||
      (person.project && person.project.toLowerCase().includes(searchLower))
    );
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    const filtered = searchSalesPeople(salesPeople, term);
    setFilteredSalesPeople(filtered);
  };

  useEffect(() => {
    if (isLoaded && userData) {
      fetchSalesPeople();
    }
  }, [isLoaded, userData]);


  const refreshData = () => {
    fetchSalesPeople();
  };

  const goBack = () => {
    router.push("/dashboard");
  };

  const handleSalesPersonClick = (salesPersonName: string) => {
    const urlFriendlyName = salesPersonName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .trim();
    router.push(`/dashboard/sales-people/${urlFriendlyName}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading Sales People..." />
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
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
              <span className="text-red-400 text-sm sm:text-base">{error}</span>
            </div>
          )}

          {/* Sales People Section */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-3 sm:space-y-0">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">
                  Sales Team
                </h2>
                <p className="text-white/70 text-sm sm:text-base md:text-lg">
                  Krisala Project Team Members
                </p>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6 mb-6">
              {/* Search Bar */}
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search sales people by name, email, phone..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-4 pr-12 py-3 bg-[var(--bg-primary)] border-white/20 text-white placeholder-white/50 focus:border-[var(--accent-green)] focus:ring-2 focus:ring-[var(--accent-green)]/20 rounded-xl text-sm w-full shadow-inner"
                  />
                  <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--accent-green)]" />
                </div>
              </div>

              {/* Refresh Button */}
              <Button
                onClick={refreshData}
                variant="outline"
                size="sm"
                className="border-[var(--accent-green)] text-[var(--accent-green)] hover:bg-[var(--accent-green)] hover:text-[var(--bg-primary)] shrink-0"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Sales Team Directory */}
            <div className="bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-secondary)] border border-white/10 shadow-2xl rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-[var(--bg-primary)] to-[var(--bg-secondary)] border-b border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-green)] to-green-400 flex items-center justify-center shadow-lg">
                      <Users className="w-6 h-6 text-[var(--bg-primary)]" />
                    </div>
                    <div>
                      <h3 className="text-2xl text-white font-bold">
                        Team Directory
                      </h3>
                      <p className="text-white/70 text-base mt-1">
                        {filteredSalesPeople.length} team member
                        {filteredSalesPeople.length !== 1 ? "s" : ""} found
                        {searchTerm && (
                          <span className="text-[var(--accent-green)] ml-1 font-medium">
                            matching &ldquo;{searchTerm}&rdquo;
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 px-3 py-1 bg-[var(--accent-green)]/20 rounded-full">
                      <div className="w-2 h-2 bg-[var(--accent-green)] rounded-full animate-pulse"></div>
                      <span className="text-xs text-[var(--accent-green)] font-bold">
                        LIVE
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {salesPeopleLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--accent-green)] to-green-400 flex items-center justify-center mb-4 animate-pulse">
                      <Users className="w-8 h-8 text-[var(--bg-primary)]" />
                    </div>
                    <LoadingSpinner size="lg" text="Loading sales team..." />
                    <p className="text-white/60 text-sm mt-2">Fetching team member information</p>
                  </div>
                ) : filteredSalesPeople.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredSalesPeople.map((person, index) => (
                      <div
                        key={person.id}
                        onClick={() => handleSalesPersonClick(person.name)}
                        className="group relative overflow-hidden bg-gradient-to-br from-[var(--bg-secondary)] via-[var(--bg-surface)] to-[var(--bg-secondary)] border border-white/10 rounded-2xl p-6 hover:border-[var(--accent-green)]/50 hover:shadow-2xl hover:shadow-[var(--accent-green)]/20 transition-all duration-500 hover:scale-[1.02] cursor-pointer"
                      >
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-green)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <div className="relative flex flex-col items-center text-center space-y-4">
                          {/* Avatar */}
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--accent-green)] to-green-400 flex items-center justify-center text-[var(--bg-primary)] font-bold text-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                            {person.name.charAt(0).toUpperCase()}
                          </div>
                          
                          {/* Name and Role */}
                          <div>
                            <h3 className="font-bold text-white text-lg group-hover:text-[var(--accent-green)] transition-colors duration-300">
                              {person.name}
                            </h3>
                            <div className="flex items-center justify-center space-x-2 mt-2">
                              <div className="w-2 h-2 bg-[var(--accent-green)] rounded-full animate-pulse"></div>
                              <span className="text-xs text-[var(--accent-green)] font-medium">Sales Team Member</span>
                            </div>
                          </div>

                          {/* Contact Info (if available) */}
                          {(person.email || person.phone) && (
                            <div className="w-full space-y-2">
                              {person.email && (
                                <div className="flex items-center space-x-2 p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors duration-300">
                                  <Mail className="w-3 h-3 text-[var(--accent-green)]" />
                                  <p className="text-xs text-white/80 truncate">{person.email}</p>
                                </div>
                              )}
                              {person.phone && (
                                <div className="flex items-center space-x-2 p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors duration-300">
                                  <Phone className="w-3 h-3 text-[var(--accent-green)]" />
                                  <p className="text-xs text-white/80">{person.phone}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Team member number */}
                          <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                            <span className="text-xs text-white/60 font-mono">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                          </div>

                          {/* Action indicator */}
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="w-6 h-6 rounded-full bg-[var(--accent-green)] flex items-center justify-center shadow-lg">
                              <ArrowRight className="w-3 h-3 text-[var(--bg-primary)]" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center mb-6">
                      <Users className="w-10 h-10 text-white/30" />
                    </div>
                    <h3 className="text-xl text-white/80 font-semibold mb-2">
                      {searchTerm ? "No Team Members Found" : "No Sales Team Members"}
                    </h3>
                    <p className="text-white/60 text-center max-w-md">
                      {searchTerm ? (
                        <>No team members found matching <span className="text-[var(--accent-green)] font-medium">&ldquo;{searchTerm}&rdquo;</span>. Try adjusting your search terms.</>
                      ) : (
                        "No sales people found for the Krisala project."
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
