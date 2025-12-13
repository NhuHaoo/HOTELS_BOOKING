import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaSearch, FaCalendarAlt, FaUsers, FaUser,
  FaChild, FaBed, FaDollarSign, FaLocationArrow,
  FaChevronDown, FaChevronUp, FaMapMarkerAlt,
  FaPlus, FaMinus
} from 'react-icons/fa';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import { ROOM_TYPES, CITIES } from '../utils/constants';
import { getToday, getTomorrow } from '../utils/dateUtils';
import useSearchStore from '../store/useSearchStore';
import toast from 'react-hot-toast';
import MapView from './MapView';
import HeroPromoBar from '../components/HeroPromoBar';
import { hotelAPI } from '../api/hotel.api';
import { useQuery } from '@tanstack/react-query';

// Helper function: Remove Vietnamese tones
const removeVietnameseTones = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
};

const HeroSearchBar = () => {
  const navigate = useNavigate();
  const { setSearchParams } = useSearchStore();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [useLocation, setUseLocation] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  // Map state
  const [showMap, setShowMap] = useState(false);

  // Popup chọn khách & phòng
  const [showGuestBox, setShowGuestBox] = useState(false);
  const guestBoxRef = useRef(null);

  // Autocomplete suggestions
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const searchInputRef = useRef(null);

  const [searchData, setSearchData] = useState({
    search: '',
    checkIn: getTomorrow(),
    checkOut: new Date(getTomorrow().getTime() + 24 * 60 * 60 * 1000),
    rooms: 1,
    adults: 2,
    children: 0,
    roomType: '',
    minPrice: '',
    maxPrice: '',
    radius: 10,      // km
    latitude: '',
    longitude: '',
  });

  // Map center state - phải khai báo sau searchData
  const [mapCenter, setMapCenter] = useState({
    latitude: 10.776889, // HCM mặc định
    longitude: 106.700981,
  });

  // Helper: format ngày thành YYYY-MM-DD (để SearchResult + backend dễ xử lý)
  const formatDateParam = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // chỉ lấy phần ngày
  };

  // Lấy vị trí hiện tại (dùng checkbox "Dùng vị trí hiện tại")
  useEffect(() => {
    if (useLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({
            latitude: lat,
            longitude: lng,
          });
          setSearchData((prev) => ({
            ...prev,
            latitude: lat.toString(),
            longitude: lng.toString(),
          }));
          setMapCenter({ latitude: lat, longitude: lng });
        },
        (error) => {
          console.error(error);
          toast.error('Không thể lấy vị trí của bạn');
        }
      );
    }
  }, [useLocation]);

  // Cập nhật map center khi searchData thay đổi
  useEffect(() => {
    if (searchData.latitude && searchData.longitude) {
      setMapCenter({
        latitude: Number(searchData.latitude),
        longitude: Number(searchData.longitude),
      });
    }
  }, [searchData.latitude, searchData.longitude]);

  // Lấy danh sách hotels để đếm số lượng theo city
  const { data: allHotelsData } = useQuery({
    queryKey: ['all-hotels-for-count'],
    queryFn: () => hotelAPI.getHotels({ limit: 1000, page: 1 }),
    staleTime: 5 * 60 * 1000, // Cache 5 phút
  });

  // Removed hotels autocomplete - chỉ hiển thị địa điểm

  // Đếm số lượng hotels theo city
  const getHotelCountByCity = (cityName) => {
    if (!allHotelsData?.data?.hotels && !allHotelsData?.data) return 0;
    const hotels = allHotelsData.data.hotels || allHotelsData.data;
    return hotels.filter(h => h.city === cityName).length;
  };

  // Popular destinations với thumbnail
  const popularDestinations = [
    { name: 'Đà Lạt', image: 'https://res.cloudinary.com/dsjdn1ajs/image/upload/v1765628577/%C4%90%C3%A0_l%E1%BA%A1t_zhfh3l.png' },
    { name: 'Phú Yên', image: 'https://res.cloudinary.com/dsjdn1ajs/image/upload/v1765628133/ph%C3%BA_y%C3%AAn_vlri8f.jpg' },
    { name: 'Đà Nẵng', image: 'https://res.cloudinary.com/dsjdn1ajs/image/upload/v1765629341/%C4%91%C3%A0_n%E1%BA%B5ng_coq4xj.jpg' },
    { name: 'Hà Nội', image: 'https://res.cloudinary.com/dsjdn1ajs/image/upload/v1765628129/h%C3%A0_n%E1%BB%99i_fxuamd.jpg' },
    { name: 'Hội An', image: 'https://res.cloudinary.com/dsjdn1ajs/image/upload/v1765629296/h%E1%BB%99i_annn_o5drik.jpg' },
    { name: 'Vịnh Hạ Long', image: 'https://res.cloudinary.com/dsjdn1ajs/image/upload/v1765628142/v%E1%BB%8Bnh_h%E1%BA%A1_long_k9f3td.jpg' },
    { name: 'Nha Trang', image: 'https://res.cloudinary.com/dsjdn1ajs/image/upload/v1765628130/nha_trang_akczbi.jpg' },
    { name: 'Phú Quốc', image: 'https://res.cloudinary.com/dsjdn1ajs/image/upload/v1765628132/Ph%C3%BA_qu%E1%BB%91c_urfqky.jpg' },
    { name: 'Quy Nhơn', image: 'https://res.cloudinary.com/dsjdn1ajs/image/upload/v1765628138/Quy_nh%C6%A1n_rfbwxl.jpg' },
  ];

  // Tạo suggestions từ cities và hotels
  useEffect(() => {
    const searchTerm = searchData.search?.toLowerCase().trim() || '';
    const searchTermNoTones = removeVietnameseTones(searchTerm);

    // Nếu không có search term, hiển thị popular destinations
    if (!searchTerm || searchTerm.length < 2) {
      const popular = popularDestinations.map(dest => ({
        type: 'city',
        label: dest.name,
        value: dest.name,
        image: dest.image,
        hotelCount: getHotelCountByCity(dest.name),
      }));
      setSuggestions(popular);
      // Chỉ hiển thị khi user focus vào input
      return;
    }

    const results = [];

    // 1. Tìm cities phù hợp (hỗ trợ tìm không dấu)
    const matchedCities = CITIES.filter(city => {
      const cityLower = city.toLowerCase();
      const cityNoTones = removeVietnameseTones(city);
      return cityLower.includes(searchTerm) || cityNoTones.includes(searchTermNoTones);
    }).map(city => {
      const popular = popularDestinations.find(d => d.name === city);
      return {
        type: 'city',
        label: city,
        value: city,
        image: popular?.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&h=150&fit=crop',
        hotelCount: getHotelCountByCity(city),
      };
    });

    results.push(...matchedCities);

    setSuggestions(results);
    setShowSuggestions(results.length > 0);
  }, [searchData.search, allHotelsData]);

  // Xử lý click trên map để chọn vị trí
  const handleMapClick = (e) => {
    const lat = e.lngLat.lat;
    const lng = e.lngLat.lng;

      setSearchData((prev) => ({
        ...prev,
        latitude: lat.toString(),
        longitude: lng.toString(),
      }));

      // Bật luôn "tìm theo bán kính" để khi submit gửi lat/lng
      setUseLocation(true);
    setMapCenter({ latitude: lat, longitude: lng });
  };

  // Đóng popup khách/phòng khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (guestBoxRef.current && !guestBoxRef.current.contains(e.target)) {
        setShowGuestBox(false);
      }
      if (searchInputRef.current && !searchInputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();

    // Validate đơn giản
    if (!searchData.search && !searchData.latitude && !searchData.longitude) {
      toast.error('Vui lòng nhập điểm đến hoặc chọn vị trí trên bản đồ');
      return;
    }

    if (searchData.checkIn && searchData.checkOut && searchData.checkIn > searchData.checkOut) {
      toast.error('Ngày nhận phòng phải trước ngày trả phòng');
      return;
    }

    const totalGuests = searchData.adults + searchData.children;

    // Lưu vào store (nếu chỗ khác còn dùng)
    setSearchParams({
      checkIn: formatDateParam(searchData.checkIn),
      checkOut: formatDateParam(searchData.checkOut),
      guests: totalGuests,
      rooms: searchData.rooms,
      adults: searchData.adults,
      children: searchData.children,
      search: searchData.search,
      roomType: searchData.roomType,
      minPrice: searchData.minPrice,
      maxPrice: searchData.maxPrice,
      latitude: searchData.latitude,
      longitude: searchData.longitude,
      radius: searchData.radius ? searchData.radius * 1000 : '',
    });

    // Build query cho URL (SearchResult.jsx đọc ở đây)
    const params = new URLSearchParams();

    if (searchData.search) params.set('search', searchData.search);
    if (searchData.checkIn) params.set('checkIn', formatDateParam(searchData.checkIn));
    if (searchData.checkOut) params.set('checkOut', formatDateParam(searchData.checkOut));

    params.set('guests', totalGuests.toString());
    params.set('adults', searchData.adults.toString());
    params.set('children', searchData.children.toString());

    if (searchData.roomType) params.set('roomType', searchData.roomType);
    if (searchData.minPrice) params.set('minPrice', searchData.minPrice);
    if (searchData.maxPrice) params.set('maxPrice', searchData.maxPrice);

    const hasLocation = searchData.latitude && searchData.longitude;
    if (hasLocation) {
      params.set('latitude', searchData.latitude);
      params.set('longitude', searchData.longitude);
      params.set('radius', (searchData.radius * 1000).toString()); // km -> m
    }

    // sort mặc định (SearchResult cũng default -rating nhưng set luôn cho rõ)
    params.set('sort', '-rating');

    navigate(`/search?${params.toString()}`);
  };

  const totalGuests = searchData.adults + searchData.children;

  const handleGuestChange = (field, delta) => {
    setSearchData((prev) => {
      let min = 0;
      if (field === 'rooms') min = 1;
      if (field === 'adults') min = 1;

      const next = Math.max(min, prev[field] + delta);
      return { ...prev, [field]: next };
    });
  };

  const guestSummary = `${searchData.rooms} phòng, ${searchData.adults} người lớn, ${searchData.children} trẻ em`;

  return (
    <div className="relative max-w-6xl mx-auto px-3 space-y-3">
      {/* Card tổng */}
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_18px_45px_rgba(15,23,42,0.18)] p-5 md:p-8 border border-slate-100">
        {/* Tiêu đề + mô tả nhỏ */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Tìm phòng cho chuyến đi của bạn
          </h2>
          <p className="mt-2 text-sm md:text-base text-slate-500">
            Chọn điểm đến, ngày nhận – trả phòng và số khách để xem các ưu đãi tốt nhất.
          </p>
        </div>

        <form onSubmit={handleSearch} className="space-y-6">
          {/* Hàng 1: Ô tìm kiếm + map */}
          <div className="relative">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
              <span className="inline-flex items-center gap-2">
                <FaMapMarkerAlt className="text-orange-400" />
                Điểm đến
              </span>
            </label>

            <div className="relative" ref={searchInputRef}>
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm z-10" />
              <input
                type="text"
                value={searchData.search}
                onChange={(e) => {
                  setSearchData({ ...searchData, search: e.target.value });
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  // Hiển thị popular destinations khi focus vào input rỗng
                  if (!searchData.search || searchData.search.length < 2) {
                    const popular = popularDestinations.map(dest => ({
                      type: 'city',
                      label: dest.name,
                      value: dest.name,
                      image: dest.image,
                      hotelCount: getHotelCountByCity(dest.name),
                    }));
                    setSuggestions(popular);
                  }
                  setShowSuggestions(true);
                }}
                placeholder="Nhập thành phố, tên khách sạn hoặc địa điểm..."
                className="w-full pl-10 pr-3 py-2 h-12 md:h-13 rounded-2xl border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-300/60 text-sm md:text-base"
              />

              {/* Dropdown Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
                  {/* Header */}
                  <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-slate-200">
                    <h3 className="font-bold text-slate-900 text-sm">
                      {searchData.search && searchData.search.length >= 2 
                        ? 'Kết quả tìm kiếm' 
                        : 'Địa điểm đang hot nhất'}
                    </h3>
                  </div>

                  {/* Content */}
                  <div className="max-h-96 overflow-y-auto">
                    {searchData.search && searchData.search.length >= 2 ? (
                      // List view cho search results
                      <div className="py-2">
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setSearchData((prev) => ({
                                ...prev,
                                search: suggestion.value,
                              }));
                              setShowSuggestions(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors flex items-center gap-3 group"
                          >
                            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={suggestion.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&h=150&fit=crop'}
                                alt={suggestion.label}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-slate-900 group-hover:text-orange-600">
                                {suggestion.label}
                              </div>
                                {suggestion.city && (
                                  <div className="text-xs text-slate-500 mt-0.5">
                                    {suggestion.city}
                                    {suggestion.address && ` • ${suggestion.address}`}
                                  </div>
                                )}
                            </div>
                            <FaMapMarkerAlt className="text-slate-400 group-hover:text-orange-500 text-sm flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                      ) : (
                        // Grid view cho popular destinations - Layout ngang: ảnh trái, tên phải
                        <div className="p-3">
                          <div className="grid grid-cols-3 gap-2">
                            {suggestions.slice(0, 9).map((suggestion, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => {
                                  setSearchData((prev) => ({
                                    ...prev,
                                    search: suggestion.value,
                                  }));
                                  setShowSuggestions(false);
                                }}
                                className="group relative overflow-hidden rounded-lg border border-slate-200 hover:border-orange-400 hover:shadow-md transition-all duration-200 bg-white flex items-center gap-2 p-2"
                              >
                                {/* Thumbnail - Bên trái */}
                                <div className="w-12 h-12 flex-shrink-0 overflow-hidden rounded bg-slate-100">
                                  <img
                                    src={suggestion.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=150&h=30&fit=crop'}
                                    alt={suggestion.label}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  />
                                </div>
                                {/* Info - Bên phải */}
                                <div className="flex-1 min-w-0 text-left">
                                  <div className="font-semibold text-xs text-slate-900 group-hover:text-orange-600 line-clamp-1">
                                    {suggestion.label}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>

            {/* Nút bật bản đồ + tọa độ */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowMap((prev) => !prev)}
                className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold text-orange-500 hover:text-orange-600"
              >
                <FaMapMarkerAlt className="text-[13px]" />
                {showMap ? 'Ẩn bản đồ chọn vị trí' : 'Chọn vị trí trên bản đồ'}
              </button>

              {searchData.latitude && searchData.longitude && (
                <div className="text-[11px] md:text-xs text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full">
                  <FaLocationArrow className="text-emerald-500 text-[12px]" />
                  <span className="font-medium">Đã chọn vị trí:</span>
                  <span>
                    {Number(searchData.latitude).toFixed(4)},{' '}
                    {Number(searchData.longitude).toFixed(4)}
                  </span>
                </div>
              )}
            </div>

            {/* Bản đồ */}
            {showMap && (
              <div className="mt-3 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                <MapView
                  latitude={mapCenter.latitude}
                  longitude={mapCenter.longitude}
                  zoom={13}
                  height="256px"
                  onMapClick={handleMapClick}
                />
              </div>
            )}
          </div>

          {/* Hàng 2: Ngày + khách/phòng */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Check-in */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                <span className="inline-flex items-center gap-2">
                  <FaCalendarAlt className="text-orange-400" />
                  Ngày nhận phòng
                </span>
              </label>
              <DatePicker
                selected={searchData.checkIn}
                onChange={(date) =>
                  setSearchData({ ...searchData, checkIn: date })
                }
                selectsStart
                startDate={searchData.checkIn}
                endDate={searchData.checkOut}
                minDate={getToday()}
                dateFormat="dd/MM/yyyy"
                className="w-full h-11 md:h-12 rounded-2xl border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-300/60 text-sm"
              />
            </div>

            {/* Check-out */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                <span className="inline-flex items-center gap-2">
                  <FaCalendarAlt className="text-orange-400" />
                  Ngày trả phòng
                </span>
              </label>
              <DatePicker
                selected={searchData.checkOut}
                onChange={(date) =>
                  setSearchData({ ...searchData, checkOut: date })
                }
                selectsEnd
                startDate={searchData.checkIn}
                endDate={searchData.checkOut}
                minDate={searchData.checkIn}
                dateFormat="dd/MM/yyyy"
                className="w-full h-11 md:h-12 rounded-2xl border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-300/60 text-sm"
              />
            </div>

            {/* Khách & Phòng (gộp) */}
            <div className="relative" ref={guestBoxRef}>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                <span className="inline-flex items-center gap-2">
                  <FaUsers className="text-orange-400" />
                  Phòng & Khách
                </span>
              </label>

              {/* Ô tổng */}
              <div
                className="h-11 md:h-12 px-4 flex items-center justify-between rounded-2xl border border-slate-300 bg-white cursor-pointer hover:border-orange-400"
                onClick={() => setShowGuestBox((prev) => !prev)}
              >
                <div className="flex items-center gap-2 text-slate-700">
                  <FaUsers className="text-orange-500" />
                  <span className="text-sm font-medium truncate">
                    {guestSummary}
                  </span>
                </div>
                <FaChevronDown
                  className={`text-xs text-slate-400 transition-transform ${
                    showGuestBox ? 'rotate-180' : ''
                  }`}
                />
              </div>

              {/* Popup chọn phòng/khách */}
              {showGuestBox && (
                <div className="absolute z-50 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4">
                  {/* Row phòng */}
                  <GuestRow
                    label="Phòng"
                    sub="1 phòng tiêu chuẩn"
                    value={searchData.rooms}
                    onMinus={() => handleGuestChange('rooms', -1)}
                    onPlus={() => handleGuestChange('rooms', 1)}
                    min={1}
                  />

                  {/* Row người lớn */}
                  <GuestRow
                    label="Người lớn"
                    sub="Từ 17 tuổi"
                    value={searchData.adults}
                    onMinus={() => handleGuestChange('adults', -1)}
                    onPlus={() => handleGuestChange('adults', 1)}
                    min={1}
                  />

                  {/* Row trẻ em */}
                  <GuestRow
                    label="Trẻ em"
                    sub="Từ 0 – 16 tuổi"
                    value={searchData.children}
                    onMinus={() => handleGuestChange('children', -1)}
                    onPlus={() => handleGuestChange('children', 1)}
                    min={0}
                  />

                  <div className="mt-3 text-xs text-slate-500">
                    Đặt đoàn từ 10 phòng –{' '}
                    <span className="text-blue-600 underline cursor-pointer">
                      Liên hệ
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tổng khách + nút nâng cao */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-sm text-slate-600 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100">
                <FaUsers className="text-slate-500 text-sm" />
              </span>
              <span>
                Tổng:{' '}
                <span className="font-semibold text-orange-500">
                  {totalGuests}
                </span>{' '}
                khách, {searchData.rooms} phòng
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-slate-700 hover:text-orange-500"
            >
              {showAdvanced ? (
                <>
                  Ẩn tuỳ chọn nâng cao
                  <FaChevronUp className="text-xs" />
                </>
              ) : (
                <>
                  Tuỳ chọn nâng cao
                  <FaChevronDown className="text-xs" />
                </>
              )}
            </button>
          </div>

          {/* Tuỳ chọn nâng cao */}
          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 border border-slate-100 p-4 rounded-2xl">
              {/* Room Type */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  <FaBed className="text-orange-400 inline mr-1" />
                  Loại phòng
                </label>
                <select
                  value={searchData.roomType}
                  onChange={(e) =>
                    setSearchData({ ...searchData, roomType: e.target.value })
                  }
                  className="w-full h-11 md:h-12 rounded-2xl border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-300/60 text-sm"
                >
                  <option value="">Tất cả loại phòng</option>
                  {ROOM_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Price Min */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  <FaDollarSign className="text-orange-400 inline mr-1" />
                  Giá từ
                </label>
                <input
                  type="number"
                  value={searchData.minPrice}
                  onChange={(e) =>
                    setSearchData({ ...searchData, minPrice: e.target.value })
                  }
                  className="w-full h-11 md:h-12 rounded-2xl border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-300/60 text-sm"
                  placeholder="0"
                />
              </div>

              {/* Price Max */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  <FaDollarSign className="text-orange-400 inline mr-1" />
                  Giá đến
                </label>
                <input
                  type="number"
                  value={searchData.maxPrice}
                  onChange={(e) =>
                    setSearchData({ ...searchData, maxPrice: e.target.value })
                  }
                  className="w-full h-11 md:h-12 rounded-2xl border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-300/60 text-sm"
                  placeholder="Không giới hạn"
                />
              </div>

              {/* Use Location (GPS + bán kính) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  <FaLocationArrow className="text-orange-400 inline mr-1" />
                  Tìm theo bán kính
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={useLocation}
                    onChange={(e) => setUseLocation(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Dùng vị trí hiện tại
                </label>

                {(useLocation || searchData.latitude) && (
                  <>
                    <input
                      type="number"
                      value={searchData.radius}
                      onChange={(e) =>
                        setSearchData({
                          ...searchData,
                          radius: Number(e.target.value),
                        })
                      }
                      min="1"
                      max="100"
                      className="w-full h-11 md:h-12 rounded-2xl border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-300/60 text-sm mt-2"
                      placeholder="Bán kính (km)"
                    />
                    {userLocation && (
                      <div className="text-[11px] text-emerald-600 mt-1">
                        ✓ {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Nút submit */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:brightness-105 text-slate-900 font-semibold py-4 md:py-5 rounded-2xl text-base md:text-lg flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(248,181,0,0.35)] transition-transform duration-150 hover:-translate-y-[1px]"
          >
            <FaSearch className="text-lg md:text-xl" />
            Tìm phòng ngay
          </button>
        </form>
      </div>

      {/* Thanh khuyến mãi bên dưới HeroSearch */}
      <HeroPromoBar />
    </div>
  );
};

// Row nhỏ cho popup khách/phòng
const GuestRow = ({ label, sub, value, onMinus, onPlus, min = 0 }) => (
  <div className="flex items-center justify-between py-2 border-b last:border-b-0">
    <div>
      <div className="font-medium text-sm">{label}</div>
      <div className="text-xs text-slate-500">{sub}</div>
    </div>
    <div className="flex items-center gap-3">
      <button
        type="button"
        className="w-7 h-7 flex items-center justify-center rounded-full border border-slate-300 disabled:opacity-40"
        onClick={onMinus}
        disabled={value <= min}
      >
        <FaMinus className="text-xs" />
      </button>
      <span className="w-5 text-center font-semibold text-sm">{value}</span>
      <button
        type="button"
        className="w-7 h-7 flex items-center justify-center rounded-full border border-slate-300"
        onClick={onPlus}
      >
        <FaPlus className="text-xs" />
      </button>
    </div>
  </div>
);

export default HeroSearchBar;
