"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, RefreshCw, AlertCircle } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import Header from "@/components/Header";
import { useRequireAuth } from "@/contexts/UserContext";
import { formatCurrency } from "@/lib/utils";

interface Customer {
  _id: string;
  id: string;
  name: string;
  email: string;
  phone: string;
  budget: number | string;
  preferences_563: string[];
  source_tags: string[];
  location__ac1e6456: string;
  visit_date_ed0: string | string[];
  nature_of_work_348: string;
  company_name_c66: string;
  is_active: boolean;
  createdAt: string;
  buying_purpose_19a51b85: string;
  gre_attended_282: string;
  language_924: string;
  pincode_a84: string;
  city_0b6: string;
  state_9d4: string;
  address_f6f61448: string;
  project_visited_b2b: string;
  newspaper_name_b22: string;
  website_name_2ef: string;
  hoarding_location_7b4: string;
  referral_text: string;
  loyality_source__sales__a03: string;
  radio_source__sales__767: string;
  channelPartner: string | null;
  channel_partner_0f8: string;
  cp_firm_name_0bf: string;
  cp_contact_number_67b: string;
  rera_number_8a5: string;
  channel_partner_representative_637: string;
  sourcing_manager: string;
  remark_9b8: string;
  closing_manager_cb3: string;
  token_type: string;
  typology: string;
  band: string;
  token_number: string;
  salesPerson: string;
  nextMeetingDate: string;
  rating: number | string;
  krisala_lead_id: string;
  updatedAt: string;
  conversation_id: string;
  request_id: string;
  enquiry_location: string;
  lead_source: string;
  preferences: string;
  project: string;
  remarks: string;
}

export default function SalesPersonCustomersPage() {
  const { userData, isLoading, isLoaded, logout } = useRequireAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const urlFriendlyName = params.salesPerson as string;

  // Convert URL-friendly name back to original name
  const salesPersonName = urlFriendlyName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const fetchCustomersForSalesPerson = useCallback(async () => {
    setCustomersLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("access_token");
      const encodedName = encodeURIComponent(salesPersonName);
      const response = await fetch(
        `https://api.floorselector.convrse.ai/customer/krisala?salesPerson=${encodedName}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.statusText}`);
      }

      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setError("Failed to fetch customers data");
    } finally {
      setCustomersLoading(false);
    }
  }, [salesPersonName]);

  useEffect(() => {
    if (isLoaded && userData && salesPersonName) {
      fetchCustomersForSalesPerson();
    }
  }, [isLoaded, userData, salesPersonName, fetchCustomersForSalesPerson]);

  const goBack = () => {
    router.push("/dashboard/sales-people");
  };

  const refreshData = () => {
    fetchCustomersForSalesPerson();
  };


  const formatVisitDates = (visitDates: string | string[] | null | undefined) => {
    if (!visitDates) return "N/A";
    
    if (Array.isArray(visitDates)) {
      return visitDates
        .filter(date => date && date.trim() !== "")
        .map((date) => {
          try {
            return new Date(date).toLocaleDateString();
          } catch {
            return date;
          }
        })
        .join(", ") || "N/A";
    }
    
    if (visitDates.trim() === "") return "N/A";
    
    try {
      return new Date(visitDates).toLocaleDateString();
    } catch {
      return visitDates;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
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
                <span className="text-xs sm:text-sm">Back to Sales Team</span>
              </Button>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 flex items-center space-x-2 sm:space-x-3">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
              <span className="truncate">Customers - {salesPersonName}</span>
            </h1>
            <p className="text-white/70 text-sm sm:text-base md:text-lg px-2 sm:px-0">
              All customers managed by {salesPersonName}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
              <span className="text-red-400 text-sm sm:text-base">{error}</span>
            </div>
          )}

          {/* Customers Section */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 md:mb-8 space-y-3 sm:space-y-0">
              <Button
                onClick={refreshData}
                variant="outline"
                className="border-[var(--accent-green)] text-[var(--accent-green)] hover:bg-[var(--accent-green)] hover:text-[var(--bg-primary)] px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base w-full sm:w-auto"
              >
                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Refresh</span>
                <span className="sm:hidden">Refresh</span>
              </Button>
            </div>

            {customersLoading ? (
              <div className="flex items-center justify-center py-16">
                <LoadingSpinner size="lg" text="Loading customers..." />
              </div>
            ) : customers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {customers.map((customer) => (
                  <div
                    key={customer._id}
                    onClick={() => {
                      const urlFriendlyPhone = customer.phone.replace(
                        /[^0-9]/g,
                        ""
                      );
                      router.push(
                        `/dashboard/sales-people/${urlFriendlyName}/customers/${urlFriendlyPhone}`
                      );
                    }}
                    className="bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-surface)] border border-white/10 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:border-[var(--accent-green)]/50 hover:shadow-lg hover:shadow-[var(--accent-green)]/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  >
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold text-base sm:text-lg truncate">
                            {customer.name}
                          </h3>
                          <p className="text-white/60 text-xs sm:text-sm truncate">
                            {customer.email}
                          </p>
                          <p className="text-white/60 text-xs sm:text-sm">
                            {customer.phone}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="text-[var(--accent-green)] font-bold text-sm sm:text-lg">
                            {formatCurrency(customer.budget)}
                          </div>
                          <div className="text-white/40 text-xs">Budget</div>
                        </div>
                      </div>

                      <div className="space-y-1 sm:space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-white/60 text-xs sm:text-sm">
                            Location:
                          </span>
                          <span className="text-white text-xs sm:text-sm truncate ml-2">
                            {customer.location__ac1e6456}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/60 text-xs sm:text-sm">
                            Work:
                          </span>
                          <span className="text-white text-xs sm:text-sm truncate ml-2">
                            {customer.nature_of_work_348}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/60 text-xs sm:text-sm">
                            Visit Date:
                          </span>
                          <span className="text-white text-xs sm:text-sm">
                            {formatVisitDates(customer.visit_date_ed0)}
                          </span>
                        </div>
                      </div>

                      {customer.preferences_563 &&
                        customer.preferences_563.length > 0 && (
                          <div>
                            <span className="text-white/60 text-sm">
                              Preferences:
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {customer.preferences_563.map((pref, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-[var(--accent-green)]/20 text-[var(--accent-green)] text-xs rounded-full"
                                >
                                  {pref}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                      {customer.source_tags &&
                        customer.source_tags.length > 0 && (
                          <div>
                            <span className="text-white/60 text-sm">
                              Source:
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {customer.source_tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-white/10 text-white/80 text-xs rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                      <div className="flex items-center justify-between pt-2 border-t border-white/10">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            customer.is_active
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {customer.is_active ? "Active" : "Inactive"}
                        </span>
                        <span className="text-white/40 text-xs">
                          {new Date(customer.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-white/5 rounded-full flex items-center justify-center">
                  <Users className="w-12 h-12 text-white/30" />
                </div>
                <h3 className="text-xl text-white/80 mb-2">
                  No Customers Found
                </h3>
                <p className="text-white/60">
                  No customers found for {salesPersonName}.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
