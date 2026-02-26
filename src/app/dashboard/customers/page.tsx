"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, RefreshCw, AlertCircle, ArrowLeft, Search, Download, Printer } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import Header from "@/components/Header";
import { useRequireAuth } from "@/contexts/UserContext";
import { exportGRECustomersToExcel, ExportOptions, Customer as ExportCustomer } from "@/lib/excelExport";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  status: string;
  salesPerson: string;
  is_active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  budget?: number | string;
  budget_interested_c49?: number | string;
  buying_purpose_19a51b85?: string;
  location__ac1e6456?: string;
  preferrences_563?: string[];
  source_tags?: string[];
  closing_manager_cb3?: string;
  visit_date_ed0?: string[] | string;
  project_visited_b2b?: string;
  gre_attended_282?: string;
  visited_with_95e?: string;
  site_visit_type_703?: string;
  visit_comments_462?: string;
  remark_9b8?: string;
  remarks?: string;
  channelPartner?: string | null;
  channel_partner_0f8?: string;
  // New fields requested
  source?: string;
  cp_firm_name_0bf?: string;
  sourcing_manager?: string;
  cp_contact_number_67b?: string;
  // Mapped fields for display
  booking_for?: string; // Mapped from preferrences_563
  executive_name?: string; // Mapped from gre_attended_282? Or salesPerson? The user said "Executive Name". In the JSON "gre_attended_282": "Mohini Jadhav". Let's assume that or salesPerson. But wait, "salesPerson": "Arif Saifi" is also there. Let's look for "Executive". The JSON has "channel_partner_representative_637": "". Let's map Executive Name to Sales Person (Relationship Manager) or Sourcing Manager based on context, but user asked for "Executive Name". The prompt says: "Executive Name, Executive Number".
  // Looking at the JSON:
  // "salesPerson": "Arif Saifi"
  // "sourcing_manager": "Sanket Madhavi"
  // "closing_manager_cb3": "Arif Saifi"
  // "gre_attended_282": "Mohini Jadhav"
  // Let's use "salesPerson" as Executive Name for now as it's the primary contact usually, or "channel_partner_representative_637" if it's external.
  // Actually, usually "Sales Executive" is the sales person.
  // Let's use:
  // Executive Name -> salesPerson
  // Executive Number -> We need a field for this. The JSON has "cp_contact_number_67b": "9987257974".
  // Let's check if there is a sales person number. The JSON doesn't have it explicitly in the root.
  // We will use what's available.
  pax?: string; // Mapped from visited_with_95e? Or count of people? "visited_with_95e": "Family". It's a string.
}

