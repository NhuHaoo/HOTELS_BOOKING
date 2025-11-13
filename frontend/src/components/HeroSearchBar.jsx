import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaMapMarkerAlt, FaCalendarAlt, FaUsers, FaUser, FaChild, FaBed, FaDollarSign, FaLocationArrow, FaExpand, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CITIES, ROOM_TYPES, PRICE_RANGES } from '../utils/constants';
import { getToday, getTomorrow } from '../utils/dateUtils';
import useSearchStore from '../store/useSearchStore';
import toast from 'react-hot-toast';

const HeroSearchBar = () => {
  const navigate = useNavigate();
  const { setSearchParams } = useSearchStore();
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [useLocation, setUseLocation] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  
  const [searchData, setSearchData] = useState({
    search: '', // Tìm kiếm tổng quát
    city: '',
    checkIn: getTomorrow(),
    checkOut: new Date(getTomorrow().getTime() + 24 * 60 * 60 * 1000),
    adults: 2,
    children: 0,
    roomType: '',
    minPrice: '',
    maxPrice: '',
    radius: 10, // km
    latitude: '',
    longitude: '',
  });

  // Get user location
  useEffect(() => {
    if (useLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setSearchData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Không thể lấy vị trí của bạn');
        }
      );
    }
  }, [useLocation]);

  const handleSearch = (e) => {
    e.preventDefault();
    
    const totalGuests = searchData.adults + searchData.children;
    
    // Update search store
    setSearchParams({
      city: searchData.city,
      checkIn: searchData.checkIn,
      checkOut: searchData.checkOut,
      guests: totalGuests,
      adults: searchData.adults,
      children: searchData.children,
      search: searchData.search,
      roomType: searchData.roomType,
      minPrice: searchData.minPrice,
      maxPrice: searchData.maxPrice,
    });

    // Navigate to search results
    const params = new URLSearchParams({
      search: searchData.search || '',
      city: searchData.city || '',
      checkIn: searchData.checkIn?.toISOString() || '',
      checkOut: searchData.checkOut?.toISOString() || '',
      guests: totalGuests.toString(),
      adults: searchData.adults.toString(),
      children: searchData.children.toString(),
      roomType: searchData.roomType || '',
      minPrice: searchData.minPrice || '',
      maxPrice: searchData.maxPrice || '',
    });

    // Add location-based search if enabled
    if (useLocation && searchData.latitude && searchData.longitude) {
      params.append('latitude', searchData.latitude);
      params.append('longitude', searchData.longitude);
      params.append('radius', (searchData.radius * 1000).toString()); // Convert km to meters
    }

    navigate(`/search?${params.toString()}`);
  };

  const handleQuickSearch = (city) => {
    const newSearchData = { ...searchData, city };
    setSearchData(newSearchData);
    
    const totalGuests = newSearchData.adults + newSearchData.children;
    
    // Auto search
    const params = new URLSearchParams({
      city: city,
      checkIn: newSearchData.checkIn?.toISOString() || '',
      checkOut: newSearchData.checkOut?.toISOString() || '',
      guests: totalGuests.toString(),
      adults: newSearchData.adults.toString(),
      children: newSearchData.children.toString(),
    });

    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="relative max-w-6xl mx-auto">
      {/* Main Search Form - Ultra Enhanced */}
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-10 relative z-10 border border-white/50">
        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
          🔍 Tìm phòng hoàn hảo cho chuyến đi
        </h2>
        
        <form onSubmit={handleSearch} className="space-y-6">
          {/* Tìm kiếm tổng quát */}
          <div className="relative">
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <FaSearch className="text-primary text-lg" />
              Tìm kiếm tổng quát
            </label>
            <input
              type="text"
              value={searchData.search}
              onChange={(e) => setSearchData({ ...searchData, search: e.target.value })}
              placeholder="Tên phòng, khách sạn, địa điểm, mô tả..."
              className="input w-full pl-12"
            />
            <FaSearch className="absolute left-4 top-11 text-gray-400" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* City/Destination */}
            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <FaMapMarkerAlt className="text-primary text-lg" />
                Điểm đến
              </label>
              <select
                value={searchData.city}
                onChange={(e) => setSearchData({ ...searchData, city: e.target.value })}
                className="input w-full"
              >
                <option value="">Tất cả địa điểm</option>
                {CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Check-in Date */}
            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <FaCalendarAlt className="text-primary text-lg" />
                Nhận phòng
              </label>
              <DatePicker
                selected={searchData.checkIn}
                onChange={(date) => setSearchData({ ...searchData, checkIn: date })}
                selectsStart
                startDate={searchData.checkIn}
                endDate={searchData.checkOut}
                minDate={getToday()}
                dateFormat="dd/MM/yyyy"
                className="input w-full hover:border-primary transition-colors"
              />
            </div>

            {/* Check-out Date */}
            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <FaCalendarAlt className="text-primary text-lg" />
                Trả phòng
              </label>
              <DatePicker
                selected={searchData.checkOut}
                onChange={(date) => setSearchData({ ...searchData, checkOut: date })}
                selectsEnd
                startDate={searchData.checkIn}
                endDate={searchData.checkOut}
                minDate={searchData.checkIn}
                dateFormat="dd/MM/yyyy"
                className="input w-full hover:border-primary transition-colors"
              />
            </div>

            {/* Adults */}
            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <FaUser className="text-primary text-lg" />
                Người lớn
              </label>
              <select
                value={searchData.adults}
                onChange={(e) => setSearchData({ ...searchData, adults: parseInt(e.target.value) })}
                className="input w-full hover:border-primary transition-colors"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <option key={num} value={num}>
                    {num} người lớn
                  </option>
                ))}
              </select>
            </div>

            {/* Children */}
            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <FaChild className="text-primary text-lg" />
                Trẻ em
              </label>
              <select
                value={searchData.children}
                onChange={(e) => setSearchData({ ...searchData, children: parseInt(e.target.value) })}
                className="input w-full hover:border-primary transition-colors"
              >
                {[0, 1, 2, 3, 4, 5].map((num) => (
                  <option key={num} value={num}>
                    {num === 0 ? 'Không có' : `${num} trẻ em`}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Advanced Options Toggle */}
          <div className="flex items-center justify-between">
            <div className="text-center text-sm text-gray-600 flex-1">
              <FaUsers className="inline mr-2" />
              Tổng: <span className="font-bold text-primary">{searchData.adults + searchData.children}</span> khách
              {searchData.children > 0 && (
                <span className="ml-2">
                  ({searchData.adults} người lớn, {searchData.children} trẻ em)
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-primary hover:text-primary-dark font-semibold"
            >
              {showAdvanced ? (
                <>
                  <span>Ẩn tùy chọn</span>
                  <FaChevronUp />
                </>
              ) : (
                <>
                  <span>Tùy chọn nâng cao</span>
                  <FaChevronDown />
                </>
              )}
            </button>
          </div>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              {/* Loại phòng */}
              <div className="relative">
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <FaBed className="text-primary text-sm" />
                  Loại phòng
                </label>
                <select
                  value={searchData.roomType}
                  onChange={(e) => setSearchData({ ...searchData, roomType: e.target.value })}
                  className="input w-full text-sm"
                >
                  <option value="">Tất cả loại phòng</option>
                  {ROOM_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Khoảng giá - Min */}
              <div className="relative">
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <FaDollarSign className="text-primary text-sm" />
                  Giá từ (VNĐ)
                </label>
                <input
                  type="number"
                  value={searchData.minPrice}
                  onChange={(e) => setSearchData({ ...searchData, minPrice: e.target.value })}
                  placeholder="0"
                  className="input w-full text-sm"
                />
              </div>

              {/* Khoảng giá - Max */}
              <div className="relative">
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <FaDollarSign className="text-primary text-sm" />
                  Giá đến (VNĐ)
                </label>
                <input
                  type="number"
                  value={searchData.maxPrice}
                  onChange={(e) => setSearchData({ ...searchData, maxPrice: e.target.value })}
                  placeholder="Không giới hạn"
                  className="input w-full text-sm"
                />
              </div>

              {/* Tìm theo bán kính */}
              <div className="relative">
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <FaLocationArrow className="text-primary text-sm" />
                  Tìm theo bán kính
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useLocation}
                      onChange={(e) => {
                        setUseLocation(e.target.checked);
                        if (!e.target.checked) {
                          setSearchData(prev => ({
                            ...prev,
                            latitude: '',
                            longitude: '',
                          }));
                        }
                      }}
                      className="rounded text-primary"
                    />
                    <span className="text-sm">Dùng vị trí hiện tại</span>
                  </label>
                  {useLocation && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={searchData.radius}
                        onChange={(e) => setSearchData({ ...searchData, radius: parseInt(e.target.value) || 10 })}
                        min="1"
                        max="100"
                        className="input text-sm flex-1"
                      />
                      <span className="text-sm text-gray-600">km</span>
                    </div>
                  )}
                  {useLocation && userLocation && (
                    <div className="text-xs text-green-600">
                      ✓ Đã lấy vị trí: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Price Ranges */}
              <div className="md:col-span-2 lg:col-span-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">Khoảng giá nhanh</label>
                <div className="flex flex-wrap gap-2">
                  {PRICE_RANGES.map((range, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSearchData({
                        ...searchData,
                        minPrice: range.min.toString(),
                        maxPrice: range.max === 99999999 ? '' : range.max.toString(),
                      })}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        searchData.minPrice === range.min.toString() && 
                        (range.max === 99999999 ? !searchData.maxPrice : searchData.maxPrice === range.max.toString())
                          ? 'bg-primary text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Search Button - Ultra Enhanced */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 hover:from-yellow-500 hover:via-orange-500 hover:to-yellow-500 text-gray-900 font-bold py-5 px-8 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] text-lg flex items-center justify-center gap-3 border-2 border-yellow-300"
          >
            <FaSearch className="text-xl" />
            <span className="text-xl">Tìm phòng ngay</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default HeroSearchBar;
