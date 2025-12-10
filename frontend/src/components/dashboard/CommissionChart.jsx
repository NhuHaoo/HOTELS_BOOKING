import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { formatPrice } from '../../utils/formatPrice';
import { FaChartBar } from 'react-icons/fa';

const CommissionChart = ({ summary = {} }) => {
  const {
    totalCommission = 0,
    totalDiscount = 0,
    totalRevenue = 0
  } = summary;

  const settlementAmount = totalRevenue - totalCommission;

  // Bar chart data
  const barData = [
    {
      name: 'Phân bổ',
      'Hoa hồng': totalCommission,
      'Chi phí khuyến mãi': totalDiscount,
      'Trả khách sạn': settlementAmount
    }
  ];

  // Pie chart data
  const pieData = [
    { name: 'Hoa hồng', value: totalCommission, color: '#10b981' },
    { name: 'Chi phí khuyến mãi', value: totalDiscount, color: '#f59e0b' },
    { name: 'Trả khách sạn', value: settlementAmount, color: '#3b82f6' }
  ].filter(item => item.value > 0); // Chỉ hiển thị các mục có giá trị > 0

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6'];

  // Nếu không có dữ liệu, hiển thị thông báo
  if (totalCommission === 0 && totalDiscount === 0 && settlementAmount === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <FaChartBar className="text-primary" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Phân bổ tài chính</h3>
          </div>
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            <p>Chưa có dữ liệu</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <FaChartBar className="text-primary" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Tỷ lệ phân bổ</h3>
          </div>
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            <p>Chưa có dữ liệu</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Bar Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <FaChartBar className="text-primary" size={20} />
          <h3 className="text-lg font-semibold text-gray-900">Phân bổ tài chính</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis dataKey="name" type="category" stroke="#6b7280" style={{ fontSize: '12px' }} width={80} />
            <Tooltip
              formatter={(value) => formatPrice(value)}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '10px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            />
            <Legend />
            <Bar dataKey="Hoa hồng" fill="#10b981" radius={[0, 8, 8, 0]} />
            <Bar dataKey="Chi phí khuyến mãi" fill="#f59e0b" radius={[0, 8, 8, 0]} />
            <Bar dataKey="Trả khách sạn" fill="#3b82f6" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <FaChartBar className="text-primary" size={20} />
          <h3 className="text-lg font-semibold text-gray-900">Tỷ lệ phân bổ</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatPrice(value)}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '10px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {pieData.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index] }}
                />
                <span className="text-gray-600">{item.name}</span>
              </div>
              <span className="font-semibold text-gray-900">{formatPrice(item.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommissionChart;

