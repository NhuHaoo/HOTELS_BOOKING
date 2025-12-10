import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { formatPrice } from '../../utils/formatPrice';
import { FaChartLine } from 'react-icons/fa';

const RevenueChart = ({ data = [] }) => {
  // Transform data for chart
  const chartData = data.map((item) => ({
    name: `T${item._id?.month || 0}/${item._id?.year || 0}`,
    'Doanh thu gốc': item.totalRevenue || 0,
    'Hoa hồng': item.totalCommission || 0,
    'Lợi nhuận': item.actualProfit || 0
  }));

  // Chỉ hiển thị khi có dữ liệu
  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FaChartLine className="text-primary" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Phân tích doanh thu theo tháng</h3>
          </div>
        </div>
        <div className="flex items-center justify-center h-[350px] text-gray-500">
          <p>Chưa có dữ liệu</p>
        </div>
      </div>
    );
  }

  const displayData = chartData;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FaChartLine className="text-primary" size={20} />
          <h3 className="text-lg font-semibold text-gray-900">Phân tích doanh thu theo tháng</h3>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={displayData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `${(value / 1000000).toFixed(0)}tr`}
          />
          <Tooltip
            formatter={(value, name) => {
              return [formatPrice(value), name];
            }}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '10px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="Doanh thu gốc"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="Hoa hồng"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="Lợi nhuận"
            stroke="#f59e0b"
            strokeWidth={2.5}
            dot={{ fill: '#f59e0b', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;

