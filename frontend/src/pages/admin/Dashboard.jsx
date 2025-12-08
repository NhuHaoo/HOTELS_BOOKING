import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../api/admin.api';
import Loading from '../../components/Loading';
import {
  FaUsers,
  FaHotel,
  FaClipboardList,
  FaDollarSign,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaClock,
  FaCheckCircle
} from 'react-icons/fa';
import { formatPrice } from '../../utils/formatPrice';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  // =============== FILTER STATE ===============
  const [filters, setFilters] = useState({
    hotelId: '',
    startDate: '',
    endDate: ''
  });

  // Lấy danh sách khách sạn để đổ vào select
  const { data: hotelsData } = useQuery({
    queryKey: ['admin-hotels'],
    queryFn: () => adminAPI.getHotels()
  });

  // Lấy dữ liệu dashboard (có áp dụng filter)
  const {
    data: dashboardData,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['admin-dashboard', filters],
    queryFn: () => adminAPI.getDashboard(filters),
  });

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">❌ Lỗi tải dữ liệu dashboard</p>
          <p className="text-gray-600">{error?.message || 'Vui lòng thử lại sau'}</p>
        </div>
      </div>
    );
  }

  const overview = dashboardData?.data?.overview || {};
  const monthlyRevenue = dashboardData?.data?.monthlyRevenue || [];
  const recentBookings = dashboardData?.data?.recentBookings || [];
  const statusData = dashboardData?.data?.bookingsByStatus || [];

  // Stats cards with gradients
  const statsCards = [
    {
      title: 'Tổng người dùng',
      value: overview.totalUsers || 0,
      icon: FaUsers,
      gradient: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-500',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Tổng phòng',
      value: overview.totalRooms || 0,
      icon: FaHotel,
      gradient: 'from-green-500 to-green-600',
      iconBg: 'bg-green-500',
      trend: '+5%',
      trendUp: true,
    },
    {
      title: 'Tổng đặt phòng',
      value: overview.totalBookings || 0,
      icon: FaClipboardList,
      gradient: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-500',
      trend: '+18%',
      trendUp: true,
    },
    {
      title: 'Doanh thu',
      value: formatPrice(overview.totalRevenue || 0),
      icon: FaDollarSign,
      gradient: 'from-yellow-500 to-orange-500',
      iconBg: 'bg-accent',
      trend: '+24%',
      trendUp: true,
    },
  ];

  // Transform data for charts
  const revenueChartData = monthlyRevenue.map((item) => ({
    name: `T${item._id.month}/${item._id.year}`,
    'Doanh thu': item.revenue,
    'Đặt phòng': item.bookings,
  }));

  // Quick actions
  const quickActions = [
    { label: 'Thêm khách sạn', path: '/admin/hotels', icon: FaHotel, color: 'bg-blue-500' },
    { label: 'Thêm phòng', path: '/admin/rooms', icon: FaClipboardList, color: 'bg-green-500' },
    { label: 'Xem đặt phòng', path: '/admin/bookings', icon: FaEye, color: 'bg-purple-500' },
    { label: 'Quản lý user', path: '/admin/users', icon: FaUsers, color: 'bg-orange-500' },
  ];

  // ====== Mapping trạng thái sang tiếng Việt ======
  const statusLabel = {
    paid: 'Đã thanh toán',
    pending: 'Chờ thanh toán',
    cancelled: 'Đã hủy',
    refunded: 'Đã hoàn tiền',
    confirmed: 'Đã xác nhận',
    'no-show': 'Không đến',
    'checked-in': 'Đã nhận phòng',
    'checked-out': 'Đã trả phòng',
  };

  // Dữ liệu Pie chart dùng bookingsByStatus từ backend
  const pieData = statusData.map((s) => ({
    name: statusLabel[s._id] || s._id,
    value: s.count,
    color:
      s._id === 'paid'
        ? '#10b981'
        : s._id === 'pending'
        ? '#3b82f6'
        : s._id === 'cancelled'
        ? '#ef4444'
        : s._id === 'refunded'
        ? '#6366f1'
        : s._id === 'checked-in'
        ? '#f59e0b'
        : s._id === 'checked-out'
        ? '#6b7280'
        : '#9ca3af',
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Tổng quan hệ thống đặt phòng khách sạn</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-2 text-sm text-gray-500">
          <FaClock />
          <span>Cập nhật: {new Date().toLocaleDateString('vi-VN')}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <div
            key={index}
            className={`relative overflow-hidden bg-gradient-to-br ${stat.gradient} rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
          >
            <div className="p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.iconBg} bg-white/20 p-3 rounded-lg backdrop-blur-sm`}>
                  <stat.icon size={24} />
                </div>
                <div
                  className={`flex items-center space-x-1 text-sm font-semibold ${
                    stat.trendUp ? 'text-green-100' : 'text-red-100'
                  }`}
                >
                  {stat.trendUp ? <FaArrowUp size={12} /> : <FaArrowDown size={12} />}
                  <span>{stat.trend}</span>
                </div>
              </div>
              <p className="text-white/80 text-sm font-medium mb-1">{stat.title}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30" />
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <FaCheckCircle className="mr-2 text-primary" />
          Thao tác nhanh
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.path}
              className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
            >
              <div className={`${action.color} p-4 rounded-full mb-3 group-hover:scale-110 transition-transform`}>
                <action.icon className="text-white" size={24} />
              </div>
              <span className="text-sm font-medium text-gray-700 text-center">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ====== BỘ LỌC THỐNG KÊ (dưới Thao tác nhanh) ====== */}
      <div className="card p-6 border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Bộ lọc thống kê</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Hotel filter */}
          <div>
            <label className="block text-sm font-medium mb-1">Khách sạn</label>
            <select
              className="w-full border px-3 py-2 rounded"
              value={filters.hotelId}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, hotelId: e.target.value }))
              }
            >
              <option value="">Tất cả</option>
              {hotelsData?.data?.map((hotel) => (
                <option key={hotel._id} value={hotel._id}>
                  {hotel.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start date */}
          <div>
            <label className="block text-sm font-medium mb-1">Từ ngày</label>
            <input
              type="date"
              className="w-full border px-3 py-2 rounded"
              value={filters.startDate}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, startDate: e.target.value }))
              }
            />
          </div>

          {/* End date */}
          <div>
            <label className="block text-sm font-medium mb-1">Đến ngày</label>
            <input
              type="date"
              className="w-full border px-3 py-2 rounded"
              value={filters.endDate}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, endDate: e.target.value }))
              }
            />
          </div>

          {/* Clear filter */}
          <div className="flex items-end">
            <button
              onClick={() =>
                setFilters({
                  hotelId: '',
                  startDate: '',
                  endDate: ''
                })
              }
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded text-sm font-medium"
            >
              Xóa lọc
            </button>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart - Takes 2 columns */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <FaDollarSign className="mr-2 text-accent" />
            Doanh thu và Đặt phòng theo tháng
          </h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => {
                  if (name === 'Doanh thu') return formatPrice(value);
                  return value;
                }}
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              />
              <Legend />
              <Bar dataKey="Doanh thu" fill="#febb02" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Đặt phòng" fill="#003580" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="card p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <FaClipboardList className="mr-2 text-purple-500" />
            Trạng thái đặt phòng
          </h2>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value} lượt`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line Chart */}
      <div className="card p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <FaArrowUp className="mr-2 text-green-500" />
          Xu hướng đặt phòng
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="Đặt phòng"
              stroke="#003580"
              strokeWidth={3}
              dot={{ fill: '#003580', r: 6 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Bookings Table */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center">
            <FaClipboardList className="mr-2 text-primary" />
            Đặt phòng gần đây
          </h2>
          <Link
            to="/admin/bookings"
            className="text-primary hover:text-primary-dark text-sm font-semibold"
          >
            Xem tất cả →
          </Link>
        </div>
        <div className="overflow-hidden">
          <table className="w-full table-fixed">
            <thead>
              <tr className="bg-gradient-to-r from-primary/10 to-primary/5">
                <th className="w-[20%] px-2 py-3 text-left text-xs font-semibold text-gray-700 uppercase rounded-tl-lg">
                  Mã đặt phòng
                </th>
                <th className="w-[25%] px-2 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Khách hàng
                </th>
                <th className="w-[25%] px-2 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Phòng
                </th>
                <th className="w-[15%] px-2 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Tổng tiền
                </th>
                <th className="w-[15%] px-2 py-3 text-left text-xs font-semibold text-gray-700 uppercase rounded-tr-lg">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentBookings.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <FaClipboardList className="text-5xl text-gray-300 mb-3" />
                      <p className="text-lg font-medium">Chưa có đặt phòng nào</p>
                      <p className="text-sm">
                        Các đặt phòng mới sẽ hiển thị ở đây
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                recentBookings.slice(0, 10).map((booking) => (
                  <tr
                    key={booking._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-2 py-3">
                      <span className="font-mono font-semibold text-primary text-xs truncate block" title={booking.bookingCode}>
                        {booking.bookingCode}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                          {booking.userId?.name?.charAt(0)}
                        </div>
                        <span className="font-medium text-xs truncate" title={booking.userId?.name}>
                          {booking.userId?.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs text-gray-700 truncate" title={booking.roomId?.name}>
                        {booking.roomId?.name}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <span className="font-bold text-accent text-xs">
                        {formatPrice(booking.totalPrice)}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          booking.paymentStatus === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {booking.paymentStatus === 'paid'
                          ? '✓ Đã thanh toán'
                          : '⏳ Chờ thanh toán'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
