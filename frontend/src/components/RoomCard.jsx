import { Link } from 'react-router-dom';
import {
  FaStar,
  FaMapMarkerAlt,
  FaHeart,
  FaRegHeart,
  FaUsers,
  FaExpand,
  FaFire,
  FaUser,
  FaChild,
  FaBed,
  FaCheckCircle
} from 'react-icons/fa';
import { formatPrice } from '../utils/formatPrice';
import { useState, useEffect } from 'react';
import { favoriteAPI } from '../api/favorite.api';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';

// Helper to get room type label
const getRoomTypeLabel = (type) => {
  const types = {
    single: 'Phòng đơn',
    double: 'Phòng đôi',
    suite: 'Suite',
    deluxe: 'Deluxe',
    family: 'Gia đình',
    presidential: 'Tổng thống'
  };
  return types[type] || type;
};

const RoomCard = ({
  room,
  onFavoriteChange,
  initialFavorited = false,
  showBadge = false,
  highlightCoupon, // 👈 nhận coupon từ SearchResult
}) => {
  const { isAuthenticated } = useAuthStore();
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // ✅ Tính sức chứa hiển thị: tối đa X người lớn, Y trẻ em
  const maxAdults =
    typeof room.maxAdults === 'number'
      ? room.maxAdults
      : typeof room.maxGuests === 'number'
      ? room.maxGuests
      : 2;

  const maxChildren =
    typeof room.maxChildren === 'number'
      ? room.maxChildren
      : 0;

  const totalGuests =
    typeof room.maxGuests === 'number'
      ? room.maxGuests
      : maxAdults + maxChildren;

  // Check if room is favorited on mount
  useEffect(() => {
    const checkFavorite = async () => {
      if (!isAuthenticated || !room?._id) return;

      try {
        const response = await favoriteAPI.checkFavorite(room._id);
        setIsFavorited(response.isFavorited || false);
      } catch (error) {
        console.log('Check favorite error:', error);
      }
    };

    checkFavorite();
  }, [room?._id, isAuthenticated]);

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để sử dụng tính năng này');
      return;
    }

    const previousState = isFavorited;
    setIsFavorited(!isFavorited);
    setIsLoading(true);

    try {
      if (previousState) {
        await favoriteAPI.removeFavoriteByRoom(room._id);
        toast.success('Đã xóa khỏi yêu thích');
      } else {
        await favoriteAPI.addFavorite(room._id);
        toast.success('Đã thêm vào yêu thích');
      }
      onFavoriteChange?.();
    } catch (error) {
      setIsFavorited(previousState);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Link
      to={`/rooms/${room._id}`}
      className="group block bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2"
    >
      {/* Image Container */}
      <div className="relative h-56 overflow-hidden bg-gray-200">
        {/* Image */}
        <img
          src={room.images?.[0] || '/placeholder-room.jpg'}
          alt={room.name}
          className={`w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
        />

        {/* Loading skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse"></div>
        )}

        {/* Image Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          disabled={isLoading}
          className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all duration-300 z-20 group/fav"
        >
          {isFavorited ? (
            <FaHeart className="text-red-500 text-xl animate-pulse" />
          ) : (
            <FaRegHeart className="text-gray-600 text-xl group-hover/fav:text-red-500 transition-colors" />
          )}
        </button>

        {/* 🔥 Coupon Badge (mã khuyến mãi) */}
        {highlightCoupon && (
          <div className="absolute top-4 left-4 z-20">
            <div className="px-3 py-1.5 rounded-full bg-rose-500/95 text-white text-xs font-semibold shadow-lg flex items-center gap-1">
              <FaFire className="text-[11px]" />
              <span>Mã {highlightCoupon.code}</span>
            </div>
          </div>
        )}

        {/* Discount Badge (đẩy xuống nếu có coupon) */}
        {room.discount > 0 && (
          <div
            className={`absolute ${
              highlightCoupon ? 'top-14' : 'top-4'
            } left-4 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse z-10`}
          >
            <span className="flex items-center gap-1">
              <FaFire />
              -{room.discount}%
            </span>
          </div>
        )}

        {/* Hot Badge (đẩy xuống thêm nếu có coupon/discount) */}
        {showBadge && (
          <div
            className={`absolute ${
              highlightCoupon
                ? room.discount > 0
                  ? 'top-24'
                  : 'top-14'
                : room.discount > 0
                ? 'top-14'
                : 'top-4'
            } left-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg z-10`}
          >
            <span className="flex items-center gap-1">
              <FaFire className="animate-pulse" />
              HOT
            </span>
          </div>
        )}

        {/* View Details Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full font-semibold text-primary transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
            Xem chi tiết →
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Location & Hotel */}
        {room.hotelId && (
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center text-sm text-gray-600">
              <FaMapMarkerAlt className="mr-1.5 text-primary flex-shrink-0" />
              <span className="truncate">{room.hotelId.city}</span>
            </div>
            {room.rating && (
              <div className="flex items-center bg-gradient-to-r from-primary to-primary-dark text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md">
                <FaStar className="mr-1" />
                <span>{room.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        )}

        {/* Room Name */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem] group-hover:text-primary transition-colors">
          {room.name}
        </h3>

        {/* Hotel Name */}
        {room.hotelId && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-1">
            {room.hotelId.name}
          </p>
        )}

        {/* Room Type */}
        {room.roomType && (
          <div className="mb-2">
            <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
              <FaBed className="text-xs" />
              {getRoomTypeLabel(room.roomType)}
            </span>
          </div>
        )}

        {/* ⭐ Room Info: Tối đa X người lớn, Y trẻ em + diện tích */}
        <div className="flex items-center gap-4 text-xs text-gray-600 mb-4 flex-wrap">
          {(maxAdults || maxChildren) && (
            <div className="flex items-center gap-1">
              <FaUsers className="text-gray-400" />
              <span>
                Tối đa {maxAdults} người lớn
                {maxChildren > 0 && `, ${maxChildren} trẻ em`}
              </span>
            </div>
          )}

          {/* Nếu muốn nhấn mạnh tổng khách luôn */}
          {totalGuests && (
            <div className="flex items-center gap-1">
              <FaUser className="text-gray-400" />
              <span>Tổng {totalGuests} khách</span>
            </div>
          )}

          {room.size && (
            <div className="flex items-center gap-1">
              <FaExpand className="text-gray-400" />
              <span>{room.size}m²</span>
            </div>
          )}
        </div>

        {/* Available Rooms Count */}
        {room.availableRoomsCount !== undefined && (
          <div className="mb-3">
            <div
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium ${
                room.availableRoomsCount > 0
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              <FaCheckCircle className="text-xs" />
              <span>
                {room.availableRoomsCount > 0
                  ? `Còn ${room.availableRoomsCount} phòng`
                  : 'Hết phòng'}
              </span>
            </div>
          </div>
        )}

        {/* Amenities */}
        <div className="flex flex-wrap gap-2 mb-4">
          {room.amenities?.slice(0, 2).map((amenity, index) => (
            <span
              key={index}
              className="text-xs bg-blue-50 text-primary px-3 py-1.5 rounded-full font-medium"
            >
              {amenity}
            </span>
          ))}
          {room.amenities?.length > 2 && (
            <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full font-medium">
              +{room.amenities.length - 2} tiện nghi
            </span>
          )}
        </div>

        {/* Reviews */}
        {room.totalReviews > 0 && (
          <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <FaStar
                  key={i}
                  className={`text-xs ${
                    i < Math.floor(room.rating)
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span>({room.totalReviews} đánh giá)</span>
          </div>
        )}

        {/* Price & CTA */}
        <div className="flex items-end justify-between pt-4 border-t border-gray-100">
          <div className="flex-1">
            {room.discount > 0 && (
              <p className="text-sm text-gray-400 line-through mb-1">
                {formatPrice(room.price)}
              </p>
            )}
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-black text-accent">
                {formatPrice(room.finalPrice || room.price)}
              </p>
              <span className="text-xs text-gray-500">/ đêm</span>
            </div>
          </div>
          <button className="bg-gradient-to-r from-primary to-primary-dark text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg transform hover:scale-105 transition-all duration-300 whitespace-nowrap">
            Đặt ngay
          </button>
        </div>
      </div>
    </Link>
  );
};

export default RoomCard;
