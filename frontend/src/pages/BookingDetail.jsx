// frontend/src/pages/BookingDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import { bookingAPI } from '../api/booking.api';
import { paymentAPI } from '../api/payment.api';
import Loading from '../components/Loading';
import toast from 'react-hot-toast';
import {
  FaMapMarkerAlt,
  FaCalendar,
  FaUsers,
  FaTimes,
  FaStar,
  FaCreditCard,
  FaExchangeAlt,
  FaCalendarAlt,
  FaCheckCircle,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { formatPrice } from '../utils/formatPrice';
import { formatDate, calculateNights } from '../utils/dateUtils';
import { BOOKING_STATUS, PAYMENT_STATUS } from '../utils/constants';
import { calcBookingMoney, getPaymentStatus } from '../utils/bookingCalculations';

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ============ FETCH BOOKING DETAIL ============
  const {
    data: bookingRes,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingAPI.getBooking(id), // 👈 dùng API getBooking
  });

  const booking = bookingRes?.data;

  // ============ STATE RESCHEDULE MODAL ============
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [newCheckIn, setNewCheckIn] = useState(null);
  const [newCheckOut, setNewCheckOut] = useState(null);

  // Khi load booking xong -> set mặc định ngày mới = ngày cũ
  useEffect(() => {
    if (booking) {
      setNewCheckIn(new Date(booking.checkIn));
      setNewCheckOut(new Date(booking.checkOut));
    }
  }, [booking]);

  // Refresh booking data khi quay lại từ payment success page
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromPayment = urlParams.get('fromPayment');
    const type = urlParams.get('type');
    
    if (fromPayment === 'success' || type === 'reschedule') {
      // Refresh booking data
      queryClient.invalidateQueries(['booking', id]);
      queryClient.invalidateQueries(['my-bookings']);
      
      // Remove query params để tránh refresh lại
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [id, queryClient]);

  // ============ CANCEL BOOKING ============
  const cancelMutation = useMutation({
    mutationFn: (id) => bookingAPI.cancelBooking(id),
    onSuccess: (res) => {
      toast.success(res?.message || 'Hủy đặt phòng thành công!');
      queryClient.invalidateQueries(['booking', id]);
      queryClient.invalidateQueries(['my-bookings']);
    },
    onError: (error) => {
      const msg =
        error?.response?.data?.message ||
        error.message ||
        'Hủy đặt phòng thất bại';
      toast.error(msg);
    },
  });

  // ============ PAYMENT ============
  const paymentMutation = useMutation({
    mutationFn: (bookingId) => paymentAPI.createVNPayPayment(bookingId),
    onSuccess: (response) => {
      const url = response?.data?.paymentUrl || response?.paymentUrl;
      if (url) {
        window.location.href = url;
      } else {
        toast.error('Không lấy được link thanh toán');
      }
    },
    onError: (error) => {
      const msg =
        error?.response?.data?.message ||
        error.message ||
        'Tạo thanh toán thất bại';
      toast.error(msg);
    },
  });

  // ============ RESCHEDULE PAYMENT ============
  const reschedulePaymentMutation = useMutation({
    mutationFn: (bookingId) => paymentAPI.createReschedulePayment(bookingId),
    onSuccess: (response) => {
      const url = response?.data?.paymentUrl || response?.paymentUrl;
      if (url) {
        window.location.href = url;
      } else {
        toast.error('Không lấy được link thanh toán');
      }
    },
    onError: (error) => {
      const msg =
        error?.response?.data?.message ||
        error.message ||
        'Tạo thanh toán thất bại';
      toast.error(msg);
    },
  });

  // ============ RESCHEDULE (ĐỔI LỊCH) ============
  const rescheduleMutation = useMutation({
    mutationFn: ({ bookingId, newCheckIn, newCheckOut }) =>
      bookingAPI.rescheduleBooking(bookingId, {
        newCheckIn,
        newCheckOut,
      }),
    onSuccess: async (res) => {
      const responseData = res?.data || res;
      const additionalPayment = responseData?.additionalPayment || 0;
      
      // Đóng modal
      setShowRescheduleModal(false);
      
      // Refresh data để lấy thông tin booking mới nhất
      await queryClient.invalidateQueries(['booking', id]);
      await queryClient.invalidateQueries(['my-bookings']);
      
      // Nếu có tiền cần thanh toán, tự động chuyển sang VNPay
      if (additionalPayment > 0) {
        toast.success('Đổi lịch thành công. Đang chuyển đến trang thanh toán...');
        // Đợi data được refresh và booking được lưu với reschedulePayment
        setTimeout(async () => {
          // Fetch lại booking data để đảm bảo reschedulePayment đã được lưu
          await queryClient.refetchQueries(['booking', id]);
          // Tạo payment và redirect
          reschedulePaymentMutation.mutate(id);
        }, 800);
      } else {
        toast.success(
          res?.message ||
            res?.data?.message ||
            'Đổi lịch thành công'
        );
      }
    },
    onError: (error) => {
      const msg =
        error?.response?.data?.message ||
        error.message ||
        'Đổi lịch thất bại';
      toast.error(msg);
    },
  });

  // ============ HANDLERS ============
  const handleCancelBooking = () => {
    if (window.confirm('Bạn có chắc muốn hủy đặt phòng này?')) {
      cancelMutation.mutate(id);
    }
  };

  const handlePayment = () => {
    if (
      window.confirm(
        'Bạn sẽ được chuyển đến trang thanh toán VNPay. Tiếp tục?'
      )
    ) {
      paymentMutation.mutate(id);
    }
  };

  const handleWriteReview = () => {
    if (!booking) return;
    navigate(`/reviews/create?roomId=${booking.roomId._id}&bookingId=${id}`);
  };

  const handleOpenReschedule = () => {
    if (!booking) return;
    setNewCheckIn(new Date(booking.checkIn));
    setNewCheckOut(new Date(booking.checkOut));
    setShowRescheduleModal(true);
  };

  // Hàm tính toán phí đổi lịch
  // roomBaseOld: Tổng tiền phòng gốc (trước khi giảm giá) = originalTotal
  // pricePerNight: Giá 1 đêm
  // addedNights: Số đêm phát sinh (thêm)
  // feePercent: % phí đổi lịch (ví dụ: 20)
  const calculateChangeFee = (roomBaseOld, pricePerNight, addedNights, feePercent) => {
    const roomCost = pricePerNight * addedNights; // Tiền phòng phát sinh
    // Phí đổi lịch = feePercent% của tổng tiền phòng gốc (không áp mã giảm giá)
    const changeFee = (roomBaseOld * feePercent) / 100;
    return {
      roomCost,
      changeFee,
      total: roomCost + changeFee,
    };
  };

  const handleSubmitReschedule = (e) => {
    e.preventDefault();
    if (!newCheckIn || !newCheckOut) {
      toast.error('Vui lòng chọn đủ ngày nhận / trả phòng mới');
      return;
    }
    if (newCheckOut <= newCheckIn) {
      toast.error('Ngày trả phòng phải sau ngày nhận phòng');
      return;
    }

    rescheduleMutation.mutate({
      bookingId: id,
      newCheckIn: newCheckIn.toISOString(),
      newCheckOut: newCheckOut.toISOString(),
    });
  };

  // ============ DERIVED ============
  if (isLoading) return <Loading fullScreen />;

  if (isError || !booking) {
    return (
      <div className="container-custom py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Không tìm thấy đặt phòng</h2>
        <button
          onClick={() => navigate('/profile?tab=bookings')}
          className="btn btn-primary"
        >
          Quay lại trang cá nhân
        </button>
      </div>
    );
  }

  const nights = calculateNights(booking.checkIn, booking.checkOut);
  
  // Chuẩn bị booking data với các field cần thiết cho calcBookingMoney
  // Nếu đã đổi lịch, sử dụng dữ liệu từ rescheduleInfo
  const isRescheduled = booking.rescheduleInfo && booking.rescheduleInfo.newCheckIn;
  
  let bookingForCalc;
  if (isRescheduled) {
    // Nếu đã đổi lịch, dùng dữ liệu từ rescheduleInfo
    const rescheduleInfo = booking.rescheduleInfo;
    const newNights = calculateNights(rescheduleInfo.newCheckIn || booking.checkIn, rescheduleInfo.newCheckOut || booking.checkOut);
    const pricePerNight = booking.pricePerNight || 
                          booking.roomId?.finalPrice || 
                          booking.roomId?.price || 
                          (rescheduleInfo.roomTotalNew / newNights) || 
                          (booking.totalPrice / newNights) || 0;
    
    bookingForCalc = {
      ...booking,
      pricePerNight,
      nights: newNights,
      changeFeeAmount: rescheduleInfo.changeFee || rescheduleInfo.rescheduleFee || 0,
      surchargeAmount: booking.surchargeAmount || 0,
      discountAmount: rescheduleInfo.discount || booking.discountAmount || 0,
      // Dùng trực tiếp totalAmount và paidAmount từ backend, không tính lại
      totalAmount: booking.totalAmount,
      paidAmount: booking.paidAmount,
    };
  } else {
    // Chưa đổi lịch, dùng dữ liệu gốc
    bookingForCalc = {
      ...booking,
      pricePerNight: booking.pricePerNight || 
                     booking.roomId?.finalPrice || 
                     booking.roomId?.price || 
                     (booking.originalTotal / nights) ||
                     (booking.totalPrice / nights) || 0,
      nights: booking.nights || nights,
      changeFeeAmount: booking.changeFeeAmount || 0,
      surchargeAmount: booking.surchargeAmount || 0,
      discountAmount: booking.discountAmount || 0,
      // Dùng trực tiếp totalAmount và paidAmount từ backend, không tính lại
      totalAmount: booking.totalAmount,
      paidAmount: booking.paidAmount,
    };
  }
  
  const canCancel =
    booking.bookingStatus === 'pending' ||
    booking.bookingStatus === 'confirmed';
  const canReview =
    booking.bookingStatus === 'checked-out' && !booking.hasReviewed;
  const needsPayment =
    booking.paymentStatus === 'pending' &&
    booking.bookingStatus !== 'cancelled';

  const canReschedule =
    booking.reschedulePolicy &&
    booking.reschedulePolicy.allowed !== false &&
    (booking.bookingStatus === 'pending' ||
      booking.bookingStatus === 'confirmed') &&
    !booking.rescheduledAt; // Chỉ cho phép đổi lịch nếu chưa đổi lần nào

  // ============ UI ============
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
            <span
              className={`badge badge-${
                BOOKING_STATUS[booking.bookingStatus]?.color
              } mr-2`}
            >
              {BOOKING_STATUS[booking.bookingStatus]?.label}
            </span>
            <span
              className={`badge badge-${
                PAYMENT_STATUS[booking.paymentStatus]?.color
              }`}
            >
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
            <p className="text-gray-600">
              Đặt ngày {formatDate(booking.createdAt)}
            </p>
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
                  Vui lòng thanh toán để xác nhận đặt phòng của bạn. Đặt phòng
                  sẽ tự động hủy nếu không thanh toán trong 24 giờ.
                </p>
                <button
                  onClick={handlePayment}
                  disabled={paymentMutation.isPending}
                  className="btn btn-primary btn-sm"
                >
                  <FaCreditCard className="mr-2" />
                  {paymentMutation.isPending
                    ? 'Đang xử lý...'
                    : 'Thanh toán ngay'}
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
              <h3 className="text-lg font-semibold mb-2">
                {booking.roomId?.name}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-700">
                  <FaMapMarkerAlt className="mr-2 text-primary" />
                  <span>
                    {booking.hotelId?.name} - {booking.hotelId?.address}
                  </span>
                </div>
                {booking.roomId?.rating && (
                  <div className="flex items-center">
                    <FaStar className="text-yellow-500 mr-1" />
                    <span className="font-semibold">
                      {booking.roomId.rating.toFixed(1)}
                    </span>
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
                <div className="text-sm text-gray-600">
                  {formatDate(booking.checkIn)}
                </div>
                <div className="text-xs text-gray-500">Sau 14:00</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <FaCalendar className="text-primary mt-1" />
              <div>
                <div className="font-semibold">Trả phòng</div>
                <div className="text-sm text-gray-600">
                  {formatDate(booking.checkOut)}
                </div>
                <div className="text-xs text-gray-500">Trước 12:00</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <FaUsers className="text-primary mt-1" />
              <div>
                <div className="font-semibold">Số khách</div>
                <div className="text-sm text-gray-600">
                  {booking.guests} người
                </div>
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
                <div className="text-sm text-gray-600 mb-1">
                  Yêu cầu đặc biệt
                </div>
                <div className="bg-gray-50 rounded p-3 text-sm">
                  {booking.specialRequests}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Info - Chi tiết thanh toán */}
        {(() => {
          const {
            pricePerNight,
            nights: nightsCount,
            roomTotal,
            changeFee,
            surcharge,
            discount,
            total,
          } = calcBookingMoney(bookingForCalc);
          
          // Dùng getPaymentStatus để tính trạng thái thanh toán
          const { outstanding, status } = getPaymentStatus(booking);
          
          return (
            <div className="border border-green-300 rounded-xl bg-green-50 p-5 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-green-100">
                  <span className="text-green-600 text-lg">💳</span>
                </span>
                <h3 className="font-semibold text-green-800 text-base">
                  Chi tiết thanh toán
                </h3>
              </div>

              <div className="space-y-2 text-sm text-gray-800">
                <div className="flex justify-between">
                  <span>Giá phòng/đêm:</span>
                  <span>{formatPrice(pricePerNight)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Số đêm:</span>
                  <span>{nightsCount} đêm</span>
                </div>
                <div className="flex justify-between">
                  <span>Tiền phòng:</span>
                  <span>{formatPrice(roomTotal)}</span>
                </div>

                {changeFee > 0 && (
                  <div className="flex justify-between">
                    <span>Phí đổi lịch:</span>
                    <span>{formatPrice(changeFee)}</span>
                  </div>
                )}

                {surcharge > 0 && (
                  <div className="flex justify-between">
                    <span>Phụ thu:</span>
                    <span>{formatPrice(surcharge)}</span>
                  </div>
                )}

                {discount > 0 && (
                  <div className="flex justify-between">
                    <span>Giảm giá:</span>
                    <span className="text-green-600">-{formatPrice(discount)}</span>
                  </div>
                )}

                <hr className="my-3 border-gray-300" />

                <div className="flex justify-between items-center">
                  <span className="font-semibold text-base">Tổng cộng:</span>
                  <span className="font-bold text-base text-blue-700">
                    {formatPrice(total)}
                  </span>
                </div>
                
                {/* Hiển thị số tiền cần thanh toán thêm nếu đã đổi lịch */}
                {isRescheduled && booking.rescheduleInfo?.extraToPay !== undefined && booking.rescheduleInfo.extraToPay > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Số tiền cần thanh toán thêm:</span>
                      <span className="font-bold text-base text-orange-600">
                        {formatPrice(booking.rescheduleInfo.extraToPay)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                {status === 'paid' && (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-green-700 font-semibold">Đã thanh toán</span>
                  </>
                )}
                {status === 'unpaid' && (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-red-700 font-semibold">Chưa thanh toán</span>
                  </>
                )}
                {status === 'partial' && (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <span className="text-orange-700 font-semibold">
                      Chưa thanh toán đủ / Cần thanh toán thêm {formatPrice(outstanding)}
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {/* Thông tin hoàn tiền */}
        {booking.refundAmount > 0 && (
          <div className="border border-blue-300 rounded-xl bg-blue-50 p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-blue-100">
                <span className="text-blue-600 text-lg">💰</span>
              </span>
              <h3 className="font-semibold text-blue-800 text-base">
                Thông tin hoàn tiền
              </h3>
            </div>
            <div className="space-y-2 text-sm text-gray-800">
              <div className="flex justify-between items-center">
                <span>Trạng thái:</span>
                <span className="font-semibold text-blue-700">
                  {booking.refundStatus === 'full' && 'Đã hoàn tiền - Hoàn toàn bộ'}
                  {booking.refundStatus === 'partial' && 'Đã hoàn tiền - Hoàn một phần'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Số tiền đã hoàn:</span>
                <span className="font-bold text-blue-700">
                  {formatPrice(booking.refundAmount)} đ
                </span>
              </div>
              {booking.refundedAt && (
                <div className="flex justify-between items-center">
                  <span>Thời gian hoàn:</span>
                  <span className="font-semibold text-gray-700">
                    {formatDate(booking.refundedAt)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Hiển thị "Chưa hoàn tiền" nếu booking đã hủy nhưng refundAmount = 0 */}
        {booking.bookingStatus === 'cancelled' && booking.refundAmount === 0 && (
          <div className="border border-gray-300 rounded-xl bg-gray-50 p-5 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-gray-200">
                <span className="text-gray-600 text-lg">⏳</span>
              </span>
              <h3 className="font-semibold text-gray-800 text-base">
                Thông tin hoàn tiền
              </h3>
            </div>
            <div className="text-sm text-gray-700">
              Chưa hoàn tiền / Đang xử lý hoàn tiền
            </div>
          </div>
        )}

        {/* Reschedule Payment Pending Alert - Ẩn nếu đang trong quá trình tự động thanh toán */}
        {booking?.reschedulePayment?.status === 'pending' && 
         booking?.reschedulePayment?.amount > 0 &&
         !reschedulePaymentMutation.isPending && (
          <div className="card p-6 mb-6 bg-yellow-50 border-2 border-yellow-400">
            <div className="flex items-start gap-4">
              <FaExclamationTriangle className="text-yellow-600 text-2xl mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-yellow-800 text-lg mb-2">
                  ⚠️ Cần thanh toán thêm cho đổi lịch
                </h3>
                <p className="text-gray-700 mb-4">
                  Để hoàn tất đổi lịch, bạn cần thanh toán khoản phí chênh lệch sau:
                </p>
                
                {/* Chi tiết thanh toán */}
                <div className="bg-white rounded-lg p-4 mb-4 border border-yellow-300">
                  <div className="space-y-3">
                    {/* Chênh lệch giá phòng */}
                    {booking.rescheduleInfo?.priceDifference !== undefined && 
                     booking.rescheduleInfo.priceDifference !== 0 && (
                      <div className="flex justify-between items-center pb-2 border-b">
                        <div>
                          <span className="text-gray-700 font-medium block">
                            {booking.rescheduleInfo.priceDifference > 0 
                              ? '💰 Chênh lệch giá phòng (tăng)' 
                              : '💰 Chênh lệch giá phòng (giảm)'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {booking.rescheduleInfo.priceDifference > 0 
                              ? 'Giá phòng mới cao hơn giá phòng cũ' 
                              : 'Giá phòng mới thấp hơn giá phòng cũ'}
                          </span>
                        </div>
                        <span className={`font-bold text-lg ${
                          booking.rescheduleInfo.priceDifference > 0 
                            ? 'text-red-600' 
                            : 'text-green-600'
                        }`}>
                          {booking.rescheduleInfo.priceDifference > 0 ? '+' : ''}
                          {formatPrice(Math.abs(booking.rescheduleInfo.priceDifference))}
                        </span>
                      </div>
                    )}
                    
                    {/* Phí đổi lịch */}
                    {booking.rescheduleInfo?.rescheduleFee !== undefined && 
                     booking.rescheduleInfo.rescheduleFee > 0 && (
                      <div className="flex justify-between items-center pb-2 border-b">
                        <div>
                          <span className="text-gray-700 font-medium block">
                            🔄 Phí đổi lịch
                          </span>
                          <span className="text-xs text-gray-500">
                            Phí dịch vụ đổi lịch đặt phòng
                          </span>
                        </div>
                        <span className="font-bold text-lg text-orange-600">
                          +{formatPrice(booking.rescheduleInfo.rescheduleFee)}
                        </span>
                      </div>
                    )}
                    
                    {/* Tổng cần thanh toán */}
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-gray-800 font-bold text-lg">
                        Tổng cần thanh toán:
                      </span>
                      <span className="font-bold text-2xl text-yellow-700">
                        {formatPrice(booking.reschedulePayment.amount)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    if (window.confirm(
                      `Bạn sẽ thanh toán ${formatPrice(booking.reschedulePayment.amount)} cho đổi lịch. Bạn sẽ được chuyển đến trang thanh toán VNPay. Tiếp tục?`
                    )) {
                      reschedulePaymentMutation.mutate(id);
                    }
                  }}
                  className="btn btn-primary w-full sm:w-auto"
                  disabled={reschedulePaymentMutation.isPending}
                >
                  <FaCreditCard className="mr-2" />
                  {reschedulePaymentMutation.isPending 
                    ? 'Đang xử lý...' 
                    : 'Thanh toán ngay'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-4">
          {needsPayment && (
            <button
              onClick={handlePayment}
              disabled={paymentMutation.isPending}
              className="flex-1 btn btn-primary animate-pulse"
            >
              <FaCreditCard className="mr-2" />
              {paymentMutation.isPending
                ? 'Đang xử lý...'
                : 'Thanh toán ngay'}
            </button>
          )}

          {canReschedule && (
            <button
              onClick={handleOpenReschedule}
              className="flex-1 btn btn-outline"
            >
              <FaExchangeAlt className="mr-2" />
              Đổi ngày ở
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

        {/* Cancellation & Reschedule Policy (giữ nguyên phần cũ của em) */}
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
                    const daysUntilCheckIn = Math.ceil(
                      (checkInDate - now) / (1000 * 60 * 60 * 24)
                    );
                    // Nếu booking cũ có freeCancellationDays < 3, tự động nâng lên 3 để đồng bộ với quy định mới
                    const freeCancelDays = Math.max(
                      booking.cancellationPolicy.freeCancellationDays || 3,
                      3
                    );

                    const canCancelFree = daysUntilCheckIn >= freeCancelDays;
                    
                    return (
                      <>
                        {booking.cancellationPolicy.freeCancellationDays >
                        0 ? (
                          canCancelFree ? (
                            <div className="flex items-center gap-2">
                              <FaCheckCircle className="text-green-600 text-xs" />
                              <span>
                                Hủy miễn phí trước{' '}
                                <strong>{freeCancelDays}</strong> ngày nhận
                                phòng
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-orange-600">⚠</span>
                              <span>
                                Đã hết thời gian hủy miễn phí (cần hủy trước{' '}
                                <strong>{freeCancelDays}</strong> ngày)
                              </span>
                            </div>
                          )
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
                          <div className="text-blue-700">
                          <p className="font-medium">Quy định hủy phòng:</p>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>Hủy trước {freeCancelDays} ngày → Miễn phí (hoàn tiền đầy đủ)</li>
                            <li>Hủy trong vòng {freeCancelDays} ngày → Mất phí 50% và hoàn lại 50% tổng tiền đã thanh toán</li>
                          </ul>
                          </div>
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <div className="text-xs text-blue-700">
                            <strong>Thời gian còn lại:</strong>{' '}
                            {daysUntilCheckIn} ngày trước ngày nhận phòng
                          </div>
                          {/* Dự kiến hoàn tiền nếu booking CHƯA hủy */}
                          {booking.bookingStatus !== 'cancelled' && booking.paymentStatus === 'paid' && (
                            <div className="mt-2 pt-2 border-t border-blue-200">
                              {(() => {
                                const totalPaid = booking.paidAmount || booking.totalAmount || booking.finalTotal || booking.totalPrice || 0;
                                const halfPaid = totalPaid * 0.5;
                                
                                if (daysUntilCheckIn >= freeCancelDays) {
                                  return (
                                    <div className="text-green-700 font-medium text-sm">
                                      💡 Nếu hủy bây giờ, bạn sẽ được hoàn 100% = {formatPrice(totalPaid)} đ
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div className="text-orange-700 font-medium text-sm">
                                      💡 Nếu hủy bây giờ, bạn sẽ được hoàn 50% = {formatPrice(halfPaid)} đ. 50% còn lại là phí hủy phòng thuộc về khách sạn. Phí đổi lịch không hoàn lại.
                                    </div>
                                  );
                                }
                              })()}
                            </div>
                          )}
                          {daysUntilCheckIn >= freeCancelDays ? (
                            <div className="text-green-700 font-medium mt-1">
                              ✓ Bạn có thể hủy miễn phí (còn{' '}
                              {daysUntilCheckIn - freeCancelDays + 1} ngày)
                            </div>
                          ) : (
                            <div className="text-orange-700 font-medium mt-1">
                              ⚠ Hủy trong vòng {freeCancelDays} ngày sẽ mất phí 50% và hoàn lại 50% tổng tiền đã thanh toán
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
            {booking.reschedulePolicy &&
              booking.reschedulePolicy.allowed !== false && (
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
                      const daysUntilCheckIn = Math.ceil(
                        (checkInDate - now) / (1000 * 60 * 60 * 24)
                      );
                      const freeRescheduleDays =
                        booking.reschedulePolicy.freeRescheduleDays || 3;

                      return (
                        <>
                          {freeRescheduleDays > 0 ? (
                            <div className="flex items-center gap-2">
                              <FaCheckCircle className="text-green-600 text-xs" />
                              <span>
                                Dời lịch miễn phí trước{' '}
                                <strong>{freeRescheduleDays}</strong> ngày
                                nhận phòng
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-orange-600">⚠</span>
                              <span>
                                Có thể dời lịch nhưng có thể phát sinh phí
                              </span>
                            </div>
                          )}
                            <div className="text-purple-700">
                            <p className="font-medium">Quy định đổi lịch:</p>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              <li>Đổi trước {freeRescheduleDays} ngày → Miễn phí</li>
                              <li>Đổi trong vòng {freeRescheduleDays} ngày → Thu phí {booking.reschedulePolicy.rescheduleFee || 10}%</li>
                              <li>Đổi sang ngày có giá cao hơn → Bù chênh lệch</li>
                              <li>Đổi sang ngày giá thấp hơn → Không hoàn tiền</li>
                            </ul>
                            </div>
                          {booking.rescheduledAt && (
                            <div className="mt-3 pt-3 border-t border-purple-200">
                              <div className="bg-yellow-50 border border-yellow-300 rounded p-3">
                                <div className="flex items-center gap-2 text-yellow-800">
                                  <FaExclamationTriangle className="text-yellow-600" />
                                  <span className="font-medium">
                                    Đơn đặt phòng này đã được đổi lịch 1 lần. Không thể đổi lịch thêm lần nữa.
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="mt-3 pt-3 border-t border-purple-200">
                            <div className="text-xs text-purple-700">
                              <strong>Thời gian còn lại:</strong>{' '}
                              {daysUntilCheckIn} ngày trước ngày nhận phòng
                            </div>
                            {daysUntilCheckIn >= freeRescheduleDays ? (
                              <div className="text-green-700 font-medium mt-1">
                                ✓ Bạn có thể dời lịch miễn phí (còn{' '}
                                {daysUntilCheckIn -
                                  freeRescheduleDays +
                                  1}{' '}
                                ngày)
                              </div>
                            ) : (
                              <div className="text-orange-700 font-medium mt-1">
                                ⚠ Dời lịch có thể phát sinh phí (cần dời
                                trước {freeRescheduleDays} ngày)
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

      {/* ============ RESCHEDULE MODAL ============ */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FaCalendarAlt className="text-primary" />
                Đổi ngày nhận / trả phòng
              </h3>
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmitReschedule} className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Ngày nhận phòng mới
                  </label>
                  <DatePicker
                    selected={newCheckIn}
                    onChange={(date) => {
                      setNewCheckIn(date);
                      if (newCheckOut && date && newCheckOut <= date) {
                        const nextDay = new Date(date);
                        nextDay.setDate(nextDay.getDate() + 1);
                        setNewCheckOut(nextDay);
                      }
                    }}
                    minDate={new Date()}
                    dateFormat="dd/MM/yyyy"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Ngày trả phòng mới
                  </label>
                  <DatePicker
                    selected={newCheckOut}
                    onChange={(date) => setNewCheckOut(date)}
                    minDate={
                      newCheckIn
                        ? new Date(
                            newCheckIn.getTime() + 24 * 60 * 60 * 1000
                          )
                        : new Date()
                    }
                    dateFormat="dd/MM/yyyy"
                    className="input w-full"
                  />
                </div>
              </div>

              {newCheckIn && newCheckOut && (
                <div className="text-sm text-gray-700">
                  Số đêm mới:{' '}
                  <span className="font-semibold">
                    {calculateNights(newCheckIn, newCheckOut)} đêm
                  </span>
                </div>
              )}

              {/* Chi tiết chênh lệch - chỉ hiển thị khi có thay đổi và cần thanh toán thêm */}
              {newCheckIn && newCheckOut && booking && (() => {
                // Tính toán dữ liệu từ booking hiện tại
                const oldNights = calculateNights(booking.checkIn, booking.checkOut);
                const newNights = calculateNights(newCheckIn, newCheckOut);
                const addedNights = newNights > oldNights ? newNights - oldNights : 0;
                
                // Lấy giá 1 đêm từ room hoặc tính từ booking
                const pricePerNight = booking.roomId?.finalPrice || 
                                     booking.roomId?.price || 
                                     (booking.totalPrice / oldNights);
                
                // Tổng tiền phòng gốc (trước khi giảm giá) - dùng để tính phí đổi lịch
                const roomBaseOld = booking.originalTotal || (pricePerNight * oldNights);
                
                // Lấy % phí đổi lịch
                const feePercent = booking.reschedulePolicy?.rescheduleFee || 10;
                
                // Tính toán phí theo công thức yêu cầu
                // Phí đổi lịch = feePercent% của roomBaseOld (tổng tiền phòng gốc)
                const feeDetails = calculateChangeFee(roomBaseOld, pricePerNight, addedNights, feePercent);
                
                // Kiểm tra xem có cần thanh toán thêm không
                // (có thêm đêm hoặc có phí đổi lịch)
                const needsPayment = addedNights > 0 || feePercent > 0;
                
                if (needsPayment && feeDetails.total > 0) {
                  return (
                    <div className="bg-yellow-50 p-4 rounded-lg mb-4 border border-yellow-200">
                      <h4 className="font-semibold text-yellow-800 mb-3">
                        📋 Chi tiết chênh lệch
                      </h4>
                      
                      {addedNights > 0 && (
                        <div className="flex justify-between mb-2 text-sm">
                          <span className="text-gray-700">
                            Tiền phòng phát sinh ({addedNights} đêm):
                          </span>
                          <span className="font-semibold text-gray-800">
                            {formatPrice(feeDetails.roomCost)}
                          </span>
                        </div>
                      )}
                      
                      {feePercent > 0 && (
                        <div className="flex justify-between mb-2 text-sm">
                          <span className="text-gray-700">
                            Phí đổi lịch ({feePercent}% tổng tiền phòng gốc):
                          </span>
                          <span className="font-semibold text-orange-600">
                            {formatPrice(feeDetails.changeFee)}
                          </span>
                        </div>
                      )}
                      
                      <hr className="my-2 border-gray-300" />
                      <div className="flex justify-between text-base font-bold text-yellow-700">
                        <span>Tổng số tiền cần thanh toán:</span>
                        <span>{formatPrice(feeDetails.total)}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(false)}
                  className="btn btn-outline"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={rescheduleMutation.isPending}
                  className="btn btn-primary"
                >
                  {rescheduleMutation.isPending
                    ? 'Đang xử lý...'
                    : 'Xác nhận đổi lịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingDetail;
