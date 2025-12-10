import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../api/admin.api';
import Loading from '../../components/Loading';
import DashboardFilters from '../../components/dashboard/DashboardFilters';
import StatsCards from '../../components/dashboard/StatsCards';
import RevenueChart from '../../components/dashboard/RevenueChart';
import CommissionChart from '../../components/dashboard/CommissionChart';
import AIInsights from '../../components/dashboard/AIInsights';
import DataTabs from '../../components/dashboard/DataTabs';

const Dashboard = () => {
  // =============== FILTER STATE ===============
  // Khởi tạo với "Tháng này" làm mặc định
  const getDefaultFilters = () => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      hotelId: '',
      startDate: monthStart.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    };
  };

  const [filters, setFilters] = useState(getDefaultFilters());

  // Lấy danh sách khách sạn
  const { data: hotelsData } = useQuery({
    queryKey: ['admin-hotels'],
    queryFn: () => adminAPI.getHotels()
  });

  // Lấy dữ liệu dashboard
  const {
    data: dashboardData,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['admin-dashboard', filters],
    queryFn: () => adminAPI.getDashboard(filters)
  });

  // Lấy dữ liệu lợi nhuận
  const {
    data: profitData,
    isLoading: isLoadingProfit
  } = useQuery({
    queryKey: ['admin-profit', filters],
    queryFn: () => adminAPI.getProfit({ ...filters, groupBy: 'month' }),
    enabled: !!dashboardData
  });

  // Lấy danh sách bookings gần đây (chỉ 5 booking)
  const {
    data: bookingsData,
    isLoading: isLoadingBookings
  } = useQuery({
    queryKey: ['admin-bookings-recent', filters],
    queryFn: () => {
      // Chỉ truyền filters có giá trị
      const params = {
        limit: 5,
        page: 1
      };
      if (filters.hotelId) params.hotelId = filters.hotelId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      return adminAPI.getBookings(params);
    },
    enabled: !!dashboardData // Chỉ fetch khi dashboard data đã có
  });

  // Lấy danh sách settlements
  const {
    data: settlementsData
  } = useQuery({
    queryKey: ['admin-settlements', filters],
    queryFn: () => adminAPI.getSettlements({ 
      ...filters,
      limit: 20,
      page: 1
    })
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
  const profitSummary = profitData?.data?.summary || {};
  const profitChartData = profitData?.data?.profit || [];
  
  // Xử lý bookings data - kiểm tra nhiều cấu trúc response có thể
  const recentBookings = bookingsData?.data?.data || 
                        bookingsData?.data?.bookings || 
                        (Array.isArray(bookingsData?.data) ? bookingsData.data : []) ||
                        [];
  
  const settlements = settlementsData?.data?.settlements || 
                     settlementsData?.data?.data || 
                     (Array.isArray(settlementsData?.data) ? settlementsData.data : []) ||
                     [];

  // Tính toán dữ liệu cho StatsCards
  // Gross Revenue = Tổng doanh thu gốc (originalTotal) từ tất cả bookings đã thanh toán
  // Promotion Cost = Tổng chi phí khuyến mãi (discountAmount)
  // Commission Revenue = Tổng hoa hồng thu được
  // Net Profit = Commission - Promotion Cost + RescheduleFee
  // Pending Settlement = Tổng tiền đang chờ thanh toán cho khách sạn
  const rescheduleFee = profitSummary.totalRescheduleFee || 0;
  const totalRefundAmount = profitSummary.totalRefundAmount || 0;
  const statsData = {
    grossRevenue: profitSummary.totalRevenue || overview.totalRevenue || 0,
    promotionCost: profitSummary.totalDiscount || 0,
    commissionRevenue: profitSummary.totalCommission || 0,
    netProfit: profitSummary.actualProfit || ((profitSummary.totalCommission || 0) - (profitSummary.totalDiscount || 0) + rescheduleFee),
    pendingSettlement: settlements
      .filter(s => s.status === 'pending' || s.status === 'processing')
      .reduce((sum, s) => sum + (s.totalAmount || 0), 0),
    rescheduleFee: rescheduleFee,
    totalRefundAmount: totalRefundAmount
  };

  // Tính promotion percent cho AI Insights
  const promotionPercent = statsData.commissionRevenue > 0
    ? Math.round((statsData.promotionCost / statsData.commissionRevenue) * 100)
    : 0;

  // Tính revenue growth: so sánh tháng hiện tại với tháng trước
  let revenueGrowth = null;
  if (profitChartData && profitChartData.length >= 2) {
    const currentMonth = profitChartData[profitChartData.length - 1];
    const previousMonth = profitChartData[profitChartData.length - 2];
    const currentRevenue = currentMonth.totalRevenue || 0;
    const previousRevenue = previousMonth.totalRevenue || 0;
    
    if (previousRevenue > 0) {
      revenueGrowth = Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100);
    }
  }

  const aiInsightsData = {
    promotionPercent: promotionPercent > 0 ? promotionPercent : null,
    revenueGrowth,
    highCancellationRate: false,
    highCancellationHotel: null
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Thống kê</h1>
         
        </div>
      </div>

      {/* (A) Header Filters */}
      <DashboardFilters
        filters={filters}
        onFilterChange={setFilters}
        hotels={hotelsData?.data?.hotels || hotelsData?.data || []}
      />

      {/* (B) Summary Cards - 5 cards */}
      <StatsCards data={statsData} />

      {/* (C) Biểu đồ + AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart - 2 columns */}
        <div className="lg:col-span-2">
          <RevenueChart data={profitChartData} />
        </div>

        {/* AI Insights - 1 column */}
        <div className="lg:col-span-1">
          <AIInsights data={aiInsightsData} />
        </div>
      </div>

      {/* Commission Charts - Bar & Pie */}
      <CommissionChart summary={profitSummary} />

      {/* (D) Tabs dữ liệu */}
      <DataTabs
        bookings={recentBookings}
        settlements={settlements}
      />
    </div>
  );
};

export default Dashboard;
