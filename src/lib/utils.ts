import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to convert string/number to number
export const toNumber = (value: number | string | undefined | null): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// Format budget with support for string or number
export const formatBudget = (budget: number | string): string => {
  const budgetNum = toNumber(budget);
  if (budgetNum >= 10000000) {
    return `₹${(budgetNum / 10000000).toFixed(1)}Cr`;
  } else if (budgetNum >= 100000) {
    return `₹${(budgetNum / 100000).toFixed(1)}L`;
  } else {
    return `₹${budgetNum.toLocaleString()}`;
  }
};

// Format currency with support for string or number
export const formatCurrency = (amount: number | string): string => {
  const amountNum = toNumber(amount);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amountNum);
};
