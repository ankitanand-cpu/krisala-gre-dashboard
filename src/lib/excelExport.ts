import * as XLSX from 'xlsx';
import { toNumber } from './utils';

export interface Customer {
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
  // GRE fields
  sourcing_manager?: string;
  cp_contact_number_67b?: string;
  channel_partner_representative_637?: string;
}

export interface ExportOptions {
  filterPeriod: string;
  searchTerm?: string;
  selectedMonth?: string;
}

export const formatBudget = (budget: number | string): string => {
  // Convert string to number if needed
  const budgetNum = toNumber(budget);
  
  if (budgetNum >= 10000000) {
    return `₹${(budgetNum / 10000000).toFixed(1)}Cr`;
  } else if (budgetNum >= 100000) {
    return `₹${(budgetNum / 100000).toFixed(1)}L`;
  } else {
    return `₹${budgetNum.toLocaleString()}`;
  }
};

export const formatVisitDates = (visitDates?: string[] | string | unknown): string => {
  if (!visitDates) {
    return '';
  }

  let dateArray: string[] = [];

  if (Array.isArray(visitDates)) {
    dateArray = visitDates;
  } else if (typeof visitDates === 'string') {
    dateArray = [visitDates];
  } else {
    return '';
  }

  const validDates = dateArray
    .filter((dateStr) => {
      if (!dateStr || typeof dateStr !== 'string') return false;
      const date = new Date(dateStr);
      return !isNaN(date.getTime());
    })
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (validDates.length === 0) {
    return '';
  }

  const mostRecentDate = new Date(validDates[0]);
  return mostRecentDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatPreferences = (preferences?: string[]): string => {
  if (!preferences || preferences.length === 0) {
    return '';
  }
  return preferences.join(', ');
};

export const formatSourceTags = (sourceTags?: string[]): string => {
  if (!sourceTags || sourceTags.length === 0) {
    return '';
  }
  return sourceTags.join(', ');
};

// --- Masking helpers ---
export const maskEmailForExport = (email: string): string => {
  if (!email) return '';
  const [user, domain] = email.split('@');
  if (!domain) return email;
  const masked = user.slice(0, 2) + '****' + user.slice(-1);
  return `${masked}@${domain}`;
};

export const maskPhoneForExport = (phone: string): string => {
  if (!phone) return '';
  if (phone.length < 4) return '****';
  return phone.slice(0, 2) + '******' + phone.slice(-2);
};

export interface ExportDataRow {
  'Customer ID': string;
  'Name': string;
  'Email': string;
  'Phone': string;
  'Sales Person': string;
  'Budget Interested': string | number;
  'Status': string;
  'Created Date': string;
  'Updated Date': string;
  'Buying Purpose': string;
  'Location': string;
  'Preferences': string;
  'Source Tags': string;
  'Closing Manager': string;
  'Last Visit Date': string;
  'Project Visited': string;
  'GRE Attended': string;
  'Visited With': string;
  'Visit Mode': string;
  'Visit Comments': string;
  'Remarks': string;
  'Channel Partner Name': string;
}

export const prepareCustomerDataForExport = (customers: Customer[]): ExportDataRow[] => {
  return customers.map((customer) => {
    // Handle budget - convert to string if it's a number
    let budgetInterested: string | number = '';
    if (customer.budget !== undefined && customer.budget !== null) {
      if (typeof customer.budget === 'number') {
        budgetInterested = customer.budget;
      } else if (typeof customer.budget === 'string') {
        // Keep as string for budget
        budgetInterested = customer.budget;
      }
    }
    
    // Combine remarks fields
    const remarks = [customer.remark_9b8, customer.remarks]
      .filter(Boolean)
      .join(' | ');
    
    // Get channel partner name (prefer channelPartner, fallback to channel_partner_0f8)
    const channelPartnerName = customer.channelPartner || customer.channel_partner_0f8 || '';
    
    // Explicitly create the export row with only the fields we want
    const exportRow: ExportDataRow = {
      'Customer ID': customer.id,
      'Name': customer.name,
      'Email': customer.email,
      'Phone': customer.phone,
      'Sales Person': customer.salesPerson || '',
      'Budget Interested': budgetInterested,
      'Status': customer.is_active ? 'Active' : 'Inactive',
      'Created Date': (() => {
        try {
          const date = new Date(customer.createdAt);
          return isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-US');
        } catch {
          return '';
        }
      })(),
      'Updated Date': customer.updatedAt ? (() => {
        try {
          const date = new Date(customer.updatedAt);
          return isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-US');
        } catch {
          return '';
        }
      })() : '',
      'Buying Purpose': customer.buying_purpose_19a51b85 || '',
      'Location': customer.location__ac1e6456 || '',
      'Preferences': formatPreferences(customer.preferrences_563),
      'Source Tags': formatSourceTags(customer.source_tags),
      'Closing Manager': customer.closing_manager_cb3 || '',
      'Last Visit Date': formatVisitDates(customer.visit_date_ed0),
      'Project Visited': customer.project_visited_b2b || '',
      'GRE Attended': customer.gre_attended_282 || '',
      'Visited With': customer.visited_with_95e || '',
      'Visit Mode': customer.site_visit_type_703 || '',
      'Visit Comments': customer.visit_comments_462 || '',
      'Remarks': remarks,
      'Channel Partner Name': channelPartnerName,
    };
    
    return exportRow;
  });
};

export const generateFileName = (options: ExportOptions, prefix: string = 'customers_export'): string => {
  const timestamp = new Date().toISOString().split('T')[0];
  const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  
  let filterSuffix = '';
  
  if (options.filterPeriod === 'specific-month' && options.selectedMonth) {
    const date = new Date(options.selectedMonth + '-01');
    filterSuffix = `_${date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
  } else if (options.filterPeriod === 'specific-date' && options.selectedMonth) {
    const date = new Date(options.selectedMonth + '-01');
    filterSuffix = `_${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  } else if (options.filterPeriod !== 'all') {
    filterSuffix = `_${options.filterPeriod}`;
  }
  
  if (options.searchTerm) {
    filterSuffix += `_search-${options.searchTerm.substring(0, 10)}`;
  }
  
  return `${prefix}_${timestamp}_${time}${filterSuffix}.xlsx`;
};

export const exportCustomersToExcel = (
  customers: Customer[],
  options: ExportOptions
): void => {
  try {
    // Prepare data for export
    const exportData = prepareCustomerDataForExport(customers);
    
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Create worksheet from data
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths for better readability
    const columnWidths = [
      { wch: 12 }, // Customer ID
      { wch: 25 }, // Name
      { wch: 30 }, // Email
      { wch: 15 }, // Phone
      { wch: 20 }, // Sales Person
      { wch: 20 }, // Budget Interested
      { wch: 10 }, // Status
      { wch: 12 }, // Created Date
      { wch: 12 }, // Updated Date
      { wch: 20 }, // Buying Purpose
      { wch: 20 }, // Location
      { wch: 30 }, // Preferences
      { wch: 20 }, // Source Tags
      { wch: 20 }, // Closing Manager
      { wch: 15 }, // Last Visit Date
      { wch: 25 }, // Project Visited
      { wch: 15 }, // GRE Attended
      { wch: 15 }, // Visited With
      { wch: 15 }, // Visit Mode
      { wch: 40 }, // Visit Comments
      { wch: 40 }, // Remarks
      { wch: 25 }, // Channel Partner Name
    ];
    
    worksheet['!cols'] = columnWidths;
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
    
    // Generate filename
    const fileName = generateFileName(options);
    
    // Write the file
    XLSX.writeFile(workbook, fileName);
    
    console.log(`Excel file exported successfully: ${fileName}`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Failed to export data to Excel');
  }
};

// =====================
// GRE-specific export
// =====================

export interface GREExportDataRow {
  'Client Name': string;
  'Contact (Masked)': string;
  'Email (Masked)': string;
  'Source': string;
  'CP Firm Name': string;
  'Booking For': string;
  'Executive Name': string;
  'Executive Number': string;
  'Sourcing Manager': string;
  'Closing Manager': string;
  'PAX': string;
}

export const prepareGREDataForExport = (customers: Customer[]): GREExportDataRow[] => {
  return customers.map((customer) => {
    const source = customer.source_tags && customer.source_tags.length > 0
      ? customer.source_tags.join(', ')
      : (customer.channelPartner ? 'Channel Partner' : 'Direct');

    const cpFirmName = customer.channelPartner || customer.channel_partner_0f8 || '';
    const bookingFor = formatPreferences(customer.preferrences_563) || '';
    const executiveName =
      customer.channel_partner_representative_637 ||
      customer.sourcing_manager ||
      customer.salesPerson ||
      '';
    const executiveNumber = customer.cp_contact_number_67b || '';
    const sourcingManager = customer.sourcing_manager || '';
    const closingManager = customer.closing_manager_cb3 || '';
    const pax = customer.visited_with_95e || '';

    return {
      'Client Name': customer.name,
      'Contact (Masked)': maskPhoneForExport(customer.phone),
      'Email (Masked)': maskEmailForExport(customer.email),
      'Source': source,
      'CP Firm Name': cpFirmName,
      'Booking For': bookingFor,
      'Executive Name': executiveName,
      'Executive Number': executiveNumber,
      'Sourcing Manager': sourcingManager,
      'Closing Manager': closingManager,
      'PAX': pax,
    };
  });
};

export const exportGRECustomersToExcel = (
  customers: Customer[],
  options: ExportOptions
): void => {
  try {
    const exportData = prepareGREDataForExport(customers);

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    const columnWidths = [
      { wch: 25 }, // Client Name
      { wch: 18 }, // Contact (Masked)
      { wch: 25 }, // Email (Masked)
      { wch: 20 }, // Source
      { wch: 35 }, // CP Firm Name
      { wch: 15 }, // Booking For
      { wch: 20 }, // Executive Name
      { wch: 18 }, // Executive Number
      { wch: 20 }, // Sourcing Manager
      { wch: 20 }, // Closing Manager
      { wch: 15 }, // PAX
    ];

    worksheet['!cols'] = columnWidths;
    XLSX.utils.book_append_sheet(workbook, worksheet, 'GRE Customers');

    const fileName = generateFileName(options, 'gre_customers');
    XLSX.writeFile(workbook, fileName);

    console.log(`GRE Excel file exported successfully: ${fileName}`);
  } catch (error) {
    console.error('Error exporting GRE data to Excel:', error);
    throw new Error('Failed to export GRE data to Excel');
  }
};
