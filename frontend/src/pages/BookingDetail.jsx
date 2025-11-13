import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingAPI } from '../api/booking.api';
import { paymentAPI } from '../api/payment.api';
import Loading from '../components/Loading';
import toast from 'react-hot-toast';
import { FaMapMarkerAlt, FaCalendar, FaUsers, FaTimes, FaStar, FaCreditCard, FaExchangeAlt, FaCalendarAlt, FaCheckCircle } from 'react-icons/fa';
import { formatPrice } from '../utils/formatPrice';
import { formatDate, calculateNights } from '../utils/dateUtils';
import { BOOKING_STATUS, PAYMENT_STATUS } from '../utils/constants';

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch booking details
  const { data: bookingData, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingAPI.getMyBookings({ _id: id }),
  });

  // Cancel booking mutation
  const cancelMutation = useMutation({
    mutationFn: (id) => bookingAPI.cancelBooking(id),
    onSuccess: () => {
      toast.success('Hủy đặt phòng thành công!');
      queryClient.invalidateQueries(['booking', id]);
    },
    onError: (error) => {
      toast.error(error.message || 'Hủy đặt phòng thất bại');
    },
  });

  // Payment mutation
  const paymentMutation = useMutation({
    mutationFn: (bookingId) => paymentAPI.createVNPayPayment(bookingId),
    onSuccess: (response) => {
      // Redirect to VNPay
      window.location.href = response.data.paymentUrl;
    },
    onError: (error) => {
      toast.error(error.message || 'Tạo thanh toán thất bại');
    },
  });

  const booking = bookingData?.data?.[0];

  const handleCancelBooking = () => {
    if (window.confirm('Bạn có chắc muốn hủy đặt phòng này?')) {
      cancelMutation.mutate(id);
    }
  };

  const handlePayment = () => {
    if (window.confirm('Bạn sẽ được chuyển đến trang thanh toán VNPay. Tiếp tục?')) {
      paymentMutation.mutate(id);
    }
  };

  const handleWriteReview = () => {
    navigate(`/reviews/create?roomId=${booking.roomId._id}&bookingId=${id}`);
  };

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (!booking) {
    return (
      <div className="container-custom py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Không tìm thấy đặt phòng</h2>
        <button onClick={() => navigate('/profile')} className="btn btn-primary">
          Quay lại trang cá nhân
        </button>
      </div>
    );
  }

  const nights = calculateNights(booking.checkIn, booking.checkOut);
  const canCancel = booking.bookingStatus === 'pending' || booking.bookingStatus === 'confirmed';
  const canReview = booking.bookingStatus === 'checked-out' && !booking.hasReviewed;
  const needsPayment = booking.paymentStatus === 'pending' && booking.bookingStatus !== 'cancelled';

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container-custom max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/profile?tab=bookings')}
            className="text-primary hover:text-primary-dark"
          >
            ← Quay lại
          </button>
          <div className="text-right">
            <span className={`badge badge-${BOOKING_STATUS[booking.bookingStatus]?.color} mr-2`}>
              {BOOKING_STATUS[booking.bookingStatus]?.label}
            </span>
            <span className={`badge badge-${PAYMENT_STATUS[booking.paymentStatus]?.color}`}>
              {PAYMENT_STATUS[booking.paymentStatus]?.label}
            </span>
          </div>
        </div>

        {/* Booking Code */}
        <div className="card p-6 mb-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Mã đặt phòng</h1>
            <div className="text-4xl font-mono font-bold text-primary mb-2">
              {booking.bookingCode}
            </div>
            <p className="text-gray-600">Đặt ngày {formatDate(booking.createdAt)}</p>
          </div>
        </div>

        {/* Payment Warning */}
        {needsPayment && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
            <div className="flex items-start">
              <FaCreditCard className="text-yellow-500 text-xl mt-1 mr-3" />
              <div className="flex-1">
                <h3 className="font-bold text-yellow-900 mb-1">
                  ⚠️ Đơn đặt phòng chưa thanh toán
                </h3>
                <p className="text-yellow-800 text-sm mb-2">
                  Vui lòng thanh toán để xác nhận đặt phòng của bạn. Đặt phòng sẽ tự động hủy nếu không thanh toán trong 24 giờ.
                </p>
                <button
                  onClick={handlePayment}
                  disabled={paymentMutation.isPending}
                  className="btn btn-primary btn-sm"
                >
                  <FaCreditCard className="mr-2" />
                  {paymentMutation.isPending ? 'Đang xử lý...' : 'Thanh toán ngay'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Room Info */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Thông tin phòng</h2>
          <div className="flex items-start space-x-4">
            <img
              src={booking.roomId?.images?.[0]}
              alt={booking.roomId?.name}
              className="w-32 h-32 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">{booking.roomId?.name}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-700">
                  <FaMapMarkerAlt className="mr-2 text-primary" />
                  <span>{booking.hotelId?.name} - {booking.hotelId?.address}</span>
                </div>
                {booking.roomId?.rating && (
                  <div className="flex items-center">
                    <FaStar className="text-yellow-500 mr-1" />
                    <span className="font-semibold">{booking.roomId.rating.toFixed(1)}</span>
                    <span className="text-gray-600 ml-1">
                      ({booking.roomId.totalReviews || 0} đánh giá)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Chi tiết đặt phòng</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <FaCalendar className="text-primary mt-1" />
              <div>
                <div className="font-semibold">Nhận phòng</div>
                <div className="text-sm text-gray-600">{formatDate(booking.checkIn)}</div>
                <div className="text-xs text-gray-500">Sau 14:00</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <FaCalendar className="text-primary mt-1" />
              <div>
                <div className="font-semibold">Trả phòng</div>
                <div className="text-sm text-gray-600">{formatDate(booking.checkOut)}</div>
                <div className="text-xs text-gray-500">Trước 12:00</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <FaUsers className="text-primary mt-1" />
              <div>
                <div className="font-semibold">Số khách</div>
                <div className="text-sm text-gray-600">{booking.guests} người</div>
              </div>
            </div>
            <div>
              <div className="font-semibold">Số đêm</div>
              <div className="text-sm text-gray-600">{nights} đêm</div>
            </div>
          </div>
        </div>

        {/* Guest Info */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Thông tin khách hàng</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Tên khách</div>
              <div className="font-semibold">{booking.guestName}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Email</div>
              <div className="font-semibold">{booking.guestEmail}</div>
            </div>
            <div className="md:col-span-2">
              <div className="text-sm text-gray-600">Số điện thoại</div>
              <div className="font-semibold">{booking.guestPhone}</div>
            </div>
            {booking.specialRequests && (
              <div className="md:col-span-2">
                <div className="text-sm text-gray-600 mb-1">Yêu cầu đặc biệt</div>
                <div className="bg-gray-50 rounded p-3 text-sm">{booking.specialRequests}</div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Info */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Thông tin thanh toán</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">
                Giá phòng x {nights} đêm
              </span>
              <span className="font-semibold">{formatPrice(booking.totalPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phí dịch vụ</span>
              <span className="font-semibold">Miễn phí</span>
            </div>
            <div className="flex justify-between pt-3 border-t">
              <span className="font-bold text-lg">Tổng cộng</span>
              <span className="font-bold text-2xl text-accent">
                {formatPrice(booking.totalPrice)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Phương thức</span>
              <span className="font-semibold capitalize">{booking.paymentMethod}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          {needsPayment && (
            <button
              onClick={handlePayment}
              disabled={paymentMutation.isPending}
              className="flex-1 btn btn-primary animate-pulse"
            >
              <FaCreditCard className="mr-2" />
              {paymentMutation.isPending ? 'Đang xử lý...' : 'Thanh toán ngay'}
            </button>
          )}
          {canReview && !booking.hasReviewed && (
            <button
              onClick={handleWriteReview}
              className="flex-1 btn btn-primary"
            >
              <FaStar className="mr-2" />
              Viết đánh giá
            </button>
          )}
          {canCancel && (
            <button
              onClick={handleCancelBooking}
              disabled={cancelMutation.isPending}
              className="flex-1 btn btn-outline text-red-600 hover:bg-red-50"
            >
              <FaTimes className="mr-2" />
              {cancelMutation.isPending ? 'Đang hủy...' : 'Hủy đặt phòng'}
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="flex-1 btn btn-outline"
          >
            In chi tiết
          </button>
        </div>

        {/* Cancellation & Reschedule Policy */}
        {(canCancel || booking.reschedulePolicy?.allowed) && (
          <div className="mt-6 space-y-4">
            {/* Cancellation Policy */}
            {booking.cancellationPolicy && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <FaExchangeAlt className="text-blue-600" />
                  Chính sách hủy phòng
                </h3>
                <div className="space-y-2 text-sm text-blue-800">
                  {(() => {
                    const checkInDate = new Date(booking.checkIn);
                    const now = new Date();
                    now.setHours(0, 0, 0, 0);
                    checkInDate.setHours(0, 0, 0, 0);
                    const daysUntilCheckIn = Math.ceil((checkInDate - now) / (1000 * 60 * 60 * 24));
                    const freeCancelDays = booking.cancellationPolicy.freeCancellationDays || 1;
                    
                    return (
                      <>
                        {booking.cancellationPolicy.freeCancellationDays > 0 ? (
                          <div className="flex items-center gap-2">
                            <FaCheckCircle className="text-green-600 text-xs" />
                            <span>
                              Hủy miễn phí trước <strong>{freeCancelDays}</strong> ngày nhận phòng
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-red-600">✗</span>
                            <span>Không được hủy miễn phí</span>
                          </div>
                        )}
                        {booking.cancellationPolicy.refundable ? (
                          <div className="flex items-center gap-2">
                            <FaCheckCircle className="text-green-600 text-xs" />
                            <span>Có thể hoàn tiền</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-red-600">✗</span>
                            <span>Không hoàn tiền</span>
                          </div>
                        )}
                        {booking.cancellationPolicy.cancellationFee > 0 && (
                          <div className="text-blue-700">
                            Phí hủy: <strong>{booking.cancellationPolicy.cancellationFee}%</strong> của tổng giá trị
                          </div>
                        )}
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <div className="text-xs text-blue-700">
                            <strong>Thời gian còn lại:</strong> {daysUntilCheckIn} ngày trước ngày nhận phòng
                          </div>
                          {daysUntilCheckIn >= freeCancelDays ? (
                            <div className="text-green-700 font-medium mt-1">
                              ✓ Bạn có thể hủy miễn phí (còn {daysUntilCheckIn - freeCancelDays + 1} ngày)
                            </div>
                          ) : (
                            <div className="text-red-700 font-medium mt-1">
                              ✗ Không thể hủy miễn phí (cần hủy trước {freeCancelDays} ngày)
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Reschedule Policy */}
            {booking.reschedulePolicy && booking.reschedulePolicy.allowed !== false && (
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <FaCalendarAlt className="text-purple-600" />
                  Chính sách dời lịch
                </h3>
                <div className="space-y-2 text-sm text-purple-800">
                  {(() => {
                    const checkInDate = new Date(booking.checkIn);
                    const now = new Date();
                    now.setHours(0, 0, 0, 0);
                    checkInDate.setHours(0, 0, 0, 0);
                    const daysUntilCheckIn = Math.ceil((checkInDate - now) / (1000 * 60 * 60 * 24));
                    const freeRescheduleDays = booking.reschedulePolicy.freeRescheduleDays || 3;
                    
                    return (
                      <>
                        {freeRescheduleDays > 0 ? (
                          <div className="flex items-center gap-2">
                            <FaCheckCircle className="text-green-600 text-xs" />
                            <span>
                              Dời lịch miễn phí trước <strong>{freeRescheduleDays}</strong> ngày nhận phòng
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-orange-600">⚠</span>
                            <span>Có thể dời lịch nhưng có thể phát sinh phí</span>
                          </div>
                        )}
                        {booking.reschedulePolicy.rescheduleFee > 0 && (
                          <div className="text-purple-700">
                            Phí dời lịch: <strong>{booking.reschedulePolicy.rescheduleFee}%</strong> của tổng giá trị
                          </div>
                        )}
                        <div className="mt-3 pt-3 border-t border-purple-200">
                          <div className="text-xs text-purple-700">
                            <strong>Thời gian còn lại:</strong> {daysUntilCheckIn} ngày trước ngày nhận phòng
                          </div>
                          {daysUntilCheckIn >= freeRescheduleDays ? (
                            <div className="text-green-700 font-medium mt-1">
                              ✓ Bạn có thể dời lịch miễn phí (còn {daysUntilCheckIn - freeRescheduleDays + 1} ngày)
                            </div>
                          ) : (
                            <div className="text-orange-700 font-medium mt-1">
                              ⚠ Dời lịch có thể phát sinh phí (cần dời trước {freeRescheduleDays} ngày)
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contact Support */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Cần hỗ trợ?{' '}
          <a href="tel:1900xxxx" className="text-primary font-semibold">
            Liên hệ 1900 xxxx
          </a>
        </div>
      </div>
    </div>
  );
};

export default BookingDetail;

