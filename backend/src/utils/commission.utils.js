/**
 * Utility functions for calculating commission and settlement
 */

/**
 * Calculate commission and settlement amount
 * @param {Number} originalTotal - Giá gốc trước khi giảm giá (originalTotal)
 * @param {Number} commissionRate - Tỷ lệ commission (%)
 * @returns {Object} { commission, settlement, rate }
 */
const calculateCommission = (originalTotal, commissionRate) => {
  if (!originalTotal || originalTotal <= 0) {
    return {
      commission: 0,
      settlement: 0,
      rate: commissionRate || 0
    };
  }

  const rate = commissionRate || 15; // Default 15%
  const commission = Math.round((originalTotal * rate) / 100);
  const settlement = Math.round(originalTotal - commission);

  return {
    commission,
    settlement,
    rate
  };
};

/**
 * Calculate actual profit (commission - discount cost)
 * @param {Number} commissionAmount - Số tiền commission
 * @param {Number} discountAmount - Số tiền khuyến mãi (chi phí)
 * @returns {Number} Lợi nhuận thực tế
 */
const calculateActualProfit = (commissionAmount, discountAmount = 0) => {
  const profit = commissionAmount - (discountAmount || 0);
  return Math.max(0, profit); // Không cho lợi nhuận âm
};

module.exports = {
  calculateCommission,
  calculateActualProfit
};

