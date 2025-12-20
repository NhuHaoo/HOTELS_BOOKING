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

  // ✅ Tính tổng khách = người lớn + trẻ em
  const totalGuests = maxAdults + maxChildren;

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
      className="group block bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      {/* Image Container */}
      <div className="relative h-40 overflow-hidden bg-gray-200">
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
            Xem chi tiết 
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Location & Rating */}
        {room.hotelId && (
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center text-xs text-gray-600">
              <FaMapMarkerAlt className="mr-1 text-primary flex-shrink-0" size={10} />
              <span className="truncate">{room.hotelId.city}</span>
            </div>
            {room.rating && (
              <div className="flex items-center bg-gradient-to-r from-primary to-primary-dark text-white px-2 py-0.5 rounded text-[10px] font-semibold">
                <FaStar className="mr-0.5" size={8} />
                <span>{room.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        )}

        {/* Room Name */}
        <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-primary transition-colors">
          {room.name}
        </h3>

        {/* Hotel Name */}
        {room.hotelId && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-1">
            {room.hotelId.name}
          </p>
        )}

        {/* Room Type */}
        {room.roomType && (
          <div className="mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
              {getRoomTypeLabel(room.roomType)}
            </span>
          </div>
        )}

        {/* Room Info: Sức chứa + Diện tích */}
        <div className="flex items-center gap-2 text-[10px] text-gray-600 mb-2">
          {totalGuests > 0 && (
            <span>
              Tối đa {totalGuests} khách
              {(maxAdults > 0 || maxChildren > 0) && (
                <span className="text-gray-500">
                  {' '}({maxAdults} người lớn{maxChildren > 0 ? `, ${maxChildren} trẻ em` : ''})
                </span>
              )}
            </span>
          )}
          {totalGuests > 0 && room.size && <span>•</span>}
          {room.size && <span>{room.size}m²</span>}
        </div>

        {/* Amenities - Chỉ hiển thị 2 cái đầu */}
        {room.amenities && room.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {room.amenities.slice(0, 2).map((amenity, index) => (
              <span
                key={index}
                className="text-[10px] bg-blue-50 text-primary px-1.5 py-0.5 rounded font-medium"
              >
                {amenity}
              </span>
            ))}
            {room.amenities.length > 2 && (
              <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-medium">
                +{room.amenities.length - 2} tiện nghi
              </span>
            )}
          </div>
        )}

        {/* Reviews */}
        {room.totalReviews > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <FaStar
                  key={i}
                  className={`text-[8px] ${
                    i < Math.floor(room.rating || 0)
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-gray-600">({room.totalReviews} đánh giá)</span>
          </div>
        )}

        {/* Price & CTA */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div>
            {room.discount > 0 && (
              <p className="text-[10px] text-gray-400 line-through mb-0.5">
                {formatPrice(room.price)}
              </p>
            )}
            <div className="flex items-baseline gap-1">
              <p className="text-lg font-bold text-accent">
                {formatPrice(room.finalPrice || room.price)}
              </p>
              <span className="text-[10px] text-gray-500">₫/đêm</span>
            </div>
          </div>
          <button className="bg-gradient-to-r from-primary to-primary-dark text-white px-3 py-1.5 rounded-lg font-semibold text-[11px] hover:shadow-lg transform hover:scale-105 transition-all duration-300 whitespace-nowrap">
            Đặt ngay
          </button>
        </div>
      </div>
    </Link>
  );
};

export default RoomCard;
