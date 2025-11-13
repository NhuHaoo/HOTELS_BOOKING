const Booking = require('../models/Booking');
const { createPaymentUrl, verifyReturnUrl, checkTransactionStatus } = require('../utils/vnpay.utils');
const env = require('../config/env');

// @desc    Create VNPay payment URL
// @route   POST /api/payments/vnpay/create
// @access  Private
exports.createVNPayPayment = async (req, res) => {
  try {
    const { bookingId, bankCode } = req.body;

    // Get booking
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking
    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to pay for this booking'
      });
    }

    // Check if already paid
    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already paid'
      });
    }

    // Get client IP (handle IPv6 and ensure valid format)
    let ipAddr = req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress ||
      '127.0.0.1';
    
    // If multiple IPs, get the first one
    if (ipAddr.includes(',')) {
      ipAddr = ipAddr.split(',')[0].trim();
    }
    
    // Convert IPv6 localhost to IPv4
    if (ipAddr === '::1' || ipAddr === '::ffff:127.0.0.1') {
      ipAddr = '127.0.0.1';
    }
    
    // Remove IPv6 prefix if exists
    if (ipAddr.startsWith('::ffff:')) {
      ipAddr = ipAddr.substring(7);
    }
    
    console.log('Client IP Address:', ipAddr);

    // Prepare payment data
    const paymentData = {
      amount: booking.totalPrice,
      bookingCode: booking.bookingCode,
      orderInfo: `Thanh toan dat phong ${booking.bookingCode}`,
      ipAddr: ipAddr,
      locale: 'vn'
    };

    // Only add bankCode if it's provided and not empty
    if (bankCode && bankCode.trim() !== '') {
      paymentData.bankCode = bankCode;
    }

    // Create payment URL
    const paymentUrl = createPaymentUrl(paymentData);

    // Log for debugging
    console.log('=== VNPay Payment Creation ===');
    console.log('Booking ID:', bookingId);
    console.log('Booking Code:', booking.bookingCode);
    console.log('Amount:', booking.totalPrice);
    console.log('BankCode:', paymentData.bankCode || 'NOT PROVIDED');
    console.log('Payment URL:', paymentUrl);
    console.log('===============================');

    res.status(200).json({
      success: true,
      message: 'Payment URL created successfully',
      data: {
        paymentUrl
      }
    });
  } catch (error) {
    console.error('Create VNPay payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Handle VNPay return URL
// @route   GET /api/payments/vnpay/return
// @access  Public
exports.vnpayReturn = async (req, res) => {
  try {
    const vnpParams = req.query;

    // Verify signature
    const isValid = verifyReturnUrl(vnpParams);

    if (!isValid) {
      // Redirect to frontend with error
      return res.redirect(`${env.frontendUrl}/payment/failed?message=Invalid signature`);
    }

    // Check transaction status
    const transactionStatus = checkTransactionStatus(vnpParams);

    if (transactionStatus.success) {
      // Update booking status
      const booking = await Booking.findOne({
        bookingCode: vnpParams['vnp_TxnRef']
      });

      if (booking) {
        booking.paymentStatus = 'paid';
        booking.paymentDetails = {
          transactionId: vnpParams['vnp_TransactionNo'],
          paymentDate: new Date(),
          bankCode: vnpParams['vnp_BankCode'],
          cardType: vnpParams['vnp_CardType']
        };
        await booking.save();

        // Send confirmation email (non-blocking - don't fail if email fails)
        try {
          const User = require('../models/User');
          const user = await User.findById(booking.userId);
          const { sendBookingConfirmation } = require('../utils/email.utils');
          await sendBookingConfirmation(booking, user);
          console.log('✓ Email confirmation sent successfully');
        } catch (emailError) {
          // Log error but don't fail the payment
          console.error('⚠️ Email sending failed (non-critical):', emailError.message);
        }

        // Always redirect to success page if payment succeeded
        return res.redirect(
          `${env.frontendUrl}/payment/success?bookingCode=${booking.bookingCode}`
        );
      }
    }

    // Redirect to failed page
    return res.redirect(
      `${env.frontendUrl}/payment/failed?message=${encodeURIComponent(transactionStatus.message)}`
    );
  } catch (error) {
    console.error('VNPay return error:', error);
    return res.redirect(
      `${env.frontendUrl}/payment/failed?message=System error`
    );
  }
};

// @desc    Check payment status
// @route   GET /api/payments/status/:bookingId
// @access  Private
exports.checkPaymentStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking or is admin
    if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to check this payment'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        bookingCode: booking.bookingCode,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod,
        totalPrice: booking.totalPrice,
        paymentDetails: booking.paymentDetails
      }
    });
  } catch (error) {
    console.error('Check payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

