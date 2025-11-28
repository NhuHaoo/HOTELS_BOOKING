import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Loading from "../../components/Loading";
import toast from "react-hot-toast";
import {
  FaSearch,
  FaEye,
  FaTimes,
  FaCheck,
  FaFilter,
  FaCalendar,
  FaUser,
  FaHotel,
  FaDollarSign,
  FaCheckCircle,
  FaBan,
  FaClock,
  FaSyncAlt
} from "react-icons/fa";
import { formatPrice } from "../../utils/formatPrice";
import { formatDate, calculateNights } from "../../utils/dateUtils";
import { BOOKING_STATUS, PAYMENT_STATUS } from "../../utils/constants";
import useAuthStore from "../../store/useAuthStore";
import axios from "axios";

// base URL an toàn
const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:2409/api";

const ManagerBookings = () => {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // ===== Fetch bookings (manager only) =====
  const { data: bookingsData, isLoading, isError, error } = useQuery({
    queryKey: ["manager-bookings", page, searchTerm, filterStatus, filterPaymentStatus],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/manager/bookings`, {
        params: {
          page,
          limit: 15,
          search: searchTerm || undefined,
          bookingStatus: filterStatus || undefined,
          paymentStatus: filterPaymentStatus || undefined
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: !!token,
    keepPreviousData: true
  });

  // ===== Update status (manager) =====
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await axios.put(
        `${API_BASE}/manager/bookings/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success("Cập nhật trạng thái thành công!");
      queryClient.invalidateQueries(["manager-bookings"]);
      setSelectedBooking(null);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Cập nhật thất bại");
    }
  });

  // ===== Cancel booking (manager) =====
  const cancelMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axios.put(
        `${API_BASE}/manager/bookings/${id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success("Hủy đặt phòng thành công!");
      queryClient.invalidateQueries(["manager-bookings"]);
      setSelectedBooking(null);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Hủy đặt phòng thất bại");
    }
  });

  const handleCancelBooking = (id) => {
    if (window.confirm("Bạn có chắc muốn hủy đặt phòng này?")) {
      cancelMutation.mutate(id);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus("");
    setFilterPaymentStatus("");
    setPage(1);
  };

  const activeFiltersCount =
    (searchTerm ? 1 : 0) +
    (filterStatus ? 1 : 0) +
    (filterPaymentStatus ? 1 : 0);

  // ===== Quick stats (chỉ dựa trên page hiện tại cho nhẹ) =====
  const stats = [
    {
      label: "Tổng đặt phòng",
      value: bookingsData?.total || 0,
      icon: FaCalendar,
      gradient: "from-blue-500 to-blue-600"
    },
    {
      label: "Chờ xử lý",
      value:
        bookingsData?.data?.filter(
          (b) => b.bookingStatus === "pending" || b.bookingStatus === "confirmed"
        ).length || 0,
      icon: FaClock,
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      label: "Đã hoàn thành",
      value:
        bookingsData?.data?.filter((b) => b.bookingStatus === "checked-out" || b.bookingStatus === "completed")
          .length || 0,
      icon: FaCheckCircle,
      gradient: "from-green-500 to-green-600"
    },
    {
      label: "Đã hủy",
      value:
        bookingsData?.data?.filter((b) => b.bookingStatus === "cancelled").length ||
        0,
      icon: FaBan,
      gradient: "from-red-500 to-red-600"
    }
  ];

  if (isLoading) return <Loading fullScreen />;

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-2">❌ Lỗi tải bookings</p>
          <p className="text-gray-600 text-sm">
            {error?.response?.data?.message || error?.message || "Vui lòng thử lại"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ===== Header ===== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quản lý đặt phòng
          </h1>
          <p className="text-gray-600">
            Tổng số:{" "}
            <span className="font-semibold text-primary">
              {bookingsData?.total || 0}
            </span>{" "}
            đặt phòng
          </p>
        </div>

        <button
          onClick={() => queryClient.invalidateQueries(["manager-bookings"])}
          className="btn btn-outline mt-3 md:mt-0 flex items-center gap-2"
        >
          <FaSyncAlt />
          Làm mới
        </button>
      </div>

      {/* ===== Quick stats ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`relative overflow-hidden bg-gradient-to-br ${stat.gradient} rounded-lg shadow-md hover:shadow-lg transition-all duration-300`}
          >
            <div className="p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <stat.icon size={24} className="opacity-80" />
                <span className="text-2xl font-bold">{stat.value}</span>
              </div>
              <p className="text-white/90 text-sm font-medium">{stat.label}</p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30" />
          </div>
        ))}
      </div>

      {/* ===== Filters ===== */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FaFilter className="text-primary" />
            <h3 className="font-semibold">Bộ lọc</h3>
            {activeFiltersCount > 0 && (
              <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </div>
          <div className="flex space-x-2">
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Xóa bộ lọc
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden text-primary"
            >
              {showFilters ? "Ẩn" : "Hiện"}
            </button>
          </div>
        </div>

        <div
          className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${
            showFilters ? "block" : "hidden md:grid"
          }`}
        >
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo mã hoặc tên khách..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="input pl-10 w-full"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="input w-full"
          >
            <option value="">Tất cả trạng thái đặt phòng</option>
            {Object.entries(BOOKING_STATUS).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>

          <select
            value={filterPaymentStatus}
            onChange={(e) => {
              setFilterPaymentStatus(e.target.value);
              setPage(1);
            }}
            className="input w-full"
          >
            <option value="">Tất cả trạng thái thanh toán</option>
            {Object.entries(PAYMENT_STATUS).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ===== Bookings Table ===== */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-primary/10 to-primary/5">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase rounded-tl-lg">
                  Mã đặt phòng
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Khách hàng
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Phòng
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Ngày ở
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Tổng tiền
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase rounded-tr-lg">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {bookingsData?.data?.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <FaCalendar size={48} className="mb-4 text-gray-300" />
                      <p className="text-lg font-semibold mb-1">
                        Không có đặt phòng nào
                      </p>
                      <p className="text-sm">
                        Thử thay đổi bộ lọc hoặc tìm kiếm khác
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                bookingsData?.data?.map((booking) => (
                  <tr
                    key={booking._id}
                    className="hover:bg-blue-50/50 transition-colors"
                  >
                    {/* booking code */}
                    <td className="px-4 py-4">
                      <div className="font-mono text-sm font-bold text-primary">
                        {booking.bookingCode || booking._id}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center mt-1">
                        <FaClock className="mr-1" size={10} />
                        {formatDate(booking.createdAt)}
                      </div>
                    </td>

                    {/* guest */}
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white font-bold">
                          {booking.guestName?.charAt(0) ||
                            booking.userId?.name?.charAt(0) ||
                            "?"}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">
                            {booking.guestName || booking.userId?.name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {booking.guestEmail || booking.userId?.email}
                          </div>
                          <div className="text-xs text-gray-600">
                            {booking.guestPhone || booking.userId?.phone}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* room */}
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={
                            booking.roomId?.images?.[0] || "/placeholder.jpg"
                          }
                          alt={booking.roomId?.name}
                          className="w-16 h-16 object-cover rounded-lg shadow-sm"
                        />
                        <div>
                          <div className="font-semibold text-sm flex items-center">
                            <FaHotel
                              className="mr-1 text-primary"
                              size={12}
                            />
                            {booking.roomId?.name}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {booking.hotelId?.name}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* dates */}
                    <td className="px-4 py-4">
                      <div className="text-sm space-y-1">
                        <div className="flex items-center text-gray-700">
                          <FaCalendar
                            className="mr-2 text-green-500"
                            size={12}
                          />
                          <span className="font-medium">
                            {formatDate(booking.checkIn)}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <FaCalendar
                            className="mr-2 text-red-500"
                            size={12}
                          />
                          <span className="font-medium">
                            {formatDate(booking.checkOut)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          <span className="font-semibold">
                            {calculateNights(
                              booking.checkIn,
                              booking.checkOut
                            )}
                          </span>{" "}
                          đêm • <FaUser className="inline ml-1 mr-1" size={10} />
                          {booking.guests} khách
                        </div>
                      </div>
                    </td>

                    {/* total price */}
                    <td className="px-4 py-4">
                      <div className="font-bold text-lg text-accent flex items-center">
                        <FaDollarSign className="mr-1" size={14} />
                        {formatPrice(booking.totalPrice)}
                      </div>
                    </td>

                    {/* status badges */}
                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            booking.bookingStatus === "confirmed"
                              ? "bg-blue-100 text-blue-800"
                              : booking.bookingStatus === "checked-in"
                              ? "bg-green-100 text-green-800"
                              : booking.bookingStatus === "checked-out" ||
                                booking.bookingStatus === "completed"
                              ? "bg-gray-100 text-gray-800"
                              : booking.bookingStatus === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {BOOKING_STATUS[booking.bookingStatus]?.label ||
                            booking.bookingStatus}
                        </span>
                        <br />
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            booking.paymentStatus === "paid"
                              ? "bg-green-100 text-green-800"
                              : booking.paymentStatus === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {booking.paymentStatus === "paid" ? "✓" : "⏳"}{" "}
                          {PAYMENT_STATUS[booking.paymentStatus]?.label ||
                            booking.paymentStatus}
                        </span>
                      </div>
                    </td>

                    {/* actions */}
                    <td className="px-4 py-4">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Xem chi tiết"
                        >
                          <FaEye size={18} />
                        </button>

                        {/* Manager chỉ xử lý các trạng thái chưa xong */}
                        {(booking.bookingStatus === "pending" ||
                          booking.bookingStatus === "confirmed" ||
                          booking.bookingStatus === "checked-in") && (
                          <>
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: booking._id,
                                  status:
                                    booking.bookingStatus === "pending"
                                      ? "confirmed"
                                      : booking.bookingStatus === "confirmed"
                                      ? "checked-in"
                                      : "checked-out"
                                })
                              }
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title={
                                booking.bookingStatus === "pending"
                                  ? "Xác nhận"
                                  : booking.bookingStatus === "confirmed"
                                  ? "Nhận phòng"
                                  : "Trả phòng"
                              }
                            >
                              <FaCheck size={18} />
                            </button>

                            {booking.bookingStatus !== "cancelled" && (
                              <button
                                onClick={() => handleCancelBooking(booking._id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Hủy đặt phòng"
                              >
                                <FaTimes size={18} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {bookingsData?.pages > 1 && (
          <div className="flex justify-center items-center space-x-3 p-4 border-t bg-gray-50">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-outline btn-sm disabled:opacity-50"
            >
              ← Trước
            </button>
            <span className="text-sm font-medium text-gray-700">
              Trang{" "}
              <span className="font-bold text-primary">{page}</span> /{" "}
              {bookingsData.pages}
            </span>
            <button
              onClick={() =>
                setPage((p) => Math.min(bookingsData.pages, p + 1))
              }
              disabled={page === bookingsData.pages}
              className="btn btn-outline btn-sm disabled:opacity-50"
            >
              Sau →
            </button>
          </div>
        )}
      </div>

      {/* ===== Booking Detail Modal ===== */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-slide-up">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary to-primary-dark p-6 flex items-center justify-between text-white sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-bold">Chi tiết đặt phòng</h2>
                <p className="text-white/80 text-sm mt-1">
                  Mã: {selectedBooking.bookingCode || selectedBooking._id}
                </p>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <FaTimes size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Status Badges */}
              <div className="flex flex-wrap gap-3">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    selectedBooking.bookingStatus === "confirmed"
                      ? "bg-blue-100 text-blue-800"
                      : selectedBooking.bookingStatus === "checked-in"
                      ? "bg-green-100 text-green-800"
                      : selectedBooking.bookingStatus === "checked-out" ||
                        selectedBooking.bookingStatus === "completed"
                      ? "bg-gray-100 text-gray-800"
                      : selectedBooking.bookingStatus === "cancelled"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {BOOKING_STATUS[selectedBooking.bookingStatus]?.label ||
                    selectedBooking.bookingStatus}
                </span>

                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    selectedBooking.paymentStatus === "paid"
                      ? "bg-green-100 text-green-800"
                      : selectedBooking.paymentStatus === "cancelled"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {PAYMENT_STATUS[selectedBooking.paymentStatus]?.label ||
                    selectedBooking.paymentStatus}
                </span>
              </div>

              {/* Booking Info */}
              <div className="card p-5">
                <h3 className="font-bold text-lg mb-4 flex items-center text-primary">
                  <FaCalendar className="mr-2" />
                  Thông tin đặt phòng
                </h3>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 block mb-1">Ngày đặt:</span>
                    <div className="font-semibold">
                      {formatDate(selectedBooking.createdAt)}
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-600 block mb-1">Số đêm:</span>
                    <div className="font-semibold">
                      {calculateNights(
                        selectedBooking.checkIn,
                        selectedBooking.checkOut
                      )}{" "}
                      đêm
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-600 block mb-1">Nhận phòng:</span>
                    <div className="font-semibold text-green-600">
                      {formatDate(selectedBooking.checkIn)}
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-600 block mb-1">Trả phòng:</span>
                    <div className="font-semibold text-red-600">
                      {formatDate(selectedBooking.checkOut)}
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-600 block mb-1">Số khách:</span>
                    <div className="font-semibold">
                      {selectedBooking.guests} người
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-600 block mb-1">Tổng tiền:</span>
                    <div className="font-bold text-xl text-accent">
                      {formatPrice(selectedBooking.totalPrice)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Guest Info */}
              <div className="card p-5">
                <h3 className="font-bold text-lg mb-4 flex items-center text-primary">
                  <FaUser className="mr-2" />
                  Thông tin khách hàng
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 block mb-1">Tên khách:</span>
                    <div className="font-semibold">
                      {selectedBooking.guestName || selectedBooking.userId?.name}
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-600 block mb-1">Email:</span>
                    <div className="font-semibold">
                      {selectedBooking.guestEmail || selectedBooking.userId?.email}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <span className="text-gray-600 block mb-1">
                      Số điện thoại:
                    </span>
                    <div className="font-semibold">
                      {selectedBooking.guestPhone || selectedBooking.userId?.phone}
                    </div>
                  </div>
                </div>
              </div>

              {/* Room Info */}
              <div className="card p-5">
                <h3 className="font-bold text-lg mb-4 flex items-center text-primary">
                  <FaHotel className="mr-2" />
                  Thông tin phòng
                </h3>

                <div className="flex items-start space-x-4">
                  <img
                    src={
                      selectedBooking.roomId?.images?.[0] || "/placeholder.jpg"
                    }
                    alt={selectedBooking.roomId?.name}
                    className="w-32 h-32 object-cover rounded-xl shadow-md"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-lg mb-1">
                      {selectedBooking.roomId?.name}
                    </div>
                    <div className="text-gray-600 mb-1">
                      {selectedBooking.hotelId?.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedBooking.hotelId?.address}
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedBooking.hotelId?.city}
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {selectedBooking.specialRequests && (
                <div className="card p-5 bg-yellow-50 border border-yellow-200">
                  <h3 className="font-bold text-lg mb-3 text-yellow-900">
                    📝 Yêu cầu đặc biệt
                  </h3>
                  <p className="text-sm text-yellow-800">
                    {selectedBooking.specialRequests}
                  </p>
                </div>
              )}

              {/* Actions for manager */}
              {(selectedBooking.bookingStatus === "pending" ||
                selectedBooking.bookingStatus === "confirmed" ||
                selectedBooking.bookingStatus === "checked-in") && (
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                  <button
                    onClick={() =>
                      updateStatusMutation.mutate({
                        id: selectedBooking._id,
                        status:
                          selectedBooking.bookingStatus === "pending"
                            ? "confirmed"
                            : selectedBooking.bookingStatus === "confirmed"
                            ? "checked-in"
                            : "checked-out"
                      })
                    }
                    className="flex-1 btn btn-primary py-3 font-semibold"
                    disabled={updateStatusMutation.isPending}
                  >
                    <FaCheck className="mr-2" />
                    {selectedBooking.bookingStatus === "pending"
                      ? "Xác nhận đặt phòng"
                      : selectedBooking.bookingStatus === "confirmed"
                      ? "Xác nhận nhận phòng"
                      : "Xác nhận trả phòng"}
                  </button>

                  {selectedBooking.bookingStatus !== "cancelled" && (
                    <button
                      onClick={() => handleCancelBooking(selectedBooking._id)}
                      className="flex-1 btn btn-outline border-2 border-red-500 text-red-600 hover:bg-red-50 py-3 font-semibold"
                      disabled={cancelMutation.isPending}
                    >
                      <FaTimes className="mr-2" />
                      Hủy đặt phòng
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerBookings;
