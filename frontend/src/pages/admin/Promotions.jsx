// frontend/src/pages/admin/Promotions.jsx
import { useState, useMemo } from "react";
import {
  Tag,
  Gift,
  Percent,
  Calendar,
  TrendingUp,
  Edit2,
  Trash2,
  Plus,
  X,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { promotionAPI } from "../../api/promotion.api";
import { hotelAPI } from "../../api/hotel.api";
import Loading from "../../components/Loading";
import { FaSearch, FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { formatPrice } from "../../utils/formatPrice";

const EMPTY_FORM = {
  name: "",
  code: "",
  description: "",
  discountType: "percent",
  discountValue: 0,
  minOrderAmount: 0,
  usageLimit: "",
  startDate: "",
  endDate: "",
  isActive: true,
  type: "coupon",
  applyType: "global",
  hotelId: [], // Array để hỗ trợ chọn nhiều khách sạn
};

export default function Promotions() {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);

  /* ============ LOAD LIST TỪ BACKEND ============ */
  const { data, isLoading } = useQuery({
    queryKey: ["promotions"],
    queryFn: () => promotionAPI.getAll().then((res) => res.data),
  });

  // Load danh sách hotels để chọn
  const { data: hotelsData, isLoading: isLoadingHotels, error: hotelsError } = useQuery({
    queryKey: ["hotels-for-promotion"],
    queryFn: () => hotelAPI.getHotels({ page: 1, limit: 1000 }),
    // axiosClient đã trả về response.data rồi, nên hotelsData = { success, count, total, page, pages, data: [...] }
    enabled: isModalOpen, // Chỉ fetch khi modal mở
    staleTime: 5 * 60 * 1000, // Cache 5 phút
  });

  // BE trả: { success, count, data: [...] }
  const allPromotions = data?.data || [];
  const hotels = hotelsData?.data || [];

  // Filter promotions
  const filteredPromotions = useMemo(() => {
    let filtered = [...allPromotions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType) {
      filtered = filtered.filter((p) => p.type === filterType);
    }

    // Status filter
    if (filterStatus) {
      const now = new Date();
      filtered = filtered.filter((p) => {
        const start = new Date(p.startDate);
        const end = new Date(p.endDate);
        if (filterStatus === "active") {
          return p.isActive && start <= now && end >= now;
        } else if (filterStatus === "expired") {
          return end < now || !p.isActive;
        } else if (filterStatus === "upcoming") {
          return start > now;
        }
        return true;
      });
    }

    return filtered;
  }, [allPromotions, searchTerm, filterType, filterStatus]);

  // Pagination
  const limit = 10;
  const totalPages = Math.ceil(filteredPromotions.length / limit);
  const paginatedPromotions = filteredPromotions.slice(
    (page - 1) * limit,
    page * limit
  );

  const stats = useMemo(() => {
    const now = new Date();
    let active = 0;
    let expired = 0;
    allPromotions.forEach((p) => {
      const start = new Date(p.startDate);
      const end = new Date(p.endDate);
      if (p.isActive && start <= now && end >= now) active++;
      else expired++;
    });
    return {
      active,
      expired,
      total: allPromotions.length,
      usedTotal: allPromotions.reduce(
        (sum, p) => sum + (p.usedCount || 0),
        0
      ),
    };
  }, [allPromotions]);

  /* ============ MUTATIONS ============ */
  const createMutation = useMutation({
    mutationFn: (payload) => promotionAPI.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["promotions"]);
      closeModal();
    },
    onError: (err) => {
      console.error("Create promotion error:", err?.response || err);
      setErrorMsg(
        err?.response?.data?.message ||
          "Tạo khuyến mãi thất bại. Vui lòng thử lại."
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => promotionAPI.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["promotions"]);
      closeModal();
    },
    onError: (err) => {
      console.error("Update promotion error:", err?.response || err);
      setErrorMsg(
        err?.response?.data?.message ||
          "Cập nhật khuyến mãi thất bại. Vui lòng thử lại."
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => promotionAPI.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["promotions"]);
    },
    onError: (err) => {
      console.error("Delete promotion error:", err?.response || err);
      alert(
        err?.response?.data?.message ||
          "Xóa khuyến mãi thất bại. Vui lòng thử lại."
      );
    },
  });

  /* ============ HANDLERS ============ */

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEdit = (promo) => {
    setEditingId(promo._id);
    setErrorMsg("");

    setForm({
      name: promo.name || "",
      code: promo.code || "",
      description: promo.description || "",
      discountType: promo.discountType || "percent",
      discountValue: promo.discountValue ?? 0,
      minOrderAmount: promo.minOrderAmount ?? 0,
      usageLimit:
        promo.usageLimit === null || promo.usageLimit === undefined
          ? ""
          : promo.usageLimit,
      startDate: promo.startDate ? promo.startDate.substring(0, 10) : "",
      endDate: promo.endDate ? promo.endDate.substring(0, 10) : "",
      isActive: promo.isActive ?? true,
      type: promo.type || "coupon",
      applyType: promo.applyType || "global",
      hotelId: promo.hotelId
        ? Array.isArray(promo.hotelId)
          ? promo.hotelId.map((h) => (typeof h === "object" ? h._id : h).toString())
          : [typeof promo.hotelId === "object" ? promo.hotelId._id : promo.hotelId].map(String)
        : [],
    });

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrorMsg("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      description: form.description.trim(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue) || 0,
      minOrderAmount: Number(form.minOrderAmount) || 0,
      usageLimit:
        form.usageLimit === "" || form.usageLimit === null
          ? null
          : Number(form.usageLimit),
      startDate: form.startDate,
      endDate: form.endDate,
      isActive: !!form.isActive,
      type: form.type || "coupon",
      applyType: form.applyType || "global",
      hotelId:
        form.applyType === "hotel" && form.hotelId && form.hotelId.length > 0
          ? form.hotelId.length === 1
            ? form.hotelId[0] // Gửi single value nếu chỉ chọn 1
            : form.hotelId // Gửi array nếu chọn nhiều
          : null,
    };

    if (!payload.name) {
      setErrorMsg("Vui lòng nhập tên khuyến mãi");
      return;
    }
    if (!payload.startDate || !payload.endDate) {
      setErrorMsg("Vui lòng chọn ngày bắt đầu và ngày kết thúc");
      return;
    }
    if (payload.discountValue <= 0) {
      setErrorMsg("Giá trị giảm phải lớn hơn 0");
      return;
    }
    if (payload.applyType === "hotel" && (!payload.hotelId || (Array.isArray(payload.hotelId) && payload.hotelId.length === 0))) {
      setErrorMsg("Vui lòng chọn ít nhất một khách sạn");
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id) => {
    if (!window.confirm("Bạn có chắc muốn xoá khuyến mãi này?")) return;
    deleteMutation.mutate(id);
  };

  const getTypeInfo = (type) => {
    switch (type) {
      case "coupon":
        return {
          label: "Mã giảm giá",
          color: "bg-blue-100 text-blue-700",
          icon: Tag,
        };
      case "seasonal":
        return {
          label: "Theo mùa",
          color: "bg-purple-100 text-purple-700",
          icon: Calendar,
        };
      case "duration":
      default:
        return {
          label: "Theo số đêm",
          color: "bg-green-100 text-green-700",
          icon: TrendingUp,
        };
    }
  };

  const getStatusInfo = (promo) => {
    const now = new Date();
    const start = new Date(promo.startDate);
    const end = new Date(promo.endDate);

    if (!promo.isActive) {
      return { label: "Tạm dừng", color: "bg-gray-100 text-gray-800" };
    }
    if (end < now) {
      return { label: "Hết hạn", color: "bg-red-100 text-red-800" };
    }
    if (start > now) {
      return { label: "Sắp diễn ra", color: "bg-yellow-100 text-yellow-800" };
    }
    return { label: "Đang hoạt động", color: "bg-green-100 text-green-800" };
  };

  /* ============ RENDER ============ */

  if (isLoading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý khuyến mãi</h1>
          <p className="text-gray-600">Tổng số: {stats.total} khuyến mãi</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary">
          <FaPlus className="mr-2" />
          Thêm khuyến mãi mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Tổng khuyến mãi</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Gift className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Đang hoạt động</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Tổng lượt sử dụng</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{stats.usedTotal}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Tag className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc mã..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="input pl-10"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPage(1);
            }}
            className="input"
          >
            <option value="">Tất cả loại</option>
            <option value="coupon">Mã giảm giá</option>
            <option value="seasonal">Theo mùa</option>
            <option value="duration">Theo số đêm</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="input"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="expired">Hết hạn</option>
            <option value="upcoming">Sắp diễn ra</option>
          </select>
        </div>
      </div>

      {/* Promotions Table */}
      <div className="card overflow-hidden">
        <div className="overflow-hidden">
          <table className="w-full table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-[20%] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tên khuyến mãi
                </th>
                <th className="w-[12%] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Mã
                </th>
                <th className="w-[10%] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Loại
                </th>
                <th className="w-[12%] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Giảm giá
                </th>
                <th className="w-[18%] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Thời gian
                </th>
                <th className="w-[10%] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Đã dùng
                </th>
                <th className="w-[10%] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trạng thái
                </th>
                <th className="w-[8%] px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedPromotions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <Gift className="text-6xl text-gray-300 mb-4" />
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        Chưa có khuyến mãi nào
                      </h3>
                      <p className="text-gray-500 mb-6">
                        {searchTerm || filterType || filterStatus
                          ? "Không tìm thấy khuyến mãi phù hợp. Thử thay đổi bộ lọc."
                          : "Hãy thêm khuyến mãi đầu tiên để bắt đầu."}
                      </p>
                      {!searchTerm && !filterType && !filterStatus && (
                        <button onClick={openCreate} className="btn btn-primary">
                          <FaPlus className="mr-2" />
                          Thêm khuyến mãi mới
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPromotions.map((promo) => {
                  const typeInfo = getTypeInfo(promo.type);
                  const statusInfo = getStatusInfo(promo);
                  return (
                    <tr key={promo._id} className="hover:bg-gray-50">
                      <td className="px-2 py-3">
                        <div className="font-semibold text-sm truncate">{promo.name}</div>
                        {promo.description && (
                          <div className="text-xs text-gray-500 truncate mt-1">
                            {promo.description}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-3">
                        {promo.code ? (
                          <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                            {promo.code}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-2 py-3">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        <div className="font-semibold text-sm text-orange-600">
                          {promo.discountType === "percent"
                            ? `${promo.discountValue}%`
                            : formatPrice(promo.discountValue)}
                        </div>
                        {promo.minOrderAmount > 0 && (
                          <div className="text-xs text-gray-500">
                            Tối thiểu: {formatPrice(promo.minOrderAmount)}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-3">
                        <div className="text-xs">
                          <div>
                            {promo.startDate
                              ? new Date(promo.startDate).toLocaleDateString("vi-VN")
                              : "—"}
                          </div>
                          <div className="text-gray-500">
                            {promo.endDate
                              ? new Date(promo.endDate).toLocaleDateString("vi-VN")
                              : "—"}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <div className="text-xs">
                          <span className="font-semibold text-blue-600">
                            {promo.usedCount || 0}
                          </span>
                          {promo.usageLimit && (
                            <span className="text-gray-500"> / {promo.usageLimit}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <span className={`px-2 py-0.5 text-xs rounded-full whitespace-nowrap ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-right">
                        <div className="flex justify-end space-x-1">
                          <button
                            onClick={() => openEdit(promo)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Sửa"
                          >
                            <FaEdit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(promo._id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Xóa"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 p-4 border-t">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-outline btn-sm"
            >
              Trước
            </button>
            <span className="text-sm text-gray-600">
              Trang {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn btn-outline btn-sm"
            >
              Sau
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Gift className="w-7 h-7" />
                  {editingId ? "Chỉnh sửa khuyến mãi" : "Thêm khuyến mãi mới"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto no-scrollbar">
              {errorMsg && (
                <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Tên khuyến mãi */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Tên khuyến mãi *
                  </label>
                  <input
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="VD: Giảm giá mùa hè"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    required
                  />
                </div>

                {/* Mã giảm giá */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Mã giảm giá
                  </label>
                  <input
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm uppercase font-mono focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="VD: SUMMER2024"
                    value={form.code}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, code: e.target.value }))
                    }
                  />
                </div>

                {/* Kiểu & Giá trị giảm */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Kiểu giảm *
                    </label>
                    <select
                      value={form.discountType}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          discountType: e.target.value,
                        }))
                      }
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                    >
                      <option value="percent">Phần trăm ()</option>
                      <option value="fixed">Số tiền (VND)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Giá trị giảm *
                    </label>
                    <input
                      type="number"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                      value={form.discountValue}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          discountValue: e.target.value,
                        }))
                      }
                      required
                      min="0"
                    />
                  </div>
                </div>

                {/* Đơn tối thiểu & Giới hạn lượt */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Đơn tối thiểu (VND)
                    </label>
                    <input
                      type="number"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                      value={form.minOrderAmount}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          minOrderAmount: e.target.value,
                        }))
                      }
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Giới hạn số lần dùng
                    </label>
                    <input
                      type="number"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                      value={form.usageLimit}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          usageLimit: e.target.value,
                        }))
                      }
                      min="0"
                      placeholder="Để trống = không giới hạn"
                    />
                  </div>
                </div>

                {/* Ngày bắt đầu & kết thúc */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Ngày bắt đầu *
                    </label>
                    <input
                      type="date"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                      value={form.startDate}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          startDate: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Ngày kết thúc *
                    </label>
                    <input
                      type="date"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                      value={form.endDate}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          endDate: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>

                {/* Áp dụng cho */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Áp dụng cho *
                  </label>
                  <select
                    value={form.applyType}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        applyType: e.target.value,
                        hotelId: e.target.value !== "hotel" ? [] : f.hotelId,
                      }))
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    <option value="global">Tất cả khách sạn</option>
                    <option value="hotel">Tùy chọn khách sạn</option>
                  </select>
                </div>

                {/* Chọn khách sạn (hiển thị khi applyType = 'hotel') */}
                {form.applyType === "hotel" && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Chọn khách sạn * {form.hotelId.length > 0 && `(${form.hotelId.length} đã chọn)`}
                    </label>
                    {isLoadingHotels ? (
                      <div className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500">
                        Đang tải danh sách khách sạn...
                      </div>
                    ) : hotelsError ? (
                      <div className="w-full border-2 border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 bg-red-50">
                        Lỗi khi tải danh sách khách sạn. Vui lòng thử lại.
                      </div>
                    ) : (
                      <div className="w-full border-2 border-gray-200 rounded-xl p-4 max-h-60 overflow-y-auto no-scrollbar bg-gray-50">
                        {hotels.length > 0 ? (
                          <div className="space-y-2">
                            {hotels.map((hotel) => {
                              const isSelected = form.hotelId.includes(hotel._id);
                              return (
                                <label
                                  key={hotel._id}
                                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                    isSelected
                                      ? "bg-blue-50 border-2 border-blue-300"
                                      : "bg-white border-2 border-gray-200 hover:border-blue-200"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setForm((f) => ({
                                          ...f,
                                          hotelId: [...f.hotelId, hotel._id],
                                        }));
                                      } else {
                                        setForm((f) => ({
                                          ...f,
                                          hotelId: f.hotelId.filter(
                                            (id) => id !== hotel._id
                                          ),
                                        }));
                                      }
                                    }}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                  />
                                  <div className="flex-1">
                                    <span className="font-medium text-gray-900">
                                      {hotel.name}
                                    </span>
                                    <span className="text-sm text-gray-500 ml-2">
                                      - {hotel.city}
                                    </span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-4">
                            Không có khách sạn nào
                          </div>
                        )}
                      </div>
                    )}
                    {form.hotelId.length === 0 && form.applyType === "hotel" && (
                      <p className="text-xs text-red-500 mt-1">
                        Vui lòng chọn ít nhất một khách sạn
                      </p>
                    )}
                  </div>
                )}

                {/* Trạng thái */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        isActive: e.target.checked,
                      }))
                    }
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="isActive"
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    Kích hoạt khuyến mãi ngay
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg font-medium disabled:opacity-60"
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                  >
                    {editingId ? "Lưu thay đổi" : "Tạo khuyến mãi"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
