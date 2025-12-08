import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaExclamationCircle, FaTimes } from 'react-icons/fa';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { isValidEmail } from '../utils/validation';

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const result = await login(formData);
    
    if (result.success) {
      toast.success('Đăng nhập thành công!');

      // 🔥 LẤY USER HIỆN TẠI TRONG STORE SAU KHI LOGIN
      const currentUser = useAuthStore.getState().user;

      // 🔥 ĐIỀU HƯỚNG THEO ROLE
      if (currentUser?.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (currentUser?.role === 'manager') {
        navigate('/manager/dashboard');
      } else {
        navigate('/');
      }

    } else {
      // Show error dialog instead of toast
      setErrorMessage(
        result.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.'
      );
      setShowErrorDialog(true);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: '',
      });
    }
  };

  const closeErrorDialog = () => {
    setShowErrorDialog(false);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">
            🏨 Hotel Booking
          </h1>
          <p className="text-gray-600">Đăng nhập vào tài khoản của bạn</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
                className={`input pl-10 ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                required
              />
            </div>
            {errors.email && (
              <div className="flex items-center mt-1 text-red-500 text-sm">
                <FaExclamationCircle className="mr-1" />
                {errors.email}
              </div>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mật khẩu <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`input pl-10 pr-10 ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.password && (
              <div className="flex items-center mt-1 text-red-500 text-sm">
                <FaExclamationCircle className="mr-1" />
                {errors.password}
              </div>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm text-primary hover:text-primary-dark"
            >
              Quên mật khẩu?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn btn-primary py-3"
          >
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>

          {/* Demo Accounts */}
          <div className="bg-gray-50 p-4 rounded-lg">
          {/*   <p className="text-sm text-gray-600 mb-2 font-semibold">Tài khoản demo:</p>
            <p className="text-xs text-gray-500">Admin: admin@example.com / admin123</p>
            <p className="text-xs text-gray-500">User: user1@example.com / password123</p> */}
          </div>
        </form>

        {/* Register Link */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-primary hover:text-primary-dark font-semibold">
            Đăng ký ngay
          </Link>
        </p>

        {/* Back to Home */}
        <div className="text-center mt-4">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Về trang chủ
          </Link>
        </div>
      </div>

      {/* Error Dialog */}
      {showErrorDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-3">
                  <FaExclamationCircle className="text-red-500 text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Đăng nhập thất bại</h3>
              </div>
              <button
                onClick={closeErrorDialog}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            {/* Message */}
            <div className="mb-6">
              <p className="text-gray-600 leading-relaxed">{errorMessage}</p>
            </div>

            {/* Suggestions */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-2">Gợi ý:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Kiểm tra lại email và mật khẩu</li>
                <li>• Đảm bảo không có khoảng trắng thừa</li>
                <li>• Thử sử dụng tài khoản demo bên dưới</li>
              </ul>
            </div>

            {/* Action Button */}
            <button
              onClick={closeErrorDialog}
              className="w-full btn btn-primary py-3"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
