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
  const promotions = data?.data || [];
  const hotels = hotelsData?.data || [];

  const stats = useMemo(() => {
    const now = new Date();
    let active = 0;
    let expired = 0;
    promotions.forEach((p) => {
      const start = new Date(p.startDate);
      const end = new Date(p.endDate);
      if (p.isActive && start <= now && end >= now) active++;
      else expired++;
    });
    return {
      active,
      expired,
      total: promotions.length,
      usedTotal: promotions.reduce(
        (sum, p) => sum + (p.usedCount || 0),
        0
      ),
    };
  }, [promotions]);

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

  /* ============ RENDER ============ */

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Gift className="w-8 h-8 text-blue-600" />
                Quản lý khuyến mãi
              </h1>
              <p className="text-gray-600 mt-2">
                Tạo và quản lý các chương trình ưu đãi cho hệ thống
              </p>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
            >
              <Plus className="w-5 h-5" />
              Thêm khuyến mãi
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Tổng khuyến mãi
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Gift className="w-7 h-7 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Đang hoạt động
                </p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {stats.active}
                </p>
              </div>
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Tổng lượt sử dụng
                </p>
                <p className="text-3xl font-bold text-purple-600 mt-1">
                  {stats.usedTotal}
                </p>
              </div>
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center">
                <Tag className="w-7 h-7 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Promotions Grid */}
        {promotions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promotions.map((promo) => {
              const typeInfo = getTypeInfo(promo.type);
              const TypeIcon = typeInfo.icon;

              return (
                <div
                  key={promo._id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group"
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className={`${typeInfo.color} px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1`}
                        >
                          <TypeIcon className="w-3 h-3" />
                          {typeInfo.label}
                        </div>
                        {promo.isActive ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">
                            Hoạt động
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded-lg text-xs font-semibold">
                            Tạm dừng
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {promo.name}
                      </h3>
                      {promo.code && (
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                          <Tag className="w-4 h-4 text-white" />
                          <span className="font-mono text-white font-bold text-sm">
                            {promo.code}
                          </span>
                        </div>
                      )}
                      {promo.applyType === "hotel" && promo.hotelId && (
                        <div className="mt-2 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                          <span className="text-white text-xs font-medium">
                            {Array.isArray(promo.hotelId)
                              ? `Áp dụng cho ${promo.hotelId.length} khách sạn`
                              : typeof promo.hotelId === "object" && promo.hotelId?.name
                              ? `Áp dụng cho: ${promo.hotelId.name} - ${promo.hotelId.city || ""}`
                              : "Áp dụng cho khách sạn"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    {/* Discount Value */}
                    <div className="mb-6">
                      <div className="flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border-2 border-dashed border-orange-300">
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-1">Giảm giá</p>
                          <div className="flex items-center justify-center gap-2">
                            <Percent className="w-6 h-6 text-orange-600" />
                            <p className="text-4xl font-bold text-orange-600">
                              {promo.discountType === "percent"
                                ? `${promo.discountValue}`
                                : `${promo.discountValue.toLocaleString()} đ`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-3 text-sm">
                      {promo.minOrderAmount > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">
                            Đơn tối thiểu:
                          </span>
                          <span className="font-semibold text-gray-900">
                            {promo.minOrderAmount.toLocaleString()} đ
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Thời gian:</span>
                        <span className="font-medium text-gray-700">
                          {promo.startDate
                            ? new Date(
                                promo.startDate
                              ).toLocaleDateString("vi-VN")
                            : "—"}{" "}
                          -{" "}
                          {promo.endDate
                            ? new Date(
                                promo.endDate
                              ).toLocaleDateString("vi-VN")
                            : "—"}
                        </span>
                      </div>

                      {promo.usedCount !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Đã sử dụng:</span>
                          <span className="font-semibold text-blue-600">
                            {promo.usedCount} lượt
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Áp dụng cho:</span>
                        <span className="font-semibold text-gray-900">
                          {promo.applyType === "global"
                            ? "Toàn hệ thống"
                            : promo.applyType === "hotel" && promo.hotelId
                            ? Array.isArray(promo.hotelId)
                              ? `${promo.hotelId.length} khách sạn`
                              : typeof promo.hotelId === "object" && promo.hotelId?.name
                              ? `${promo.hotelId.name}`
                              : "Khách sạn"
                            : "Phòng cụ thể"}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-6 pt-6 border-t border-gray-100">
                      <button
                        onClick={() => openEdit(promo)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors font-medium"
                      >
                        <Edit2 className="w-4 h-4" />
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(promo._id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Chưa có khuyến mãi nào</p>
            <p className="text-gray-400 text-sm mt-2">
              Nhấn nút "Thêm khuyến mãi" để tạo mới.
            </p>
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
            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
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
                      <div className="w-full border-2 border-gray-200 rounded-xl p-4 max-h-60 overflow-y-auto bg-gray-50">
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
