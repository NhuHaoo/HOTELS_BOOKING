const config = require('./env');

module.exports = {
  vnp_TmnCode: config.vnpay.tmnCode,
  vnp_HashSecret: config.vnpay.hashSecret,
  vnp_Url: config.vnpay.url,
  vnp_ReturnUrl: config.vnpay.returnUrl,
  vnp_ApiUrl: config.vnpay.apiUrl
};

