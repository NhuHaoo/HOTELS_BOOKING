import { FaBrain, FaExclamationTriangle, FaLightbulb } from 'react-icons/fa';

const AIInsights = ({ data = {} }) => {
  // Chỉ tạo insights khi có dữ liệu
  const insights = [];

  // Insight 1: Promotion cost warning
  if (data.promotionPercent && data.promotionPercent > 50) {
    insights.push({
      type: 'warning',
      icon: FaExclamationTriangle,
      message: `Khuyến mãi tháng này chiếm ${data.promotionPercent}% hoa hồng. Đề xuất giảm discount để tối ưu lợi nhuận.`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    });
  }

  // Insight 2: Cancellation rate
  if (data.highCancellationRate && data.highCancellationHotel) {
    insights.push({
      type: 'info',
      icon: FaLightbulb,
      message: `Hotel ${data.highCancellationHotel} có tỷ lệ hủy cao (>15%). Cần xem xét chính sách hủy.`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    });
  } else if (data.promotionPercent !== undefined) {
    insights.push({
      type: 'info',
      icon: FaLightbulb,
      message: 'Tỷ lệ hủy đặt phòng đang ở mức ổn định.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    });
  }

  // Insight 3: Revenue growth
  if (data.revenueGrowth !== undefined && data.revenueGrowth !== null) {
    if (data.revenueGrowth > 0) {
      insights.push({
        type: 'success',
        icon: FaBrain,
        message: `Doanh thu tháng này tăng ${data.revenueGrowth}% so với tháng trước. Tiếp tục duy trì chiến lược hiện tại.`,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      });
    } else if (data.revenueGrowth < 0) {
      insights.push({
        type: 'warning',
        icon: FaExclamationTriangle,
        message: `Doanh thu tháng này giảm ${Math.abs(data.revenueGrowth)}% so với tháng trước. Cần xem xét lại chiến lược.`,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      });
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <FaBrain className="text-primary" size={18} />
        <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
      </div>
      
      {insights.length > 0 ? (
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`${insight.bgColor} ${insight.borderColor} border-l-4 p-4 rounded-r-lg`}
            >
              <div className="flex items-start gap-3">
                <insight.icon className={`${insight.color} mt-0.5 flex-shrink-0`} size={18} />
                <p className={`text-sm ${insight.color} font-medium`}>
                  {insight.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-[200px] text-gray-500">
          <p>Chưa có dữ liệu để phân tích</p>
        </div>
      )}
    </div>
  );
};

export default AIInsights;

