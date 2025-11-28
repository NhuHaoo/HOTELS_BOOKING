import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const ProtectedRoute = ({ children, adminOnly = false, managerOnly = false }) => {
  const { isAuthenticated, user } = useAuthStore();

  // 1. Chưa đăng nhập → yêu cầu login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. Nếu route yêu cầu Admin → chỉ Admin vào
  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // 3. Nếu route yêu cầu Manager → chỉ Manager vào
  if (managerOnly && user?.role !== 'manager') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
