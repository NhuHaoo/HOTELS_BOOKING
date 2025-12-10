import {
  FaDollarSign,
  FaTag,
  FaMoneyBillWave,
  FaChartLine,
  FaClock,
  FaUndo
} from 'react-icons/fa';
import { formatPrice } from '../../utils/formatPrice';

const StatsCards = ({ data }) => {
  const {
    grossRevenue = 0,
    promotionCost = 0,
    commissionRevenue = 0,
    netProfit = 0,
    pendingSettlement = 0,
    totalRefundAmount = 0
  } = data;

  const cards = [
    {
      title: 'Doanh thu gốc',
      value: formatPrice(grossRevenue),
      icon: FaDollarSign,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      description: 'Tổng doanh thu trước giảm giá'
    },
    {
      title: 'Chi phí khuyến mãi',
      value: formatPrice(promotionCost),
      icon: FaTag,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      description: 'Tổng chi phí giảm giá'
    },
    {
      title: 'Hoa hồng thu được',
      value: formatPrice(commissionRevenue),
      icon: FaMoneyBillWave,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      description: 'Tổng hoa hồng hệ thống'
    },
    {
      title: 'Lợi nhuận hệ thống',
      value: formatPrice(netProfit),
      icon: FaChartLine,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      description: 'Hoa hồng - Chi phí khuyến mãi + Phí đổi lịch'
    },
    {
      title: 'Số tiền chờ thanh toán',
      value: formatPrice(pendingSettlement),
      icon: FaClock,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      description: 'Tiền đang chờ trả khách sạn'
    },
    {
      title: 'Tổng tiền đã hoàn',
      value: formatPrice(totalRefundAmount),
      icon: FaUndo,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      description: 'Tổng tiền đã hoàn cho khách trong kỳ'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`${card.bgColor} rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 min-w-0 overflow-hidden`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`${card.iconColor} p-2 rounded-lg bg-white shadow-sm flex-shrink-0`}>
              <card.icon size={18} />
            </div>
            {/* Optional: Trend indicator - có thể thêm sau */}
            {card.trend && (
              <span className={`text-xs font-semibold ${card.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                {card.trend}
              </span>
            )}
          </div>
          <div className="mb-2 min-w-0">
            <p className="text-xs font-medium text-gray-600 mb-1.5 truncate">{card.title}</p>
            <p className="text-lg xl:text-xl font-bold text-gray-900 break-words leading-tight">{card.value}</p>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{card.description}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;

