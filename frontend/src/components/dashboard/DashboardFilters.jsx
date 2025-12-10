import { useState, useEffect } from 'react';
import { FaCalendarAlt, FaHotel, FaFilter } from 'react-icons/fa';

const DashboardFilters = ({ filters, onFilterChange, hotels = [] }) => {
  // Xác định dateRangeType dựa trên filters hiện tại
  const getDateRangeType = () => {
    if (!filters.startDate || !filters.endDate) return 'month';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(filters.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(filters.endDate);
    endDate.setHours(0, 0, 0, 0);
    
    // Check if today
    if (startDate.getTime() === today.getTime() && endDate.getTime() === today.getTime()) {
      return 'today';
    }
    
    // Check if last 7 days
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    if (startDate.getTime() === weekAgo.getTime() && endDate.getTime() === today.getTime()) {
      return 'week';
    }
    
    // Check if this month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    if (startDate.getTime() === monthStart.getTime() && endDate.getTime() === today.getTime()) {
      return 'month';
    }
    
    // Otherwise it's custom
    return 'custom';
  };

  const [dateRangeType, setDateRangeType] = useState(() => getDateRangeType());

  // Sync dateRangeType khi filters thay đổi từ bên ngoài
  useEffect(() => {
    const newType = getDateRangeType();
    if (newType !== dateRangeType) {
      setDateRangeType(newType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.startDate, filters.endDate]);

  const handleDateRangeChange = (type) => {
    setDateRangeType(type);
    const today = new Date();
    let startDate = '';
    let endDate = '';

    switch (type) {
      case 'today':
        startDate = today.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        startDate = monthStart.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'custom':
        // Khi chọn custom, chỉ set state, không thay đổi filters
        // Date inputs sẽ hiển thị để user chọn
        return;
      default:
        break;
    }

    // Cập nhật filters với dates mới
    onFilterChange({
      ...filters,
      startDate,
      endDate
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <FaFilter className="text-primary" size={16} />
        <h3 className="text-sm font-semibold text-gray-700">Bộ lọc</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Date Range Quick Select */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            <FaCalendarAlt className="inline mr-1" />
            Khoảng thời gian
          </label>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleDateRangeChange('today')}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                dateRangeType === 'today'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Hôm nay
            </button>
            <button
              onClick={() => handleDateRangeChange('week')}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                dateRangeType === 'week'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              7 ngày
            </button>
            <button
              onClick={() => handleDateRangeChange('month')}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                dateRangeType === 'month'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tháng này
            </button>
            <button
              onClick={() => handleDateRangeChange('custom')}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                dateRangeType === 'custom'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tùy chỉnh
            </button>
          </div>
        </div>

        {/* Custom Date Range - Chỉ hiển thị khi chọn "Tùy chỉnh" */}
        {dateRangeType === 'custom' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Từ ngày
              </label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => {
                  onFilterChange({ ...filters, startDate: e.target.value });
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Đến ngày
              </label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => {
                  onFilterChange({ ...filters, endDate: e.target.value });
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </>
        )}

        {/* Hotel Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            <FaHotel className="inline mr-1" />
            Khách sạn
          </label>
          <select
            value={filters.hotelId || ''}
            onChange={(e) => onFilterChange({ ...filters, hotelId: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Tất cả khách sạn</option>
            {hotels.map((hotel) => (
              <option key={hotel._id} value={hotel._id}>
                {hotel.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default DashboardFilters;
