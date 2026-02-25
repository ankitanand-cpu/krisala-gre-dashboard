"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UserCheck,
  RefreshCw,
  AlertCircle,
  Filter,
  ArrowRight,
  ArrowLeft,
  Calendar,
  MapPin,
  Search,
  Phone,
  Mail,
  Building2,
  Star,
  TrendingUp,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import Header from "@/components/Header";
import { useRequireAuth } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportCustomersToExcel, ExportOptions } from "@/lib/excelExport";
import { formatBudget, toNumber } from "@/lib/utils";

interface Customer {
  _id: string;
  id: string;
  name: string;
  email: string;
  phone: string;
  salesPerson: string | null;
  budget: number | string;
  nextMeetingDate: string | null;
  rating: number | string;
  is_active: boolean;
  project_id: string;
  createdAt: string;
  updatedAt?: string;
  // Additional fields from the API
  buying_purpose_19a51b85?: string;
  location__ac1e6456?: string;
  budget_interested_c49?: string | number;
  preferrences_563?: string[];
  source_tags?: string[];
  closing_manager_cb3?: string;
  visit_date_ed0?: string[] | string;
  project_visited_b2b?: string;
  gre_attended_282?: string;
  // New visit fields
  visited_with_95e?: string;
  site_visit_type_703?: string;
  visit_comments_462?: string;
  // Remarks fields
  remark_9b8?: string;
  remarks?: string;
  // Channel Partner
  channelPartner?: string | null;
  channel_partner_0f8?: string;
}

type FilterPeriod = "all" | "today" | "week" | "month" | "specific-month";

interface FilterOption {
  value: FilterPeriod;
  label: string;
  description: string;
}

const filterOptions: FilterOption[] = [
  { value: "all", label: "All Time", description: "Show all customers" },
  { value: "today", label: "Today", description: "Customers added today" },
  { value: "week", label: "This Week", description: "Last 7 days" },
  { value: "month", label: "This Month", description: "Last 30 days" },
  {
    value: "specific-month",
    label: "Specific Month",
    description: "Choose any month/year",
  },
];

