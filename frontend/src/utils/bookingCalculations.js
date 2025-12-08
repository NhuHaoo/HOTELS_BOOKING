/**
 * Tính toán chi tiết tiền booking
 * @param {Object} booking - Booking object từ backend
 * @returns {Object} Chi tiết tính toán tiền
 */
export const calcBookingMoney = (booking) => {
  const pricePerNight = booking.pricePerNight || 0;
  const nights = booking.nights || 0;
  const roomTotal = pricePerNight * nights;

  const changeFee = Math.max(booking.changeFeeAmount || 0, 0);
  const surcharge = Math.max(booking.surchargeAmount || 0, 0);
  const discount = Math.max(booking.discountAmount || 0, 0);

  // Đảm bảo total không bao giờ âm
  const total = Math.max(roomTotal + changeFee + surcharge - discount, 0);
  const paid = Math.max(booking.paidAmount || 0, 0);
  const isPaid = paid >= total && total > 0;

  return {
    pricePerNight,
    nights,
    roomTotal,
    changeFee,
    surcharge,
    discount,
    total,
    paid,
    isPaid,
  };
};

/**
 * Tính trạng thái thanh toán của booking
 * @param {Object} booking - Booking object từ backend
 * @returns {Object} Trạng thái thanh toán
 */
export const getPaymentStatus = (booking) => {
  // LUÔN ưu tiên dùng totalAmount và paidAmount từ backend
  // Chỉ fallback khi thực sự không có (null hoặc undefined)
  let total, paid;
  
  // Kiểm tra xem có totalAmount và paidAmount từ backend không
  // Chấp nhận cả giá trị 0 (vì có thể booking chưa thanh toán)
  const hasTotalAmount = booking.totalAmount !== null && booking.totalAmount !== undefined;
  const hasPaidAmount = booking.paidAmount !== null && booking.paidAmount !== undefined;
  
  if (hasTotalAmount && hasPaidAmount) {
    // Dùng trực tiếp từ backend
    total = Number(booking.totalAmount) || 0;
    paid = Number(booking.paidAmount) || 0;
  } else {
    // Fallback: tính từ calcBookingMoney (cho booking cũ chưa có totalAmount/paidAmount)
    const calc = calcBookingMoney(booking);
    total = Math.max(calc.total, 0); // Đảm bảo không bao giờ âm
    paid = Math.max(calc.paid, 0);
    
    // Nếu paymentStatus = 'paid' nhưng paidAmount chưa có, set paid = total
    if (booking.paymentStatus === 'paid' && !hasPaidAmount) {
      paid = total;
    }
  }
  
  // Đảm bảo total không bao giờ âm
  if (total < 0) {
    total = 0;
  }
  
  // Đảm bảo paid không bao giờ > total
  if (paid > total) {
    paid = total;
  }
  
  // Đảm bảo paid không bao giờ âm
  if (paid < 0) {
    paid = 0;
  }
  
  // Xử lý trường hợp đặc biệt: paymentStatus = 'paid' nhưng paidAmount = 0
  // → Có thể là booking cũ, set paid = total
  if (booking.paymentStatus === 'paid' && paid === 0 && total > 0) {
    paid = total;
  }
  
  // Xử lý trường hợp đặc biệt: paymentStatus = 'refunded' → đã thanh toán đủ, sau đó hoàn lại
  if (booking.paymentStatus === 'refunded' && paid === 0 && total > 0) {
    paid = total; // Đã trả đủ, sau đó hoàn lại
  }
  
  const outstanding = Math.max(total - paid, 0); // số tiền còn thiếu
  
  let status; // 'paid' | 'partial' | 'unpaid'
  if (outstanding === 0 && total > 0) {
    status = 'paid';
  } else if (paid === 0 && total > 0) {
    status = 'unpaid';
  } else if (outstanding > 0) {
    status = 'partial'; // đã trả một phần
  } else {
    status = 'paid'; // total = 0 hoặc đã trả đủ
  }
  
  return { total, paid, outstanding, status };
};

