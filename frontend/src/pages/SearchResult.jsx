import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { roomAPI } from '../api/room.api';
import RoomCard from '../components/RoomCard';
import Loading from '../components/Loading';
import Pagination from '../components/Pagination';
import WeatherWidget from '../components/WeatherWidget';
import { FaFilter, FaTimes } from 'react-icons/fa';
import { ROOM_TYPES, AMENITIES, PRICE_RANGES, RATINGS, SORT_OPTIONS, CITIES } from '../utils/constants';

const SearchResult = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  
  // Get search params
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    city: searchParams.get('city') || '',
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    guests: parseInt(searchParams.get('guests')) || 2,
    adults: parseInt(searchParams.get('adults')) || parseInt(searchParams.get('guests')) || 2,
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
    limit: 12,
    sort: searchParams.get('sort') || '-rating',
  });

  // Fetch rooms
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['search-rooms', filters],
    queryFn: () => {
      const params = {
        ...filters,
        amenities: filters.amenities.join(','),
        maxGuests: filters.guests, // Send guests as maxGuests to backend
        adults: filters.adults,
        children: filters.children,
        checkIn: filters.checkIn,
        checkOut: filters.checkOut,
        // Location-based search
        latitude: filters.latitude,
        longitude: filters.longitude,
        radius: filters.radius,
      };
      // Remove empty values
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined || (Array.isArray(params[key]) && params[key].length === 0)) {
          delete params[key];
        }
      });
      return roomAPI.getRooms(params);
    },
  });

  useEffect(() => {
    refetch();
  }, [filters, refetch]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filter changes
    }));
  };

  const handlePriceRangeChange = (min, max) => {
    setFilters((prev) => ({
      ...prev,
      minPrice: min,
      maxPrice: max,
      page: 1,
    }));
  };

  const handleAmenityToggle = (amenity) => {
    setFilters((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
      page: 1,
    }));
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
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
      limit: 12,
      sort: '-rating',
    });
    // Update URL
    setSearchParams({});
  };

  // Count active filters
  const activeFiltersCount = 
    (filters.search ? 1 : 0) +
    (filters.city ? 1 : 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.roomType ? 1 : 0) +
    (filters.rating ? 1 : 0) +
    (filters.latitude && filters.longitude ? 1 : 0) +
    filters.amenities.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Kết quả tìm kiếm
            </h1>
            {data?.total && (
              <p className="text-gray-600">
                Tìm thấy {data.total} phòng
              </p>
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
                        onClick={() => handlePriceRangeChange(range.min, range.max)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          filters.minPrice === range.min && filters.maxPrice === range.max
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
                    <label className="text-xs text-gray-600 mb-2 block">Hoặc nhập giá tùy chỉnh:</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Giá từ"
                        value={filters.minPrice}
                        onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                        className="input text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Giá đến"
                        value={filters.maxPrice}
                        onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
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
                    onChange={(e) => handleFilterChange('roomType', e.target.value)}
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
                        onClick={() => handleFilterChange('rating', rating.value)}
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
            {filters.city && (
              <div className="mb-6">
                <WeatherWidget city={filters.city} />
              </div>
            )}

            {/* Active Filters & Sort */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold">{data?.total || 0}</span> phòng tìm thấy
                </div>
                
                {/* Active Filter Tags */}
                {activeFiltersCount > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {filters.search && (
                      <span className="text-xs bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full flex items-center gap-1">
                        🔍 {filters.search}
                        <button onClick={() => handleFilterChange('search', '')} className="hover:text-indigo-900">
                          <FaTimes className="text-xs" />
                        </button>
                      </span>
                    )}
                    {filters.city && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-1">
                        📍 {filters.city}
                        <button onClick={() => handleFilterChange('city', '')} className="hover:text-blue-900">
                          <FaTimes className="text-xs" />
                        </button>
                      </span>
                    )}
                    {(filters.minPrice || filters.maxPrice) && (
                      <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center gap-1">
                        💰 {filters.minPrice ? `${(parseInt(filters.minPrice) / 1000).toFixed(0)}k` : '0'} - {filters.maxPrice ? `${(parseInt(filters.maxPrice) / 1000).toFixed(0)}k` : '∞'}
                        <button onClick={() => handlePriceRangeChange('', '')} className="hover:text-green-900">
                          <FaTimes className="text-xs" />
                        </button>
                      </span>
                    )}
                    {filters.roomType && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full flex items-center gap-1">
                        🏠 {ROOM_TYPES.find(t => t.value === filters.roomType)?.label}
                        <button onClick={() => handleFilterChange('roomType', '')} className="hover:text-purple-900">
                          <FaTimes className="text-xs" />
                        </button>
                      </span>
                    )}
                    {filters.rating && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full flex items-center gap-1">
                        ⭐ {filters.rating}+ sao
                        <button onClick={() => handleFilterChange('rating', '')} className="hover:text-yellow-900">
                          <FaTimes className="text-xs" />
                        </button>
                      </span>
                    )}
                    {filters.latitude && filters.longitude && (
                      <span className="text-xs bg-orange-100 text-orange-800 px-3 py-1 rounded-full flex items-center gap-1">
                        📍 Bán kính {filters.radius ? `${(parseInt(filters.radius) / 1000).toFixed(0)}km` : '10km'}
                        <button onClick={() => {
                          handleFilterChange('latitude', '');
                          handleFilterChange('longitude', '');
                          handleFilterChange('radius', '');
                        }} className="hover:text-orange-900">
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

            {/* Room Grid */}
            {isLoading ? (
              <Loading />
            ) : data?.data?.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.data.map((room) => (
                    <RoomCard key={room._id} room={room} />
                  ))}
                </div>

                {/* Pagination */}
                {data.pages > 1 && (
                  <Pagination
                    currentPage={filters.page}
                    totalPages={data.pages}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Không tìm thấy phòng nào
                </h3>
                <p className="text-gray-600 mb-4">
                  Thử thay đổi bộ lọc hoặc tìm kiếm lại
                </p>
                <button onClick={clearFilters} className="btn btn-primary">
                  Xóa bộ lọc
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

