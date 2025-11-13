/**
 * Format price to Vietnamese Dong
 * @param {number} price
 * @returns {string}
 */
export const formatPrice = (price) => {
  if (!price) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

/**
 * Format price short (1,000,000 -> 1tr)
 * @param {number} price
 * @returns {string}
 */
export const formatPriceShort = (price) => {
  if (!price) return '0 ₫';
  
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)}tr ₫`;
  }
  
  if (price >= 1000) {
    return `${(price / 1000).toFixed(0)}k ₫`;
  }
  
  return `${price} ₫`;
};

/**
 * Parse price string to number
 * @param {string} priceStr
 * @returns {number}
 */
export const parsePrice = (priceStr) => {
  if (typeof priceStr === 'number') return priceStr;
  return parseInt(priceStr.replace(/[^0-9]/g, ''), 10) || 0;
};

