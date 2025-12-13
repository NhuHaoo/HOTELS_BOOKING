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
      <table className="w-full text-xs table-auto">
        <thead className="bg-gray-50">
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 px-2 font-semibold text-gray-700 text-[10px] uppercase">Mã settlement</th>
            <th className="text-left py-2 px-2 font-semibold text-gray-700 text-[10px] uppercase">Khách sạn</th>
            <th className="text-left py-2 px-2 font-semibold text-gray-700 text-[10px] uppercase">Kỳ đối soát</th>
            <th className="text-right py-2 px-2 font-semibold text-gray-700 text-[10px] uppercase">Tổng booking</th>
            <th className="text-right py-2 px-2 font-semibold text-gray-700 text-[10px] uppercase">Tổng doanh thu</th>
            <th className="text-right py-2 px-2 font-semibold text-gray-700 text-[10px] uppercase">Tổng hoa hồng</th>
            <th className="text-right py-2 px-2 font-semibold text-gray-700 text-[10px] uppercase">Số tiền chi trả</th>
            <th className="text-center py-2 px-2 font-semibold text-gray-700 text-[10px] uppercase">Trạng thái</th>
            <th className="text-center py-2 px-2 font-semibold text-gray-700 text-[10px] uppercase">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {settlements.map((settlement) => {
            const status = statusConfig[settlement.status] || statusConfig.pending;
            const totalRevenue = settlement.totalAmount + settlement.commissionAmount;

            return (
              <tr key={settlement._id} className="hover:bg-gray-50 transition-colors">
                <td className="py-2 px-2">
                  <span className="font-mono text-[10px] text-primary font-semibold">
                    {settlement._id.toString().slice(-8).toUpperCase()}
                  </span>
                </td>
                <td className="py-2 px-2">
                  <div className="flex items-center gap-1.5">
                    <FaHotel className="text-gray-400" size={12} />
                    <span className="text-gray-700 text-[11px]">{settlement.hotelId?.name || 'N/A'}</span>
                  </div>
                </td>
                <td className="py-2 px-2">
                  <div className="text-[11px] text-gray-600">
                    {formatDate(settlement.period?.startDate)} - {formatDate(settlement.period?.endDate)}
                  </div>
                </td>
                <td className="py-2 px-2 text-right">
                  <span className="font-medium text-gray-900 text-[11px]">{settlement.bookings?.length || 0}</span>
                </td>
                <td className="py-2 px-2 text-right">
                  <span className="font-medium text-gray-900 text-[11px]">{formatPrice(totalRevenue)}</span>
                </td>
                <td className="py-2 px-2 text-right">
                  <span className="font-semibold text-emerald-600 text-[11px]">
                    {formatPrice(settlement.commissionAmount || 0)}
                  </span>
                </td>
                <td className="py-2 px-2 text-right">
                  <span className="font-semibold text-blue-600 text-[11px]">
                    {formatPrice(settlement.totalAmount || 0)}
                  </span>
                </td>
                <td className="py-2 px-2 text-center">
                  <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </td>
                <td className="py-2 px-2 text-center">
                  <Link
                    to={`/admin/settlements/${settlement._id}`}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-600 hover:bg-gray-100 hover:text-primary transition-colors"
                    title="Xem chi tiết"
                  >
                    <FaEye size={12} />
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

