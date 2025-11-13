import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { roomAPI } from '../api/room.api';
import { reviewAPI } from '../api/review.api';
import { favoriteAPI } from '../api/favorite.api';
import { formatPrice } from '../utils/formatPrice';
import { FaStar, FaMapMarkerAlt, FaHeart, FaRegHeart, FaUsers, FaBed, FaExpand, FaPhone, FaEnvelope, FaClock, FaUser, FaChild, FaHotel, FaCheckCircle, FaExchangeAlt, FaCalendarAlt } from 'react-icons/fa';
import Loading from '../components/Loading';
import ReviewCard from '../components/ReviewCard';
import WeatherWidget from '../components/WeatherWidget';
import RoomCard from '../components/RoomCard';
import MapView from '../components/MapView';
import useAuthStore from '../store/useAuthStore';
import useBookingStore from '../store/useBookingStore';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

const RoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { setSelectedRoom, setDates } = useBookingStore();
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  // Fetch room details
  const { data: roomData, isLoading } = useQuery({
    queryKey: ['room', id],
    queryFn: () => roomAPI.getRoom(id),
  });

  // Fetch reviews
  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => reviewAPI.getRoomReviews(id, { limit: 5 }),
  });

  // Check favorite status
  const { data: favoriteData } = useQuery({
    queryKey: ['favorite-check', id],
    queryFn: () => favoriteAPI.checkFavorite(id),
    enabled: isAuthenticated && !!id,
  });

  const room = roomData?.data;
  const reviews = reviewsData?.data || [];
  const reviewStats = reviewsData?.stats;

  // Fetch other rooms from same hotel
  const { data: otherRoomsData } = useQuery({
    queryKey: ['other-rooms', room?.hotelId?._id, id],
    queryFn: () => roomAPI.getRoomsByHotel(room.hotelId._id, { excludeRoomId: id, limit: 3 }),
    enabled: !!room?.hotelId?._id,
  });

  const otherRooms = otherRoomsData?.data || [];

  // Update favorite state when data loads
  // axiosClient already unwraps response.data
  useEffect(() => {
    if (favoriteData?.isFavorited !== undefined) {
      setIsFavorited(favoriteData.isFavorited);
    }
  }, [favoriteData]);

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

    // Optimistic update
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
      // Revert on error
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-8">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-600 mb-6">
          <span className="hover:text-primary cursor-pointer" onClick={() => navigate('/')}>
            Trang chủ
          </span>
          <span className="mx-2">/</span>
          <span className="hover:text-primary cursor-pointer" onClick={() => navigate('/search')}>
            Tìm kiếm
          </span>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{room.name}</span>
        </div>

        {/* Image Gallery */}
        <div className="grid grid-cols-4 gap-2 mb-8">
          <div className="col-span-4 md:col-span-3 h-96 rounded-xl overflow-hidden">
            <img
              src={room.images?.[selectedImage] || '/placeholder-room.jpg'}
              alt={room.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="col-span-4 md:col-span-1 grid grid-cols-4 md:grid-cols-1 gap-2">
            {room.images?.slice(0, 4).map((image, index) => (
              <div
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`h-24 rounded-lg overflow-hidden cursor-pointer ${
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
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{room.name}</h1>
                  {room.hotelId && (
                    <div className="flex items-center text-gray-600 mb-2">
                      <FaMapMarkerAlt className="mr-2" />
                      <span>{room.hotelId.name} - {room.hotelId.city}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center bg-primary text-white px-3 py-1 rounded-lg">
                      <FaStar className="mr-1" />
                      <span className="font-semibold">{room.rating?.toFixed(1) || 'N/A'}</span>
                    </div>
                    <span className="text-gray-600">({room.totalReviews || 0} đánh giá)</span>
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

              <p className="text-gray-700 leading-relaxed">{room.description}</p>

              {/* Room Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                {room.maxAdults ? (
                  <>
                    <div className="flex flex-col items-center text-center">
                      <FaUser className="text-primary text-2xl mb-2" />
                      <span className="text-sm text-gray-600">Người lớn</span>
                      <span className="font-semibold">{room.maxAdults} người</span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <FaChild className="text-primary text-2xl mb-2" />
                      <span className="text-sm text-gray-600">Trẻ em</span>
                      <span className="font-semibold">{room.maxChildren || 0} trẻ</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <FaUsers className="text-primary text-2xl mb-2" />
                    <span className="text-sm text-gray-600">Số khách</span>
                    <span className="font-semibold">{room.maxGuests} người</span>
                  </div>
                )}
                <div className="flex flex-col items-center text-center">
                  <FaBed className="text-primary text-2xl mb-2" />
                  <span className="text-sm text-gray-600">Giường</span>
                  <span className="font-semibold">{room.numberOfBeds} {room.bedType}</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <FaExpand className="text-primary text-2xl mb-2" />
                  <span className="text-sm text-gray-600">Diện tích</span>
                  <span className="font-semibold">{room.size} m²</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <span className="text-primary text-2xl mb-2">🏨</span>
                  <span className="text-sm text-gray-600">Loại phòng</span>
                  <span className="font-semibold capitalize">{room.roomType}</span>
                </div>
              </div>

              {/* Available Rooms Count */}
              {room.availableRoomsCount !== undefined && (
                <div className="mt-4 pt-4 border-t">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                    room.availableRoomsCount > 0 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
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

            {/* Hotel Information */}
            {room.hotelId && (
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-4">Thông tin khách sạn</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{room.hotelId.name}</h3>
                      {room.hotelId.hotelType && (
                        <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                          <FaHotel />
                          {room.hotelId.hotelType === 'hotel' ? 'Khách sạn' :
                           room.hotelId.hotelType === 'resort' ? 'Resort' :
                           room.hotelId.hotelType === 'apartment' ? 'Căn hộ' :
                           room.hotelId.hotelType === 'villa' ? 'Villa' :
                           room.hotelId.hotelType === 'hostel' ? 'Hostel' :
                           room.hotelId.hotelType === 'motel' ? 'Motel' :
                           room.hotelId.hotelType}
                        </span>
                      )}
                      {room.hotelId.starRating && (
                        <div className="flex items-center gap-1">
                          {[...Array(room.hotelId.starRating)].map((_, i) => (
                            <FaStar key={i} className="text-yellow-400 text-sm" />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center text-gray-600 mb-2">
                      <FaMapMarkerAlt className="mr-2" />
                      <span>{room.hotelId.address}, {room.hotelId.city}</span>
                    </div>
                    {room.hotelId.rating && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center bg-primary text-white px-3 py-1 rounded-lg">
                          <FaStar className="mr-1" />
                          <span className="font-semibold">{room.hotelId.rating.toFixed(1)}</span>
                        </div>
                        <span className="text-gray-600">
                          ({room.hotelReviewsCount || room.hotelId.totalReviews || 0} đánh giá)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Hotel Introduction */}
                  {room.hotelId.introduction && (
                    <div className="pt-4 border-t">
                      <h4 className="font-semibold mb-2">Giới thiệu khách sạn</h4>
                      <p className="text-gray-700 leading-relaxed">{room.hotelId.introduction}</p>
                    </div>
                  )}

                  {/* Hotel Description */}
                  {room.hotelId.description && (
                    <div className="pt-4 border-t">
                      <h4 className="font-semibold mb-2">Mô tả</h4>
                      <p className="text-gray-700 leading-relaxed">{room.hotelId.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    {room.hotelId.phone && (
                      <div className="flex items-center space-x-2">
                        <FaPhone className="text-primary" />
                        <div>
                          <div className="text-xs text-gray-500">Điện thoại</div>
                          <a href={`tel:${room.hotelId.phone}`} className="font-semibold hover:text-primary">
                            {room.hotelId.phone}
                          </a>
                        </div>
                      </div>
                    )}

                    {room.hotelId.email && (
                      <div className="flex items-center space-x-2">
                        <FaEnvelope className="text-primary" />
                        <div>
                          <div className="text-xs text-gray-500">Email</div>
                          <a href={`mailto:${room.hotelId.email}`} className="font-semibold hover:text-primary">
                            {room.hotelId.email}
                          </a>
                        </div>
                      </div>
                    )}

                    {room.hotelId.checkInTime && (
                      <div className="flex items-center space-x-2">
                        <FaClock className="text-primary" />
                        <div>
                          <div className="text-xs text-gray-500">Giờ nhận phòng</div>
                          <span className="font-semibold">{room.hotelId.checkInTime}</span>
                        </div>
                      </div>
                    )}

                    {room.hotelId.checkOutTime && (
                      <div className="flex items-center space-x-2">
                        <FaClock className="text-primary" />
                        <div>
                          <div className="text-xs text-gray-500">Giờ trả phòng</div>
                          <span className="font-semibold">{room.hotelId.checkOutTime}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hotel Amenities */}
                  {room.hotelId.amenities && room.hotelId.amenities.length > 0 && (
                    <div className="pt-4 border-t">
                      <h4 className="font-semibold mb-3">Tiện nghi khách sạn</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {room.hotelId.amenities.map((amenity, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <span className="text-primary">✓</span>
                            <span className="capitalize">{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cancellation & Reschedule Policy */}
                  {room.hotelId.cancellationPolicy && (
                    <div className="pt-4 border-t">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <FaExchangeAlt className="text-primary" />
                        Chính sách đổi trả
                      </h4>
                      <div className="space-y-2 text-sm">
                        {room.hotelId.cancellationPolicy.freeCancellationDays > 0 && (
                          <div className="flex items-center gap-2 text-green-700">
                            <FaCheckCircle />
                            <span>
                              Hủy miễn phí trước {room.hotelId.cancellationPolicy.freeCancellationDays} ngày
                            </span>
                          </div>
                        )}
                        {room.hotelId.cancellationPolicy.refundable ? (
                          <div className="flex items-center gap-2 text-green-700">
                            <FaCheckCircle />
                            <span>Có thể hoàn tiền</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-700">
                            <span>✗</span>
                            <span>Không hoàn tiền</span>
                          </div>
                        )}
                        {room.hotelId.cancellationPolicy.cancellationFee > 0 && (
                          <div className="text-gray-700">
                            Phí hủy: {room.hotelId.cancellationPolicy.cancellationFee}%
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Amenities */}
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
                    <strong>Địa chỉ:</strong> {room.hotelId.address}, {room.hotelId.city}
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
                <h2 className="text-xl font-bold mb-4">🌤️ Thời tiết tại {room.hotelId.city}</h2>
                <WeatherWidget 
                  city={room.hotelId.city} 
                  coordinates={room.hotelId.location?.coordinates}
                />
              </div>
            )}

            {/* Other Rooms at This Hotel */}
            {otherRooms.length > 0 && (
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-4">Các phòng khác tại {room.hotelId?.name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {otherRooms.map((otherRoom) => (
                    <RoomCard key={otherRoom._id} room={otherRoom} />
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="card p-6">
              <h2 className="text-xl font-bold mb-4">Đánh giá từ khách hàng</h2>
              
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
                        <div key={star} className="flex items-center space-x-2">
                          <span className="text-sm w-12">{star} sao</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-accent h-2 rounded-full"
                              style={{
                                width: `${(reviewStats[`rating${star}`] / reviewStats.totalReviews) * 100}%`,
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
                  <p className="text-center text-gray-600 py-8">Chưa có đánh giá nào</p>
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
                    <span className="text-gray-500 line-through">{formatPrice(room.price)}</span>
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

              {room.availability ? (
                <>
                  <button onClick={handleBookNow} className="w-full btn btn-primary py-3 mb-4">
                    Đặt phòng ngay
                  </button>
                  {room.hotelId?.cancellationPolicy && (
                    <div className="text-sm text-gray-600 text-center space-y-1">
                      {room.hotelId.cancellationPolicy.freeCancellationDays > 0 && (
                        <p className="flex items-center justify-center gap-1">
                          <FaCheckCircle className="text-green-500" />
                          Hủy miễn phí trước {room.hotelId.cancellationPolicy.freeCancellationDays} ngày
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

              {/* Available Dates */}
              {room.availableDates && room.availableDates.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                    <FaCalendarAlt className="text-primary" />
                    <span>Ngày trống ({room.availableDates.length} ngày)</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Có sẵn từ {room.availableDates[0]} đến {room.availableDates[room.availableDates.length - 1]}
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Giá phòng</span>
                  <span className="font-semibold">{formatPrice(room.finalPrice || room.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phí dịch vụ</span>
                  <span className="font-semibold">Miễn phí</span>
                </div>
                <div className="flex justify-between pt-3 border-t font-semibold text-lg">
                  <span>Tổng cộng</span>
                  <span className="text-accent">{formatPrice(room.finalPrice || room.price)}</span>
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
