import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authAPI } from '../api/auth.api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaEnvelope, FaCheckCircle } from 'react-icons/fa';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Forgot password mutation
  const forgotMutation = useMutation({
    mutationFn: (email) => authAPI.forgotPassword(email),
    onSuccess: () => {
      setSubmitted(true);
      toast.success('Email đặt lại mật khẩu đã được gửi!');
    },
    onError: (error) => {
      toast.error(error.message || 'Gửi email thất bại');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      forgotMutation.mutate(email);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-12">
        <div className="container-custom max-w-md">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheckCircle className="text-green-500 text-3xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Kiểm tra email của bạn
            </h1>
            <p className="text-gray-600 mb-6">
              Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email{' '}
              <span className="font-semibold">{email}</span>
            </p>
            <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left text-sm">
              <p className="text-blue-900 mb-2">Không nhận được email?</p>
              <ul className="text-blue-800 space-y-1">
                <li>• Kiểm tra thư mục spam/rác</li>
                <li>• Đảm bảo email chính xác</li>
                <li>• Chờ vài phút và kiểm tra lại</li>
              </ul>
            </div>
            <button
              onClick={() => setSubmitted(false)}
              className="btn btn-primary w-full mb-3"
            >
              Gửi lại email
            </button>
            <Link to="/login" className="btn btn-outline w-full">
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12">
      <div className="container-custom max-w-md">
        <div className="card p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4">
              <FaEnvelope size={28} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quên mật khẩu?</h1>
            <p className="text-gray-600">
              Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="your.email@example.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={forgotMutation.isPending}
              className="w-full btn btn-primary"
            >
              {forgotMutation.isPending ? 'Đang gửi...' : 'Gửi email đặt lại'}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-primary hover:text-primary-dark">
              ← Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

