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
      const bookingCode = vnpParams['vnp_TxnRef'];
      
      // Check if this is a reschedule payment
      if (bookingCode.includes('-RESCHEDULE')) {
        const originalBookingCode = bookingCode.replace('-RESCHEDULE', '');
        const booking = await Booking.findOne({ bookingCode: originalBookingCode });
        
        console.log('=== Reschedule Payment Callback ===');
        console.log('Original Booking Code:', originalBookingCode);
        console.log('Booking found:', !!booking);
        console.log('ReschedulePayment exists:', !!booking?.reschedulePayment);
        console.log('ReschedulePayment status before:', booking?.reschedulePayment?.status);
        
        if (booking) {
          // Nếu reschedulePayment chưa tồn tại, tạo mới
          if (!booking.reschedulePayment || !booking.reschedulePayment.status) {
            console.log('⚠️ ReschedulePayment not found, checking rescheduleInfo...');
            // Có thể booking đã được reschedule nhưng reschedulePayment chưa được tạo
            // Kiểm tra rescheduleInfo để lấy amount
            if (booking.rescheduleInfo && booking.rescheduleInfo.extraToPay > 0) {
              booking.reschedulePayment = {
                amount: booking.rescheduleInfo.extraToPay,
                status: 'pending',
                createdAt: booking.rescheduledAt || new Date()
              };
              console.log('✓ Created reschedulePayment from rescheduleInfo');
            } else {
              console.log('❌ Cannot create reschedulePayment: no rescheduleInfo or extraToPay');
              return res.redirect(
                `${env.frontendUrl}/payment/failed?message=Reschedule payment not found`
              );
            }
          }
          
          // Kiểm tra xem đã thanh toán chưa
          if (booking.reschedulePayment.status === 'paid') {
            console.log('⚠️ Reschedule payment already paid, skipping...');
            return res.redirect(
              `${env.frontendUrl}/payment/success?bookingCode=${booking.bookingCode}&type=reschedule&alreadyPaid=true`
            );
          }
          
          // Update reschedule payment status
          const rescheduleAmount = booking.reschedulePayment.amount || 0;
          booking.reschedulePayment.status = 'paid';
          booking.reschedulePayment.transactionId = vnpParams['vnp_TransactionNo'];
          booking.reschedulePayment.paymentDate = new Date();
          booking.reschedulePayment.paidAt = new Date();
          
          // Cập nhật paidAmount: cộng thêm số tiền reschedule payment
          const oldPaidAmount = booking.paidAmount || 0;
          booking.paidAmount = oldPaidAmount + rescheduleAmount;
          
          // Đảm bảo paidAmount không bao giờ > totalAmount
          const totalAmount = booking.totalAmount || booking.finalTotal || booking.totalPrice || 0;
          if (booking.paidAmount > totalAmount) {
            booking.paidAmount = totalAmount;
          }
          
          // Nếu đã thanh toán đủ, cập nhật paymentStatus
          if (booking.paidAmount >= totalAmount) {
            booking.paymentStatus = 'paid';
          }
          
          // Lưu booking với error handling
          try {
            await booking.save();
            
            // Verify lại sau khi save
            const savedBooking = await Booking.findById(booking._id);
            console.log('✓ Reschedule payment completed:');
            console.log('  - Amount:', rescheduleAmount);
            console.log('  - Old paidAmount:', oldPaidAmount);
            console.log('  - New paidAmount:', booking.paidAmount);
            console.log('  - Saved paidAmount:', savedBooking.paidAmount);
            console.log('  - TotalAmount:', totalAmount);
            console.log('  - PaymentStatus:', booking.paymentStatus);
            console.log('  - ReschedulePayment status:', savedBooking.reschedulePayment?.status);
            console.log('===============================');
            
            return res.redirect(
              `${env.frontendUrl}/payment/success?bookingCode=${booking.bookingCode}&type=reschedule`
            );
          } catch (saveError) {
            console.error('❌ Error saving booking after reschedule payment:', saveError);
            return res.redirect(
              `${env.frontendUrl}/payment/failed?message=Error saving payment status`
            );
          }
        } else {
          console.log('❌ Booking not found');
          return res.redirect(
            `${env.frontendUrl}/payment/failed?message=Booking not found`
          );
        }
      } else {
        // Normal payment logic
      const booking = await Booking.findOne({
          bookingCode: bookingCode
      });

      if (booking) {
        booking.paymentStatus = 'paid';
        booking.paymentDetails = {
          transactionId: vnpParams['vnp_TransactionNo'],
          paymentDate: new Date(),
          bankCode: vnpParams['vnp_BankCode'],
          cardType: vnpParams['vnp_CardType']
        };
        
        // Cập nhật paidAmount: số tiền đã thanh toán ban đầu
        const totalAmount = booking.totalAmount || booking.finalTotal || booking.totalPrice || 0;
        booking.paidAmount = totalAmount; // Thanh toán ban đầu = totalAmount
        
        // Đảm bảo paidAmount không bao giờ > totalAmount
        if (booking.paidAmount > totalAmount) {
          booking.paidAmount = totalAmount;
        }
        
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

// @desc    Create VNPay payment for reschedule
// @route   POST /api/payments/vnpay/reschedule/:bookingId
// @access  Private
exports.createReschedulePayment = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check authorization
    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to pay for this booking'
      });
    }

    // Check if reschedule payment exists and is pending
    if (!booking.reschedulePayment || 
        booking.reschedulePayment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Không có khoản thanh toán nào đang chờ xử lý cho đổi lịch'
      });
    }

    // Get client IP
    let ipAddr = req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      '127.0.0.1';
    
    if (ipAddr.includes(',')) {
      ipAddr = ipAddr.split(',')[0].trim();
    }
    
    if (ipAddr === '::1' || ipAddr === '::ffff:127.0.0.1') {
      ipAddr = '127.0.0.1';
    }
    
    if (ipAddr.startsWith('::ffff:')) {
      ipAddr = ipAddr.substring(7);
    }

    // Create payment URL với amount là reschedulePayment.amount
    const paymentData = {
      amount: booking.reschedulePayment.amount,
      bookingCode: `${booking.bookingCode}-RESCHEDULE`,
      orderInfo: `Thanh toan doi lich ${booking.bookingCode}`,
      ipAddr: ipAddr,
      locale: 'vn'
    };

    const paymentUrl = createPaymentUrl(paymentData);

    console.log('=== VNPay Reschedule Payment Creation ===');
    console.log('Booking ID:', req.params.bookingId);
    console.log('Booking Code:', booking.bookingCode);
    console.log('Reschedule Amount:', booking.reschedulePayment.amount);
    console.log('Payment URL:', paymentUrl);
    console.log('==========================================');

    res.status(200).json({
      success: true,
      message: 'Payment URL created successfully',
      data: {
        paymentUrl,
        amount: booking.reschedulePayment.amount
      }
    });
  } catch (error) {
    console.error('Create reschedule payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
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
        paymentDetails: booking.paymentDetails,
        reschedulePayment: booking.reschedulePayment || null
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

