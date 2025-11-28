import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { roomAPI } from '../api/room.api';
import RoomCard from '../components/RoomCard';
import Loading from '../components/Loading';
import Pagination from '../components/Pagination';
import WeatherWidget from '../components/WeatherWidget';
import { FaFilter, FaTimes, FaStar, FaMapMarkerAlt } from 'react-icons/fa';
import {
  ROOM_TYPES,
  AMENITIES,
  PRICE_RANGES,
  RATINGS,
  SORT_OPTIONS,
  CITIES,
} from '../utils/constants';

const SearchResult = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  // ✨ nếu có hotelId trên URL → đang ở chế độ "xem phòng của 1 khách sạn"
  const initialHotelId = searchParams.get('hotelId') || '';

  // Phân trang cho danh sách KHÁCH SẠN
  const [hotelPage, setHotelPage] = useState(1);
  const HOTELS_PER_PAGE = 10;

  // Get search params
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    city: searchParams.get('city') || '',
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    guests: parseInt(searchParams.get('guests')) || 2,
    adults:
      parseInt(searchParams.get('adults')) ||
      parseInt(searchParams.get('guests')) ||
      2,
    children: parseInt(searchParams.get('children')) || 0,
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    roomType: searchParams.get('roomType') || '',
    amenities: [],
    rating: '',
    latitude: searchParams.get('latitude') || '',
    longitude: searchParams.get('longitude') || '',
    radius: searchParams.get('radius') || '',
    page: parseInt(searchParams.get('page')) || 1,
    // 🔥 Nếu chưa chọn khách sạn → lấy nhiều phòng để gom được nhiều KS
    limit: initialHotelId ? 12 : 200,
    sort: searchParams.get('sort') || '-rating',
    hotelId: initialHotelId,
  });

  // Fetch rooms
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['search-rooms', filters],
    queryFn: () => {
      const params = {
        ...filters,
        amenities: filters.amenities.join(','),
        maxGuests: filters.guests,
        adults: filters.adults,
        children: filters.children,
        checkIn: filters.checkIn,
        checkOut: filters.checkOut,
        latitude: filters.latitude,
        longitude: filters.longitude,
        radius: filters.radius,
        hotelId: filters.hotelId || undefined,
      };

      // Xoá param rỗng
      Object.keys(params).forEach((key) => {
        const value = params[key];
        if (
          value === '' ||
          value === null ||
          value === undefined ||
          (Array.isArray(value) && value.length === 0)
        ) {
          delete params[key];
        }
      });

      // Nếu thiếu lat/lng thì không gửi geo search
      if (!params.latitude || !params.longitude) {
        delete params.latitude;
        delete params.longitude;
        delete params.radius;
      }

      return roomAPI.getRooms(params);
    },
  });

  useEffect(() => {
    refetch();
  }, [filters, refetch]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const updated = {
        ...prev,
        [key]: value,
        page: 1, // Reset trang phòng
      };

      // Đổi thành phố → nếu không có toạ độ map thì reset lat/lng
      if (key === 'city') {
        if (!filters.latitude && !filters.longitude) {
          updated.latitude = '';
          updated.longitude = '';
          updated.radius = '';
        }
        // Đổi city thì reset trang khách sạn
        setHotelPage(1);
      }

      return updated;
    });
  };

  const handlePriceRangeChange = (min, max) => {
    setFilters((prev) => ({
      ...prev,
      minPrice: min,
      maxPrice: max,
      page: 1,
    }));
    setHotelPage(1);
  };

  const handleAmenityToggle = (amenity) => {
    setFilters((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
      page: 1,
    }));
    setHotelPage(1);
  };

  const handlePageChange = (page) => {
    // Phân trang theo PHÒNG (chỉ dùng khi đang ở mode hotelId)
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHotelPageChange = (page) => {
    // Phân trang theo KHÁCH SẠN
    setHotelPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      city: '',
      checkIn: '',
      checkOut: '',
      guests: 2,
      adults: 2,
      children: 0,
      minPrice: '',
      maxPrice: '',
      roomType: '',
      amenities: [],
      rating: '',
      latitude: '',
      longitude: '',
      radius: '',
      page: 1,
      limit: 200,   // Quay lại mode danh sách KS
      sort: '-rating',
      hotelId: '',
    });
    setHotelPage(1);
    setSearchParams({});
  };

  // ====== GROUP ROOMS THEO KHÁCH SẠN (chỉ dùng khi CHƯA chọn hotelId) ======
  const hotels = (() => {
    if (!data?.data || filters.hotelId) return []; // nếu đang xem 1 KS thì không group nữa
    const map = new Map();

    data.data.forEach((room) => {
      const hotel = room.hotelId;
      if (!hotel) return;

      const id = hotel._id?.toString();
      if (!id) return;

      const existing = map.get(id);
      const price = room.price || 0;

      if (!existing) {
        map.set(id, {
          hotelId: id,
          hotel,
          minPrice: price,
          maxPrice: price,
          roomsCount: 1,
          sampleRoom: room,
        });
      } else {
        existing.roomsCount += 1;
        if (price && price < existing.minPrice) existing.minPrice = price;
        if (price && price > existing.maxPrice) existing.maxPrice = price;
      }
    });

    return Array.from(map.values());
  })();

  const hotelCount = filters.hotelId ? 0 : hotels.length;

  // Phân trang cho danh sách khách sạn
  const totalHotelPages =
    hotelCount > 0 ? Math.ceil(hotelCount / HOTELS_PER_PAGE) : 1;
  const pagedHotels = hotels.slice(
    (hotelPage - 1) * HOTELS_PER_PAGE,
    hotelPage * HOTELS_PER_PAGE
  );

  const handleViewHotelRooms = (hotelGroup) => {
    const { hotel } = hotelGroup;
    const params = new URLSearchParams();

    params.set('hotelId', hotel._id);
    if (hotel.city) params.set('city', hotel.city);
    if (filters.checkIn) params.set('checkIn', filters.checkIn);
    if (filters.checkOut) params.set('checkOut', filters.checkOut);
    params.set('guests', filters.guests.toString());
    params.set('adults', filters.adults.toString());
    params.set('children', filters.children.toString());

    // Khi chuyển sang xem phòng → limit nhỏ lại, pagin theo phòng
    setFilters((prev) => ({
      ...prev,
      hotelId: hotel._id,
      city: hotel.city || '',
      page: 1,
      limit: 12,
    }));

    setHotelPage(1);
    navigate(`/search?${params.toString()}`);
  };

  const activeFiltersCount =
    (filters.search ? 1 : 0) +
    (filters.city ? 1 : 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.roomType ? 1 : 0) +
    (filters.rating ? 1 : 0) +
    (filters.latitude && filters.longitude ? 1 : 0) +
    filters.amenities.length;

  // ====== RENDER ======
  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            {/* Nếu chưa chọn hotelId → tiêu đề dạng "Khách sạn Đà Nẵng" */}
            {!filters.hotelId ? (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {filters.city
                    ? `Khách sạn ${filters.city}`
                    : 'Kết quả khách sạn'}
                </h1>
                <p className="text-gray-600">
                  Tìm thấy{' '}
                  <span className="font-semibold">{hotelCount}</span> khách sạn
                  {!!data?.total && (
                    <>
                      {' '}
                      (<span className="font-semibold">{data.total}</span> phòng
                      phù hợp)
                    </>
                  )}
                </p>
              </>
            ) : (
              // Nếu đã chọn hotelId → tiêu đề dạng "Các phòng tại Khách sạn X"
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {data?.data?.[0]?.hotelId?.name
                    ? `Các phòng tại ${data.data[0].hotelId.name}`
                    : 'Danh sách phòng'}
                </h1>
                <p className="text-gray-600">
                  <span className="font-semibold">
                    {data?.total || data?.data?.length || 0}
                  </span>{' '}
                  phòng phù hợp
                </p>
              </>
            )}
          </div>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden btn btn-outline relative"
          >
            <FaFilter className="mr-2" />
            Bộ lọc
            {activeFiltersCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside
            className={`${
              showFilters ? 'block' : 'hidden'
            } md:block w-full md:w-64 flex-shrink-0`}
          >
            <div className="card p-6 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">Bộ lọc</h2>
                  {activeFiltersCount > 0 && (
                    <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </div>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-600 hover:text-red-700 font-semibold"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {/* City Filter */}
                <div>
                  <h3 className="font-semibold mb-3">Thành phố</h3>
                  <select
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    className="input w-full"
                  >
                    <option value="">Tất cả thành phố</option>
                    {CITIES.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <h3 className="font-semibold mb-3">Khoảng giá</h3>
                  <div className="space-y-2">
                    {PRICE_RANGES.map((range, index) => (
                      <button
                        key={index}
                        onClick={() =>
                          handlePriceRangeChange(range.min, range.max)
                        }
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          filters.minPrice === range.min &&
                          filters.maxPrice === range.max
                            ? 'bg-primary text-white'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Price Range */}
                  <div className="mt-3 pt-3 border-t">
                    <label className="text-xs text-gray-600 mb-2 block">
                      Hoặc nhập giá tùy chỉnh:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Giá từ"
                        value={filters.minPrice}
                        onChange={(e) =>
                          handleFilterChange('minPrice', e.target.value)
                        }
                        className="input text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Giá đến"
                        value={filters.maxPrice}
                        onChange={(e) =>
                          handleFilterChange('maxPrice', e.target.value)
                        }
                        className="input text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Adults */}
                <div>
                  <h3 className="font-semibold mb-3">Người lớn</h3>
                  <select
                    value={filters.adults}
                    onChange={(e) => {
                      const newAdults = parseInt(e.target.value);
                      const totalGuests = newAdults + filters.children;
                      handleFilterChange('adults', newAdults);
                      handleFilterChange('guests', totalGuests);
                    }}
                    className="input w-full"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <option key={num} value={num}>
                        {num} người lớn
                      </option>
                    ))}
                  </select>
                </div>

                {/* Children */}
                <div>
                  <h3 className="font-semibold mb-3">Trẻ em</h3>
                  <select
                    value={filters.children}
                    onChange={(e) => {
                      const newChildren = parseInt(e.target.value);
                      const totalGuests = filters.adults + newChildren;
                      handleFilterChange('children', newChildren);
                      handleFilterChange('guests', totalGuests);
                    }}
                    className="input w-full"
                  >
                    {[0, 1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>
                        {num === 0 ? 'Không có' : `${num} trẻ em`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Room Type */}
                <div>
                  <h3 className="font-semibold mb-3">Loại phòng</h3>
                  <select
                    value={filters.roomType}
                    onChange={(e) =>
                      handleFilterChange('roomType', e.target.value)
                    }
                    className="input w-full"
                  >
                    <option value="">Tất cả loại phòng</option>
                    {ROOM_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rating */}
                <div>
                  <h3 className="font-semibold mb-3">Đánh giá</h3>
                  <div className="space-y-2">
                    {RATINGS.map((rating) => (
                      <button
                        key={rating.value}
                        onClick={() =>
                          handleFilterChange('rating', rating.value)
                        }
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          filters.rating === rating.value
                            ? 'bg-primary text-white'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {rating.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <h3 className="font-semibold mb-3">Tiện nghi</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {AMENITIES.slice(0, 8).map((amenity) => (
                      <label
                        key={amenity.value}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filters.amenities.includes(amenity.value)}
                          onChange={() => handleAmenityToggle(amenity.value)}
                          className="rounded text-primary focus:ring-primary"
                        />
                        <span className="text-sm">
                          {amenity.icon} {amenity.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1">
            {/* Weather Widget */}
            {filters.city && !filters.hotelId && (
              <div className="mb-6">
                <WeatherWidget city={filters.city} />
              </div>
            )}

            {/* Active Filters & Sort */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="text-sm text-gray-600">
                  {!filters.hotelId ? (
                    <>
                      <span className="font-semibold">{hotelCount}</span> khách
                      sạn phù hợp
                    </>
                  ) : (
                    <>
                      <span className="font-semibold">
                        {data?.total || data?.data?.length || 0}
                      </span>{' '}
                      phòng phù hợp
                    </>
                  )}
                </div>

                {/* Active Filter Tags */}
                {activeFiltersCount > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {filters.search && (
                      <span className="text-xs bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full flex items-center gap-1">
                        🔍 {filters.search}
                        <button
                          onClick={() => handleFilterChange('search', '')}
                          className="hover:text-indigo-900"
                        >
                          <FaTimes className="text-xs" />
                        </button>
                      </span>
                    )}
                    {filters.city && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-1">
                        📍 {filters.city}
                        <button
                          onClick={() => handleFilterChange('city', '')}
                          className="hover:text-blue-900"
                        >
                          <FaTimes className="text-xs" />
                        </button>
                      </span>
                    )}
                    {(filters.minPrice || filters.maxPrice) && (
                      <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center gap-1">
                        💰{' '}
                        {filters.minPrice
                          ? `${(
                              parseInt(filters.minPrice) / 1000
                            ).toFixed(0)}k`
                          : '0'}{' '}
                        -{' '}
                        {filters.maxPrice
                          ? `${(
                              parseInt(filters.maxPrice) / 1000
                            ).toFixed(0)}k`
                          : '∞'}
                        <button
                          onClick={() => handlePriceRangeChange('', '')}
                          className="hover:text-green-900"
                        >
                          <FaTimes className="text-xs" />
                        </button>
                      </span>
                    )}
                    {filters.roomType && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full flex items-center gap-1">
                        🏠{' '}
                        {
                          ROOM_TYPES.find(
                            (t) => t.value === filters.roomType
                          )?.label
                        }
                        <button
                          onClick={() => handleFilterChange('roomType', '')}
                          className="hover:text-purple-900"
                        >
                          <FaTimes className="text-xs" />
                        </button>
                      </span>
                    )}
                    {filters.rating && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full flex items-center gap-1">
                        ⭐ {filters.rating}+ sao
                        <button
                          onClick={() => handleFilterChange('rating', '')}
                          className="hover:text-yellow-900"
                        >
                          <FaTimes className="text-xs" />
                        </button>
                      </span>
                    )}
                    {filters.latitude && filters.longitude && (
                      <span className="text-xs bg-orange-100 text-orange-800 px-3 py-1 rounded-full flex items-center gap-1">
                        📍 Bán kính{' '}
                        {filters.radius
                          ? `${(parseInt(filters.radius) / 1000).toFixed(0)}km`
                          : '10km'}
                        <button
                          onClick={() => {
                            handleFilterChange('latitude', '');
                            handleFilterChange('longitude', '');
                            handleFilterChange('radius', '');
                          }}
                          className="hover:text-orange-900"
                        >
                          <FaTimes className="text-xs" />
                        </button>
                      </span>
                    )}
                  </div>
                )}
              </div>

              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="input w-auto text-sm"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* === NỘI DUNG CHÍNH === */}
            {isLoading ? (
              <Loading />
            ) : !filters.hotelId ? (
              // MODE 1: DANH SÁCH KHÁCH SẠN
              hotelCount > 0 ? (
                <>
                  <div className="space-y-4">
                    {pagedHotels.map((item) => {
                      const { hotel, minPrice, roomsCount, sampleRoom } = item;
                      const img =
                        hotel.images?.[0] ||
                        sampleRoom.images?.[0] ||
                        'https://via.placeholder.com/400x250?text=Hotel';

                      return (
                        <div
                          key={item.hotelId}
                          className="card p-4 flex flex-col md:flex-row gap-4 hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() => handleViewHotelRooms(item)}
                        >
                          {/* Hình ảnh */}
                          <div className="md:w-1/3 w-full">
                            <img
                              src={img}
                              alt={hotel.name}
                              className="w-full h-48 object-cover rounded-xl"
                            />
                          </div>

                          {/* Thông tin khách sạn */}
                          <div className="flex-1 flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {hotel.name}
                              </h3>

                              <div className="flex items-center gap-2 mb-1">
                                <div className="flex items-center text-yellow-400">
                                  {[1, 2, 3, 4, 5].map((i) => (
                                    <FaStar
                                      key={i}
                                      className={
                                        i <= (hotel.starRating || 5)
                                          ? ''
                                          : 'opacity-30'
                                      }
                                    />
                                  ))}
                                </div>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                                  {hotel.rating?.toFixed
                                    ? hotel.rating.toFixed(1)
                                    : hotel.rating || '9.0'}{' '}
                                  Tuyệt vời
                                </span>
                              </div>

                              <div className="flex items-center text-sm text-gray-600 mb-2">
                                <FaMapMarkerAlt className="mr-1" />
                                <span>
                                  {hotel.address || hotel.city || 'Việt Nam'}
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-2 text-xs">
                                {hotel.hotelType && (
                                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                                    {hotel.hotelType === 'hotel'
                                      ? 'Khách sạn'
                                      : hotel.hotelType}
                                  </span>
                                )}
                                {hotel.amenities?.slice(0, 3).map((a) => (
                                  <span
                                    key={a}
                                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full"
                                  >
                                    {a}
                                  </span>
                                ))}
                                {roomsCount > 1 && (
                                  <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded-full">
                                    {roomsCount} loại phòng
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Giá + nút */}
                            <div className="md:w-56 flex flex-col justify-between items-end text-right">
                              <div className="mb-2">
                                <div className="text-xs text-gray-500">
                                  *Giá trung bình / đêm
                                </div>
                                <div className="text-xl font-bold text-orange-600">
                                  {minPrice
                                    ? minPrice.toLocaleString('vi-VN') + ' đ'
                                    : 'Liên hệ'}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewHotelRooms(item);
                                }}
                                className="btn btn-primary px-4 py-2 text-sm rounded-full"
                              >
                                Xem phòng
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination theo KHÁCH SẠN */}
                  {totalHotelPages > 1 && (
                    <div className="mt-6">
                      <Pagination
                        currentPage={hotelPage}
                        totalPages={totalHotelPages}
                        onPageChange={handleHotelPageChange}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Không tìm thấy khách sạn nào
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Thử thay đổi bộ lọc hoặc tìm kiếm lại
                  </p>
                  <button onClick={clearFilters} className="btn btn-primary">
                    Xóa bộ lọc
                  </button>
                </div>
              )
            ) : // MODE 2: DANH SÁCH PHÒNG CỦA 1 KHÁCH SẠN
            data?.data && data.data.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.data.map((room) => (
                    <RoomCard key={room._id} room={room} />
                  ))}
                </div>

                {data.pages > 1 && (
                  <div className="mt-6">
                    <Pagination
                      currentPage={filters.page}
                      totalPages={data.pages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Không tìm thấy phòng nào
                </h3>
                <p className="text-gray-600 mb-4">
                  Thử thay đổi bộ lọc hoặc quay lại danh sách khách sạn
                </p>
                <button onClick={clearFilters} className="btn btn-primary">
                  Quay lại danh sách khách sạn
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResult;
