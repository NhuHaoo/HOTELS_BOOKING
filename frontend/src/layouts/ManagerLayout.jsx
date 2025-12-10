import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FaHotel,
  FaClipboardList,
  FaStar,
  FaChartBar,
  FaBars,
  FaTimes,
  FaBuilding,
  FaMoneyBillWave
} from 'react-icons/fa';
import { useState } from 'react';
import useAuthStore from '../store/useAuthStore';

const ManagerLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/manager/dashboard', icon: FaChartBar, label: 'Tổng quan' },
    { path: '/manager/hotel', icon: FaBuilding, label: 'Thông tin khách sạn' },
    { path: '/manager/rooms', icon: FaHotel, label: 'Phòng của tôi' },
    { path: '/manager/bookings', icon: FaClipboardList, label: 'Đặt phòng' },
    { path: '/manager/settlements', icon: FaMoneyBillWave, label: 'Thanh toán' },
    { path: '/manager/reviews', icon: FaStar, label: 'Đánh giá' },
  ];

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-primary to-primary-dark text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 flex items-center justify-between border-b border-white/10">
            <Link to="/manager/dashboard" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <FaHotel className="text-2xl" />
              </div>
              <div>
                <p className="font-bold text-lg">Manager Panel</p>
                <p className="text-xs text-white/70">Hotel Manager</p>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white"
            >
              <FaTimes size={20} />
            </button>
          </div>

          {/* Menu */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    active
                      ? 'bg-white text-primary shadow-lg transform scale-105'
                      : 'hover:bg-white/10 text-white'
                  }`}
                >
                  <item.icon
                    className={active ? 'text-primary' : 'text-white/80'}
                    size={20}
                  />
                  <span className="font-medium">{item.label}</span>
                  {active && (
                    <div className="ml-auto w-2 h-2 bg-accent rounded-full animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User info + Logout */}
          <div className="p-4 border-t border-white/10">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-3">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold">
                    {user?.name?.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{user?.name}</p>
                  <p className="text-xs text-white/70 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70">Vai trò:</span>
                <span className="bg-accent text-white px-2 py-1 rounded font-semibold">
                  MANAGER
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
            >
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-screen">
        {/* Top bar */}
        <header className="bg-white shadow-sm h-16 flex items-center px-4 lg:px-6 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-600 hover:text-primary mr-4"
          >
            <FaBars size={20} />
          </button>
          <div>
            <h1 className="text-lg lg:text-xl font-bold text-gray-800">
              Quản lý khách sạn
            </h1>
            <p className="text-xs text-gray-500 hidden sm:block">
              Chào {user?.name}, đây là khu vực quản lý khách sạn của bạn.
            </p>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ManagerLayout;
