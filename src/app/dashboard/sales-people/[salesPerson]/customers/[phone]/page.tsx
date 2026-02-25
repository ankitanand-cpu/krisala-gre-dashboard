"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  User,
  RefreshCw,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building,
  DollarSign,
  Tag,
  Users,
  MessageSquare,
  MessageCircle,
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import Header from "@/components/Header";
import { useRequireAuth } from "@/contexts/UserContext";
import { formatCurrency, toNumber } from "@/lib/utils";

interface Customer {
  _id: string;
  id: string;
  name: string;
  email: string;
  phone: string;
  alternate_mobile?: string;
  budget: number | string;
  budget_interested_c49?: string | number;
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
  // New visit fields
  visited_with_95e?: string;
  site_visit_type_703?: string;
  visit_comments_462?: string;
}

export default function CustomerDetailPage() {
  const { userData, isLoading, isLoaded, logout } = useRequireAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [salesPeople, setSalesPeople] = useState<string[]>([]);
  const [salesPeopleLoading, setSalesPeopleLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSalesPerson, setSelectedSalesPerson] = useState<string>("");
  const router = useRouter();
  const params = useParams();
  const urlFriendlyPhone = params.phone as string;
  const urlFriendlySalesPerson = params.salesPerson as string;

  // Convert URL-friendly names back to original format
  const phoneNumber = urlFriendlyPhone;
  const salesPersonName = urlFriendlySalesPerson
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const fetchCustomerByPhone = useCallback(async () => {
    setCustomerLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `https://api.floorselector.convrse.ai/customer/krisala?phone=${phoneNumber}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch customer: ${response.statusText}`);
      }

      const data = await response.json();
      if (data && data.length > 0) {
        const customerData = data[0];
        console.log("Customer data:", customerData); // Debug log
        console.log("Visit dates:", customerData.visit_date_ed0);
        console.log("Visit dates type:", typeof customerData.visit_date_ed0);
        console.log("Is array?", Array.isArray(customerData.visit_date_ed0));
        setCustomer(customerData); // Take the first customer if multiple found
      } else {
        setError("Customer not found");
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
      setError("Failed to fetch customer data");
    } finally {
      setCustomerLoading(false);
    }
  }, [phoneNumber]);

  const fetchSalesPeople = async () => {
    setSalesPeopleLoading(true);
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
      const salesPeopleData = data.data || data;
      const names = salesPeopleData.map(
        (person: { name: string }) => person.name
      );
      setSalesPeople(names);
    } catch (error) {
      console.error("Error fetching sales people:", error);
    } finally {
      setSalesPeopleLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && userData && phoneNumber) {
      fetchCustomerByPhone();
      fetchSalesPeople();
    }
  }, [isLoaded, userData, phoneNumber, fetchCustomerByPhone]);

  useEffect(() => {
    if (isEditing && salesPeople.length === 0) {
      fetchSalesPeople();
    }
  }, [isEditing, salesPeople.length]);

  useEffect(() => {
    if (customer?.salesPerson) {
      setSelectedSalesPerson(customer.salesPerson);
    }
  }, [customer]);

  const goBack = () => {
    router.push(`/dashboard/sales-people/${urlFriendlySalesPerson}`);
  };

  const refreshData = () => {
    fetchCustomerByPhone();
  };

  const filteredSalesPeople = salesPeople.filter((person) =>
    person.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ensure current sales person is always included in the filtered list
  const allSalesPeople =
    customer?.salesPerson && !salesPeople.includes(customer.salesPerson)
      ? [customer.salesPerson, ...filteredSalesPeople]
      : filteredSalesPeople;

  const updateCustomer = async (updatedData: Partial<Customer>) => {
    if (!customer) return;

    setIsUpdating(true);
    setError(null);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `https://api.floorselector.convrse.ai/customer/krisala/${customer.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedData),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update customer: ${response.statusText}`);
      }

      const updatedCustomer = await response.json();
      setCustomer(updatedCustomer);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating customer:", error);
      setError("Failed to update customer data");
    } finally {
      setIsUpdating(false);
    }
  };


  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString || dateString.trim() === "") return "N/A";

    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const getValidDates = (visitDates?: string[] | string | unknown) => {
    if (!visitDates) {
      return [];
    }

    // Handle different data types
    let dateArray: string[] = [];

    if (Array.isArray(visitDates)) {
      dateArray = visitDates;
    } else if (typeof visitDates === "string") {
      // If it's a single string, wrap it in an array
      dateArray = [visitDates];
    } else {
      // If it's some other type, return empty array
      return [];
    }

    return dateArray
      .filter((dateStr) => {
        if (!dateStr || typeof dateStr !== "string") return false;
        const date = new Date(dateStr);
        return !isNaN(date.getTime());
      })
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  };

  const formatVisitDates = (visitDates?: string[] | string | unknown) => {
    const validDates = getValidDates(visitDates);

    if (validDates.length === 0) {
      return "N/A";
    }

    // Format all valid dates and join with commas
    const formattedDates = validDates.map((dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    });

    return formattedDates.join(", ");
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div
          className={`transition-all duration-1000 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Page Title */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center space-x-2 mb-2">
              <Button
                onClick={goBack}
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white hover:bg-white/10 p-2 -ml-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                <span className="text-sm">Back to {salesPersonName}</span>
              </Button>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 flex items-center space-x-3">
              <User className="w-6 h-6 sm:w-8 sm:h-8" />
              <span>Customer Details</span>
            </h1>
            <p className="text-white/70 text-base sm:text-lg">
              {customer ? customer.name : "Loading customer information..."}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
              <span className="text-red-400 text-sm sm:text-base">{error}</span>
            </div>
          )}

          {/* Customer Details */}
          {customerLoading ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner size="lg" text="Loading customer details..." />
            </div>
          ) : customer ? (
            <div className="space-y-8">
              {/* Header Card */}
              <div className="bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-surface)] border border-white/10 rounded-xl p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-4 sm:space-x-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[var(--accent-green)] to-[#7a9a1a] rounded-full flex items-center justify-center text-[var(--bg-primary)] font-bold text-xl sm:text-2xl">
                      {customer.name
                        ? customer.name.charAt(0).toUpperCase()
                        : "?"}
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                        {customer.name || "Unknown Customer"}
                      </h2>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-white/60">
                        <div className="flex items-center space-x-1">
                          <Phone className="w-4 h-4" />
                          <span className="text-sm sm:text-base">
                            {customer.phone || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Mail className="w-4 h-4" />
                          <span className="text-sm sm:text-base">
                            {customer.email || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right w-full sm:w-auto">
                    <div className="text-[var(--accent-green)] font-bold text-2xl sm:text-3xl mb-1 sm:mb-2">
                      {customer.budget && toNumber(customer.budget) > 0
                        ? formatCurrency(customer.budget)
                        : customer.budget_interested_c49
                        ? String(customer.budget_interested_c49)
                        : "N/A"}
                    </div>
                    <div className="text-white/60 text-sm">
                      {customer.budget && toNumber(customer.budget) > 0
                        ? "Budget"
                        : customer.budget_interested_c49
                        ? "Budget Interested"
                        : "Budget"}
                    </div>
                    <div
                      className={`mt-2 px-3 py-1 rounded-full text-xs ${
                        customer.is_active
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {customer.is_active ? "Active" : "Inactive"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={refreshData}
                      variant="outline"
                      className="border-[var(--accent-green)] text-[var(--accent-green)] hover:bg-[var(--accent-green)] hover:text-[var(--bg-primary)]"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                    <Button
                      onClick={() => setIsEditing(!isEditing)}
                      variant="outline"
                      className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white"
                    >
                      {isEditing ? "Cancel Edit" : "Edit Customer"}
                    </Button>
                  </div>
                  <div className="text-white/40 text-sm space-y-1">
                    <div>Lead ID: {customer.krisala_lead_id}</div>
                    <div>Customer ID: {customer.id}</div>
                    <div>Created: {formatDate(customer.createdAt)}</div>
                    {customer.updatedAt && (
                      <div>Updated: {formatDate(customer.updatedAt)}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Edit Form */}
              {isEditing && (
                <div className="bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-surface)] border border-[var(--accent-green)]/20 rounded-xl p-4 sm:p-6 lg:p-8 shadow-[var(--shadow-dark)]">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center space-x-2 sm:space-x-3">
                    <User className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--accent-green)]" />
                    <span>Edit Customer Information</span>
                  </h3>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(
                        e.target as HTMLFormElement
                      );
                      const budgetValue = formData.get("budget") as string;
                      const updatedData = {
                        name: formData.get("name") as string,
                        email: formData.get("email") as string,
                        phone: formData.get("phone") as string,
                        budget: toNumber(budgetValue),
                        nature_of_work_348: formData.get("workType") as string,
                        location__ac1e6456: formData.get("location") as string,
                        salesPerson: selectedSalesPerson,
                        closing_manager_cb3: formData.get(
                          "closingManager"
                        ) as string,
                      };
                      updateCustomer(updatedData);
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label className="block text-white/90 text-sm font-semibold mb-3">
                          Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          defaultValue={customer.name}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-[var(--accent-green)] focus:ring-2 focus:ring-[var(--accent-green)]/20 transition-all duration-200 text-sm sm:text-base"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-white/90 text-sm font-semibold mb-3">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          defaultValue={customer.email}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-[var(--accent-green)] focus:ring-2 focus:ring-[var(--accent-green)]/20 transition-all duration-200 text-sm sm:text-base"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-white/90 text-sm font-semibold mb-3">
                          Phone
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          defaultValue={customer.phone}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-[var(--accent-green)] focus:ring-2 focus:ring-[var(--accent-green)]/20 transition-all duration-200 text-sm sm:text-base"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-white/90 text-sm font-semibold mb-3">
                          Budget (₹)
                        </label>
                        <input
                          type="number"
                          name="budget"
                          defaultValue={
                            customer.budget && toNumber(customer.budget) > 0
                              ? toNumber(customer.budget)
                              : ""
                          }
                          placeholder={
                            customer.budget_interested_c49
                              ? `Current: ${customer.budget_interested_c49}`
                              : "Enter budget"
                          }
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-[var(--accent-green)] focus:ring-2 focus:ring-[var(--accent-green)]/20 transition-all duration-200 text-sm sm:text-base"
                        />
                        {customer.budget_interested_c49 && (
                          <p className="text-xs text-white/60 mt-1">
                            Budget Interested: {String(customer.budget_interested_c49)}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-white/90 text-sm font-semibold mb-3">
                          Work Type
                        </label>
                        <select
                          name="workType"
                          defaultValue={customer.nature_of_work_348}
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-[var(--accent-green)] focus:ring-2 focus:ring-[var(--accent-green)]/20 transition-all duration-200"
                        >
                          <option
                            value="Salaried"
                            className="bg-[var(--bg-surface)] text-white"
                          >
                            Salaried
                          </option>
                          <option
                            value="Self Employed"
                            className="bg-[var(--bg-surface)] text-white"
                          >
                            Self Employed
                          </option>
                          <option
                            value="Student"
                            className="bg-[var(--bg-surface)] text-white"
                          >
                            Student
                          </option>
                          <option
                            value="Business"
                            className="bg-[var(--bg-surface)] text-white"
                          >
                            Business
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-white/90 text-sm font-semibold mb-3">
                          Location
                        </label>
                        <input
                          type="text"
                          name="location"
                          defaultValue={customer.location__ac1e6456}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-[var(--accent-green)] focus:ring-2 focus:ring-[var(--accent-green)]/20 transition-all duration-200 text-sm sm:text-base"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-white/90 text-sm font-semibold mb-3">
                          Sales Person
                        </label>
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Search sales person..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-[var(--accent-green)] focus:ring-2 focus:ring-[var(--accent-green)]/20 transition-all duration-200 text-sm sm:text-base"
                          />
                          {salesPeopleLoading ? (
                            <div className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white/50 flex items-center justify-center">
                              Loading sales people...
                            </div>
                          ) : (
                            <select
                              name="salesPerson"
                              value={selectedSalesPerson}
                              onChange={(e) =>
                                setSelectedSalesPerson(e.target.value)
                              }
                              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-[var(--accent-green)] focus:ring-2 focus:ring-[var(--accent-green)]/20 transition-all duration-200"
                              required
                            >
                              {allSalesPeople.map((name, index) => (
                                <option
                                  key={index}
                                  value={name}
                                  className="bg-[var(--bg-surface)] text-white"
                                >
                                  {name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-white/90 text-sm font-semibold mb-3">
                          Closing Manager
                        </label>
                        <input
                          type="text"
                          name="closingManager"
                          defaultValue={customer.closing_manager_cb3}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-[var(--accent-green)] focus:ring-2 focus:ring-[var(--accent-green)]/20 transition-all duration-200 text-sm sm:text-base"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6">
                      <Button
                        type="submit"
                        disabled={isUpdating}
                        className="w-full sm:w-auto bg-[var(--accent-green)] hover:bg-[var(--accent-green)]/90 text-[var(--bg-primary)] font-semibold px-6 sm:px-8 py-2 sm:py-3 rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                      >
                        {isUpdating ? "Updating..." : "Update Customer"}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        variant="outline"
                        className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 sm:px-8 py-2 sm:py-3 rounded-xl transition-all duration-200 hover:scale-105 text-sm sm:text-base"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Personal Information */}
                <div className="bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-surface)] border border-white/10 rounded-xl p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center space-x-2">
                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Personal Information</span>
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-white/60 text-sm sm:text-base">
                        Name:
                      </span>
                      <span className="text-white text-sm sm:text-base">
                        {customer.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60 text-sm sm:text-base">
                        Email:
                      </span>
                      <span className="text-white text-sm sm:text-base">
                        {customer.email}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60 text-sm sm:text-base">
                        Phone:
                      </span>
                      <span className="text-white text-sm sm:text-base">
                        {customer.phone}
                      </span>
                    </div>
                    {customer.alternate_mobile && (
                      <div className="flex justify-between">
                        <span className="text-white/60 text-sm sm:text-base">
                          Alternate Mobile:
                        </span>
                        <span className="text-white text-sm sm:text-base">
                          {customer.alternate_mobile}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-white/60">Language:</span>
                      <span className="text-white">
                        {customer.language_924 || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Work Type:</span>
                      <span className="text-white">
                        {customer.nature_of_work_348}
                      </span>
                    </div>
                    {customer.company_name_c66 && (
                      <div className="flex justify-between">
                        <span className="text-white/60">Company:</span>
                        <span className="text-white">
                          {customer.company_name_c66}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Location & Project */}
                <div className="bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-surface)] border border-white/10 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                    <MapPin className="w-5 h-5" />
                    <span>Location & Project</span>
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-white/60">Location:</span>
                      <span className="text-white">
                        {customer.location__ac1e6456}
                      </span>
                    </div>
                    {customer.city_0b6 && (
                      <div className="flex justify-between">
                        <span className="text-white/60">City:</span>
                        <span className="text-white">{customer.city_0b6}</span>
                      </div>
                    )}
                    {customer.state_9d4 && (
                      <div className="flex justify-between">
                        <span className="text-white/60">State:</span>
                        <span className="text-white">{customer.state_9d4}</span>
                      </div>
                    )}
                    {customer.pincode_a84 && (
                      <div className="flex justify-between">
                        <span className="text-white/60">Pincode:</span>
                        <span className="text-white">
                          {customer.pincode_a84}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-white/60">Project Visited:</span>
                      <span className="text-white">
                        {customer.project_visited_b2b}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Enquiry Location:</span>
                      <span className="text-white">
                        {customer.enquiry_location}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Visit & Meeting Info */}
                <div className="bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-surface)] border border-white/10 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>Visit & Meeting</span>
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-white/60">Visit Dates:</span>
                      <div className="text-right">
                        <span className="text-white">
                          {formatVisitDates(customer.visit_date_ed0)}
                        </span>
                        {(() => {
                          const validDates = getValidDates(
                            customer.visit_date_ed0
                          );
                          return (
                            validDates.length > 1 && (
                              <div className="text-xs text-[var(--accent-green)] mt-1">
                                {validDates.length} visits total
                              </div>
                            )
                          );
                        })()}
                      </div>
                    </div>
                    {customer.visited_with_95e && (
                      <div className="flex justify-between">
                        <span className="text-white/60">Visited With:</span>
                        <span className="text-white">
                          {customer.visited_with_95e}
                        </span>
                      </div>
                    )}
                    {customer.site_visit_type_703 && (
                      <div className="flex justify-between">
                        <span className="text-white/60">Visit Mode:</span>
                        <span className="text-white">
                          {customer.site_visit_type_703}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-white/60">GRE Attended:</span>
                      <span className="text-white">
                        {customer.gre_attended_282 || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Closing Manager:</span>
                      <span className="text-white">
                        {customer.closing_manager_cb3 || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Sales Person:</span>
                      <span className="text-white">{customer.salesPerson || "N/A"}</span>
                    </div>
                    {customer.nextMeetingDate && (
                      <div className="flex justify-between">
                        <span className="text-white/60">Next Meeting Date:</span>
                        <span className="text-white">
                          {formatDate(customer.nextMeetingDate)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial & Preferences */}
                <div className="bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-surface)] border border-white/10 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                    <DollarSign className="w-5 h-5" />
                    <span>Financial & Preferences</span>
                  </h3>
                  <div className="space-y-3">
                    {customer.budget_interested_c49 && (
                      <div className="flex justify-between">
                        <span className="text-white/60">Budget Interested:</span>
                        <span className="text-white font-semibold">
                          {String(customer.budget_interested_c49)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-white/60">Buying Purpose:</span>
                      <span className="text-white">
                        {customer.buying_purpose_19a51b85 || "N/A"}
                      </span>
                    </div>
                    {customer.preferences_563 &&
                      customer.preferences_563.length > 0 && (
                        <div>
                          <span className="text-white/60 mb-2 block">
                            Preferences:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {customer.preferences_563.map((pref, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-[var(--accent-green)]/20 text-[var(--accent-green)] text-sm rounded-full border border-[var(--accent-green)]/30"
                              >
                                {pref}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>

              {/* Source & Marketing */}
              <div className="bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-surface)] border border-white/10 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                  <Tag className="w-5 h-5" />
                  <span>Source & Marketing</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <h4 className="text-white/80 font-medium mb-2">
                      Lead Source
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-white/60">Primary Source:</span>
                        <span className="text-white">
                          {customer.lead_source}
                        </span>
                      </div>
                      {customer.source_tags &&
                        customer.source_tags.length > 0 && (
                          <div>
                            <span className="text-white/60 text-sm">
                              Source Tags:
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
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white/80 font-medium mb-2">
                      Marketing Channels
                    </h4>
                    <div className="space-y-2">
                      {customer.newspaper_name_b22 && (
                        <div className="flex justify-between">
                          <span className="text-white/60">Newspaper:</span>
                          <span className="text-white">
                            {customer.newspaper_name_b22}
                          </span>
                        </div>
                      )}
                      {customer.website_name_2ef && (
                        <div className="flex justify-between">
                          <span className="text-white/60">Website:</span>
                          <span className="text-white">
                            {customer.website_name_2ef}
                          </span>
                        </div>
                      )}
                      {customer.hoarding_location_7b4 && (
                        <div className="flex justify-between">
                          <span className="text-white/60">Hoarding:</span>
                          <span className="text-white">
                            {customer.hoarding_location_7b4}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white/80 font-medium mb-2">
                      Additional Info
                    </h4>
                    <div className="space-y-2">
                      {customer.referral_text && (
                        <div className="flex justify-between">
                          <span className="text-white/60">Referral:</span>
                          <span className="text-white">
                            {customer.referral_text}
                          </span>
                        </div>
                      )}
                      {customer.loyality_source__sales__a03 && (
                        <div className="flex justify-between">
                          <span className="text-white/60">Loyalty Source:</span>
                          <span className="text-white">
                            {customer.loyality_source__sales__a03}
                          </span>
                        </div>
                      )}
                      {customer.radio_source__sales__767 && (
                        <div className="flex justify-between">
                          <span className="text-white/60">Radio Source:</span>
                          <span className="text-white">
                            {customer.radio_source__sales__767}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Channel Partner Information */}
              {(customer.channelPartner ||
                customer.channel_partner_0f8 ||
                customer.cp_firm_name_0bf ||
                customer.cp_contact_number_67b ||
                customer.rera_number_8a5 ||
                customer.channel_partner_representative_637) && (
                <div className="bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-surface)] border border-white/10 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Channel Partner Information</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customer.channelPartner && (
                      <div className="flex justify-between">
                        <span className="text-white/60">Channel Partner:</span>
                        <span className="text-white">
                          {customer.channelPartner}
                        </span>
                      </div>
                    )}
                    {customer.channel_partner_0f8 && (
                      <div className="flex justify-between">
                        <span className="text-white/60">Partner ID:</span>
                        <span className="text-white">
                          {customer.channel_partner_0f8}
                        </span>
                      </div>
                    )}
                    {customer.cp_firm_name_0bf && (
                      <div className="flex justify-between">
                        <span className="text-white/60">Firm Name:</span>
                        <span className="text-white">
                          {customer.cp_firm_name_0bf}
                        </span>
                      </div>
                    )}
                    {customer.cp_contact_number_67b && (
                      <div className="flex justify-between">
                        <span className="text-white/60">Contact Number:</span>
                        <span className="text-white">
                          {customer.cp_contact_number_67b}
                        </span>
                      </div>
                    )}
                    {customer.rera_number_8a5 && (
                      <div className="flex justify-between">
                        <span className="text-white/60">RERA Number:</span>
                        <span className="text-white">
                          {customer.rera_number_8a5}
                        </span>
                      </div>
                    )}
                    {customer.channel_partner_representative_637 && (
                      <div className="flex justify-between">
                        <span className="text-white/60">Representative:</span>
                        <span className="text-white">
                          {customer.channel_partner_representative_637}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Token & Typology Information */}
              {(customer.token_type ||
                customer.typology ||
                customer.band ||
                customer.token_number ||
                customer.sourcing_manager) && (
                <div className="bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-surface)] border border-white/10 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                    <Tag className="w-5 h-5" />
                    <span>Token & Typology Information</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customer.token_type && (
                      <div className="flex justify-between">
                        <span className="text-white/60">Token Type:</span>
                        <span className="text-white">
                          {customer.token_type}
                        </span>
                      </div>
                    )}
                    {customer.typology && (
                      <div className="flex justify-between">
                        <span className="text-white/60">Typology:</span>
                        <span className="text-white">{customer.typology}</span>
                      </div>
                    )}
                    {customer.band && (
                      <div className="flex justify-between">
                        <span className="text-white/60">Band:</span>
                        <span className="text-white">{customer.band}</span>
                      </div>
                    )}
                    {customer.token_number && (
                      <div className="flex justify-between">
                        <span className="text-white/60">Token Number:</span>
                        <span className="text-white">
                          {customer.token_number}
                        </span>
                      </div>
                    )}
                    {customer.sourcing_manager && (
                      <div className="flex justify-between">
                        <span className="text-white/60">Sourcing Manager:</span>
                        <span className="text-white">
                          {customer.sourcing_manager}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Visit Comments Section */}
              {customer.visit_comments_462 && (
                <div className="bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-surface)] border border-white/10 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-[var(--accent-green)]" />
                    <span>Visit Comments</span>
                  </h3>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <p className="text-white leading-relaxed whitespace-pre-wrap">
                      {customer.visit_comments_462}
                    </p>
                  </div>
                </div>
              )}

              {/* Remarks Section */}
              {(customer.remarks || customer.remark_9b8) && (
                <div className="bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-surface)] border border-white/10 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                    <MessageCircle className="w-5 h-5 text-blue-400" />
                    <span>Remarks</span>
                  </h3>
                  <div className="space-y-4">
                    {customer.remark_9b8 && (
                      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <p className="text-white leading-relaxed whitespace-pre-wrap">
                          {customer.remark_9b8}
                        </p>
                      </div>
                    )}
                    {customer.remarks && (
                      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <p className="text-white leading-relaxed whitespace-pre-wrap">
                          {customer.remarks}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* System Information */}
              <div className="bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-surface)] border border-white/10 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                  <Building className="w-5 h-5" />
                  <span>System Information</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <span className="text-white/60 text-sm">Created:</span>
                    <div className="text-white">
                      {formatDate(customer.createdAt)}
                    </div>
                  </div>
                  <div>
                    <span className="text-white/60 text-sm">Lead ID:</span>
                    <div className="text-white font-mono text-sm">
                      {customer.krisala_lead_id}
                    </div>
                  </div>
                  <div>
                    <span className="text-white/60 text-sm">Status:</span>
                    <div
                      className={`px-2 py-1 rounded-full text-xs inline-block ${
                        customer.is_active
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {customer.is_active ? "Active" : "Inactive"}
                    </div>
                  </div>
                </div>

                {/* Additional System Fields */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {customer.request_id && (
                      <div>
                        <span className="text-white/60 text-sm">
                          Request ID:
                        </span>
                        <div className="text-white font-mono text-xs break-all">
                          {customer.request_id}
                        </div>
                      </div>
                    )}
                    {customer.preferences && (
                      <div>
                        <span className="text-white/60 text-sm">
                          Preferences (Alt):
                        </span>
                        <div className="text-white text-sm">
                          {customer.preferences}
                        </div>
                      </div>
                    )}
                    {customer.project && (
                      <div>
                        <span className="text-white/60 text-sm">
                          Project (Alt):
                        </span>
                        <div className="text-white text-sm">
                          {customer.project}
                        </div>
                      </div>
                    )}
                    {customer.address_f6f61448 && (
                      <div>
                        <span className="text-white/60 text-sm">Address:</span>
                        <div className="text-white text-sm">
                          {customer.address_f6f61448}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-white/5 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-white/30" />
              </div>
              <h3 className="text-xl text-white/80 mb-2">Customer Not Found</h3>
              <p className="text-white/60">
                No customer found with phone number {phoneNumber}.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
