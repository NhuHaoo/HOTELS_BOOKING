import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { bookingAPI } from '../api/booking.api';
import Loading from '../components/Loading';
import { FaCheckCircle, FaArrowRight, FaHotel, FaCalendarAlt, FaUsers, FaPrint, FaDownload } from 'react-icons/fa';
import { formatPrice } from '../utils/formatPrice';
import { formatDate, calculateNights } from '../utils/dateUtils';
import confetti from 'canvas-confetti';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingCode = searchParams.get('bookingCode');
  const [showAnimation, setShowAnimation] = useState(false);

  // Fetch booking details by code
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['booking-success', bookingCode],
    queryFn: async () => {
      const response = await bookingAPI.getMyBookings({ 
        bookingCode: bookingCode 
      });
      return response.data;
    },
    enabled: !!bookingCode,
  });

  const booking = bookings?.[0];

  useEffect(() => {
    if (!bookingCode) {
      navigate('/');
      return;
    }

    // Trigger animation after mount
    setTimeout(() => setShowAnimation(true), 100);

    // Fire confetti
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, [bookingCode, navigate]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-12">
        <div className="container-custom max-w-2xl">
          <div className="card p-8 text-center">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaCheckCircle className="text-red-500 text-6xl" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Không tìm thấy đơn đặt phòng
            </h1>
            <p className="text-gray-600 mb-8">
              Mã đơn đặt phòng không hợp lệ hoặc không tồn tại.
            </p>
            <button
              onClick={() => navigate('/')}
              className="btn btn-primary"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  const nights = calculateNights(booking.checkIn, booking.checkOut);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-primary/5 py-12">
      <div className="container-custom max-w-4xl">
        <div className={`transition-all duration-700 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Success Header */}
          <div className="card p-8 text-center mb-6 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-primary to-accent"></div>
            
            {/* Success Icon with pulse animation */}
            <div className="relative mb-6">
              <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto animate-pulse-slow shadow-2xl">
                <FaCheckCircle className="text-white text-7xl animate-bounce-once" />
              </div>
              <div className="absolute inset-0 w-32 h-32 bg-green-400 rounded-full mx-auto opacity-20 animate-ping"></div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4 animate-fade-in">
              🎉 Thanh toán thành công! 🎉
            </h1>
            <p className="text-lg text-gray-600 mb-6 animate-fade-in animation-delay-200">
              Chúc mừng! Đặt phòng của bạn đã được xác nhận thành công.
            </p>

            {/* Booking Code Badge */}
            <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-primary/10 to-accent/10 px-6 py-3 rounded-full border-2 border-primary/20 animate-fade-in animation-delay-300">
              <span className="text-sm font-medium text-gray-600">Mã đặt phòng:</span>
              <span className="text-xl font-mono font-bold text-gradient">{booking.bookingCode}</span>
            </div>
          </div>

          {/* Booking Details */}
          <div className="card p-6 mb-6 animate-fade-in animation-delay-400">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <FaHotel className="mr-3 text-primary" />
              Thông tin đặt phòng
            </h2>

            {/* Room Info with Image */}
            <div className="flex flex-col md:flex-row gap-6 mb-6 pb-6 border-b">
              <div className="md:w-1/3">
                <img
                  src={booking.roomId?.images?.[0] || '/placeholder-room.jpg'}
                  alt={booking.roomId?.name}
                  className="w-full h-48 object-cover rounded-xl shadow-lg hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400';
                  }}
                />
              </div>
              <div className="md:w-2/3 space-y-3">
                <h3 className="text-2xl font-bold text-gray-800">
                  {booking.roomId?.name}
                </h3>
                <div className="flex items-center text-gray-600">
                  <FaHotel className="mr-2 text-primary" />
                  <span className="font-medium">{booking.hotelId?.name}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{booking.hotelId?.address}</span>
                </div>
              </div>
            </div>

            {/* Stay Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-4 rounded-xl border border-primary/20">
                <div className="flex items-center mb-2">
                  <FaCalendarAlt className="text-primary mr-2" />
                  <span className="text-sm font-medium text-gray-600">Nhận phòng</span>
                </div>
                <div className="text-lg font-bold text-gray-800">
                  {formatDate(booking.checkIn)}
                </div>
              </div>

              <div className="bg-gradient-to-br from-accent/5 to-accent/10 p-4 rounded-xl border border-accent/20">
                <div className="flex items-center mb-2">
                  <FaCalendarAlt className="text-accent mr-2" />
                  <span className="text-sm font-medium text-gray-600">Trả phòng</span>
                </div>
                <div className="text-lg font-bold text-gray-800">
                  {formatDate(booking.checkOut)}
                </div>
              </div>

              <div className="bg-gradient-to-br from-secondary/5 to-secondary/10 p-4 rounded-xl border border-secondary/20">
                <div className="flex items-center mb-2">
                  <FaUsers className="text-secondary mr-2" />
                  <span className="text-sm font-medium text-gray-600">Số khách</span>
                </div>
                <div className="text-lg font-bold text-gray-800">
                  {booking.guests} người
                </div>
              </div>
            </div>

            {/* Guest Information */}
            <div className="bg-gray-50 rounded-xl p-5 mb-6">
              <h4 className="font-semibold text-gray-800 mb-3">Thông tin khách hàng</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Họ tên:</span>
                  <span className="ml-2 font-semibold text-gray-800">{booking.guestName}</span>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <span className="ml-2 font-semibold text-gray-800">{booking.guestEmail}</span>
                </div>
                <div>
                  <span className="text-gray-600">Điện thoại:</span>
                  <span className="ml-2 font-semibold text-gray-800">{booking.guestPhone}</span>
                </div>
                <div>
                  <span className="text-gray-600">Số đêm:</span>
                  <span className="ml-2 font-semibold text-gray-800">{nights} đêm</span>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-gradient-to-br from-green-50 to-primary/5 rounded-xl p-5 border-2 border-green-200">
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Chi tiết thanh toán
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>Giá phòng/đêm:</span>
                  <span className="font-semibold">{formatPrice(booking.roomId?.price || 0)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Số đêm:</span>
                  <span className="font-semibold">{nights} đêm</span>
                </div>
                <div className="h-px bg-gray-300"></div>
                <div className="flex justify-between text-lg">
                  <span className="font-bold text-gray-800">Tổng cộng:</span>
                  <span className="font-bold text-2xl text-gradient">{formatPrice(booking.totalPrice)}</span>
                </div>
                <div className="flex items-center justify-center space-x-2 pt-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="font-semibold text-green-700">Đã thanh toán</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="card p-6 animate-fade-in animation-delay-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate(`/bookings/${booking._id}`)}
                className="btn btn-primary flex items-center justify-center"
              >
                <FaArrowRight className="mr-2" />
                Xem chi tiết
              </button>
              <button
                onClick={() => navigate('/profile?tab=bookings')}
                className="btn btn-outline flex items-center justify-center"
              >
                Đơn đặt phòng của tôi
              </button>
              <button
                onClick={handlePrint}
                className="btn btn-outline flex items-center justify-center"
              >
                <FaPrint className="mr-2" />
                In hóa đơn
              </button>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/')}
                className="text-primary hover:text-primary-dark font-medium hover:underline"
              >
                ← Về trang chủ
              </button>
            </div>
          </div>

          {/* Additional Info */}
          <div className="card p-6 mt-6 bg-gradient-to-r from-primary/5 to-accent/5 animate-fade-in animation-delay-600">
            <h3 className="font-semibold text-gray-800 mb-3 text-center">📧 Thông báo quan trọng</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>Email xác nhận đã được gửi đến <strong>{booking.guestEmail}</strong></span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>Vui lòng mang theo CMND/CCCD khi nhận phòng</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>Thời gian nhận phòng: 14:00 | Trả phòng: 12:00</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">✓</span>
                <span>Liên hệ hỗ trợ: <a href="tel:1900xxxx" className="text-primary font-semibold hover:underline">1900 xxxx</a></span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-once {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .animate-bounce-once {
          animation: bounce-once 0.6s ease-in-out;
        }
        .animate-pulse-slow {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        .animation-delay-300 {
          animation-delay: 300ms;
        }
        .animation-delay-400 {
          animation-delay: 400ms;
        }
        .animation-delay-500 {
          animation-delay: 500ms;
        }
        .animation-delay-600 {
          animation-delay: 600ms;
        }
      `}</style>
    </div>
  );
};

export default PaymentSuccess;

