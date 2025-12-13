import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { managerAPI } from '../../api/manager.api';
import Loading from '../../components/Loading';
import {
  FaDollarSign,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaEye,
  FaMoneyBillWave,
  FaSync
} from 'react-icons/fa';
import { formatPrice } from '../../utils/formatPrice';
import { formatDate } from '../../utils/dateUtils';

const ManagerSettlements = () => {
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 10
  });

  const queryClient = useQueryClient();

  // Lấy số tiền đang chờ thanh toán (auto-refresh mỗi 10 giây để đồng bộ nhanh hơn)
  const { 
    data: pendingData, 
    isLoading: isLoadingPending,
    isError: isErrorPending,
    error: errorPending,
    refetch: refetchPending
  } = useQuery({
    queryKey: ['manager-pending-settlement'],
    queryFn: () => managerAPI.getPendingSettlement(),
    refetchInterval: 10000, // Tự động refresh mỗi 10 giây để đồng bộ nhanh hơn
    retry: 1
  });

  // Lấy danh sách settlements (auto-refresh mỗi 10 giây để đồng bộ nhanh hơn)
  const {
    data: settlementsData,
    isLoading,
    isError,
    error,
    refetch: refetchSettlements
  } = useQuery({
    queryKey: ['manager-settlements', filters],
    queryFn: () => managerAPI.getSettlements(filters),
    refetchInterval: 10000, // Tự động refresh mỗi 10 giây để đồng bộ nhanh hơn
    retry: 1
  });

  // Hàm refresh thủ công
  const handleRefresh = async () => {
    await Promise.all([refetchPending(), refetchSettlements()]);
  };

  const statusConfig = {
    pending: { label: 'Chờ thanh toán', color: 'bg-yellow-100 text-yellow-800', icon: FaClock },
    processing: { label: 'Đang xử lý', color: 'bg-blue-100 text-blue-800', icon: FaClock },
    paid: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-800', icon: FaCheckCircle },
    cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800', icon: FaTimesCircle }
  };

  if (isLoading || isLoadingPending) return <Loading fullScreen />;

  // Hiển thị lỗi nếu có
  if (isError || isErrorPending) {
    return (
      <div className="space-y-6">
        <div className="card p-6 bg-red-50 border-2 border-red-200">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Lỗi tải dữ liệu</h2>
          <p className="text-red-600">
            {error?.response?.data?.message || errorPending?.response?.data?.message || 'Không thể tải dữ liệu thanh toán. Vui lòng thử lại sau.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 btn btn-outline"
            aria-label="Tải lại trang"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }

  const settlements = settlementsData?.data?.settlements || [];
  const pagination = settlementsData?.data?.pagination || {};
  const pendingAmount = pendingData?.data?.totalPending || 0;
  const pendingCount = pendingData?.data?.bookingCount || 0;

  // Debug logging
  console.log('🔍 Manager Settlements State:', {
    isLoading,
    isError,
    error: error?.response?.data || error,
    settlementsData,
    settlementsDataStructure: {
      hasSuccess: !!settlementsData?.success,
      hasData: !!settlementsData?.data,
      hasSettlements: !!settlementsData?.data?.settlements,
      settlementsArray: settlementsData?.data?.settlements,
      settlementsCount: settlements.length
    },
    settlements,
    pendingData,
    pendingAmount,
    pendingCount
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Thanh toán</h1>
          <p className="text-gray-600">Xem lịch sử thanh toán của khách sạn</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading || isLoadingPending}
          className="btn btn-outline mt-4 md:mt-0"
          aria-label="Làm mới dữ liệu"
          title="Làm mới dữ liệu (Tự động refresh mỗi 10 giây)"
        >
          <FaSync className={`mr-2 ${(isLoading || isLoadingPending) ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Pending Amount Card */}
      <div className="card p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              Số tiền đang chờ thanh toán
            </h2>
            <p className="text-3xl font-bold text-yellow-700 mb-1">
              {formatPrice(pendingAmount)}
            </p>
            <p className="text-sm text-gray-600">
              Từ {pendingCount} đặt phòng đã trả phòng
            </p>
          </div>
          <div className="text-6xl text-yellow-200">
            <FaMoneyBillWave />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="input"
            >
              <option value="">Tất cả</option>
              <option value="pending">Chờ thanh toán</option>
              <option value="processing">Đang xử lý</option>
              <option value="paid">Đã thanh toán</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Settlements Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Kỳ thanh toán
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Số booking
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tổng tiền phải trả KS
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ngày thanh toán
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {settlements.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    {isLoading ? 'Đang tải...' : 'Không có thanh toán nào'}
                  </td>
                </tr>
              ) : (
                settlements.map((settlement) => {
                  const StatusIcon = statusConfig[settlement.status]?.icon || FaClock;
                  return (
                    <tr key={settlement._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="flex items-center">
                          <FaCalendarAlt className="mr-2 text-gray-400" />
                          <span>
                            {formatDate(settlement.period?.startDate)} - {formatDate(settlement.period?.endDate)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {settlement.bookings?.length || 0} booking
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-green-600">
                          {formatPrice(settlement.totalAmount || 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            statusConfig[settlement.status]?.color || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <StatusIcon className="mr-1" size={12} />
                          {statusConfig[settlement.status]?.label || settlement.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {settlement.paidAt ? formatDate(settlement.paidAt) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => window.open(`/manager/settlements/${settlement._id}`, '_blank')}
                          className="btn btn-sm btn-outline"
                          title="Xem chi tiết"
                          aria-label="Xem chi tiết thanh toán"
                        >
                          <FaEye size={14} aria-hidden="true" />
                          <span className="sr-only">Xem chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Trang {pagination.page} / {pagination.pages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page <= 1}
                className="btn btn-sm btn-outline"
                aria-label="Trang trước"
              >
                Trước
              </button>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page >= pagination.pages}
                className="btn btn-sm btn-outline"
                aria-label="Trang sau"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerSettlements;

