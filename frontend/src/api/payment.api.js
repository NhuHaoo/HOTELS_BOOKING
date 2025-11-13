import axiosClient from './axiosClient';

export const paymentAPI = {
  // Create VNPay payment
  // bankCode is optional - if not provided, VNPay will show all payment options
  createVNPayPayment: (bookingId, bankCode = null) => {
    const payload = { bookingId };
    // Only include bankCode if it's provided and not null
    if (bankCode) {
      payload.bankCode = bankCode;
    }
    return axiosClient.post('/payments/vnpay/create', payload);
  },

  // Check payment status
  checkPaymentStatus: (bookingId) => {
    return axiosClient.get(`/payments/status/${bookingId}`);
  },
};

