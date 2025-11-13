import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaHeart, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import { useState } from 'react';
import useAuthStore from '../store/useAuthStore';

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-gradient">
              🏨 HotelBooking
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-primary transition-colors">
              Trang chủ
            </Link>
            <Link to="/search" className="text-gray-700 hover:text-primary transition-colors">
              Tìm phòng
            </Link>
            {isAuthenticated && (
              <Link to="/favorites" className="text-gray-700 hover:text-primary transition-colors flex items-center space-x-1">
                <FaHeart className="text-red-500" />
                <span>Yêu thích</span>
              </Link>
            )}
          </nav>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                >
                  <FaUser />
                  <span>{user?.name}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 animate-fade-in">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Tài khoản của tôi
                    </Link>
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Quản trị
                      </Link>
                    )}
                    <hr className="my-2" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <FaSignOutAlt />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login" className="btn btn-outline">
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Đăng ký
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden text-gray-700 text-2xl"
          >
            {showMobileMenu ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden py-4 animate-fade-in border-t">
            <Link
              to="/"
              className="block py-2 text-gray-700 hover:text-primary"
              onClick={() => setShowMobileMenu(false)}
            >
              Trang chủ
            </Link>
            <Link
              to="/search"
              className="block py-2 text-gray-700 hover:text-primary"
              onClick={() => setShowMobileMenu(false)}
            >
              Tìm phòng
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to="/favorites"
                  className="block py-2 text-gray-700 hover:text-primary"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Yêu thích
                </Link>
                <Link
                  to="/profile"
                  className="block py-2 text-gray-700 hover:text-primary"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Tài khoản
                </Link>
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="block py-2 text-gray-700 hover:text-primary"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Quản trị
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left py-2 text-red-600"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block py-2 text-gray-700 hover:text-primary"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="block py-2 text-gray-700 hover:text-primary"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

