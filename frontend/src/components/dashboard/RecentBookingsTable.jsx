import { formatPrice } from '../../utils/formatPrice';
import { formatDate } from '../../utils/dateUtils';
import { FaEye } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const RecentBookingsTable = ({ bookings = [] }) => {
  const statusConfig = {
    paid: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-800' },
    pending: { label: 'Chờ thanh toán', color: 'bg-yellow-100 text-yellow-800' },
    cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
    refunded: { label: 'Đã hoàn tiền', color: 'bg-blue-100 text-blue-800' }
  };

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Chưa có đặt phòng nào</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="overflow-x-hidden">
        <table className="w-full text-xs" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '7%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '7%' }} />
          </colgroup>
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-2 font-semibold text-gray-700 text-[10px] uppercase">Mã</th>
              <th className="text-left py-2 px-2 font-semibold text-gray-700 text-[10px] uppercase">Khách hàng</th>
              <th className="text-left py-2 px-2 font-semibold text-gray-700 text-[10px] uppercase">Khách sạn</th>
              <th className="text-right py-2 px-2 font-semibold text-gray-700 text-[10px] uppercase">Giá gốc</th>
              <th className="text-right py-2 px-2 font-semibold text-gray-700 text-[10px] uppercase">KM</th>
              <th className="text-right py-2 px-2 font-semibold text-gray-700 text-[10px] uppercase">Thanh toán</th>
              <th className="text-right py-2 px-2 font-semibold text-gray-700 text-[10px] uppercase">Hoa hồng</th>
              <th className="text-right py-2 px-2 font-semibold text-gray-700 text-[10px] uppercase">Phí đổi lịch</th>
              <th className="text-right py-2 px-2 font-semibold text-gray-700 text-[10px] uppercase">Trả KS</th>
              <th className="text-center py-2 px-2 font-semibold text-gray-700 text-[10px] uppercase">TT</th>
              <th className="text-center py-2 px-2 font-semibold text-gray-700 text-[10px] uppercase"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.map((booking) => {
              const originalTotal = booking.originalTotal || booking.totalPrice || 0;
              const discountAmount = booking.discountAmount || 0;
              const customerPaid = booking.totalAmount || booking.finalTotal || originalTotal - discountAmount;
              const commission = booking.commission?.amount || 0;
              const settlement = booking.settlement?.amount || (originalTotal - commission);
              const rescheduleFee = booking.rescheduleFee || 0;
              const status = statusConfig[booking.paymentStatus] || statusConfig.pending;

              return (
                <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-2 px-2">
                    <span className="font-mono text-[10px] text-primary font-semibold">
                      {booking.bookingCode?.slice(-8) || 'N/A'}
                    </span>
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0">
                        {booking.userId?.name?.charAt(0) || 'U'}
                      </div>
                      <span className="text-gray-700 text-[11px] truncate max-w-[100px]">{booking.userId?.name || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <div className="max-w-[120px]">
                      <div className="font-medium text-gray-900 text-[11px] truncate">{booking.hotelId?.name || 'N/A'}</div>
                      <div className="text-[10px] text-gray-500 truncate">{booking.roomId?.name || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="py-2 px-2 text-right">
                    <span className="font-medium text-gray-900 text-[11px] whitespace-nowrap">{formatPrice(originalTotal)}</span>
                  </td>
                  <td className="py-2 px-2 text-right">
                    <span className="text-orange-600 font-medium text-[11px] whitespace-nowrap">
                      {discountAmount > 0 ? `-${formatPrice(discountAmount)}` : '-'}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right">
                    <span className="font-semibold text-green-600 text-[11px] whitespace-nowrap">{formatPrice(customerPaid)}</span>
                  </td>
                  <td className="py-2 px-2 text-right">
                    <span className="font-semibold text-emerald-600 text-[11px] whitespace-nowrap">{formatPrice(commission)}</span>
                  </td>
                  <td className="py-2 px-2 text-right">
                    <span className="font-semibold text-purple-600 text-[11px] whitespace-nowrap">
                      {rescheduleFee > 0 ? formatPrice(rescheduleFee) : '-'}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right">
                    <span className="font-semibold text-blue-600 text-[11px] whitespace-nowrap">{formatPrice(settlement)}</span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <Link
                      to={`/admin/bookings/${booking._id}`}
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
    </div>
  );
};

export default RecentBookingsTable;

