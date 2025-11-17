/**
 * Date utilities for consistent Bangkok timezone handling
 */

const BANGKOK_TZ = 'Asia/Bangkok';

/**
 * Format date in Bangkok timezone
 * @param {Date|string} date - The date to format
 * @param {string} locale - Locale to use (default: 'th-TH')
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDate(date, locale = 'th-TH', options = {}) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString(locale, {
    ...options,
    timeZone: BANGKOK_TZ
  });
}

/**
 * Get month name in Bangkok timezone
 * @param {Date|string} date - The date
 * @param {string} locale - Locale ('th-TH' or 'en-US')
 * @returns {string} Month name
 */
export function getMonthName(date, locale = 'th-TH') {
  return formatDate(date, locale, { month: 'long' });
}

/**
 * Format date with time in Bangkok timezone
 * @param {Date|string} date - The date to format
 * @param {string} locale - Locale to use (default: 'th-TH')
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted datetime string
 */
export function formatDateTime(date, locale = 'th-TH', options = {}) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString(locale, {
    ...options,
    timeZone: BANGKOK_TZ
  });
}

/**
 * Get current date/time in Bangkok timezone
 * @returns {Date} Current date in Bangkok timezone
 */
export function nowInBangkok() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: BANGKOK_TZ }));
}

export default {
  formatDate,
  getMonthName,
  formatDateTime,
  nowInBangkok,
  BANGKOK_TZ
};
