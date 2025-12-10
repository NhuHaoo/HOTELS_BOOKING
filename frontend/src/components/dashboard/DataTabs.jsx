import { useState } from 'react';
import { FaClipboardList, FaMoneyBillWave } from 'react-icons/fa';
import RecentBookingsTable from './RecentBookingsTable';
import SettlementTable from './SettlementTable';

const DataTabs = ({ bookings = [], settlements = [] }) => {
  const [activeTab, setActiveTab] = useState('bookings');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Tabs Header */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 ${
              activeTab === 'bookings'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FaClipboardList size={16} />
              <span>Đặt phòng gần đây</span>
              {bookings.length > 0 && (
                <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full font-medium">
                  {bookings.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('settlements')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 ${
              activeTab === 'settlements'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FaMoneyBillWave size={16} />
              <span>Đối soát thanh toán</span>
              {settlements.length > 0 && (
                <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full font-medium">
                  {settlements.length}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Tabs Content */}
      <div className="p-4">
        {activeTab === 'bookings' ? (
          <RecentBookingsTable bookings={bookings} />
        ) : (
          <SettlementTable settlements={settlements} />
        )}
      </div>
    </div>
  );
};

export default DataTabs;

