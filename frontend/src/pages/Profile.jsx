import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FaUser, FaClipboardList, FaHeart, FaCog, FaStar, FaEdit, FaSave, FaTimes, FaKey } from 'react-icons/fa';
import { bookingAPI } from '../api/booking.api';
import { reviewAPI } from '../api/review.api';
import useAuthStore from '../store/useAuthStore';
import { formatPrice } from '../utils/formatPrice';
import { formatDate, calculateNights } from '../utils/dateUtils';
import { Link } from 'react-router-dom';
import { BOOKING_STATUS, PAYMENT_STATUS } from '../utils/constants';
import { calcBookingMoney, getPaymentStatus } from '../utils/bookingCalculations';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('bookings');
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });

  // Fetch user bookings
  const { data: bookingsData, isLoading: loadingBookings } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => bookingAPI.getMyBookings({}),
  });

  // Fetch user reviews
  const { data: reviewsData, isLoading: loadingReviews } = useQuery({
    queryKey: ['my-reviews'],
    queryFn: () => reviewAPI.getMyReviews(),
  });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const result = await updateProfile(formData);
      if (result.success) {
        toast.success('Cập nhật thông tin thành công!');
        setIsEditing(false);
      } else {
        toast.error(result.error || 'Cập nhật thất bại');
      }
    } catch (error) {
      toast.error('Đã xảy ra lỗi khi cập nhật');
    } finally {
      setIsUpdating(false);
    }
  };

  const tabs = [
    { id: 'bookings', label: 'Đặt phòng của tôi', icon: FaClipboardList },
    { id: 'reviews', label: 'Đánh giá của tôi', icon: FaStar },
    { id: 'settings', label: 'Cài đặt tài khoản', icon: FaCog },
  ];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              {/* User Avatar */}
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-primary text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-3">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-xl font-bold">{user?.name}</h2>
                <p className="text-gray-600 text-sm">{user?.email}</p>
                {user?.role === 'admin' && (
                  <span className="inline-block mt-2 bg-accent text-gray-900 px-3 py-1 rounded-full text-xs font-semibold">
                    Quản trị viên
                  </span>
                )}
              </div>

              {/* Menu */}
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <tab.icon />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div className="card p-6">
                <h2 className="text-2xl font-bold mb-6">Đặt phòng của tôi</h2>
                
                {loadingBookings ? (
                  <div className="text-center py-12">Đang tải...</div>
                ) : bookingsData?.data?.length > 0 ? (
                  <div className="space-y-4">
                    {bookingsData.data.map((booking) => {
                      // Dùng getPaymentStatus để tính trạng thái thanh toán
                      const { total, outstanding, status } = getPaymentStatus(booking);
                      
                      return (
                      <div key={booking._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-4">
                          <img
                            src={booking.roomId?.images?.[0]}
                            alt={booking.roomId?.name}
                            className="w-32 h-24 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">{booking.roomId?.name}</h3>
                                <p className="text-sm text-gray-600">{booking.hotelId?.name}</p>
                              </div>
                              <div className="text-right">
                                <span className={`badge badge-${BOOKING_STATUS[booking.bookingStatus]?.color}`}>
                                  {BOOKING_STATUS[booking.bookingStatus]?.label}
                                </span>
                                <div className="mt-1">
                                  <span className={`badge badge-${PAYMENT_STATUS[booking.paymentStatus]?.color}`}>
                                    {PAYMENT_STATUS[booking.paymentStatus]?.label}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Nhận phòng:</span>
                                <span className="ml-2 font-semibold">{formatDate(booking.checkIn)}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Trả phòng:</span>
                                <span className="ml-2 font-semibold">{formatDate(booking.checkOut)}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Số khách:</span>
                                <span className="ml-2 font-semibold">{booking.guests} khách</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Tổng tiền:</span>
                                  <span className="ml-2 font-semibold text-yellow-600">{formatPrice(total)}</span>
                                </div>
                              </div>
                              <div className="mt-2 space-y-2">
                                {/* Trạng thái thanh toán chính */}
                                <div className="text-sm">
                                  {status === 'paid' && (
                                    <span className="text-green-700 font-semibold">
                                      Đã thanh toán
                                    </span>
                                  )}
                                  {status === 'unpaid' && (
                                    <span className="text-red-600 font-semibold">
                                      Chưa thanh toán
                                    </span>
                                  )}
                                  {status === 'partial' && (
                                    <span className="text-orange-600 font-semibold">
                                      Cần thanh toán thêm {formatPrice(outstanding)}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Thông tin hoàn tiền */}
                                {booking.bookingStatus === 'cancelled' && (
                                  <div className="text-sm">
                                    {booking.refundAmount > 0 ? (
                                      <div className="text-blue-700 font-semibold">
                                        Đã hoàn: {formatPrice(booking.refundAmount)} 
                                        {booking.refundStatus === 'full' && ' (100%)'}
                                        {booking.refundStatus === 'partial' && ' (50%)'}
                                      </div>
                                    ) : (
                                      <div className="text-gray-600">
                                        Chưa hoàn tiền / Đang xử lý hoàn tiền
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {/* Cảnh báo thanh toán đổi lịch */}
                                {booking?.reschedulePayment?.status === 'pending' && 
                                 booking?.reschedulePayment?.amount > 0 && (
                                  <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 text-sm">
                                    <div className="flex items-start gap-2">
                                      <span className="text-yellow-600 font-bold">⚠️</span>
                                      <div className="flex-1">
                                        <div className="font-semibold text-yellow-800 mb-1">
                                          Cần thanh toán thêm cho đổi lịch
                                        </div>
                                        <div className="text-yellow-700">
                                          Số tiền cần thanh toán: <span className="font-bold">{formatPrice(booking.reschedulePayment.amount)}</span>
                                        </div>
                                        {booking?.rescheduleInfo && (
                                          <div className="mt-2 text-xs text-yellow-600 space-y-1">
                                            {booking.rescheduleInfo.priceDifference > 0 && (
                                              <div>• Chênh lệch giá phòng: +{formatPrice(booking.rescheduleInfo.priceDifference)}</div>
                                            )}
                                            {booking.rescheduleInfo.rescheduleFee > 0 && (
                                              <div>• Phí đổi lịch: +{formatPrice(booking.rescheduleInfo.rescheduleFee)}</div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                              <Link
                                to={`/bookings/${booking._id}`}
                                className="text-primary hover:text-primary-dark text-sm font-semibold"
                              >
                                Xem chi tiết →
                              </Link>
                              {booking.bookingStatus === 'checked-out' && !booking.hasReviewed && (
                                <Link
                                  to={`/reviews/create?roomId=${booking.roomId?._id}&bookingId=${booking._id}`}
                                  className="text-accent hover:text-yellow-600 text-sm font-semibold flex items-center"
                                >
                                  <FaStar className="mr-1" />
                                  Viết đánh giá
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📋</div>
                    <p className="text-gray-600 mb-4">Bạn chưa có đặt phòng nào</p>
                    <Link to="/search" className="btn btn-primary">
                      Tìm phòng ngay
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="card p-6">
                <h2 className="text-2xl font-bold mb-6">Đánh giá của tôi</h2>
                
                {loadingReviews ? (
                  <div className="text-center py-12">Đang tải...</div>
                ) : reviewsData?.data?.length > 0 ? (
                  <div className="space-y-4">
                    {reviewsData.data.map((review) => (
                      <div key={review._id} className="border rounded-lg p-4">
                        <div className="flex items-start space-x-4">
                          <img
                            src={review.roomId?.images?.[0]}
                            alt={review.roomId?.name}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold">{review.roomId?.name}</h3>
                                <p className="text-sm text-gray-600">{review.hotelId?.name}</p>
                              </div>
                              <div className="flex items-center bg-primary text-white px-3 py-1 rounded-lg">
                                <FaStar className="mr-1" />
                                <span className="font-semibold">{review.rating}</span>
                              </div>
                            </div>
                            <p className="text-gray-700 mb-2">{review.comment}</p>
                            <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">⭐</div>
                    <p className="text-gray-600">Bạn chưa có đánh giá nào</p>
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Cài đặt tài khoản</h2>
                    <p className="text-gray-600 text-sm mt-1">Quản lý thông tin cá nhân của bạn</p>
                  </div>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="btn btn-primary flex items-center space-x-2"
                    >
                      <FaEdit />
                      <span>Chỉnh sửa</span>
                    </button>
                  )}
                </div>
                
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`input ${isEditing ? 'border-primary/50 focus:border-primary' : 'bg-gray-50'}`}
                        disabled={!isEditing || isUpdating}
                        required
                        placeholder="Nhập họ và tên"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số điện thoại <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className={`input ${isEditing ? 'border-primary/50 focus:border-primary' : 'bg-gray-50'}`}
                        disabled={!isEditing || isUpdating}
                        required
                        placeholder="Nhập số điện thoại"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={user?.email}
                          className="input bg-gray-100 cursor-not-allowed"
                          disabled
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-gray-200 px-2 py-1 rounded-full text-gray-600">
                          Không thể thay đổi
                        </span>
                      </div>
                    </div>

                    {user?.role === 'admin' && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vai trò
                        </label>
                        <input
                          type="text"
                          value="Quản trị viên"
                          className="input bg-gray-100 cursor-not-allowed"
                          disabled
                        />
                      </div>
                    )}
                  </div>

                  {isEditing && (
                    <div className="flex items-center space-x-3 pt-4 border-t">
                      <button
                        type="submit"
                        disabled={isUpdating}
                        className="btn btn-primary flex items-center space-x-2"
                      >
                        {isUpdating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span>Đang lưu...</span>
                          </>
                        ) : (
                          <>
                            <FaSave />
                            <span>Lưu thay đổi</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({ name: user?.name || '', phone: user?.phone || '' });
                        }}
                        disabled={isUpdating}
                        className="btn btn-outline flex items-center space-x-2"
                      >
                        <FaTimes />
                        <span>Hủy</span>
                      </button>
                    </div>
                  )}
                </form>

                <hr className="my-8" />

                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <FaKey className="text-primary text-xl" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-2">Bảo mật tài khoản</h3>
                      <p className="text-gray-600 text-sm mb-4">
                        Thay đổi mật khẩu định kỳ để bảo vệ tài khoản của bạn
                      </p>
                      <Link to="/change-password" className="btn btn-outline flex items-center space-x-2 inline-flex">
                        <FaKey />
                        <span>Đổi mật khẩu</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