export default function AllCustomersPage() {
  const { userData, isLoading, isLoaded, logout } = useRequireAuth();
  const router = useRouter();
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().substring(0, 7) // Format: YYYY-MM
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // 300ms debounce delay
  const [displayedCustomers, setDisplayedCustomers] = useState<Customer[]>([]);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(30); // Default: 30 (multiple of 3)

  const getDateRangeForFilter = (
    period: FilterPeriod
  ): { startDate?: string; endDate?: string } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (period) {
      case "today":
        return {
          startDate: today.toISOString().split("T")[0],
          endDate: today.toISOString().split("T")[0],
        };
      case "week":
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return {
          startDate: weekAgo.toISOString().split("T")[0],
          endDate: today.toISOString().split("T")[0],
        };
      case "month":
        const monthAgo = new Date(today);
        monthAgo.setDate(today.getDate() - 30);
        return {
          startDate: monthAgo.toISOString().split("T")[0],
          endDate: today.toISOString().split("T")[0],
        };
      default:
        return {};
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
      return null;
    }

    // Always return the most recent valid date formatted
    const mostRecentDate = new Date(validDates[0]);

    return mostRecentDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filterCustomersByPeriod = useCallback(
    (
      customers: Customer[],
      period: FilterPeriod,
      specificMonth?: string
    ): Customer[] => {
      if (period === "all") {
        return customers;
      }

      if (period === "specific-month" && specificMonth) {
        const [year, month] = specificMonth.split("-");
        const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endOfMonth = new Date(
          parseInt(year),
          parseInt(month),
          0,
          23,
          59,
          59,
          999
        );

        return customers.filter((customer) => {
          const customerDate = new Date(customer.createdAt);
          return customerDate >= startOfMonth && customerDate <= endOfMonth;
        });
      }

      const { startDate, endDate } = getDateRangeForFilter(period);
      if (!startDate || !endDate) {
        return customers;
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end date

      return customers.filter((customer) => {
        const customerDate = new Date(customer.createdAt);
        return customerDate >= start && customerDate <= end;
      });
    },
    []
  );

  const fetchAllCustomers = useCallback(async () => {
    setCustomersLoading(true);
    setCustomersError(null);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        "https://api.floorselector.convrse.ai/customer/krisala",
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

      // Remove debug console logs for better performance
      const customers = Array.isArray(data) ? data : [];
      setAllCustomers(customers);
    } catch (error) {
      console.error("Error fetching all customers:", error);
      setCustomersError("Failed to fetch customers data");
    } finally {
      setCustomersLoading(false);
    }
  }, []);

  const refreshCustomers = () => {
    fetchAllCustomers();
  };

  const searchCustomers = useCallback(
    (customers: Customer[], term: string): Customer[] => {
      if (!term.trim()) {
        return customers;
      }

      const searchLower = term.toLowerCase();
      // Use more efficient filtering with early returns
      return customers.filter((customer) => {
        // Check name first (most common search)
        if (customer.name?.toLowerCase().includes(searchLower)) return true;
        // Check email
        if (customer.email?.toLowerCase().includes(searchLower)) return true;
        // Check phone (no toLowerCase needed for numbers)
        if (customer.phone?.includes(searchLower)) return true;
        // Check sales person
        if (customer.salesPerson?.toLowerCase().includes(searchLower)) return true;
        // Check location
        if (customer.location__ac1e6456?.toLowerCase().includes(searchLower)) return true;
        // Check project visited
        if (customer.project_visited_b2b?.toLowerCase().includes(searchLower)) return true;
        return false;
      });
    },
    []
  );

  // Memoize filtered customers by date period
  const dateFilteredCustomers = useMemo(() => {
    return filterCustomersByPeriod(
      allCustomers,
      filterPeriod,
      selectedMonth
    );
  }, [allCustomers, filterPeriod, selectedMonth, filterCustomersByPeriod]);

  // Memoize final displayed customers with debounced search
  const finalDisplayedCustomers = useMemo(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setIsSearching(true);
    }
    return searchCustomers(dateFilteredCustomers, debouncedSearchTerm);
  }, [dateFilteredCustomers, debouncedSearchTerm, searchCustomers, searchTerm]);

  // Update displayed customers when final result changes
  useEffect(() => {
    setDisplayedCustomers(finalDisplayedCustomers);
    setIsSearching(false);
    // Reset to first page when filters or search change
    setCurrentPage(1);
  }, [finalDisplayedCustomers]);

  // Calculate pagination
  const totalPages = Math.ceil(displayedCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCustomers = useMemo(() => {
    return displayedCustomers.slice(startIndex, endIndex);
  }, [displayedCustomers, startIndex, endIndex]);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1); // Reset to first page
  };

  const handleFilterChange = (period: FilterPeriod) => {
    setFilterPeriod(period);
    // Will be handled by useEffect
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    // Will be handled by useEffect
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    // Will be handled by useEffect
  };

  const getFilterDisplayText = () => {
    if (filterPeriod === "specific-month") {
      const date = new Date(selectedMonth + "-01");
      return date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    }
    return filterOptions.find((opt) => opt.value === filterPeriod)?.label;
  };

  const handleCustomerClick = (customer: Customer) => {
    if (customer.salesPerson) {
      const urlFriendlySalesPerson = customer.salesPerson
        .toLowerCase()
        .replace(/\s+/g, "-");
      router.push(
        `/dashboard/sales-people/${urlFriendlySalesPerson}/customers/${customer.phone}`
      );
    }
  };


  const goBack = () => {
    router.push("/dashboard");
  };

  const handleDownloadExcel = async () => {
    if (displayedCustomers.length === 0) {
      alert("No data to export. Please adjust your filters or search terms.");
      return;
    }

    setIsExporting(true);
    try {
      const exportOptions: ExportOptions = {
        filterPeriod,
        searchTerm: searchTerm || undefined,
        selectedMonth: filterPeriod === "specific-month" ? selectedMonth : undefined,
      };

      exportCustomersToExcel(displayedCustomers, exportOptions);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (isLoaded && userData) {
      fetchAllCustomers();
    }
  }, [isLoaded, userData, fetchAllCustomers]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading All Customers..." />
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Header showLogout={true} onLogoutClick={logout} />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12">
        <div
          className={`transition-all duration-1000 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
        >
          {/* Header Section */}
          <div className="mb-6 sm:mb-8">
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
              <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                All Customers
              </h1>
            </div>
            <p className="text-sm sm:text-base text-white/80 mt-1 sm:mt-2">
              View and manage all customer data with advanced filtering options
            </p>
          </div>

          {/* Error Display */}
          {customersError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400">{customersError}</span>
            </div>
          )}

          {/* Search and Filter Controls */}
          <div className="mb-8">
            {/* Search Section */}
            <div className="bg-gradient-to-r from-[var(--bg-secondary)] to-[var(--bg-surface)] border border-white/10 rounded-2xl p-6 mb-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                {/* Search Bar */}
                <div className="flex-1">
                  <Label className="text-white/90 text-sm font-medium mb-3 block">
                    Search Customers
                  </Label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search by name, email, phone, sales person, location..."
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-4 pr-12 py-3 bg-[var(--bg-primary)] border-white/20 text-white placeholder-white/50 focus:border-[var(--accent-green)] focus:ring-2 focus:ring-[var(--accent-green)]/20 rounded-xl text-sm w-full shadow-inner"
                    />
                    {isSearching ? (
                      <RefreshCw className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--accent-green)] animate-spin" />
                    ) : (
                      <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--accent-green)]" />
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col items-center lg:items-end">
                  <Label className="text-white/90 text-sm font-medium mb-3 block lg:invisible">
                    Actions
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={refreshCustomers}
                      variant="outline"
                      className="border-[var(--accent-green)] text-[var(--accent-green)] hover:bg-[var(--accent-green)] hover:text-[var(--bg-primary)] px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-[var(--accent-green)]/20 transition-all duration-300"
                      disabled={customersLoading}
                    >
                      <RefreshCw
                        className={`w-4 h-4 mr-2 ${customersLoading ? "animate-spin" : ""
                          }`}
                      />
                      Refresh Data
                    </Button>
                    <Button
                      onClick={handleDownloadExcel}
                      variant="outline"
                      className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-[var(--bg-primary)] px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-blue-400/20 transition-all duration-300"
                      disabled={isExporting || displayedCustomers.length === 0}
                    >
                      <Download
                        className={`w-4 h-4 mr-2 ${isExporting ? "animate-pulse" : ""
                          }`}
                      />
                      {isExporting ? "Exporting..." : "Download Excel"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="bg-gradient-to-r from-[var(--bg-surface)] to-[var(--bg-secondary)] border border-white/10 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Filter Dropdown */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <Label className="text-white/90 text-sm font-medium whitespace-nowrap">
                    Time Period:
                  </Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 hover:border-[var(--accent-green)] min-w-[160px] justify-between px-4 py-2 rounded-xl"
                      >
                        <div className="flex items-center space-x-2">
                          <Filter className="w-4 h-4 text-[var(--accent-green)]" />
                          <span className="text-sm font-medium truncate">
                            {getFilterDisplayText()}
                          </span>
                        </div>
                        <ArrowRight className="w-3 h-3 rotate-90" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[var(--bg-surface)] border-white/20 min-w-[220px] rounded-xl shadow-2xl">
                      {filterOptions.map((option) => (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() => handleFilterChange(option.value)}
                          className={`text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer rounded-lg m-1 p-3 ${filterPeriod === option.value
                              ? "bg-[var(--accent-green)]/20 text-[var(--accent-green)]"
                              : ""
                            }`}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{option.label}</span>
                            <span className="text-xs text-white/60">
                              {option.description}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Month Picker - only show when specific month is selected */}
                {filterPeriod === "specific-month" && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <Label className="text-white/90 text-sm font-medium whitespace-nowrap">
                      Select Month:
                    </Label>
                    <Input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => handleMonthChange(e.target.value)}
                      className="bg-[var(--bg-primary)] border-white/20 text-white rounded-xl px-4 py-2 shadow-inner focus:border-[var(--accent-green)] focus:ring-2 focus:ring-[var(--accent-green)]/20"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Customer List */}
          <Card className="bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-secondary)] border border-white/10 shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[var(--bg-primary)] to-[var(--bg-secondary)] border-b border-white/10 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-green)] to-green-400 flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-6 h-6 text-[var(--bg-primary)]" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-white font-bold">
                      Customer Directory
                    </CardTitle>
                    <CardDescription className="text-white/70 text-base mt-1">
                      {displayedCustomers.length > itemsPerPage ? (
                        <>
                          Showing {startIndex + 1}-{Math.min(endIndex, displayedCustomers.length)} of {displayedCustomers.length} filtered
                          {displayedCustomers.length !== allCustomers.length && ` (${allCustomers.length} total)`}
                        </>
                      ) : (
                        <>
                          Showing {displayedCustomers.length} of{" "}
                          {allCustomers.length} total customers
                        </>
                      )}
                      {(filterPeriod !== "all" || searchTerm) && (
                        <span className="text-[var(--accent-green)] ml-1 font-medium">
                          •{searchTerm && ` matching "${searchTerm}"`}
                          {searchTerm && filterPeriod !== "all" && " in "}
                          {filterPeriod !== "all" &&
                            ` filtered by ${filterPeriod === "specific-month"
                              ? new Date(selectedMonth + "-01")
                                .toLocaleDateString("en-US", {
                                  month: "long",
                                  year: "numeric",
                                })
                                .toLowerCase()
                              : filterOptions
                                .find((opt) => opt.value === filterPeriod)
                                ?.label.toLowerCase()
                            }`}
                        </span>
                      )}
                    </CardDescription>
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
            </CardHeader>
            <CardContent className="p-6">
              {customersLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--accent-green)] to-green-400 flex items-center justify-center mb-4 animate-pulse">
                    <UserCheck className="w-8 h-8 text-[var(--bg-primary)]" />
                  </div>
                  <LoadingSpinner size="md" text="Loading customer data..." />
                  <p className="text-white/60 text-sm mt-2">
                    Fetching latest customer information
                  </p>
                </div>
              ) : displayedCustomers.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {paginatedCustomers.map((customer) => (
                      <Card
                        key={customer._id}
                        className="group relative overflow-hidden bg-gradient-to-br from-[var(--bg-secondary)] via-[var(--bg-surface)] to-[var(--bg-secondary)] border border-white/10 hover:border-[var(--accent-green)]/50 transition-all duration-500 hover:shadow-2xl hover:shadow-[var(--accent-green)]/20 hover:scale-[1.02] cursor-pointer"
                        onClick={() => handleCustomerClick(customer)}
                      >
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-green)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <CardContent className="relative p-6">
                          {/* Header with name and budget */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-white group-hover:text-[var(--accent-green)] transition-colors duration-300 truncate">
                                {customer.name}
                              </h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <div className="w-2 h-2 bg-[var(--accent-green)] rounded-full animate-pulse"></div>
                                <span className="text-xs text-[var(--accent-green)] font-medium">
                                  Active Lead
                                </span>
                              </div>
                            </div>
                            {toNumber(customer.budget) > 0 && (
                              <div className="flex flex-col items-end">
                                <Badge className="bg-gradient-to-r from-[var(--accent-green)] to-green-400 text-[var(--bg-primary)] text-xs font-bold px-3 py-1 shadow-lg">
                                  {formatBudget(customer.budget)}
                                </Badge>
                                <span className="text-xs text-white/50 mt-1">
                                  Budget
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Contact Information */}
                          <div className="space-y-3 mb-4">
                            <div className="flex items-center space-x-3 p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors duration-300">
                              <div className="w-8 h-8 rounded-full bg-[var(--accent-green)]/20 flex items-center justify-center">
                                <Mail className="w-4 h-4 text-[var(--accent-green)]" />
                              </div>
                              <p className="text-sm text-white/90 truncate flex-1">
                                {customer.email}
                              </p>
                            </div>

                            <div className="flex items-center space-x-3 p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors duration-300">
                              <div className="w-8 h-8 rounded-full bg-[var(--accent-green)]/20 flex items-center justify-center">
                                <Phone className="w-4 h-4 text-[var(--accent-green)]" />
                              </div>
                              <p className="text-sm text-white/90">
                                {customer.phone}
                              </p>
                            </div>

                            {customer.salesPerson && (
                              <div className="flex items-center space-x-3 p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors duration-300">
                                <div className="w-8 h-8 rounded-full bg-[var(--accent-green)]/20 flex items-center justify-center">
                                  <UserCheck className="w-4 h-4 text-[var(--accent-green)]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-white/60">
                                    Relationship Manager
                                  </p>
                                  <p className="text-sm text-white/90 truncate font-medium">
                                    {customer.salesPerson}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Location and Visit Info */}
                          <div className="space-y-2 mb-4">
                            {customer.location__ac1e6456 && (
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-3 h-3 text-[var(--accent-green)]" />
                                <span className="text-xs text-white/70">
                                  Location:
                                </span>
                                <span className="text-xs text-white/90 font-medium">
                                  {customer.location__ac1e6456}
                                </span>
                              </div>
                            )}

                            {formatVisitDates(customer.visit_date_ed0) && (
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-3 h-3 text-[var(--accent-green)]" />
                                <span className="text-xs text-white/70">
                                  Last Visit:
                                </span>
                                <span className="text-xs text-white/90 font-medium">
                                  {formatVisitDates(customer.visit_date_ed0)}
                                </span>
                              </div>
                            )}

                            {customer.project_visited_b2b && (
                              <div className="flex items-center space-x-2">
                                <Building2 className="w-3 h-3 text-[var(--accent-green)]" />
                                <span className="text-xs text-white/70">
                                  Project:
                                </span>
                                <span className="text-xs text-white/90 font-medium truncate">
                                  {customer.project_visited_b2b}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Preferences */}
                          {customer.preferrences_563 &&
                            customer.preferrences_563.length > 0 && (
                              <div className="border-t border-white/10 pt-3">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Star className="w-3 h-3 text-[var(--accent-green)]" />
                                  <span className="text-xs text-white/70 font-medium">
                                    Preferences
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {customer.preferrences_563
                                    .slice(0, 3)
                                    .map((pref, index) => (
                                      <Badge
                                        key={index}
                                        variant="outline"
                                        className="text-xs border-[var(--accent-green)]/30 text-[var(--accent-green)] bg-[var(--accent-green)]/10 px-2 py-0.5 hover:bg-[var(--accent-green)]/20 transition-colors duration-200"
                                      >
                                        {pref}
                                      </Badge>
                                    ))}
                                  {customer.preferrences_563.length > 3 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs border-white/30 text-white/70 px-2 py-0.5"
                                    >
                                      +{customer.preferrences_563.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Action indicator */}
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="w-8 h-8 rounded-full bg-[var(--accent-green)] flex items-center justify-center shadow-lg">
                              <ArrowRight className="w-4 h-4 text-[var(--bg-primary)]" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {displayedCustomers.length > itemsPerPage && (
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10">
                      {/* Items per page selector */}
                      <div className="flex items-center gap-3">
                        <Label className="text-white/70 text-sm">Items per page:</Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className="border-white/20 text-white hover:bg-white/10 min-w-[80px]"
                            >
                              {itemsPerPage}
                            </Button>
                          </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[var(--bg-surface)] border-white/20">
                          <DropdownMenuItem
                            onClick={() => handleItemsPerPageChange(30)}
                            className="text-white hover:bg-white/10"
                          >
                            30
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleItemsPerPageChange(60)}
                            className="text-white hover:bg-white/10"
                          >
                            60
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleItemsPerPageChange(90)}
                            className="text-white hover:bg-white/10"
                          >
                            90
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleItemsPerPageChange(120)}
                            className="text-white hover:bg-white/10"
                          >
                            120
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleItemsPerPageChange(150)}
                            className="text-white hover:bg-white/10"
                          >
                            150
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Page info */}
                      <div className="text-white/70 text-sm">
                        Showing {startIndex + 1} to {Math.min(endIndex, displayedCustomers.length)} of {displayedCustomers.length} customers
                      </div>

                      {/* Page navigation */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>

                        {/* Page numbers */}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum: number;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }

                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(pageNum)}
                                className={
                                  currentPage === pageNum
                                    ? "bg-[var(--accent-green)] text-[var(--bg-primary)] hover:bg-[var(--accent-green)]/90"
                                    : "border-white/20 text-white hover:bg-white/10"
                                }
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center mb-6">
                    <Search className="w-10 h-10 text-white/30" />
                  </div>
                  <h3 className="text-xl text-white/80 font-semibold mb-2">
                    {searchTerm ? "No Matches Found" : "No Customers Found"}
                  </h3>
                  <p className="text-white/60 text-center max-w-md">
                    {searchTerm ? (
                      <>
                        No customers found matching{" "}
                        <span className="text-[var(--accent-green)] font-medium">
                          &ldquo;{searchTerm}&rdquo;
                        </span>
                        . Try adjusting your search terms.
                      </>
                    ) : filterPeriod === "all" ? (
                      "No customers are currently available in the system."
                    ) : (
                      <>
                        No customers found for{" "}
                        <span className="text-[var(--accent-green)] font-medium">
                          {filterPeriod === "specific-month"
                            ? new Date(
                              selectedMonth + "-01"
                            ).toLocaleDateString("en-US", {
                              month: "long",
                              year: "numeric",
                            })
                            : filterOptions.find(
                              (opt) => opt.value === filterPeriod
                            )?.label}
                        </span>
                        . Try selecting a different time period.
                      </>
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
