// frontend/src/pages/HotelRooms.jsx

import { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { hotelAPI } from "../api/hotel.api";
import { roomAPI } from "../api/room.api";
import { reviewAPI } from "../api/review.api";
import { favoriteAPI } from "../api/favorite.api";
import Loading from "../components/Loading";
import Breadcrumb from "../components/Breadcrumb";
import ReviewCard from "../components/ReviewCard";
import MapView from "../components/MapView";
import useAuthStore from "../store/useAuthStore";
import { formatPrice } from "../utils/formatPrice";
import toast from "react-hot-toast";
import {
  FaMapMarkerAlt,
  FaStar,
  FaHotel,
  FaPhone,
  FaEnvelope,
  FaClock,
  FaCheckCircle,
  FaHeart,
  FaRegHeart,
  FaBed,
  FaUsers,
} from "react-icons/fa";

const HotelRooms = () => {
  const { hotelId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const hotelFromState = location.state?.hotel || null;
  const searchFilters = location.state?.searchFilters || null;

  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [filterCheckIn, setFilterCheckIn] = useState(searchFilters?.checkIn || '');
  const [filterCheckOut, setFilterCheckOut] = useState(searchFilters?.checkOut || '');
  const [filterGuests, setFilterGuests] = useState(searchFilters?.adults || 2);
  const [filterChildren, setFilterChildren] = useState(searchFilters?.children || 0);

  // Tạo currentFilters object để dùng trong query
  const currentFilters = {
    ...(filterCheckIn && { checkIn: filterCheckIn }),
    ...(filterCheckOut && { checkOut: filterCheckOut }),
    ...(filterGuests && { adults: filterGuests }),
    ...(filterChildren && { children: filterChildren }),
    hotelId: hotelId, // Thêm hotelId để filter theo khách sạn
  };

  // Hotel
  const {
    data: hotelRes,
    isLoading: hotelLoading,
    isError: hotelError,
  } = useQuery({
    queryKey: ["hotel", hotelId],
    queryFn: () => hotelAPI.getHotel(hotelId),
    enabled: !!hotelId && !hotelFromState,
  });

  const hotel = hotelFromState || hotelRes?.data || hotelRes || null;

  // Rooms - Sử dụng getRooms với hotelId và filters để hỗ trợ filter theo ngày và số khách
  const {
    data: roomsRes,
    isLoading: roomsLoading,
    isError: roomsError,
    refetch: refetchRooms,
  } = useQuery({
    queryKey: ["rooms-by-hotel", hotelId, currentFilters],
    queryFn: () => roomAPI.getRooms(currentFilters),
    enabled: !!hotelId,
  });

  const rooms = roomsRes?.data || roomsRes || [];

  // Get reviews for all rooms in this hotel
  const { data: reviewsData } = useQuery({
    queryKey: ["hotel-reviews", hotelId],
    queryFn: async () => {
      if (!rooms || rooms.length === 0) return { data: [], stats: null };
      // Get reviews for first room as sample (or aggregate all)
      const firstRoom = rooms[0];
      if (firstRoom?._id) {
        return reviewAPI.getRoomReviews(firstRoom._id, { limit: 10 });
      }
      return { data: [], stats: null };
    },
    enabled: !!hotelId && rooms.length > 0,
  });

  const reviews = reviewsData?.data || [];
  const reviewStats = reviewsData?.stats;

  // Check if hotel is favorited (using first room as proxy)
  useEffect(() => {
    const checkFavorite = async () => {
      if (!isAuthenticated || !rooms || rooms.length === 0) return;
      try {
        const firstRoom = rooms[0];
        if (firstRoom?._id) {
          const response = await favoriteAPI.checkFavorite(firstRoom._id);
          setIsFavorited(response.isFavorited || false);
        }
      } catch (error) {
        console.log('Check favorite error:', error);
      }
    };
    checkFavorite();
  }, [isAuthenticated, rooms]);

  // Handle favorite toggle
  const handleFavoriteClick = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để sử dụng tính năng này');
      return;
    }
    if (!rooms || rooms.length === 0) return;

    const previousState = isFavorited;
    setIsFavorited(!isFavorited);

    try {
      const firstRoom = rooms[0];
      if (firstRoom?._id) {
        if (previousState) {
          await favoriteAPI.removeFavoriteByRoom(firstRoom._id);
          toast.success('Đã xóa khỏi yêu thích');
        } else {
          await favoriteAPI.addFavorite(firstRoom._id);
          toast.success('Đã thêm vào yêu thích');
        }
      }
    } catch (error) {
      setIsFavorited(previousState);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  // Handle filter search
  const handleFilterSearch = () => {
    // Validate dates
    if (filterCheckIn && filterCheckOut) {
      const checkInDate = new Date(filterCheckIn);
      const checkOutDate = new Date(filterCheckOut);
      
      if (checkOutDate <= checkInDate) {
        toast.error('Ngày trả phòng phải sau ngày nhận phòng');
        return;
      }
    }

    if (!filterCheckIn || !filterCheckOut) {
      toast.error('Vui lòng chọn đầy đủ ngày nhận và trả phòng');
      return;
    }

    // Refetch rooms với filters mới
    refetchRooms();
    
    // Scroll to rooms section
    setTimeout(() => {
      scrollToRooms();
    }, 300);
    
    toast.success('Đang tìm phòng phù hợp...');
  };

  // Ảnh khách sạn
  const hotelImages = (() => {
    if (hotel?.images && Array.isArray(hotel.images) && hotel.images.length) {
      return hotel.images;
    }
    if (Array.isArray(rooms) && rooms.length > 0) {
      const imgs = [];
      rooms.forEach((room) => {
        if (Array.isArray(room.images)) {
          room.images.forEach((img) => {
            if (img && !imgs.includes(img)) {
              imgs.push(img);
            }
          });
        }
      });
      return imgs;
    }
    return [];
  })();

  const mainImage =
    hotelImages[selectedImage] ||
    hotel?.thumbnail ||
    "https://via.placeholder.com/800x450?text=Hotel";

  // 🔥 TIỆN NGHI KHÁCH SẠN:
  // 1) Nếu hotel.amenities là mảng và có phần tử → dùng
  // 2) Nếu không → gộp tiện nghi từ tất cả rooms[*].amenities
  const hotelAmenities = (() => {
    if (Array.isArray(hotel?.amenities) && hotel.amenities.length) {
      return hotel.amenities;
    }
    const set = new Set();
    rooms.forEach((room) => {
      if (Array.isArray(room.amenities)) {
        room.amenities.forEach((a) => a && set.add(a));
      }
    });
    return Array.from(set);
  })();

  // Chính sách hủy (có thì dùng, không có cũng không sao)
  const hotelCancellationPolicy =
    hotel?.cancellationPolicy || rooms[0]?.hotelId?.cancellationPolicy || null;

  // Tính giá phòng thấp nhất
  const minPrice = rooms.length > 0 
    ? Math.min(...rooms.map(room => room.finalPrice || room.price || 0))
    : 0;

  // Hàm scroll tới section rooms
  const scrollToRooms = () => {
    document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Hàm scroll tới map (nếu có)
  const scrollToMap = () => {
    const mapElement = document.getElementById('map');
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if ((hotelLoading && !hotelFromState) || roomsLoading) {
    return <Loading />;
  }

  if (hotelError) return <p className="p-6">Không tải được thông tin khách sạn.</p>;
  if (roomsError) return <p className="p-6">Không tải được danh sách phòng.</p>;

  // Tạo breadcrumb items
  const breadcrumbItems = [
    { label: 'Trang chủ', path: '/' },
  ];

  // Thêm thành phố nếu có
  if (hotel?.city) {
    breadcrumbItems.push({
      label: hotel.city,
      path: `/search?city=${encodeURIComponent(hotel.city)}`,
    });
  }

  // Thêm tên khách sạn (item cuối cùng, không có path)
  if (hotel?.name) {
    breadcrumbItems.push({
      label: hotel.name,
      path: null, // Không click được
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      <div className="container-custom py-6 space-y-6">
        {/* ========== HEADER KHÁCH SẠN ========== */}
        {hotel && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                    {hotel.name}
                  </h1>
                  {hotel.starRating && Number.isInteger(hotel.starRating) && hotel.starRating >= 1 && hotel.starRating <= 5 && (
                    <div className="flex items-center gap-1">
                      {[...Array(Math.min(Math.max(1, hotel.starRating), 5))].map((_, i) => (
                        <FaStar key={i} className="text-orange-400 text-lg" />
                      ))}
                    </div>
                  )}
                </div>
                {hotel.rating && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center bg-primary text-white px-3 py-1 rounded-lg font-semibold">
                      <FaStar className="mr-1" />
                      <span>{hotel.rating.toFixed ? hotel.rating.toFixed(1) : hotel.rating}</span>
                    </div>
                    <span className="text-gray-600 text-sm font-semibold">
                      Tuyệt vời
                    </span>
                    <span className="text-gray-500 text-sm">
                      ({hotel.totalReviews || 0} đánh giá)
                    </span>
                  </div>
                )}
                {hotel.address && (
                  <div className="flex items-center text-gray-600 text-sm mb-2">
                    <FaMapMarkerAlt className="mr-2 text-primary" />
                    <span>
                      {hotel.address}
                      {hotel.city ? `, ${hotel.city}` : ""}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={handleFavoriteClick}
                  className="p-3 rounded-full border-2 border-gray-300 hover:border-primary transition-colors"
                  aria-label="Yêu thích"
                >
                  {isFavorited ? (
                    <FaHeart className="text-red-500 text-xl" />
                  ) : (
                    <FaRegHeart className="text-gray-600 text-xl" />
                  )}
                </button>
                <button
                  onClick={scrollToRooms}
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors whitespace-nowrap"
                >
                  Đặt ngay
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========== GALLERY ẢNH KHÁCH SẠN ========== */}
        <div className="space-y-2">
          {/* Main Image và Map cùng hàng */}
          <div className="grid grid-cols-12 gap-2">
            {/* Main Image */}
            <div className="col-span-12 md:col-span-9 h-[400px] md:h-[500px] rounded-xl overflow-hidden relative">
              <img
                src={mainImage}
                alt={`${hotel?.name || "Hotel"} - Ảnh ${selectedImage + 1}`}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Map */}
            <div className="col-span-12 md:col-span-3 h-[300px] md:h-[350px] rounded-xl overflow-hidden">
              <MapView
                latitude={
                  hotel?.location?.coordinates?.[1] || null
                }
                longitude={
                  hotel?.location?.coordinates?.[0] || null
                }
                hotelName={hotel?.name || null}
                hotelAddress={
                  hotel?.address
                    ? `${hotel.address}${hotel.city ? `, ${hotel.city}` : ""}`
                    : null
                }
                zoom={15}
                height="100%"
              />
            </div>
          </div>

          {/* Thumbnail Gallery */}
          {hotelImages.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {(hotelImages.length ? hotelImages : [mainImage])
                .slice(0, 5)
                .map((img, index) => (
                  <button
                    type="button"
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`h-20 md:h-24 rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-200 ${
                      selectedImage === index
                        ? "border-primary ring-2 ring-primary"
                        : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Hotel ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-200"
                    />
                  </button>
                ))}
              {hotelImages.length > 5 && (
                <button
                  type="button"
                  className="h-20 md:h-24 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary transition-colors flex items-center justify-center text-gray-600 text-sm font-semibold"
                >
                  Xem tất cả ảnh
                </button>
              )}
            </div>
          )}
        </div>

        {/* ========== FILTER BAR ========== */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Ngày nhận phòng</label>
              <input
                type="date"
                value={filterCheckIn}
                onChange={(e) => setFilterCheckIn(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Ngày trả phòng</label>
              <input
                type="date"
                value={filterCheckOut}
                onChange={(e) => setFilterCheckOut(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Số khách</label>
              <input
                type="number"
                min="1"
                value={filterGuests}
                onChange={(e) => setFilterGuests(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Trẻ em</label>
              <input
                type="number"
                min="0"
                value={filterChildren}
                onChange={(e) => setFilterChildren(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleFilterSearch}
                className="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
              >
                Tìm phòng
              </button>
            </div>
          </div>
        </div>

        {/* ========== LAYOUT 2 CỘT: NỘI DUNG + SUMMARY ========== */}
        <div className="grid grid-cols-12 gap-6">
          {/* CỘT TRÁI: NỘI DUNG */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Danh sách phòng */}
            <section id="rooms" className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-6">Đang có các hạng phòng</h2>

              {rooms.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-600 mb-2">
                    {filterCheckIn && filterCheckOut
                      ? 'Không có phòng phù hợp với tiêu chí tìm kiếm của bạn.'
                      : 'Khách sạn hiện chưa có phòng khả dụng.'}
                  </p>
                  {filterCheckIn && filterCheckOut && (
                    <p className="text-xs text-gray-500">
                      Vui lòng thử chọn khoảng thời gian hoặc số khách khác.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {rooms.map((room) => (
                    <div
                      key={room._id}
                      className="bg-white border-2 border-gray-100 rounded-xl p-5 hover:shadow-lg transition-all"
                    >
                      <div className="flex gap-5">
                        {/* Ảnh phòng */}
                        <div className="w-56 h-44 flex-shrink-0">
                          <img
                            src={room.images?.[0] || '/placeholder-room.jpg'}
                            alt={room.name}
                            className="w-full h-full rounded-lg object-cover"
                          />
                        </div>
                        
                        {/* Thông tin phòng */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg mb-2 text-gray-900">{room.name}</h3>
                          
                          {/* Thông tin cơ bản */}
                          <div className="flex flex-wrap items-center gap-3 mb-3 text-sm text-gray-600">
                            {room.size && (
                              <span className="flex items-center gap-1">
                                <FaBed className="text-primary" />
                                Diện tích {room.size}m²
                              </span>
                            )}
                            {room.bedType && (
                              <span>• {room.bedType}</span>
                            )}
                            {(room.maxAdults || room.maxGuests) && (
                              <span className="flex items-center gap-1">
                                <FaUsers className="text-primary" />
                                Tối đa {room.maxAdults || room.maxGuests} khách
                              </span>
                            )}
                          </div>

                          {/* Tiện nghi */}
                          {room.amenities && room.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {room.amenities.slice(0, 6).map((amenity, index) => (
                                <span
                                  key={index}
                                  className="text-xs bg-blue-50 text-primary px-2 py-1 rounded font-medium"
                                >
                                  {amenity}
                                </span>
                              ))}
                              {room.amenities.length > 6 && (
                                <span className="text-xs text-gray-500 px-2 py-1">
                                  +{room.amenities.length - 6} tiện nghi
                                </span>
                              )}
                            </div>
                          )}

                          {/* Link xem chi tiết */}
                          <button
                            onClick={() => navigate(`/rooms/${room._id}`)}
                            className="text-primary text-sm font-semibold hover:underline"
                          >
                            Xem chi tiết →
                          </button>
                        </div>

                        {/* Giá và nút đặt */}
                        <div className="flex flex-col items-end gap-3 flex-shrink-0 min-w-[180px]">
                          <div className="text-right">
                            {room.discount > 0 && (
                              <p className="text-sm text-gray-400 line-through mb-1">
                                {formatPrice(room.price)}
                              </p>
                            )}
                            <p className="text-2xl font-bold text-orange-500 mb-1">
                              {formatPrice(room.finalPrice || room.price)}
                            </p>
                            <p className="text-xs text-gray-500">Giá đã bao gồm thuế và phí</p>
                            <p className="text-xs text-gray-500">₫/đêm</p>
                          </div>
                          <button
                            onClick={() => navigate(`/rooms/${room._id}`)}
                            className="w-full bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-all duration-300"
                          >
                            Đặt ngay
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Tổng quan */}
            {(hotel?.introduction || hotel?.description) && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="font-semibold text-xl mb-4">Tổng quan</h3>
                {hotel.introduction && (
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">
                    {hotel.introduction}
                  </p>
                )}
                {hotel.description && (
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {hotel.description}
                  </p>
                )}
              </div>
            )}

            {/* Tiện nghi */}
            {hotelAmenities.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="font-semibold text-xl mb-4">Tiện nghi khách sạn</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {hotelAmenities.map((amenity, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 text-sm"
                    >
                      <span className="text-primary">✓</span>
                      <span className="capitalize">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chính sách đổi/hủy */}
            {hotelCancellationPolicy && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="font-semibold text-xl mb-4 flex items-center gap-2">
                  <FaCheckCircle className="text-primary" />
                  Chính sách đổi / hủy
                </h3>
                <div className="space-y-2 text-sm">
                  {hotelCancellationPolicy.freeCancellationDays > 0 && (
                    <div className="flex items-center gap-2 text-green-700">
                      <FaCheckCircle className="text-xs" />
                      <span>
                        Hủy miễn phí trước{" "}
                        {hotelCancellationPolicy.freeCancellationDays} ngày
                      </span>
                    </div>
                  )}
                  {hotelCancellationPolicy.refundable ? (
                    <div className="flex items-center gap-2 text-green-700">
                      <FaCheckCircle className="text-xs" />
                      <span>Có thể hoàn tiền</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-700">
                      <span>✗</span>
                      <span>Không hoàn tiền</span>
                    </div>
                  )}
                  {hotelCancellationPolicy.cancellationFee > 0 && (
                    <div className="text-gray-700">
                      Phí hủy: {hotelCancellationPolicy.cancellationFee}%
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            {(reviews.length > 0 || reviewStats) && (
              <section className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-semibold mb-6">Đánh giá của khách hàng</h2>

                {reviewStats && (
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-5xl font-bold text-primary mb-1">
                          {reviewStats.averageRating?.toFixed(1) || '0.0'}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">Tuyệt vời</div>
                        <div className="text-xs text-gray-500">
                          {reviewStats.totalReviews || 0} đánh giá
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        {[5, 4, 3, 2, 1].map((star) => (
                          <div
                            key={star}
                            className="flex items-center gap-2"
                          >
                            <span className="text-sm w-12">{star} sao</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-orange-500 h-2 rounded-full"
                                style={{
                                  width: `${
                                    reviewStats.totalReviews > 0
                                      ? ((reviewStats[`rating${star}`] || 0) /
                                          reviewStats.totalReviews) *
                                        100
                                      : 0
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
                    reviews.slice(0, 5).map((review) => (
                      <ReviewCard
                        key={review._id}
                        review={review}
                        onMarkHelpful={(id) => {
                          // Handle mark helpful
                          console.log('Mark helpful:', id);
                        }}
                      />
                    ))
                  ) : (
                    <p className="text-center text-gray-600 py-8">
                      Chưa có đánh giá nào
                    </p>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* CỘT PHẢI: STICKY SUMMARY */}
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-white rounded-2xl shadow-xl p-4 sticky top-24">
              <h3 className="font-semibold text-lg mb-4">Thông tin đặt phòng</h3>
              
              {/* Check-in/Check-out */}
              <div className="space-y-3 mb-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Ngày nhận phòng</div>
                  <div className="text-sm font-semibold">
                    {filterCheckIn 
                      ? new Date(filterCheckIn).toLocaleDateString('vi-VN', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric' 
                        })
                      : 'Chưa chọn ngày'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Ngày trả phòng</div>
                  <div className="text-sm font-semibold">
                    {filterCheckOut 
                      ? new Date(filterCheckOut).toLocaleDateString('vi-VN', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric' 
                        })
                      : 'Chưa chọn ngày'}
                  </div>
                </div>
                {(filterGuests || filterChildren) && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Số khách</div>
                    <div className="text-sm font-semibold">
                      {filterGuests ? `${filterGuests} người lớn` : ''}
                      {filterChildren ? `, ${filterChildren} trẻ em` : ''}
                    </div>
                  </div>
                )}
              </div>

              {/* Giá từ */}
              {minPrice > 0 && (
                <div className="mb-4 pt-4 border-t">
                  <div className="text-xs text-gray-500 mb-1">Giá từ</div>
                  <div className="text-xl font-bold text-accent">
                    {formatPrice(minPrice)}
                  </div>
                  <div className="text-xs text-gray-500">/ đêm</div>
                </div>
              )}

              {/* Nút CTA */}
              <button
                onClick={scrollToRooms}
                className="w-full bg-gradient-to-r from-primary to-primary-dark text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                Chọn phòng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelRooms;
