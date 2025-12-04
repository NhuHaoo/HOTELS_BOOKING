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

import { ROOM_TYPES } from '../utils/constants';
import { getToday, getTomorrow } from '../utils/dateUtils';
import useSearchStore from '../store/useSearchStore';
import toast from 'react-hot-toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import HeroPromoBar from '../components/HeroPromoBar';

const HeroSearchBar = () => {
  const navigate = useNavigate();
  const { setSearchParams } = useSearchStore();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [useLocation, setUseLocation] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  // Map state
  const [showMap, setShowMap] = useState(false);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Popup chọn khách & phòng
  const [showGuestBox, setShowGuestBox] = useState(false);
  const guestBoxRef = useRef(null);

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
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setSearchData((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }));
        },
        (error) => {
          console.error(error);
          toast.error('Không thể lấy vị trí của bạn');
        }
      );
    }
  }, [useLocation]);

  // Khởi tạo bản đồ chọn vị trí tìm kiếm
  useEffect(() => {
    if (!showMap) return;

    // Nếu map đã tồn tại (toggle ẩn/hiện) thì chỉ cần invalidateSize
    if (mapRef.current) {
      mapRef.current.invalidateSize();
      return;
    }

    const defaultLat = searchData.latitude
      ? Number(searchData.latitude)
      : 10.776889; // ví dụ HCM
    const defaultLng = searchData.longitude
      ? Number(searchData.longitude)
      : 106.700981;

    const map = L.map('search-map').setView([defaultLat, defaultLng], 13);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(map);

    // Marker ban đầu
    markerRef.current = L.marker([defaultLat, defaultLng]).addTo(map);

    // Click trên map để chọn vị trí
    map.on('click', (e) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      setSearchData((prev) => ({
        ...prev,
        latitude: lat.toString(),
        longitude: lng.toString(),
      }));

      // Bật luôn "tìm theo bán kính" để khi submit gửi lat/lng
      setUseLocation(true);

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMap]);

  // Đóng popup khách/phòng khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (guestBoxRef.current && !guestBoxRef.current.contains(e.target)) {
        setShowGuestBox(false);
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

            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                value={searchData.search}
                onChange={(e) =>
                  setSearchData({ ...searchData, search: e.target.value })
                }
                placeholder="Nhập thành phố, tên khách sạn hoặc địa điểm..."
                className="w-full pl-10 pr-3 py-2 h-12 md:h-13 rounded-2xl border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-300/60 text-sm md:text-base"
              />
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
                <div id="search-map" className="w-full h-64" />
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
