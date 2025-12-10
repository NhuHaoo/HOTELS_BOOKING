import { useState, useEffect } from 'react';

const ManagerDashboardFilters = ({ filters, onFilterChange }) => {
 
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
    
    if (type === 'custom') {
      return; // Không thay đổi filters, chỉ hiển thị date inputs
    }

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

  // Format date range để hiển thị
  const getDateRangeLabel = () => {
    if (!filters.startDate || !filters.endDate) return 'Tháng này';
    
    if (dateRangeType === 'today') return 'Hôm nay';
    if (dateRangeType === 'week') return '7 ngày qua';
    if (dateRangeType === 'month') return 'Tháng này';
    
    // Custom range
    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);
    return `${start.toLocaleDateString('vi-VN')} - ${end.toLocaleDateString('vi-VN')}`;
  };

  return (
    <div className="bg-white rounded-lg p-4">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Khoảng thời gian - Dropdown */}
        <div className="flex-1">
          <select
            value={dateRangeType}
            onChange={(e) => handleDateRangeChange(e.target.value)}
            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="today">Hôm nay</option>
            <option value="week">7 ngày qua</option>
            <option value="month">Tháng này</option>
            <option value="custom">Tùy chỉnh</option>
          </select>
        </div>

        {/* Từ ngày - Chỉ hiển thị khi chọn "Tùy chỉnh" */}
        {dateRangeType === 'custom' && (
          <div className="flex-1">
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => {
                onFilterChange({ ...filters, startDate: e.target.value });
              }}
              placeholder="Từ ngày"
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        )}

        {/* Đến ngày - Chỉ hiển thị khi chọn "Tùy chỉnh" */}
        {dateRangeType === 'custom' && (
          <div className="flex-1">
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => {
                onFilterChange({ ...filters, endDate: e.target.value });
              }}
              placeholder="Đến ngày"
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        )}

        {/* Hiển thị khoảng thời gian đã chọn (khi không phải custom) - Ẩn đi để giống ảnh hơn */}
        {dateRangeType !== 'custom' && false && (
          <div className="flex-1">
            <input
              type="text"
              value={getDateRangeLabel()}
              readOnly
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-default"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerDashboardFilters;

