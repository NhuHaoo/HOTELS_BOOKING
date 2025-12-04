// frontend/src/router/AppRouter.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AdminLayout from '../layouts/AdminLayout';
import ManagerLayout from '../layouts/ManagerLayout';
import ProtectedRoute from '../components/ProtectedRoute';

// Manager Pages
import ManagerDashboard from '../pages/manager/ManagerDashboard';
import ManagerRooms from '../pages/manager/ManagerRooms';
import ManagerBookings from "../pages/manager/ManagerBookings";
import ManagerReviews from '../pages/manager/ManagerReviews';

// Public Pages
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import SearchResult from '../pages/SearchResult';
import RoomDetail from '../pages/RoomDetail';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import PaymentReturn from '../pages/PaymentReturn';
import PaymentSuccess from '../pages/PaymentSuccess';
import PaymentFailed from '../pages/PaymentFailed';
import MockPayment from '../pages/MockPayment';

// User Protected Pages
import Booking from '../pages/Booking';
import BookingDetail from '../pages/BookingDetail';
import Profile from '../pages/Profile';
import Favorites from '../pages/Favorites';
import ChangePassword from '../pages/ChangePassword';
import ReviewForm from '../pages/ReviewForm';

// Admin Pages
import Dashboard from '../pages/admin/Dashboard';
import Rooms from '../pages/admin/Rooms';
import Hotels from '../pages/admin/Hotels';
import Bookings from '../pages/admin/Bookings';
import Users from '../pages/admin/Users';
import Reviews from '../pages/admin/Reviews';
import Promotions from '../pages/admin/Promotions'; // 👈 THÊM DÒNG NÀY

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ===== PUBLIC ROUTES ===== */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/payment/return" element={<PaymentReturn />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/failed" element={<PaymentFailed />} />
        <Route path="/payment/mock" element={<MockPayment />} />

        {/* ===== MAIN LAYOUT (USER SIDE) ===== */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchResult />} />
          <Route path="/rooms/:id" element={<RoomDetail />} />

          {/* ---- USER PROTECTED ROUTES ---- */}
          <Route
            path="/booking"
            element={
              <ProtectedRoute>
                <Booking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings/:id"
            element={
              <ProtectedRoute>
                <BookingDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <Favorites />
              </ProtectedRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reviews/create"
            element={
              <ProtectedRoute>
                <ReviewForm />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* ===== ADMIN ROUTES ===== */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute adminOnly>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="hotels" element={<Hotels />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="users" element={<Users />} />
          <Route path="promotions" element={<Promotions />} /> {/* 👈 TRANG KM */}
        </Route>

        {/* ===== MANAGER ROUTES ===== */}
        <Route
          path="/manager/*"
          element={
            <ProtectedRoute managerOnly>
              <ManagerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ManagerDashboard />} />
          <Route path="dashboard" element={<ManagerDashboard />} />
          <Route path="rooms" element={<ManagerRooms />} />
          <Route path="bookings" element={<ManagerBookings />} />
          <Route path="reviews" element={<ManagerReviews />} />
        </Route>

        {/* ===== 404 ===== */}
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-background flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
                <p className="text-xl text-gray-600 mb-6">Trang không tồn tại</p>
                <a href="/" className="btn btn-primary">
                  Về trang chủ
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
