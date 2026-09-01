import { format } from 'date-fns';

export const formatPrice = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return 'GH₵ 0.00';
  }

  const numericValue = typeof value === 'string' ? parseFloat(value) : value;

  try {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(numericValue);
  } catch {
    return `GH₵ ${numericValue.toFixed(2)}`;
  }
};

export const formatPriceCompact = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return 'GH₵ 0';
  }

  const numericValue = typeof value === 'string' ? parseFloat(value) : value;

  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    maximumFractionDigits: 0,
  })
    .format(numericValue)
    .replace('GHS', 'GH₵')
    .replace('GH₵ ', 'GH₵ ');
};

export const formatDateString = (dateInput: string | Date | number | undefined | null): string => {
  if (!dateInput) return 'N/A';
  try {
    return format(new Date(dateInput), 'MMM d, yyyy');
  } catch {
    return 'Invalid Date';
  }
};

export const formatDateTimeString = (dateInput: string | Date | number | undefined | null): string => {
  if (!dateInput) return 'N/A';
  try {
    return format(new Date(dateInput), 'MMM d, yyyy h:mm a');
  } catch {
    return 'Invalid Date';
  }
};
