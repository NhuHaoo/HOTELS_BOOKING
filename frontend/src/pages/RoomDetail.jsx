import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { roomAPI } from '../api/room.api';
import { reviewAPI } from '../api/review.api';
import { favoriteAPI } from '../api/favorite.api';
import { promotionAPI } from '../api/promotion.api';
import { formatPrice } from '../utils/formatPrice';
import {
  FaStar,
  FaMapMarkerAlt,
  FaHeart,
  FaRegHeart,
  FaUsers,
  FaBed,
  FaExpand,
  FaPhone,
  FaEnvelope,
  FaClock,
  FaUser,
  FaChild,
  FaCheckCircle,
  FaExchangeAlt,
  FaCalendarAlt,
  FaTicketAlt,
} from 'react-icons/fa';
import Loading from '../components/Loading';
import ReviewCard from '../components/ReviewCard';
import WeatherWidget from '../components/WeatherWidget';
import RoomCard from '../components/RoomCard';
import MapView from '../components/MapView';
import Breadcrumb from '../components/Breadcrumb';
import useAuthStore from '../store/useAuthStore';
import useBookingStore from '../store/useBookingStore';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

const RoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { setSelectedRoom } = useBookingStore();
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isAutoSliding, setIsAutoSliding] = useState(true);

  const { data: roomData, isLoading } = useQuery({
    queryKey: ['room', id],
    queryFn: () => roomAPI.getRoom(id),
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => reviewAPI.getRoomReviews(id, { limit: 5 }),
  });

  const { data: favoriteData } = useQuery({
    queryKey: ['favorite-check', id],
    queryFn: () => favoriteAPI.checkFavorite(id),
    enabled: isAuthenticated && !!id,
  });

  const { data: couponRes } = useQuery({
    queryKey: ['active-coupons'],
    queryFn: () => promotionAPI.getActiveCoupons(),
  });

  const room = roomData?.data;
  const reviews = reviewsData?.data || [];
  const reviewStats = reviewsData?.stats;

  // Lọc mã giảm giá áp dụng cho phòng này
  const coupons =
    couponRes?.data?.data ||
    couponRes?.data ||
    [];
  
  // Tìm mã giảm giá phù hợp với phòng này:
  // - Mã global (applyType = 'global')
  // - Mã áp dụng cho hotel này (applyType = 'hotel' và hotelId chứa hotel._id)
  // - Mã áp dụng cho phòng này (applyType = 'room' và roomId = room._id)
  const applicableCoupons = coupons.filter((coupon) => {
    if (!coupon || !room) return false;
    
    // Mã global - áp dụng cho tất cả
    if (coupon.applyType === 'global') return true;
    
    // Mã áp dụng cho hotel
    if (coupon.applyType === 'hotel' && room.hotelId?._id) {
      const hotelId = room.hotelId._id.toString();
      // hotelId có thể là ObjectId hoặc array
      if (Array.isArray(coupon.hotelId)) {
        return coupon.hotelId.some(
          (id) => id?.toString() === hotelId
        );
      } else {
        return coupon.hotelId?.toString() === hotelId;
      }
    }
    
    // Mã áp dụng cho phòng cụ thể
    if (coupon.applyType === 'room' && coupon.roomId) {
      return coupon.roomId.toString() === room._id.toString();
    }
    
    return false;
  });
  
  // Lấy mã tốt nhất (ưu tiên theo discount value)
  const bestCoupon = applicableCoupons.length > 0
    ? applicableCoupons.sort((a, b) => {
        const valueA = a.discountType === 'percent' 
          ? a.discountValue * 1000 
          : a.discountValue;
        const valueB = b.discountType === 'percent' 
          ? b.discountValue * 1000 
          : b.discountValue;
        return valueB - valueA;
      })[0]
    : null;

  const { data: otherRoomsData } = useQuery({
    queryKey: ['other-rooms', room?.hotelId?._id, id],
    queryFn: () =>
      roomAPI.getRoomsByHotel(room.hotelId._id, {
        excludeRoomId: id,
        limit: 3,
      }),
    enabled: !!room?.hotelId?._id,
  });

  const otherRooms = otherRoomsData?.data || [];

  useEffect(() => {
    if (favoriteData?.isFavorited !== undefined) {
      setIsFavorited(favoriteData.isFavorited);
    }
  }, [favoriteData]);

  // Auto-slide images every 3 seconds
  useEffect(() => {
    if (!room?.images || room.images.length <= 1 || !isAutoSliding) {
      return;
    }

    const interval = setInterval(() => {
      setSelectedImage((prev) => {
        return (prev + 1) % room.images.length;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [room?.images, isAutoSliding]);

  const handleBookNow = () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để đặt phòng');
      navigate('/login');
      return;
    }

    setSelectedRoom(room);
    navigate('/booking');
  };

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để sử dụng tính năng này');
      return;
    }

    const previousState = isFavorited;
    setIsFavorited(!isFavorited);

    try {
      if (previousState) {
        await favoriteAPI.removeFavoriteByRoom(room._id);
        toast.success('Đã xóa khỏi yêu thích');
      } else {
        await favoriteAPI.addFavorite(room._id);
        toast.success('Đã thêm vào yêu thích');
      }
    } catch (error) {
      setIsFavorited(previousState);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (!room) {
    return (
      <div className="container-custom py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Không tìm thấy phòng</h2>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          Về trang chủ
        </button>
      </div>
    );
  }

  // Tạo breadcrumb items
  const breadcrumbItems = [
    { label: 'Trang chủ', path: '/' },
  ];

  // Thêm thành phố
  if (room?.hotelId?.city) {
    breadcrumbItems.push({
      label: room.hotelId.city,
      path: `/search?city=${encodeURIComponent(room.hotelId.city)}`,
    });
  }

  // Thêm tên khách sạn (item cuối cùng, không có path)
  if (room?.hotelId?.name) {
    breadcrumbItems.push({
      label: room.hotelId.name,
      path: null, // Không click được
    });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      <div className="container-custom py-8">

        {/* Image Gallery */}
        <div className="grid grid-cols-4 gap-2 mb-8">
          <div 
            className="col-span-4 md:col-span-3 h-96 rounded-xl overflow-hidden relative"
            onMouseEnter={() => setIsAutoSliding(false)}
            onMouseLeave={() => setIsAutoSliding(true)}
          >
            <img
              src={room.images?.[selectedImage] || '/placeholder-room.jpg'}
              alt={room.name}
              className="w-full h-full object-cover transition-opacity duration-500"
            />
          </div>
          <div className="col-span-4 md:col-span-1 grid grid-cols-4 md:grid-cols-1 gap-2">
            {room.images?.slice(0, 4).map((image, index) => (
              <div
                key={index}
                onClick={() => {
                  setSelectedImage(index);
                  setIsAutoSliding(false);
                  // Resume auto-sliding after 5 seconds of manual selection
                  setTimeout(() => setIsAutoSliding(true), 5000);
                }}
                className={`h-24 rounded-lg overflow-hidden cursor-pointer transition-all ${
                  selectedImage === index ? 'ring-2 ring-primary' : ''
                }`}
              >
                <img
                  src={image}
                  alt={`Room ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-110 transition-transform"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Room Info */}
            <div className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {room.name}
                  </h1>
                  {room.hotelId && (
                    <div className="flex items-center text-gray-600 mb-2">
                      <FaMapMarkerAlt className="mr-2" />
                      <span>
                        {room.hotelId.name} - {room.hotelId.city}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center bg-primary text-white px-3 py-1 rounded-lg">
                      <FaStar className="mr-1" />
                      <span className="font-semibold">
                        {room.rating?.toFixed(1) || 'N/A'}
                      </span>
                    </div>
                    <span className="text-gray-600">
                      ({room.totalReviews || 0} đánh giá)
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleFavoriteToggle}
                  className="p-3 rounded-full hover:bg-gray-100 transition-colors"
                >
                  {isFavorited ? (
                    <FaHeart className="text-red-500 text-2xl" />
                  ) : (
                    <FaRegHeart className="text-gray-600 text-2xl" />
                  )}
                </button>
              </div>

              <p className="text-gray-700 leading-relaxed">
                {room.description}
              </p>

              {/* Room Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                {room.maxAdults ? (
                  <>
                    <div className="flex flex-col items-center text-center">
                      <FaUser className="text-primary text-2xl mb-2" />
                      <span className="text-sm text-gray-600">Người lớn</span>
                      <span className="font-semibold">
                        {room.maxAdults} người
                      </span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <FaChild className="text-primary text-2xl mb-2" />
                      <span className="text-sm text-gray-600">Trẻ em</span>
                      <span className="font-semibold">
                        {room.maxChildren || 0} trẻ
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <FaUsers className="text-primary text-2xl mb-2" />
                    <span className="text-sm text-gray-600">Số khách</span>
                    <span className="font-semibold">
                      {room.maxGuests} người
                    </span>
                  </div>
                )}
                <div className="flex flex-col items-center text-center">
                  <FaBed className="text-primary text-2xl mb-2" />
                  <span className="text-sm text-gray-600">Giường</span>
                  <span className="font-semibold">
                    {room.numberOfBeds} {room.bedType}
                  </span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <FaExpand className="text-primary text-2xl mb-2" />
                  <span className="text-sm text-gray-600">Diện tích</span>
                  <span className="font-semibold">{room.size} m²</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <span className="text-primary text-2xl mb-2">🏨</span>
                  <span className="text-sm text-gray-600">Loại phòng</span>
                  <span className="font-semibold capitalize">
                    {room.roomType}
                  </span>
                </div>
              </div>

              {room.availableRoomsCount !== undefined && (
                <div className="mt-4 pt-4 border-t">
                  <div
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                      room.availableRoomsCount > 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    <FaCheckCircle />
                    <span>
                      {room.availableRoomsCount > 0
                        ? `Còn ${room.availableRoomsCount} phòng trống`
                        : 'Hết phòng'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Tiện nghi phòng */}
            <div className="card p-6">
              <h2 className="text-xl font-bold mb-4">Tiện nghi phòng</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {room.amenities?.map((amenity, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-primary">✓</span>
                    <span className="capitalize">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Location Map */}
            {room.hotelId?.location?.coordinates && (
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-4">📍 Vị trí khách sạn</h2>
                <MapView
                  latitude={room.hotelId.location.coordinates[1]}
                  longitude={room.hotelId.location.coordinates[0]}
                  hotelName={room.hotelId.name}
                  hotelAddress={`${room.hotelId.address}, ${room.hotelId.city}`}
                  zoom={15}
                  height="450px"
                />
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Địa chỉ:</strong> {room.hotelId.address},{' '}
                    {room.hotelId.city}
                  </p>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${room.hotelId.location.coordinates[1]},${room.hotelId.location.coordinates[0]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 text-primary hover:text-primary-dark font-semibold text-sm"
                  >
                    🧭 Chỉ đường đến đây →
                  </a>
                </div>
              </div>
            )}

            {/* Weather */}
            {room.hotelId && (
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-4">
                  🌤️ Thời tiết tại {room.hotelId.city}
                </h2>
                <WeatherWidget
                  city={room.hotelId.city}
                  coordinates={room.hotelId.location?.coordinates}
                />
              </div>
            )}

            {/* Other Rooms at This Hotel */}
            {otherRooms.length > 0 && (
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-4">
                  Các phòng khác tại {room.hotelId?.name}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {otherRooms.map((otherRoom) => (
                    <RoomCard key={otherRoom._id} room={otherRoom} />
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="card p-6">
              <h2 className="text-xl font-bold mb-4">
                Đánh giá từ khách hàng
              </h2>

              {reviewStats && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary">
                        {reviewStats.averageRating?.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {reviewStats.totalReviews} đánh giá
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      {[5, 4, 3, 2, 1].map((star) => (
                        <div
                          key={star}
                          className="flex items-center space-x-2"
                        >
                          <span className="text-sm w-12">{star} sao</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-accent h-2 rounded-full"
                              style={{
                                width: `${
                                  (reviewStats[`rating${star}`] /
                                    reviewStats.totalReviews) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm w-8 text-right">
                            {reviewStats[`rating${star}`] || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <ReviewCard key={review._id} review={review} />
                  ))
                ) : (
                  <p className="text-center text-gray-600 py-8">
                    Chưa có đánh giá nào
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-20">
              <div className="mb-6">
                {room.discount > 0 && (
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500 line-through">
                      {formatPrice(room.price)}
                    </span>
                    <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
                      -{room.discount}%
                    </span>
                  </div>
                )}
                <div className="flex items-end">
                  <span className="text-4xl font-bold text-accent">
                    {formatPrice(room.finalPrice || room.price)}
                  </span>
                  <span className="text-gray-600 ml-2">/ đêm</span>
                </div>
              </div>

              {bestCoupon && (
                <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200 text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <FaTicketAlt className="text-green-600" />
                    <span className="font-semibold text-green-800">
                      Mã khuyến mãi hiện có
                    </span>
                  </div>
                  <div className="mb-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-dashed border-green-400 font-mono text-xs tracking-wide text-green-800">
                      {bestCoupon.code}
                    </span>
                  </div>
                  <p className="text-green-700">
                    {bestCoupon.discountType === 'percent'
                      ? `Giảm ${bestCoupon.discountValue}% cho đơn từ ${formatPrice(
                          bestCoupon.minOrderAmount || 0
                        )}`
                      : `Giảm ${formatPrice(
                          bestCoupon.discountValue
                        )} cho đơn từ ${formatPrice(
                          bestCoupon.minOrderAmount || 0
                        )}`}
                  </p>
                  {bestCoupon.endDate && (
                    <p className="mt-1 text-xs text-green-600">
                      HSD:{' '}
                      {new Date(bestCoupon.endDate).toLocaleDateString(
                        'vi-VN'
                      )}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-600">
                    * Nhập mã ở bước thanh toán để áp dụng.
                  </p>
                </div>
              )}

              {room.availability ? (
                <>
                  <button
                    onClick={handleBookNow}
                    className="w-full btn btn-primary py-3 mb-4"
                  >
                    Đặt phòng ngay
                  </button>
                  {room.hotelId?.cancellationPolicy && (
                    <div className="text-sm text-gray-600 text-center space-y-1">
                      {room.hotelId.cancellationPolicy
                        .freeCancellationDays > 0 && (
                        <p className="flex items-center justify-center gap-1">
                          <FaCheckCircle className="text-green-500" />
                          Hủy miễn phí trước{' '}
                          {
                            room.hotelId.cancellationPolicy
                              .freeCancellationDays
                          }{' '}
                          ngày
                        </p>
                      )}
                      {room.hotelId.cancellationPolicy.refundable && (
                        <p className="flex items-center justify-center gap-1">
                          <FaCheckCircle className="text-green-500" />
                          Có thể hoàn tiền
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-red-50 text-red-800 px-4 py-3 rounded-lg text-center">
                  Phòng hiện không có sẵn
                </div>
              )}

              {room.availableDates && room.availableDates.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                    <FaCalendarAlt className="text-primary" />
                    <span>Ngày trống ({room.availableDates.length} ngày)</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Có sẵn từ {room.availableDates[0]} đến{' '}
                    {room.availableDates[room.availableDates.length - 1]}
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Giá phòng</span>
                  <span className="font-semibold">
                    {formatPrice(room.finalPrice || room.price)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phí dịch vụ</span>
                  <span className="font-semibold">Miễn phí</span>
                </div>
                <div className="flex justify-between pt-3 border-t font-semibold text-lg">
                  <span>Tổng cộng</span>
                  <span className="text-accent">
                    {formatPrice(room.finalPrice || room.price)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetail;
