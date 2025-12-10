import { formatPrice } from '../../utils/formatPrice';
import { formatDate } from '../../utils/dateUtils';
import { FaEye, FaHotel } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const SettlementTable = ({ settlements = [] }) => {
  const statusConfig = {
    pending: { label: 'Chờ thanh toán', color: 'bg-yellow-100 text-yellow-800' },
    processing: { label: 'Đang xử lý', color: 'bg-blue-100 text-blue-800' },
    paid: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800' }
  };

  if (settlements.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Chưa có đối soát thanh toán nào</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm table-auto">
        <thead className="bg-gray-50">
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase">Mã settlement</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase">Khách sạn</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase">Kỳ đối soát</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700 text-xs uppercase">Tổng booking</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700 text-xs uppercase">Tổng doanh thu</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700 text-xs uppercase">Tổng hoa hồng</th>
            <th className="text-right py-3 px-4 font-semibold text-gray-700 text-xs uppercase">Số tiền chi trả</th>
            <th className="text-center py-3 px-4 font-semibold text-gray-700 text-xs uppercase">Trạng thái</th>
            <th className="text-center py-3 px-4 font-semibold text-gray-700 text-xs uppercase">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {settlements.map((settlement) => {
            const status = statusConfig[settlement.status] || statusConfig.pending;
            const totalRevenue = settlement.totalAmount + settlement.commissionAmount;

            return (
              <tr key={settlement._id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4">
                  <span className="font-mono text-xs text-primary font-semibold">
                    {settlement._id.toString().slice(-8).toUpperCase()}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <FaHotel className="text-gray-400" size={14} />
                    <span className="text-gray-700">{settlement.hotelId?.name || 'N/A'}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-sm text-gray-600">
                    {formatDate(settlement.period?.startDate)} - {formatDate(settlement.period?.endDate)}
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="font-medium text-gray-900">{settlement.bookings?.length || 0}</span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="font-medium text-gray-900">{formatPrice(totalRevenue)}</span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="font-semibold text-emerald-600">
                    {formatPrice(settlement.commissionAmount || 0)}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="font-semibold text-blue-600">
                    {formatPrice(settlement.totalAmount || 0)}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <Link
                    to={`/admin/settlements/${settlement._id}`}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-md text-gray-600 hover:bg-gray-100 hover:text-primary transition-colors"
                    title="Xem chi tiết"
                  >
                    <FaEye size={14} />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SettlementTable;

