// Room types
export const ROOM_TYPES = [
  { value: 'single', label: 'Phòng đơn' },
  { value: 'double', label: 'Phòng đôi' },
  { value: 'suite', label: 'Phòng suite' },
  { value: 'deluxe', label: 'Phòng deluxe' },
  { value: 'family', label: 'Phòng gia đình' },
  { value: 'presidential', label: 'Phòng tổng thống' },
];

// Hotel amenities
export const HOTEL_AMENITIES = [
  { value: 'WiFi miễn phí', label: 'WiFi miễn phí', icon: '📶' },
  { value: 'Hồ bơi', label: 'Hồ bơi', icon: '🏊' },
  { value: 'Spa', label: 'Spa & Massage', icon: '💆' },
  { value: 'Phòng gym', label: 'Phòng tập gym', icon: '💪' },
  { value: 'Bãi đỗ xe', label: 'Bãi đỗ xe miễn phí', icon: '🅿️' },
  { value: 'Nhà hàng', label: 'Nhà hàng', icon: '🍽️' },
  { value: 'Quầy bar', label: 'Quầy bar', icon: '🍺' },
  { value: 'Dịch vụ phòng', label: 'Dịch vụ phòng 24/7', icon: '🛎️' },
  { value: 'Lễ tân 24h', label: 'Lễ tân 24 giờ', icon: '👨‍💼' },
  { value: 'Dịch vụ giặt là', label: 'Dịch vụ giặt là', icon: '👔' },
  { value: 'Đưa đón sân bay', label: 'Đưa đón sân bay', icon: '✈️' },
  { value: 'Hội nghị', label: 'Phòng hội nghị', icon: '🏢' },
  { value: 'Quầy tour', label: 'Quầy tour du lịch', icon: '🗺️' },
  { value: 'Két an toàn', label: 'Két an toàn', icon: '🔐' },
];

// Room amenities
export const ROOM_AMENITIES = [
  { value: 'WiFi miễn phí', label: 'WiFi miễn phí', icon: '📶' },
  { value: 'TV màn hình phẳng', label: 'TV màn hình phẳng', icon: '📺' },
  { value: 'Điều hòa', label: 'Điều hòa nhiệt độ', icon: '❄️' },
  { value: 'Minibar', label: 'Minibar', icon: '🧊' },
  { value: 'Ban công', label: 'Ban công riêng', icon: '🌅' },
  { value: 'Ăn sáng', label: 'Ăn sáng miễn phí', icon: '🥐' },
  { value: 'Máy pha cà phê', label: 'Máy pha cà phê', icon: '☕' },
  { value: 'Két an toàn', label: 'Két an toàn', icon: '🔐' },
  { value: 'Máy sấy tóc', label: 'Máy sấy tóc', icon: '💨' },
  { value: 'Bàn làm việc', label: 'Bàn làm việc', icon: '🖊️' },
  { value: 'Bồn tắm', label: 'Bồn tắm', icon: '🛁' },
  { value: 'Vòi sen', label: 'Vòi sen đứng', icon: '🚿' },
  { value: 'Dép đi trong phòng', label: 'Dép đi trong phòng', icon: '🥿' },
  { value: 'Đồ vệ sinh cá nhân', label: 'Đồ vệ sinh miễn phí', icon: '🧴' },
];

// Legacy - keep for backward compatibility
export const AMENITIES = ROOM_AMENITIES;

// Bed types
export const BED_TYPES = [
  { value: 'single', label: 'Giường đơn' },
  { value: 'double', label: 'Giường đôi' },
  { value: 'queen', label: 'Giường queen' },
  { value: 'king', label: 'Giường king' },
];

// View types
export const VIEW_TYPES = [
  { value: 'city', label: 'Phố' },
  { value: 'ocean', label: 'Biển' },
  { value: 'mountain', label: 'Núi' },
  { value: 'garden', label: 'Vườn' },
  { value: 'pool', label: 'Hồ bơi' },
];

// Booking status
export const BOOKING_STATUS = {
  confirmed: { label: 'Đã xác nhận', color: 'blue' },
  'checked-in': { label: 'Đã nhận phòng', color: 'green' },
  'checked-out': { label: 'Đã trả phòng', color: 'gray' },
  cancelled: { label: 'Đã hủy', color: 'red' },
  'no-show': { label: 'Không đến', color: 'orange' },
};

// Payment status
export const PAYMENT_STATUS = {
  pending: { label: 'Chờ thanh toán', color: 'yellow' },
  paid: { label: 'Đã thanh toán', color: 'green' },
  cancelled: { label: 'Đã hủy', color: 'red' },
  refunded: { label: 'Đã hoàn tiền', color: 'purple' },
};

// Cities (must match database city names exactly)
export const CITIES = [
  'Hà Nội',
  'Hồ Chí Minh',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'Nha Trang',
  'Đà Lạt',
  'Phú Quốc',
  'Vũng Tàu',
  'Hạ Long',
  'Huế',
  'Hội An',
];

// Price ranges
export const PRICE_RANGES = [
  { min: 0, max: 500000, label: 'Dưới 500k' },
  { min: 500000, max: 1000000, label: '500k - 1tr' },
  { min: 1000000, max: 2000000, label: '1tr - 2tr' },
  { min: 2000000, max: 5000000, label: '2tr - 5tr' },
  { min: 5000000, max: 99999999, label: 'Trên 5tr' },
];

// Rating stars
export const RATINGS = [
  { value: 5, label: '5 sao' },
  { value: 4, label: '4 sao trở lên' },
  { value: 3, label: '3 sao trở lên' },
  { value: 2, label: '2 sao trở lên' },
];

// Sort options
export const SORT_OPTIONS = [
  { value: '-rating', label: 'Đánh giá cao nhất' },
  { value: 'price', label: 'Giá thấp nhất' },
  { value: '-price', label: 'Giá cao nhất' },
  { value: '-createdAt', label: 'Mới nhất' },
];

