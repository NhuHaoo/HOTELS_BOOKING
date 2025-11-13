import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { paymentAPI } from '../api/payment.api';
import { bookingAPI } from '../api/booking.api';
import Loading from '../components/Loading';
import { FaCheckCircle, FaTimesCircle, FaArrowRight } from 'react-icons/fa';
import { formatPrice } from '../utils/formatPrice';
import { formatDate } from '../utils/dateUtils';

const PaymentReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);

  // Get parameters from VNPay callback
  const vnp_ResponseCode = searchParams.get('vnp_ResponseCode');
  const vnp_TxnRef = searchParams.get('vnp_TxnRef');
  const vnp_Amount = searchParams.get('vnp_Amount');

  // Verify payment
  const { isLoading } = useQuery({
    queryKey: ['verify-payment', Object.fromEntries(searchParams)],
    queryFn: async () => {
      try {
        const params = Object.fromEntries(searchParams);
        const response = await paymentAPI.verifyVNPayPayment(params);
        
        if (response.success) {
          setPaymentStatus('success');
          // Fetch booking details
          if (vnp_TxnRef) {
            try {
              const bookingResponse = await bookingAPI.getMyBookings({ 
                bookingCode: vnp_TxnRef 
              });
              if (bookingResponse.data?.length > 0) {
                setBookingDetails(bookingResponse.data[0]);
              }
            } catch (error) {
              console.error('Error fetching booking:', error);
            }
          }
        } else {
          setPaymentStatus('failed');
        }
        
        return response;
      } catch (error) {
        setPaymentStatus('failed');
        throw error;
      }
    },
    enabled: !!vnp_ResponseCode,
  });

  useEffect(() => {
    if (!vnp_ResponseCode) {
      navigate('/');
    }
  }, [vnp_ResponseCode, navigate]);

  if (isLoading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12">
      <div className="container-custom max-w-2xl">
        {paymentStatus === 'success' ? (
          <div className="card p-8 text-center">
            {/* Success Icon */}
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaCheckCircle className="text-green-500 text-6xl" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Thanh toán thành công!
            </h1>
            <p className="text-gray-600 mb-8">
              Cảm ơn bạn đã đặt phòng. Chúng tôi đã gửi xác nhận qua email.
            </p>

            {/* Payment Details */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
              <h3 className="font-semibold mb-4">Chi tiết thanh toán</h3>
              <div className="space-y-3">
                {vnp_TxnRef && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mã đặt phòng:</span>
                    <span className="font-mono font-semibold">{vnp_TxnRef}</span>
                  </div>
                )}
                {vnp_Amount && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Số tiền:</span>
                    <span className="font-semibold text-accent">
                      {formatPrice(parseInt(vnp_Amount) / 100)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Trạng thái:</span>
                  <span className="font-semibold text-green-600">Đã thanh toán</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Thời gian:</span>
                  <span className="font-semibold">{formatDate(new Date())}</span>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            {bookingDetails && (
              <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
                <h3 className="font-semibold mb-4">Thông tin đặt phòng</h3>
                <div className="flex items-start space-x-4">
                  <img
                    src={bookingDetails.roomId?.images?.[0]}
                    alt={bookingDetails.roomId?.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-lg mb-1">
                      {bookingDetails.roomId?.name}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {bookingDetails.hotelId?.name}
                    </div>
                    <div className="text-sm space-y-1">
                      <div>
                        <span className="text-gray-600">Nhận phòng: </span>
                        <span className="font-semibold">{formatDate(bookingDetails.checkIn)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Trả phòng: </span>
                        <span className="font-semibold">{formatDate(bookingDetails.checkOut)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/profile?tab=bookings')}
                className="flex-1 btn btn-primary"
              >
                Xem đặt phòng của tôi
                <FaArrowRight className="ml-2" />
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 btn btn-outline"
              >
                Về trang chủ
              </button>
            </div>

            {/* Download Invoice */}
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600 mb-3">
                Bạn có thể tải xuống hóa đơn hoặc in trang này để lưu trữ
              </p>
              <button
                onClick={() => window.print()}
                className="btn btn-outline btn-sm"
              >
                In hóa đơn
              </button>
            </div>
          </div>
        ) : (
          <div className="card p-8 text-center">
            {/* Failed Icon */}
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaTimesCircle className="text-red-500 text-6xl" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Thanh toán không thành công
            </h1>
            <p className="text-gray-600 mb-8">
              Rất tiếc, giao dịch của bạn không được xử lý thành công.
            </p>

            {/* Error Details */}
            <div className="bg-red-50 rounded-lg p-6 mb-6 text-left">
              <h3 className="font-semibold mb-4 text-red-900">Chi tiết lỗi</h3>
              <div className="space-y-3 text-sm">
                {vnp_ResponseCode && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mã lỗi:</span>
                    <span className="font-semibold text-red-600">{vnp_ResponseCode}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Trạng thái:</span>
                  <span className="font-semibold text-red-600">Thất bại</span>
                </div>
              </div>
            </div>

            {/* Reasons */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
              <h3 className="font-semibold mb-3">Có thể do các lý do sau:</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Số dư tài khoản không đủ</li>
                <li>• Thông tin thẻ không chính xác</li>
                <li>• Giao dịch bị hủy bởi người dùng</li>
                <li>• Vượt quá giới hạn giao dịch</li>
                <li>• Lỗi kết nối với ngân hàng</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/search')}
                className="flex-1 btn btn-primary"
              >
                Thử lại
                <FaArrowRight className="ml-2" />
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 btn btn-outline"
              >
                Về trang chủ
              </button>
            </div>

            {/* Support */}
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600">
                Nếu bạn cần hỗ trợ, vui lòng liên hệ:{' '}
                <a href="tel:1900xxxx" className="text-primary font-semibold">
                  1900 xxxx
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentReturn;

