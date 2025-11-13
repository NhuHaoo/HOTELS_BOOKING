import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaTimesCircle, FaArrowRight, FaExclamationTriangle, FaPhoneAlt, FaEnvelope } from 'react-icons/fa';

const PaymentFailed = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const errorMessage = searchParams.get('message') || 'Giao dịch không thành công';
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setShowAnimation(true), 100);
  }, []);

  const errorReasons = [
    'Số dư tài khoản không đủ',
    'Thông tin thanh toán không chính xác',
    'Giao dịch bị hủy bởi người dùng',
    'Vượt quá giới hạn giao dịch',
    'Lỗi kết nối với cổng thanh toán',
    'Phiên giao dịch đã hết hạn',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 py-12">
      <div className="container-custom max-w-3xl">
        <div className={`transition-all duration-700 ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Error Header */}
          <div className="card p-8 text-center mb-6 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-400 via-red-500 to-red-600"></div>
            
            {/* Error Icon with shake animation */}
            <div className="relative mb-6">
              <div className="w-32 h-32 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto shadow-2xl animate-shake">
                <FaTimesCircle className="text-white text-7xl" />
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 animate-fade-in">
              Thanh toán không thành công
            </h1>
            <p className="text-lg text-gray-600 mb-6 animate-fade-in animation-delay-200">
              Rất tiếc, giao dịch của bạn không được xử lý thành công.
            </p>

            {/* Error Message Badge */}
            <div className="inline-flex items-center space-x-3 bg-red-50 px-6 py-3 rounded-full border-2 border-red-200 animate-fade-in animation-delay-300">
              <FaExclamationTriangle className="text-red-500" />
              <span className="text-sm font-semibold text-red-700">{errorMessage}</span>
            </div>
          </div>

          {/* Error Details */}
          <div className="card p-6 mb-6 animate-fade-in animation-delay-400">
            <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200">
              <h2 className="text-xl font-bold text-red-900 mb-4 flex items-center">
                <FaExclamationTriangle className="mr-3" />
                Chi tiết lỗi
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-red-200">
                  <span className="text-gray-700 font-medium">Trạng thái giao dịch:</span>
                  <span className="font-bold text-red-600 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></span>
                    Thất bại
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-red-200">
                  <span className="text-gray-700 font-medium">Thời gian:</span>
                  <span className="font-semibold text-gray-800">
                    {new Date().toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700 font-medium">Lý do:</span>
                  <span className="font-semibold text-red-600">{errorMessage}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Possible Reasons */}
          <div className="card p-6 mb-6 animate-fade-in animation-delay-500">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Có thể do các nguyên nhân sau:
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {errorReasons.map((reason, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-primary transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-500 text-xs font-bold">{index + 1}</span>
                  </div>
                  <span className="text-sm text-gray-700">{reason}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Suggestions */}
          <div className="card p-6 mb-6 bg-gradient-to-br from-primary/5 to-accent/5 animate-fade-in animation-delay-600">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Gợi ý giải quyết
            </h2>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-primary font-bold mr-3 text-lg">1.</span>
                <span>Kiểm tra lại số dư tài khoản và thông tin thẻ của bạn</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary font-bold mr-3 text-lg">2.</span>
                <span>Thử lại với phương thức thanh toán khác (QR Code, ATM, Thẻ quốc tế)</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary font-bold mr-3 text-lg">3.</span>
                <span>Liên hệ ngân hàng để kiểm tra trạng thái tài khoản</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary font-bold mr-3 text-lg">4.</span>
                <span>Đảm bảo kết nối internet ổn định và thử lại sau vài phút</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="card p-6 animate-fade-in animation-delay-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/search')}
                className="btn btn-primary flex items-center justify-center group"
              >
                <svg className="w-5 h-5 mr-2 transform group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Thử lại thanh toán
              </button>
              <button
                onClick={() => navigate('/')}
                className="btn btn-outline flex items-center justify-center"
              >
                Về trang chủ
                <FaArrowRight className="ml-2" />
              </button>
            </div>
          </div>

          {/* Support Contact */}
          <div className="card p-6 mt-6 bg-gradient-to-r from-gray-50 to-gray-100 animate-fade-in animation-delay-800">
            <h3 className="font-bold text-gray-800 mb-4 text-center text-lg">
              Cần hỗ trợ thêm?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="tel:1900xxxx"
                className="flex items-center justify-center space-x-3 bg-white p-4 rounded-xl border-2 border-gray-200 hover:border-primary transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <FaPhoneAlt className="text-primary text-xl" />
                </div>
                <div className="text-left">
                  <div className="text-xs text-gray-500">Hotline</div>
                  <div className="font-bold text-primary text-lg">1900 xxxx</div>
                </div>
              </a>
              <a
                href="mailto:support@hotel.com"
                className="flex items-center justify-center space-x-3 bg-white p-4 rounded-xl border-2 border-gray-200 hover:border-accent transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <FaEnvelope className="text-accent text-xl" />
                </div>
                <div className="text-left">
                  <div className="text-xs text-gray-500">Email</div>
                  <div className="font-bold text-accent text-lg">support@hotel.com</div>
                </div>
              </a>
            </div>
            <p className="text-center text-xs text-gray-600 mt-4">
              Thời gian hỗ trợ: 24/7 | Phản hồi trong 15 phút
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: rotate(0deg); }
          10%, 30%, 50%, 70%, 90% { transform: rotate(-5deg); }
          20%, 40%, 60%, 80% { transform: rotate(5deg); }
        }
        .animate-shake {
          animation: shake 1s ease-in-out;
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
        .animation-delay-700 {
          animation-delay: 700ms;
        }
        .animation-delay-800 {
          animation-delay: 800ms;
        }
      `}</style>
    </div>
  );
};

export default PaymentFailed;

