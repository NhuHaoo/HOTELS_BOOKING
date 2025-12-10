import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../api/admin.api';
import Loading from '../../components/Loading';
import {
  FaDollarSign,
  FaCalendarAlt,
  FaHotel,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaEye,
  FaMoneyBillWave,
  FaFileInvoiceDollar
} from 'react-icons/fa';
import { formatPrice } from '../../utils/formatPrice';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/dateUtils';

const Settlements = () => {
  const [filters, setFilters] = useState({
    status: '',
    hotelId: '',
    page: 1,
    limit: 10
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [createForm, setCreateForm] = useState({
    hotelId: '',
    startDate: '',
    endDate: ''
  });
  const [payForm, setPayForm] = useState({
    transactionId: '',
    notes: ''
  });

  const queryClient = useQueryClient();

  // Lấy danh sách khách sạn
  const { data: hotelsData } = useQuery({
    queryKey: ['admin-hotels'],
    queryFn: () => adminAPI.getHotels()
  });

  // Lấy danh sách settlements
  const {
    data: settlementsData,
    isLoading,
    isError
  } = useQuery({
    queryKey: ['admin-settlements', filters],
    queryFn: () => adminAPI.getSettlements(filters)
  });

  // Mutation tạo settlement
  const createMutation = useMutation({
    mutationFn: (data) => adminAPI.createSettlement(data),
    onSuccess: () => {
      toast.success('Tạo thanh toán thành công');
      setShowCreateModal(false);
      setCreateForm({ hotelId: '', startDate: '', endDate: '' });
      // Invalidate cả admin và manager queries để đồng bộ
      queryClient.invalidateQueries(['admin-settlements']);
      queryClient.invalidateQueries(['manager-settlements']);
      queryClient.invalidateQueries(['manager-pending-settlement']);
    },
    onError: (error) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Tạo thanh toán thất bại';
      toast.error(errorMessage);
      console.error('Create settlement error:', error);
    }
  });

  // Mutation thanh toán settlement
  const payMutation = useMutation({
    mutationFn: ({ id, data }) => adminAPI.paySettlement(id, data),
    onSuccess: () => {
      toast.success('Thanh toán thành công');
      setShowPayModal(false);
      setSelectedSettlement(null);
      setPayForm({ transactionId: '', notes: '' });
      // Invalidate cả admin và manager queries để đồng bộ
      queryClient.invalidateQueries(['admin-settlements']);
      queryClient.invalidateQueries(['manager-settlements']);
      queryClient.invalidateQueries(['manager-pending-settlement']);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Thanh toán thất bại');
    }
  });

  const handleCreate = (e) => {
    e.preventDefault();
    createMutation.mutate(createForm);
  };

  const handlePay = (e) => {
    e.preventDefault();
    if (!selectedSettlement) return;
    payMutation.mutate({
      id: selectedSettlement._id,
      data: payForm
    });
  };

  const openPayModal = (settlement) => {
    setSelectedSettlement(settlement);
    setShowPayModal(true);
  };

  const statusConfig = {
    pending: { label: 'Chờ thanh toán', color: 'bg-yellow-100 text-yellow-800', icon: FaClock },
    processing: { label: 'Đang xử lý', color: 'bg-blue-100 text-blue-800', icon: FaClock },
    paid: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-800', icon: FaCheckCircle },
    cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800', icon: FaTimesCircle }
  };

  if (isLoading) return <Loading fullScreen />;

  const settlements = settlementsData?.data?.settlements || [];
  const pagination = settlementsData?.data?.pagination || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Thanh toán</h1>
          <p className="text-gray-600">Quản lý thanh toán cho các khách sạn</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary mt-4 md:mt-0"
        >
          <FaFileInvoiceDollar className="mr-2" />
          Tạo thanh toán
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Khách sạn
            </label>
            <select
              value={filters.hotelId}
              onChange={(e) => setFilters({ ...filters, hotelId: e.target.value, page: 1 })}
              className="input"
            >
              <option value="">Tất cả</option>
              {hotelsData?.data?.map((hotel) => (
                <option key={hotel._id} value={hotel._id}>
                  {hotel.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Settlements Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Khách sạn
                </th>
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
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {settlements.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    Không có thanh toán nào
                  </td>
                </tr>
              ) : (
                settlements.map((settlement) => {
                  const StatusIcon = statusConfig[settlement.status]?.icon || FaClock;
                  return (
                    <tr key={settlement._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <FaHotel className="mr-2 text-gray-400" />
                          <span className="font-medium">
                            {settlement.hotelId?.name || 'N/A'}
                          </span>
                        </div>
                      </td>
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
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => window.open(`/admin/settlements/${settlement._id}`, '_blank')}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                            title="Xem chi tiết"
                          >
                            Xem
                          </button>
                          {settlement.status === 'pending' && (
                            <>
                              <span className="text-gray-400">/</span>
                              <button
                                onClick={() => openPayModal(settlement)}
                                className="text-green-600 hover:text-green-800 font-medium text-sm"
                                title="Thanh toán"
                              >
                                Thanh toán
                              </button>
                            </>
                          )}
                        </div>
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
              >
                Trước
              </button>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page >= pagination.pages}
                className="btn btn-sm btn-outline"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Settlement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Tạo thanh toán</h2>
            <form onSubmit={handleCreate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Khách sạn *
                  </label>
                  <select
                    value={createForm.hotelId}
                    onChange={(e) => setCreateForm({ ...createForm, hotelId: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Chọn khách sạn</option>
                    {hotelsData?.data?.map((hotel) => (
                      <option key={hotel._id} value={hotel._id}>
                        {hotel.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày bắt đầu *
                  </label>
                  <input
                    type="date"
                    value={createForm.startDate}
                    onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày kết thúc *
                  </label>
                  <input
                    type="date"
                    value={createForm.endDate}
                    onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateForm({ hotelId: '', startDate: '', endDate: '' });
                  }}
                  className="btn btn-outline"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Đang tạo...' : 'Tạo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Settlement Modal */}
      {showPayModal && selectedSettlement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Thanh toán</h2>
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Khách sạn:</strong> {selectedSettlement.hotelId?.name}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Số tiền:</strong>{' '}
                <span className="font-semibold text-green-600">
                  {formatPrice(selectedSettlement.totalAmount || 0)}
                </span>
              </p>
            </div>
            <form onSubmit={handlePay}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã giao dịch
                  </label>
                  <input
                    type="text"
                    value={payForm.transactionId}
                    onChange={(e) => setPayForm({ ...payForm, transactionId: e.target.value })}
                    className="input"
                    placeholder="Nhập mã giao dịch chuyển khoản"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <textarea
                    value={payForm.notes}
                    onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                    className="input"
                    rows="3"
                    placeholder="Ghi chú (tùy chọn)"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowPayModal(false);
                    setSelectedSettlement(null);
                    setPayForm({ transactionId: '', notes: '' });
                  }}
                  className="btn btn-outline"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={payMutation.isPending}
                >
                  {payMutation.isPending ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settlements;

