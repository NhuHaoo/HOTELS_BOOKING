const crypto = require('crypto');
const querystring = require('qs');
const moment = require('moment');
const vnpayConfig = require('../config/vnpay');

// Sort object keys
function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
  }
  return sorted;
}

// Create VNPay payment URL
exports.createPaymentUrl = (bookingData) => {
  const date = new Date();
  const createDate = moment(date).format('YYYYMMDDHHmmss');
  const orderId = moment(date).format('DDHHmmss');
  
  let vnp_Params = {};
  vnp_Params['vnp_Version'] = '2.1.0';
  vnp_Params['vnp_Command'] = 'pay';
  vnp_Params['vnp_TmnCode'] = vnpayConfig.vnp_TmnCode;
  vnp_Params['vnp_Locale'] = bookingData.locale || 'vn';
  vnp_Params['vnp_CurrCode'] = 'VND';
  vnp_Params['vnp_TxnRef'] = bookingData.bookingCode || orderId;
  vnp_Params['vnp_OrderInfo'] = bookingData.orderInfo || 'Thanh toan dat phong';
  vnp_Params['vnp_OrderType'] = 'billpayment';
  vnp_Params['vnp_Amount'] = bookingData.amount * 100; // VNPay requires amount in smallest currency unit
  vnp_Params['vnp_ReturnUrl'] = vnpayConfig.vnp_ReturnUrl;
  vnp_Params['vnp_IpAddr'] = bookingData.ipAddr || '127.0.0.1';
  vnp_Params['vnp_CreateDate'] = createDate;
  
  // Only add bankCode if provided and not empty
  if (bookingData.bankCode && bookingData.bankCode.trim() !== '') {
    vnp_Params['vnp_BankCode'] = bookingData.bankCode;
    console.log('Adding bankCode to VNPay params:', bookingData.bankCode);
  } else {
    console.log('No bankCode provided - VNPay will show payment method selection');
  }

  console.log('VNPay Params before sorting:', JSON.stringify(vnp_Params, null, 2));

  vnp_Params = sortObject(vnp_Params);

  const signData = querystring.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  vnp_Params['vnp_SecureHash'] = signed;

  const paymentUrl = vnpayConfig.vnp_Url + '?' + querystring.stringify(vnp_Params, { encode: false });

  return paymentUrl;
};

// Verify VNPay return URL
exports.verifyReturnUrl = (vnpParams) => {
  const secureHash = vnpParams['vnp_SecureHash'];

  delete vnpParams['vnp_SecureHash'];
  delete vnpParams['vnp_SecureHashType'];

  const sortedParams = sortObject(vnpParams);
  const signData = querystring.stringify(sortedParams, { encode: false });
  const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  return secureHash === signed;
};

// Check transaction status
exports.checkTransactionStatus = (vnpParams) => {
  const responseCode = vnpParams['vnp_ResponseCode'];
  
  if (responseCode === '00') {
    return {
      success: true,
      message: 'Transaction successful'
    };
  } else {
    return {
      success: false,
      message: getResponseMessage(responseCode)
    };
  }
};

// Get response message based on response code
function getResponseMessage(code) {
  const messages = {
    '00': 'Giao dịch thành công',
    '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
    '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
    '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
    '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
    '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
    '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP).',
    '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
    '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
    '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
    '75': 'Ngân hàng thanh toán đang bảo trì.',
    '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định.',
    '99': 'Các lỗi khác'
  };

  return messages[code] || 'Lỗi không xác định';
}

