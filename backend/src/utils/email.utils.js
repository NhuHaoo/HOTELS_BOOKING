const nodemailer = require('nodemailer');
const config = require('../config/env');

// Create transporter
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: false, // true for 465, false for other ports
  auth: {
    user: config.email.user,
    pass: config.email.password
  }
});

// Send email
exports.sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: config.email.from,
      to: options.email,
      subject: options.subject,
      html: options.message
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Send booking confirmation email
exports.sendBookingConfirmation = async (booking, user) => {
  const message = `
    <h1>Xác nhận đặt phòng</h1>
    <p>Xin chào ${user.name},</p>
    <p>Cảm ơn bạn đã đặt phòng tại khách sạn của chúng tôi.</p>
    <h3>Thông tin đặt phòng:</h3>
    <ul>
      <li><strong>Mã đặt phòng:</strong> ${booking.bookingCode}</li>
      <li><strong>Ngày nhận phòng:</strong> ${new Date(booking.checkIn).toLocaleDateString('vi-VN')}</li>
      <li><strong>Ngày trả phòng:</strong> ${new Date(booking.checkOut).toLocaleDateString('vi-VN')}</li>
      <li><strong>Số khách:</strong> ${booking.guests}</li>
      <li><strong>Tổng tiền:</strong> ${booking.totalPrice.toLocaleString('vi-VN')} VNĐ</li>
    </ul>
    <p>Vui lòng mang theo mã đặt phòng khi check-in.</p>
    <p>Trân trọng,</p>
    <p>Đội ngũ khách sạn</p>
  `;

  await this.sendEmail({
    email: user.email,
    subject: 'Xác nhận đặt phòng - ' + booking.bookingCode,
    message
  });
};

// Send password reset email
exports.sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${config.frontendUrl}/reset-password/${resetToken}`;

  const message = `
    <h1>Đặt lại mật khẩu</h1>
    <p>Xin chào ${user.name},</p>
    <p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng click vào link bên dưới để đặt lại mật khẩu:</p>
    <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Đặt lại mật khẩu</a>
    <p>Link này sẽ hết hạn sau 10 phút.</p>
    <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
    <p>Trân trọng,</p>
    <p>Đội ngũ khách sạn</p>
  `;

  await this.sendEmail({
    email: user.email,
    subject: 'Đặt lại mật khẩu',
    message
  });
};

// Send booking cancellation email
exports.sendBookingCancellation = async (booking, user) => {
  const message = `
    <h1>Hủy đặt phòng</h1>
    <p>Xin chào ${user.name},</p>
    <p>Đặt phòng của bạn đã được hủy thành công.</p>
    <h3>Thông tin đặt phòng:</h3>
    <ul>
      <li><strong>Mã đặt phòng:</strong> ${booking.bookingCode}</li>
      <li><strong>Ngày nhận phòng:</strong> ${new Date(booking.checkIn).toLocaleDateString('vi-VN')}</li>
      <li><strong>Ngày trả phòng:</strong> ${new Date(booking.checkOut).toLocaleDateString('vi-VN')}</li>
      <li><strong>Tổng tiền:</strong> ${booking.totalPrice.toLocaleString('vi-VN')} VNĐ</li>
    </ul>
    <p>Nếu bạn đã thanh toán, chúng tôi sẽ hoàn tiền trong vòng 7-10 ngày làm việc.</p>
    <p>Trân trọng,</p>
    <p>Đội ngũ khách sạn</p>
  `;

  await this.sendEmail({
    email: user.email,
    subject: 'Xác nhận hủy đặt phòng - ' + booking.bookingCode,
    message
  });
};

