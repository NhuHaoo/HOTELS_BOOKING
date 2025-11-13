import { format, parseISO, differenceInDays, addDays, isAfter, isBefore } from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 * Format date to Vietnamese format
 * @param {Date|string} date
 * @param {string} formatStr
 * @returns {string}
 */
export const formatDate = (date, formatStr = 'dd/MM/yyyy') => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: vi });
};

/**
 * Format date to display format (e.g., "Thứ 2, 15/01/2024")
 * @param {Date|string} date
 * @returns {string}
 */
export const formatDateDisplay = (date) => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'EEEE, dd/MM/yyyy', { locale: vi });
};

/**
 * Calculate number of nights between two dates
 * @param {Date|string} checkIn
 * @param {Date|string} checkOut
 * @returns {number}
 */
export const calculateNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const checkInDate = typeof checkIn === 'string' ? parseISO(checkIn) : checkIn;
  const checkOutDate = typeof checkOut === 'string' ? parseISO(checkOut) : checkOut;
  return differenceInDays(checkOutDate, checkInDate);
};

/**
 * Get today date (start of day)
 * @returns {Date}
 */
export const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

/**
 * Get tomorrow date
 * @returns {Date}
 */
export const getTomorrow = () => {
  return addDays(getToday(), 1);
};

/**
 * Check if date is in the past
 * @param {Date|string} date
 * @returns {boolean}
 */
export const isPastDate = (date) => {
  if (!date) return false;
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isBefore(dateObj, getToday());
};

/**
 * Check if date is in the future
 * @param {Date|string} date
 * @returns {boolean}
 */
export const isFutureDate = (date) => {
  if (!date) return false;
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isAfter(dateObj, getToday());
};

/**
 * Format date range
 * @param {Date|string} startDate
 * @param {Date|string} endDate
 * @returns {string}
 */
export const formatDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return '';
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};

/**
 * Convert date to API format (YYYY-MM-DD)
 * @param {Date|string} date
 * @returns {string}
 */
export const toAPIFormat = (date) => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'yyyy-MM-dd');
};