export default function CustomersPage() {
  const { userData, isLoading, isLoaded, logout } = useRequireAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [customersLoading, setCustomersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const router = useRouter();

  const fetchCustomers = async (date: string) => {
    setCustomersLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `https://api.floorselector.convrse.ai/customer/krisala?date=${date}`,
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
      console.log("Customers data:", data.data || data); 
      const customerData = data.data || data;

      const normalizedCustomers = customerData.map((customer: Customer) => {
        if ((!customer.budget || customer.budget === 0 || customer.budget === '') && customer.budget_interested_c49) {
          customer.budget = customer.budget_interested_c49;
        }
        
        // Mapping for requested fields
        // Source
        // The JSON has "source_tags": ["Channel Partner"] and "source": null in the root, but "channelPartner" is populated.
        // We can use source_tags or channelPartner or source.
        let sourceDisplay = "Direct";
        if (customer.source_tags && customer.source_tags.length > 0) {
            sourceDisplay = customer.source_tags.join(", ");
        } else if (customer.channelPartner) {
            sourceDisplay = "Channel Partner";
        }
        customer.source = sourceDisplay;

        // Booking For (2BHK/1BHK) -> preferrences_563
        customer.booking_for = customer.preferrences_563 ? customer.preferrences_563.join(", ") : "N/A";

        // Executive Name -> salesPerson (This is usually the RM/Sales Executive)
        customer.executive_name = customer.salesPerson || "N/A";

        // Executive Number -> Not strictly in JSON root for salesPerson. 
        // We have "cp_contact_number_67b" for CP.
        // Let's leave it blank/dashed if not found, or use cp number if source is CP? 
        // The user request said "Executive Number".
        // Let's assume there is no field for Sales Person Number in this specific JSON snippet, 
        // but maybe "mobile" in a real scenario?
        // We will just show "N/A" or try to find a field.
        // Wait, the JSON user provided has "cp_contact_number_67b".
        
        // PAX -> visited_with_95e
        customer.pax = customer.visited_with_95e || "N/A";

        return customer;
      });

      setCustomers(normalizedCustomers);
      setFilteredCustomers(normalizedCustomers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setError("Failed to fetch customers data");
    } finally {
      setCustomersLoading(false);
    }
  };

  const searchCustomers = (customers: Customer[], term: string): Customer[] => {
    if (!term.trim()) {
      return customers;
    }

    const searchLower = term.toLowerCase();
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(searchLower) ||
      customer.email.toLowerCase().includes(searchLower) ||
      customer.phone.includes(searchLower) ||
      customer.salesPerson.toLowerCase().includes(searchLower)
    );
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    const filtered = searchCustomers(customers, term);
    setFilteredCustomers(filtered);
  };

  useEffect(() => {
    if (isLoaded && userData) {
      fetchCustomers(selectedDate);
    }
  }, [isLoaded, userData, selectedDate]);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  const refreshData = () => {
    fetchCustomers(selectedDate);
  };

  const goBack = () => {
    router.push("/dashboard");
  };

  const convertToExportFormat = (customers: Customer[]): ExportCustomer[] => {
    return customers.map(customer => {
      let budgetValue: number | string = '';
      if (customer.budget !== undefined && customer.budget !== null && customer.budget !== '' && customer.budget !== 0) {
        budgetValue = customer.budget;
      } else if (customer.budget_interested_c49 !== undefined && customer.budget_interested_c49 !== null && customer.budget_interested_c49 !== '' && customer.budget_interested_c49 !== 0) {
        budgetValue = customer.budget_interested_c49;
      }

      let isActive = false;
      if (customer.is_active !== undefined) {
        isActive = customer.is_active === true;
      } else if (customer.status) {
        const statusLower = String(customer.status).toLowerCase().trim();
        isActive = statusLower === 'active';
      }
      
      const createdAtDate = customer.createdAt || customer.date;
      const updatedAtDate = customer.updatedAt || customer.date;

      return {
        _id: customer.id,
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        salesPerson: customer.salesPerson,
        budget: budgetValue,
        nextMeetingDate: null,
        rating: 0,
        is_active: isActive,
        project_id: '',
        createdAt: createdAtDate,
        updatedAt: updatedAtDate,
        buying_purpose_19a51b85: customer.buying_purpose_19a51b85 || '',
        location__ac1e6456: customer.location__ac1e6456 || '',
        preferrences_563: customer.preferrences_563 || [],
        source_tags: customer.source_tags || [],
        closing_manager_cb3: customer.closing_manager_cb3 || '',
        visit_date_ed0: customer.visit_date_ed0 || [],
        project_visited_b2b: customer.project_visited_b2b || '',
        gre_attended_282: customer.gre_attended_282 || '',
        visited_with_95e: customer.visited_with_95e,
        site_visit_type_703: customer.site_visit_type_703,
        visit_comments_462: customer.visit_comments_462,
        remark_9b8: customer.remark_9b8,
        remarks: customer.remarks,
        channelPartner: customer.channelPartner || null,
        channel_partner_0f8: customer.channel_partner_0f8,
        sourcing_manager: customer.sourcing_manager,
        cp_contact_number_67b: customer.cp_contact_number_67b,
      };
    });
  };

  const handleDownloadExcel = async () => {
    if (filteredCustomers.length === 0) {
      alert("No data to export. Please adjust your search terms or select a different date.");
      return;
    }

    setIsExporting(true);
    try {
      const exportCustomers = convertToExportFormat(filteredCustomers);
      const exportOptions: ExportOptions = {
        filterPeriod: 'specific-date',
        searchTerm: searchTerm || undefined,
        selectedMonth: selectedDate.substring(0, 7),
      };

      exportGRECustomersToExcel(exportCustomers, exportOptions);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Masking functions
  const maskEmail = (email: string) => {
    if (!email) return "N/A";
    const [user, domain] = email.split("@");
    if (!domain) return email;
    const maskedUser = user.slice(0, 2) + "****" + user.slice(-1);
    return `${maskedUser}@${domain}`;
  };

  const maskPhone = (phone: string) => {
    if (!phone) return "N/A";
    if (phone.length < 4) return "****";
    return phone.slice(0, 2) + "******" + phone.slice(-2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading Customers..." />
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          [data-print-hide],
          [data-screen-only],
          [data-print-content] {
            display: none !important;
          }
          [data-print-grid] {
            display: block !important;
          }
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .min-h-screen {
            min-height: auto !important;
          }
          main {
            padding: 0 !important;
            max-width: 100% !important;
          }
          @page {
            margin: 1cm;
          }
        }
        @media screen {
          [data-print-grid] {
            display: none !important;
          }
        }
      `}</style>
      <div data-print-hide>
        <Header showLogout={true} onLogoutClick={logout} />
      </div>
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12">
        <div
          className={`transition-all duration-1000 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
        >
          <div className="mb-4 sm:mb-6 md:mb-8">
            <div data-print-hide className="flex items-center space-x-2 mb-2 sm:mb-3">
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
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                Customers by Date
              </h1>
            </div>
            <p className="text-sm sm:text-base text-white/80 mt-1 sm:mt-2">
              View and manage customer data for specific dates
            </p>
          </div>
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400">{error}</span>
            </div>
          )}
          <div className="mb-8">
            {/* Search and Date Controls */}
            <div data-print-hide className="bg-gradient-to-r from-[var(--bg-secondary)] to-[var(--bg-surface)] border border-white/10 rounded-2xl p-6 mb-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                {/* Search Bar */}
                <div className="flex-1">
                  <Label className="text-white/90 text-sm font-medium mb-3 block">
                    Search Customers
                  </Label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search by name, email, phone, sales person..."
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-4 pr-12 py-3 bg-[var(--bg-primary)] border-white/20 text-white placeholder-white/50 focus:border-[var(--accent-green)] focus:ring-2 focus:ring-[var(--accent-green)]/20 rounded-xl text-sm w-full shadow-inner"
                    />
                    <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--accent-green)]" />
                  </div>
                </div>

                {/* Date Filter */}
                <div className="flex flex-col">
                  <Label
                    htmlFor="date"
                    className="text-white/90 text-sm font-medium mb-3 block"
                  >
                    Select Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="bg-[var(--bg-primary)] border-white/20 text-white rounded-xl px-4 py-3 shadow-inner focus:border-[var(--accent-green)] focus:ring-2 focus:ring-[var(--accent-green)]/20 min-w-[180px]"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col items-center lg:items-end">
                  <Label className="text-white/90 text-sm font-medium mb-3 block lg:invisible">
                    Actions
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={refreshData}
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
                      disabled={isExporting || filteredCustomers.length === 0}
                    >
                      <Download
                        className={`w-4 h-4 mr-2 ${isExporting ? "animate-pulse" : ""
                          }`}
                      />
                      {isExporting ? "Exporting..." : "Download Excel"}
                    </Button>
                    <Button
                      onClick={handlePrint}
                      variant="outline"
                      className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-[var(--bg-primary)] px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-purple-400/20 transition-all duration-300"
                      disabled={filteredCustomers.length === 0}
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Print
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Customers List */}
            {customersLoading ? (
               <div className="flex flex-col items-center justify-center py-16 text-white">
                 <LoadingSpinner size="lg" text="Loading customers..." />
               </div>
            ) : filteredCustomers.length > 0 ? (
            <div className="grid grid-cols-1 gap-6" data-screen-only>
              {filteredCustomers.map((customer) => (
                <Card key={customer.id} data-print-content className="bg-[var(--bg-surface)] border border-white/10 text-white overflow-hidden">
                  <CardHeader className="bg-white/5 pb-3">
                    <CardTitle className="text-xl font-bold text-[var(--accent-green)]">
                      {customer.name}
                    </CardTitle>
                    <div className="text-sm text-white/60">
                      {maskEmail(customer.email)} • {maskPhone(customer.phone)}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    {/* Source */}
                    <div className="flex flex-col">
                      <span className="text-white/50 text-xs uppercase tracking-wider">Source</span>
                      <span className="font-medium">{customer.source}</span>
                    </div>

                    {/* CP Firm Name */}
                    {customer.channelPartner && (
                      <div className="flex flex-col">
                        <span className="text-white/50 text-xs uppercase tracking-wider">CP Firm Name</span>
                        <span className="font-medium">{customer.cp_firm_name_0bf || customer.channelPartner}</span>
                      </div>
                    )}

                    {/* Booking For */}
                    <div className="flex flex-col">
                         <span className="text-white/50 text-xs uppercase tracking-wider">Booking For</span>
                         <span className="font-medium">{customer.booking_for}</span>
                    </div>

                    {/* Executive Name */}
                    <div className="flex flex-col">
                        <span className="text-white/50 text-xs uppercase tracking-wider">Executive Name</span>
                        <span className="font-medium">{customer.executive_name}</span>
                    </div>

                    {/* Executive Number */}
                    <div className="flex flex-col">
                        <span className="text-white/50 text-xs uppercase tracking-wider">Executive Number</span>
                        <span className="font-medium">{customer.cp_contact_number_67b || "-"}</span>
                    </div>

                    {/* Sourcing Manager */}
                    <div className="flex flex-col">
                        <span className="text-white/50 text-xs uppercase tracking-wider">Sourcing Manager</span>
                        <span className="font-medium">{customer.sourcing_manager || "-"}</span>
                    </div>

                    {/* Closing Manager */}
                    <div className="flex flex-col">
                        <span className="text-white/50 text-xs uppercase tracking-wider">Closing Manager</span>
                        <span className="font-medium">{customer.closing_manager_cb3 || "-"}</span>
                    </div>

                    {/* PAX */}
                    <div className="flex flex-col">
                        <span className="text-white/50 text-xs uppercase tracking-wider">PAX</span>
                        <span className="font-medium">{customer.pax}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            ) : (
                <div className="text-center py-12 text-white/50">
                    No customers found for this date.
                </div>
            )}
            {!customersLoading && filteredCustomers.length > 0 && (
              <div data-print-grid className="mt-6">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="border px-2 py-1 text-left">Client Name</th>
                      <th className="border px-2 py-1 text-left">Contact (Masked)</th>
                      <th className="border px-2 py-1 text-left">Email (Masked)</th>
                      <th className="border px-2 py-1 text-left">Source</th>
                      <th className="border px-2 py-1 text-left">CP Firm Name</th>
                      <th className="border px-2 py-1 text-left">Booking For</th>
                      <th className="border px-2 py-1 text-left">Executive Name</th>
                      <th className="border px-2 py-1 text-left">Executive Number</th>
                      <th className="border px-2 py-1 text-left">Sourcing Manager</th>
                      <th className="border px-2 py-1 text-left">Closing Manager</th>
                      <th className="border px-2 py-1 text-left">PAX</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id}>
                        <td className="border px-2 py-1">{customer.name}</td>
                        <td className="border px-2 py-1">{maskPhone(customer.phone)}</td>
                        <td className="border px-2 py-1">{maskEmail(customer.email)}</td>
                        <td className="border px-2 py-1">{customer.source}</td>
                        <td className="border px-2 py-1">
                          {customer.cp_firm_name_0bf || customer.channelPartner || "-"}
                        </td>
                        <td className="border px-2 py-1">{customer.booking_for}</td>
                        <td className="border px-2 py-1">{customer.executive_name}</td>
                        <td className="border px-2 py-1">
                          {customer.cp_contact_number_67b || "-"}
                        </td>
                        <td className="border px-2 py-1">
                          {customer.sourcing_manager || "-"}
                        </td>
                        <td className="border px-2 py-1">
                          {customer.closing_manager_cb3 || "-"}
                        </td>
                        <td className="border px-2 py-1">
                          {customer.pax}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
