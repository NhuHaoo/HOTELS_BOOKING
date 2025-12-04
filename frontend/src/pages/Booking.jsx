// frontend/src/pages/Booking.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { bookingAPI } from '../api/booking.api';
import { paymentAPI } from '../api/payment.api';
import useBookingStore from '../store/useBookingStore';
import useAuthStore from '../store/useAuthStore';
import { formatPrice } from '../utils/formatPrice';
import { formatDate, calculateNights } from '../utils/dateUtils';
import toast from 'react-hot-toast';
import {
  FaCheckCircle,
  FaExchangeAlt,
  FaCalendarAlt,
  FaInfoCircle,
} from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import PromoCodeBox from '../components/PromoCodeBox';

const Booking = () => {
  const navigate = useNavigate();
  const { selectedRoom, checkIn, checkOut, guests, clearBooking } =
    useBookingStore();
  const { user } = useAuthStore();

  const [bookingData, setBookingData] = useState({
    checkIn: checkIn ? new Date(checkIn) : new Date(),
    checkOut: checkOut
      ? new Date(checkOut)
      : new Date(Date.now() + 86400000),
    guests: guests || 2,
    guestName: user?.name || '',
    guestEmail: user?.email || '',
    guestPhone: user?.phone || '',
    specialRequests: '',
    paymentMethod: 'vnpay',
  });

  const [vnpayMethod, setVnpayMethod] = useState('VNPAYQR'); // Default to QR

  // ====== STATE KHUYẾN MÃI ======
  const [promoInfo, setPromoInfo] = useState({
    promotionId: null,
    promotionCode: null,
    discountAmount: 0,
    finalTotal: 0,
  });

  if (!selectedRoom) {
    return (
      <div className="container-custom py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">
          Vui lòng chọn phòng trước
        </h2>
        <button
          onClick={() => navigate('/search')}
          className="btn btn-primary"
        >
          Tìm phòng
        </button>
      </div>
    );
  }

  const nights = calculateNights(
    bookingData.checkIn,
    bookingData.checkOut
  );
  const totalPrice =
    (selectedRoom.finalPrice || selectedRoom.price) * nights;

  // Tổng tiền sau khi áp mã
  const finalTotal = promoInfo.finalTotal || totalPrice;
  const discountAmount = promoInfo.discountAmount || 0;

  const handlePromoChange = (data) => {
    // data = { promotionId, promotionCode, discountAmount, finalTotal }
    setPromoInfo(data);
  };

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: (data) => bookingAPI.createBooking(data),
    onSuccess: async (response) => {
      const booking = response.data;
      toast.success('Đặt phòng thành công!');

      // (tuỳ em) clearBooking();
      // clearBooking();

      // Create VNPay payment with selected method
      try {
        const paymentResponse =
          await paymentAPI.createVNPayPayment(
            booking._id,
            vnpayMethod
          );
        // Redirect to VNPay
        window.location.href = paymentResponse.data.paymentUrl;
      } catch (error) {
        console.error('Payment error:', error);
        toast.error('Có lỗi xảy ra khi tạo thanh toán');
        navigate(`/bookings/${booking._id}`);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Đặt phòng thất bại');
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    createBookingMutation.mutate({
      roomId: selectedRoom._id,
      checkIn: bookingData.checkIn.toISOString(),
      checkOut: bookingData.checkOut.toISOString(),
      guests: bookingData.guests,
      guestName: bookingData.guestName,
      guestEmail: bookingData.guestEmail,
      guestPhone: bookingData.guestPhone,
      specialRequests: bookingData.specialRequests,
      paymentMethod: bookingData.paymentMethod,

      // 🔻 gửi kèm thông tin khuyến mãi
      promotionId: promoInfo.promotionId,
      promotionCode: promoInfo.promotionCode,
      discountAmount: discountAmount,
      finalTotal: finalTotal, // 👈 THÊM DÒNG NÀY
    });
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container-custom">
        <h1 className="text-3xl font-bold mb-8">
          Xác nhận đặt phòng
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Guest Information */}
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-4">
                  Thông tin khách hàng
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Họ và tên *
                    </label>
                    <input
                      type="text"
                      value={bookingData.guestName}
                      onChange={(e) =>
                        setBookingData({
                          ...bookingData,
                          guestName: e.target.value,
                        })
                      }
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={bookingData.guestEmail}
                      onChange={(e) =>
                        setBookingData({
                          ...bookingData,
                          guestEmail: e.target.value,
                        })
                      }
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      value={bookingData.guestPhone}
                      onChange={(e) =>
                        setBookingData({
                          ...bookingData,
                          guestPhone: e.target.value,
                        })
                      }
                      className="input"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-4">
                  Chi tiết đặt phòng
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nhận phòng *
                    </label>
                    <DatePicker
                      selected={bookingData.checkIn}
                      onChange={(date) =>
                        setBookingData({
                          ...bookingData,
                          checkIn: date,
                        })
                      }
                      minDate={new Date()}
                      dateFormat="dd/MM/yyyy"
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trả phòng *
                    </label>
                    <DatePicker
                      selected={bookingData.checkOut}
                      onChange={(date) =>
                        setBookingData({
                          ...bookingData,
                          checkOut: date,
                        })
                      }
                      minDate={bookingData.checkIn}
                      dateFormat="dd/MM/yyyy"
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số khách *
                    </label>
                    <select
                      value={bookingData.guests}
                      onChange={(e) =>
                        setBookingData({
                          ...bookingData,
                          guests: parseInt(e.target.value),
                        })
                      }
                      className="input"
                      required
                    >
                      {[...Array(selectedRoom.maxGuests)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1} khách
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Yêu cầu đặc biệt (tùy chọn)
                    </label>
                    <textarea
                      value={bookingData.specialRequests}
                      onChange={(e) =>
                        setBookingData({
                          ...bookingData,
                          specialRequests: e.target.value,
                        })
                      }
                      className="input"
                      rows="3"
                      placeholder="Ví dụ: Phòng tầng cao, nhận phòng sớm..."
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-4">
                  Phương thức thanh toán
                </h2>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer p-4 border rounded-lg hover:border-primary">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="vnpay"
                      checked={bookingData.paymentMethod === 'vnpay'}
                      onChange={(e) =>
                        setBookingData({
                          ...bookingData,
                          paymentMethod: e.target.value,
                        })
                      }
                      className="text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                      <div className="font-semibold">VNPay</div>
                      <div className="text-sm text-gray-600">
                        Thanh toán qua cổng VNPay
                      </div>
                    </div>
                    <img
                      src="/vnpay-logo.png"
                      alt="VNPay"
                      className="h-8"
                      onError={(e) =>
                        (e.target.style.display = 'none')
                      }
                    />
                  </label>
                </div>

                {/* VNPay Payment Options */}
                {bookingData.paymentMethod === 'vnpay' && (
                  <div className="mt-4 pt-4 border-t">
                    <h3 className="font-semibold mb-3 text-sm text-gray-700">
                      Chọn phương thức VNPay:
                    </h3>
                    <div className="space-y-2">
                      {/* QR Code */}
                      <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          name="vnpayMethod"
                          value="VNPAYQR"
                          checked={vnpayMethod === 'VNPAYQR'}
                          onChange={(e) =>
                            setVnpayMethod(e.target.value)
                          }
                          className="text-primary focus:ring-primary"
                        />
                        <div className="flex-1">
                          <div className="font-medium">
                            📱 VNPay QR
                          </div>
                          <div className="text-xs text-gray-600">
                            Quét mã QR để thanh toán
                          </div>
                        </div>
                      </label>

                      {/* ATM Card */}
                      <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          name="vnpayMethod"
                          value="VNBANK"
                          checked={vnpayMethod === 'VNBANK'}
                          onChange={(e) =>
                            setVnpayMethod(e.target.value)
                          }
                          className="text-primary focus:ring-primary"
                        />
                        <div className="flex-1">
                          <div className="font-medium">
                            🏦 Thẻ ATM nội địa
                          </div>
                          <div className="text-xs text-gray-600">
                            Thanh toán qua thẻ ATM
                          </div>
                        </div>
                      </label>

                      {/* International Card */}
                      <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          name="vnpayMethod"
                          value="INTCARD"
                          checked={vnpayMethod === 'INTCARD'}
                          onChange={(e) =>
                            setVnpayMethod(e.target.value)
                          }
                          className="text-primary focus:ring-primary"
                        />
                        <div className="flex-1">
                          <div className="font-medium">
                            💳 Thẻ quốc tế
                          </div>
                          <div className="text-xs text-gray-600">
                            VISA / MasterCard / JCB
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Booking Summary */}
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-20">
                <h2 className="text-xl font-bold mb-4">
                  Tóm tắt đặt phòng
                </h2>

                {/* Room Info */}
                <div className="mb-4">
                  <img
                    src={selectedRoom.images?.[0]}
                    alt={selectedRoom.name}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                  <h3 className="font-semibold text-lg">
                    {selectedRoom.name}
                  </h3>
                  {selectedRoom.hotelId && (
                    <p className="text-sm text-gray-600">
                      {selectedRoom.hotelId.name}
                    </p>
                  )}
                </div>

                {/* Booking Details */}
                <div className="space-y-3 py-4 border-y text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Nhận phòng:
                    </span>
                    <span className="font-semibold">
                      {formatDate(bookingData.checkIn)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Trả phòng:
                    </span>
                    <span className="font-semibold">
                      {formatDate(bookingData.checkOut)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Số đêm:</span>
                    <span className="font-semibold">
                      {nights} đêm
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Số khách:</span>
                    <span className="font-semibold">
                      {bookingData.guests} khách
                    </span>
                  </div>
                </div>

                {/* Price Details */}
                <div className="space-y-3 py-4 border-b">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {formatPrice(
                        selectedRoom.finalPrice || selectedRoom.price
                      )}{' '}
                      x {nights} đêm
                    </span>
                    <span className="font-semibold">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>

                  {/* Giảm giá từ mã khuyến mãi */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Giảm giá</span>
                    <span className="font-semibold text-red-500">
                      -{formatPrice(discountAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Phí dịch vụ
                    </span>
                    <span className="font-semibold">Miễn phí</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center py-4 text-lg font-bold">
                  <span>Tổng cộng</span>
                  <span className="text-accent text-2xl">
                    {formatPrice(finalTotal)}
                  </span>
                </div>

                {/* Mã khuyến mãi */}
                <PromoCodeBox
                  totalAmount={totalPrice}
                  onChange={handlePromoChange}
                />

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={createBookingMutation.isPending}
                  className="w-full btn btn-primary py-3 mb-4 mt-4"
                >
                  {createBookingMutation.isPending ? (
                    'Đang xử lý...'
                  ) : (
                    <>
                      <FaCheckCircle className="inline mr-2" />
                      Xác nhận đặt phòng
                    </>
                  )}
                </button>

                {/* Cancellation & Reschedule Policy */}
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FaExchangeAlt className="text-primary" />
                    Chính sách đổi trả & dời lịch
                  </h3>
                  <div className="space-y-3 text-sm">
                    {/* Cancellation Policy */}
                    {selectedRoom.hotelId?.cancellationPolicy && (
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-start gap-3">
                          <FaInfoCircle className="text-blue-600 text-lg mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-blue-900 mb-2">
                              Chính sách hủy phòng
                            </h4>
                            <div className="space-y-1.5 text-blue-800">
                              {selectedRoom.hotelId
                                .cancellationPolicy
                                .freeCancellationDays > 0 ? (
                                <div className="flex items-center gap-2">
                                  <FaCheckCircle className="text-green-600 text-xs" />
                                  <span>
                                    Hủy miễn phí trước{' '}
                                    <strong>
                                      {
                                        selectedRoom.hotelId
                                          .cancellationPolicy
                                          .freeCancellationDays
                                      }
                                    </strong>{' '}
                                    ngày nhận phòng
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-red-600">
                                    ✗
                                  </span>
                                  <span>
                                    Không được hủy miễn phí
                                  </span>
                                </div>
                              )}
                              {selectedRoom.hotelId
                                .cancellationPolicy.refundable ? (
                                <div className="flex items-center gap-2">
                                  <FaCheckCircle className="text-green-600 text-xs" />
                                  <span>Có thể hoàn tiền</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-red-600">
                                    ✗
                                  </span>
                                  <span>Không hoàn tiền</span>
                                </div>
                              )}
                              {selectedRoom.hotelId
                                .cancellationPolicy
                                .cancellationFee > 0 && (
                                <div className="text-blue-700">
                                  Phí hủy:{' '}
                                  <strong>
                                    {
                                      selectedRoom.hotelId
                                        .cancellationPolicy
                                        .cancellationFee
                                    }
                                    %
                                  </strong>{' '}
                                  của tổng giá trị
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Reschedule Policy - Default if not in hotel */}
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <div className="flex items-start gap-3">
                        <FaCalendarAlt className="text-purple-600 text-lg mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-purple-900 mb-2">
                            Chính sách dời lịch
                          </h4>
                          <div className="space-y-1.5 text-purple-800">
                            {(() => {
                              // Use hotel reschedulePolicy if available, otherwise default
                              const reschedulePolicy =
                                selectedRoom.hotelId?.reschedulePolicy ||
                                {
                                  freeRescheduleDays: 3,
                                  rescheduleFee: 0,
                                  allowed: true,
                                };

                              return reschedulePolicy.allowed !==
                                false ? (
                                <>
                                  {reschedulePolicy
                                    .freeRescheduleDays > 0 ? (
                                    <div className="flex items-center gap-2">
                                      <FaCheckCircle className="text-green-600 text-xs" />
                                      <span>
                                        Dời lịch miễn phí trước{' '}
                                        <strong>
                                          {
                                            reschedulePolicy.freeRescheduleDays
                                          }
                                        </strong>{' '}
                                        ngày nhận phòng
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span className="text-orange-600">
                                        ⚠
                                      </span>
                                      <span>
                                        Có thể dời lịch nhưng có thể
                                        phát sinh phí
                                      </span>
                                    </div>
                                  )}
                                  {reschedulePolicy.rescheduleFee >
                                    0 && (
                                    <div className="text-purple-700">
                                      Phí dời lịch:{' '}
                                      <strong>
                                        {
                                          reschedulePolicy.rescheduleFee
                                        }
                                        %
                                      </strong>{' '}
                                      của tổng giá trị
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-red-600">
                                    ✗
                                  </span>
                                  <span>
                                    Không được phép dời lịch
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Calculate days until check-in */}
                    {(() => {
                      const checkInDate = new Date(
                        bookingData.checkIn
                      );
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      checkInDate.setHours(0, 0, 0, 0);
                      const daysUntilCheckIn = Math.ceil(
                        (checkInDate - today) /
                          (1000 * 60 * 60 * 24)
                      );
                      const freeCancelDays =
                        selectedRoom.hotelId
                          ?.cancellationPolicy
                          ?.freeCancellationDays || 1;
                      const reschedulePolicy =
                        selectedRoom.hotelId?.reschedulePolicy ||
                        {
                          freeRescheduleDays: 3,
                          rescheduleFee: 0,
                          allowed: true,
                        };
                      const freeRescheduleDays =
                        reschedulePolicy.freeRescheduleDays || 3;

                      return (
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="text-xs text-gray-700 space-y-1">
                            <div>
                              <strong>Thời gian còn lại:</strong>{' '}
                              {daysUntilCheckIn} ngày trước
                              ngày nhận phòng
                            </div>
                            {daysUntilCheckIn >= freeCancelDays ? (
                              <div className="text-green-700 font-medium">
                                ✓ Bạn có thể hủy miễn phí (còn{' '}
                                {daysUntilCheckIn -
                                  freeCancelDays +
                                  1}{' '}
                                ngày)
                              </div>
                            ) : (
                              <div className="text-red-700 font-medium">
                                ✗ Không thể hủy miễn phí (cần hủy
                                trước {freeCancelDays} ngày)
                              </div>
                            )}
                            {daysUntilCheckIn >=
                            freeRescheduleDays ? (
                              <div className="text-green-700 font-medium">
                                ✓ Bạn có thể dời lịch miễn phí (còn{' '}
                                {daysUntilCheckIn -
                                  freeRescheduleDays +
                                  1}{' '}
                                ngày)
                              </div>
                            ) : (
                              <div className="text-orange-700 font-medium">
                                ⚠ Dời lịch có thể phát sinh phí
                                (cần dời trước {freeRescheduleDays}{' '}
                                ngày)
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <p className="text-xs text-gray-600 text-center mt-4">
                  Bằng việc đặt phòng, bạn đồng ý với{' '}
                  <a href="/terms" className="text-primary">
                    Điều khoản sử dụng
                  </a>{' '}
                  của chúng tôi
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Booking;
