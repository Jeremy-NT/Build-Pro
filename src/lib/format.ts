import { format } from 'date-fns';

/**
 * Formats pricing figures consistently as Ghana Cedis (GH₵)
 * Spec: Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' })
 */
export const formatPrice = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null || isNaN(Number(value))) {
    return 'GH₵ 0.00';
  }
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  try {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    }).format(numericValue);
  } catch (error) {
    console.error('Error formatting price:', error);
    return `GH₵ ${numericValue.toFixed(2)}`;
  }
};

/**
 * Formats dates consistently as "MMM d, yyyy"
 */
export const formatDateString = (dateInput: string | Date | number | undefined | null): string => {
  if (!dateInput) return 'N/A';
  try {
    const d = new Date(dateInput);
    return format(d, 'MMM d, yyyy');
  } catch (e) {
    return 'Invalid Date';
  }
};

/**
 * Formats datetimes consistently as "MMM d, yyyy h:mm a"
 */
export const formatDateTimeString = (dateInput: string | Date | number | undefined | null): string => {
  if (!dateInput) return 'N/A';
  try {
    const d = new Date(dateInput);
    return format(d, 'MMM d, yyyy h:mm a');
  } catch (e) {
    return 'Invalid Date';
  }
};
