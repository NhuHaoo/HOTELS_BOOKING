import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { roomAPI } from '../api/room.api';
import { promotionAPI } from '../api/promotion.api';
import RoomCard from '../components/RoomCard';
import Loading from '../components/Loading';
import Pagination from '../components/Pagination';
import WeatherWidget from '../components/WeatherWidget';
import MapView from '../components/MapView';
import Breadcrumb from '../components/Breadcrumb'; 

import {
  Filter,
  X,
  Star,
  MapPin,
  Percent,
  Search,
  Building2,
  Users,
  Baby,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
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
  const [showMap, setShowMap] = useState(false); // 👈 THÊM
  const navigate = useNavigate();

  const [hotelPage, setHotelPage] = useState(1);
  const HOTELS_PER_PAGE = 10;

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
    limit: 200,
    sort: searchParams.get('sort') || '-rating',
  });

  const { data: activeCoupons } = useQuery({
    queryKey: ['active-coupons'],
    queryFn: () =>
      promotionAPI.getActiveCoupons().then((res) => res.data?.data || res.data),
  });

  const highlightCoupon =
    activeCoupons && activeCoupons.length > 0 ? activeCoupons[0] : null;

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
      };

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

  // Scroll to top khi component mount hoặc searchParams thay đổi
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const updated = {
        ...prev,
        [key]: value,
        page: 1,
      };

      if (key === 'city') {
        if (!filters.latitude && !filters.longitude) {
          updated.latitude = '';
          updated.longitude = '';
          updated.radius = '';
        }
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
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHotelPageChange = (page) => {
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
      limit: 200,
      sort: '-rating',
    });
    setHotelPage(1);
    setSearchParams({});
  };

  const hotels = (() => {
    if (!data?.data) return [];
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

  const hotelCount = hotels.length;

  const totalHotelPages =
    hotelCount > 0 ? Math.ceil(hotelCount / HOTELS_PER_PAGE) : 1;
  const pagedHotels = hotels.slice(
    (hotelPage - 1) * HOTELS_PER_PAGE,
    hotelPage * HOTELS_PER_PAGE
  );

  const handleViewHotelRooms = (hotelGroup) => {
    const { hotel } = hotelGroup;

    navigate(`/hotels/${hotel._id}/rooms`, {
      state: {
        hotel,
        searchFilters: {
          city: filters.city,
          checkIn: filters.checkIn,
          checkOut: filters.checkOut,
          guests: filters.guests,
          adults: filters.adults,
          children: filters.children,
        },
      },
    });
  };

  const activeFiltersCount =
    (filters.search ? 1 : 0) +
    (filters.city ? 1 : 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.roomType ? 1 : 0) +
    (filters.rating ? 1 : 0) +
    (filters.latitude && filters.longitude ? 1 : 0) +
    filters.amenities.length;

  // 👉 Tính toạ độ trung tâm cho MapView
  const mapCenter = (() => {
    // ưu tiên toạ độ từ filter (tìm theo bản đồ)
    if (filters.latitude && filters.longitude) {
      return {
        lat: parseFloat(filters.latitude),
        lng: parseFloat(filters.longitude),
      };
    }

    // nếu không có, dùng toạ độ khách sạn đầu tiên
    if (
      hotels.length > 0 &&
      hotels[0].hotel?.location?.coordinates &&
      hotels[0].hotel.location.coordinates.length === 2
    ) {
      const [lng, lat] = hotels[0].hotel.location.coordinates;
      return { lat, lng };
    }

    // fallback: HCM
    return { lat: 10.762622, lng: 106.660172 };
  })();

  // Tạo breadcrumb items
  const breadcrumbItems = [
    { label: 'Trang chủ', path: '/' },
  ];

  // Thêm thành phố nếu có
  if (filters.city) {
    breadcrumbItems.push({
      label: filters.city,
      path: null, // Current page, không click được
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      <div className="container-custom py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {filters.city ? `Khách sạn ${filters.city}` : 'Kết quả khách sạn'}
            </h1>
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <Building2 className="w-5 h-5 text-blue-500" />
              <p>
                Tìm thấy{' '}
                <span className="font-bold text-blue-600">{hotelCount}</span> khách sạn
                {!!data?.total && (
                  <>
                    {' '}
                    (<span className="font-bold text-purple-600">{data.total}</span> phòng
                    phù hợp)
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden btn btn-outline relative hover:scale-105 transition-transform duration-200"
          >
            <Filter className="mr-2 w-4 h-4" />
            Bộ lọc
            {activeFiltersCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg animate-pulse">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Thanh sort + Xem bản đồ */}
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className="inline-flex items-center gap-2">
            <span className="text-sm text-gray-600">Sắp xếp theo</span>
            <div className="relative">
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="input pl-3 pr-9 py-1.5 text-sm border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 focus:border-blue-500"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>

          <button
            type="button"
            className="flex items-center gap-1 text-sm text-sky-500 hover:text-sky-600 font-medium"
            onClick={() => setShowMap((prev) => !prev)}
          >
            <MapPin className="w-4 h-4" />
            {showMap ? 'Ẩn bản đồ' : 'Xem bản đồ'}
          </button>
        </div>

        {/* Bản đồ hiển thị ngay dưới thanh sort */}
        {showMap && (
        <div className="mb-6 rounded-2xl overflow-hidden bg-white shadow-lg border border-gray-100">
          <MapView
            latitude={mapCenter.lat}
            longitude={mapCenter.lng}
            hotelName={filters.city || 'Khu vực tìm kiếm'}
            hotelAddress={
              filters.city ||
              (hotels[0]?.hotel?.address
                ? `${hotels[0].hotel.address}, ${hotels[0].hotel.city || ''}`
                : '')
            }
            zoom={12}
            height="380px"
            // 👇 THÊM: truyền danh sách khách sạn để vẽ nhiều chấm
            hotels={hotels.map((h) => h.hotel)}
          />
        </div>
      )}


        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside
            className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-72 flex-shrink-0`}
          >
            <div className="backdrop-blur-xl bg-white/80 border border-white/20 shadow-2xl rounded-xl p-4 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                  <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Bộ lọc
                  </h2>
                  {activeFiltersCount > 0 && (
                    <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2.5 py-1 rounded-full font-semibold shadow-md">
                      {activeFiltersCount}
                    </span>
                  )}
                </div>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-600 hover:text-red-700 font-semibold hover:scale-105 transition-transform duration-200"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {/* Keyword / Location Filter */}
                <div className="group">
                  <label className="flex items-center gap-2 font-semibold text-gray-700 mb-3">
                    <Search className="w-4 h-4 text-blue-500" />
                    Tìm theo tên
                  </label>

                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />

                    <input
                      type="text"
                      placeholder="Nhập tên khách sạn, thành phố, địa điểm..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="input w-full pl-9 border-2 border-gray-200 focus:border-blue-500 rounded-xl transition-all duration-200"
                    />
                  </div>
                </div>


                {/* Price Range */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Khoảng giá</h3>
                  <div className="space-y-2">
                    {PRICE_RANGES.map((range, index) => (
                      <button
                        key={index}
                        onClick={() =>
                          handlePriceRangeChange(range.min, range.max)
                        }
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                          filters.minPrice === range.min &&
                          filters.maxPrice === range.max
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105'
                            : 'hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <label className="text-xs text-gray-600 mb-2 block font-medium">
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
                        className="input text-sm border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                      />
                      <input
                        type="number"
                        placeholder="Giá đến"
                        value={filters.maxPrice}
                        onChange={(e) =>
                          handleFilterChange('maxPrice', e.target.value)
                        }
                        className="input text-sm border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                {/* Adults */}
                <div>
                  <label className="flex items-center gap-2 font-semibold text-gray-700 mb-3">
                    <Users className="w-4 h-4 text-green-500" />
                    Người lớn
                  </label>
                  <select
                    value={filters.adults}
                    onChange={(e) => {
                      const newAdults = parseInt(e.target.value);
                      const totalGuests = newAdults + filters.children;
                      handleFilterChange('adults', newAdults);
                      handleFilterChange('guests', totalGuests);
                    }}
                    className="input w-full border-2 border-gray-200 focus:border-green-500 rounded-xl transition-all duration-200"
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
                  <label className="flex items-center gap-2 font-semibold text-gray-700 mb-3">
                    <Baby className="w-4 h-4 text-pink-500" />
                    Trẻ em
                  </label>
                  <select
                    value={filters.children}
                    onChange={(e) => {
                      const newChildren = parseInt(e.target.value);
                      const totalGuests = filters.adults + newChildren;
                      handleFilterChange('children', newChildren);
                      handleFilterChange('guests', totalGuests);
                    }}
                    className="input w-full border-2 border-gray-200 focus:border-pink-500 rounded-xl transition-all duration-200"
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
                  <h3 className="font-semibold text-gray-700 mb-3">Loại phòng</h3>
                  <select
                    value={filters.roomType}
                    onChange={(e) =>
                      handleFilterChange('roomType', e.target.value)
                    }
                    className="input w-full border-2 border-gray-200 focus:border-purple-500 rounded-xl transition-all duration-200"
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
                  <label className="flex items-center gap-2 font-semibold text-gray-700 mb-3">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    Đánh giá
                  </label>
                  <div className="space-y-2">
                    {RATINGS.map((rating) => (
                      <button
                        key={rating.value}
                        onClick={() =>
                          handleFilterChange('rating', rating.value)
                        }
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                          filters.rating === rating.value
                            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg scale-105'
                            : 'hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        {rating.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Tiện nghi</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {AMENITIES.slice(0, 8).map((amenity) => (
                      <label
                        key={amenity.value}
                        className="flex items-center space-x-3 cursor-pointer group hover:bg-gray-50 p-2 rounded-lg transition-all duration-200"
                      >
                        <input
                          type="checkbox"
                          checked={filters.amenities.includes(amenity.value)}
                          onChange={() => handleAmenityToggle(amenity.value)}
                          className="rounded-md text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                        <span className="text-sm group-hover:text-blue-600 transition-colors duration-200">
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
            {filters.city && (
              <div className="mb-6">
                <WeatherWidget city={filters.city} />
              </div>
            )}

            {/* Summary + active filters */}
            <div className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-2xl p-4 mb-6 shadow-lg">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span>
                      Có{' '}
                      <span className="font-bold text-blue-600">
                        {hotelCount}
                      </span>{' '}
                      khách sạn phù hợp
                    </span>
                  </div>

                  {activeFiltersCount > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {filters.search && (
                        <span className="text-xs bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 px-3 py-1.5 rounded-full flex items-center gap-2 border border-indigo-200 shadow-sm">
                          <Search className="w-3 h-3" />
                          {filters.search}
                          <button
                            onClick={() => handleFilterChange('search', '')}
                            className="hover:text-indigo-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                      {filters.city && (
                        <span className="text-xs bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 px-3 py-1.5 rounded-full flex items-center gap-2 border border-blue-200 shadow-sm">
                          <MapPin className="w-3 h-3" />
                          {filters.city}
                          <button
                            onClick={() => handleFilterChange('city', '')}
                            className="hover:text-blue-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                      {(filters.minPrice || filters.maxPrice) && (
                        <span className="text-xs bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-3 py-1.5 rounded-full flex items-center gap-2 border border-green-200 shadow-sm">
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
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                      {filters.roomType && (
                        <span className="text-xs bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 px-3 py-1.5 rounded-full flex items-center gap-2 border border-purple-200 shadow-sm">
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
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                      {filters.rating && (
                        <span className="text-xs bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 px-3 py-1.5 rounded-full flex items-center gap-2 border border-yellow-200 shadow-sm">
                          <Star className="w-3 h-3 fill-yellow-600" />
                          {filters.rating}+ sao
                          <button
                            onClick={() => handleFilterChange('rating', '')}
                            className="hover:text-yellow-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                      {filters.latitude && filters.longitude && (
                        <span className="text-xs bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 px-3 py-1.5 rounded-full flex items-center gap-2 border border-orange-200 shadow-sm">
                          <MapPin className="w-3 h-3" />
                          Bán kính{' '}
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
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content */}
            {isLoading ? (
              <Loading />
            ) : hotelCount > 0 ? (
              <>
                <div className="space-y-4">
                  {pagedHotels.map((item) => {
                    const { hotel, minPrice, roomsCount, sampleRoom } = item;
                    const img =
                      hotel.images?.[0] ||
                      hotel.thumbnail ||
                      'https://via.placeholder.com/400x250?text=Hotel';

                    return (
                      <div
                        key={item.hotelId}
                        className="group backdrop-blur-xl bg-white/90 border border-white/20 rounded-xl p-4 flex flex-col md:flex-row gap-4 hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 cursor-pointer overflow-hidden"
                        onClick={() => handleViewHotelRooms(item)}
                      >
                        {/* Image */}
                        <div className="md:w-1/3 w-full relative overflow-hidden rounded-lg">
                          <img
                            src={img}
                            alt={hotel.name}
                            className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-semibold text-gray-700 shadow-sm">
                            {roomsCount} phòng
                          </div>
                        </div>

                        {/* Hotel Info */}
                        <div className="flex-1 flex flex-col md:flex-row gap-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-1.5 group-hover:text-blue-600 transition-colors duration-300">
                              {hotel.name}
                            </h3>

                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="flex items-center text-yellow-400">
                                {[1, 2, 3, 4, 5].map((i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i <= (hotel.starRating || 5)
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'opacity-20'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs px-2 py-0.5 rounded bg-green-50 text-green-700 font-semibold border border-green-100">
                                {hotel.rating?.toFixed
                                  ? hotel.rating.toFixed(1)
                                  : hotel.rating || '9.0'}{' '}
                                Tuyệt vời
                              </span>
                            </div>

                            <div className="flex items-center text-xs text-gray-600 mb-2">
                              <MapPin className="w-3 h-3 mr-1 text-blue-500" />
                              <span className="truncate">
                                {hotel.address || hotel.city || 'Việt Nam'}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-1.5 text-xs">
                              {hotel.hotelType && (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-medium border border-blue-100">
                                  {hotel.hotelType === 'hotel'
                                    ? 'Khách sạn'
                                    : hotel.hotelType}
                                </span>
                              )}
                              {hotel.amenities?.slice(0, 3).map((a) => (
                                <span
                                  key={a}
                                  className="px-2 py-0.5 bg-gray-50 text-gray-700 rounded font-medium border border-gray-200"
                                >
                                  {a}
                                </span>
                              ))}
                              {roomsCount > 1 && (
                                <span className="px-2 py-0.5 bg-gray-50 text-gray-700 rounded font-medium border border-gray-200">
                                  {roomsCount} loại phòng
                                </span>
                              )}
                            </div>

                            {/* Promotion Banner */}
                            {highlightCoupon && (
                              <div className="mt-3">
                                <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                                  <Percent className="w-4 h-4 text-orange-600 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-semibold text-orange-700">
                                        Mã <span className="font-mono">{highlightCoupon.code}</span>
                                      </span>
                                      {highlightCoupon.discountType && (
                                        <span className="text-xs text-orange-600">
                                          {highlightCoupon.discountType === 'percent'
                                            ? `Giảm ${highlightCoupon.discountValue || 0}%`
                                            : `Giảm ${(highlightCoupon.discountValue || 0).toLocaleString('vi-VN')}đ`}
                                        </span>
                                      )}
                                    </div>
                                    {(highlightCoupon.title || highlightCoupon.description) && (
                                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">
                                        {highlightCoupon.title || highlightCoupon.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Price & Button */}
                          <div className="md:w-52 flex flex-col justify-between items-end text-right">
                            <div className="mb-2">
                              <div className="text-xs text-gray-500 mb-0.5">
                                *Giá trung bình / đêm
                              </div>
                              <div className="text-2xl font-bold" style={{ color: '#003580' }}>
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
                              className="btn text-white px-4 py-2 text-xs rounded font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                              style={{ backgroundColor: '#003580' }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#002d66'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = '#003580'}
                            >
                              Xem phòng →
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalHotelPages > 1 && (
                  <div className="mt-8">
                    <Pagination
                      currentPage={hotelPage}
                      totalPages={totalHotelPages}
                      onPageChange={handleHotelPageChange}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 backdrop-blur-xl bg-white/80 border border-white/20 rounded-2xl shadow-lg">
                <div className="text-7xl mb-4 animate-bounce">🔍</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Không tìm thấy khách sạn nào
                </h3>
                <p className="text-gray-600 mb-6">
                  Thử thay đổi bộ lọc hoặc tìm kiếm lại
                </p>
                <button
                  onClick={clearFilters}
                  className="btn bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #60a5fa, #a78bfa);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
        }
      `}</style>
    </div>
  );
};

export default SearchResult;
