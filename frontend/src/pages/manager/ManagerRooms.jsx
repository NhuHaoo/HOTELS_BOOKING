import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import Loading from "../../components/Loading";
import { FaPlus, FaEdit, FaTrash, FaStar, FaSearch, FaTimes } from "react-icons/fa";
import { FaHotel } from "react-icons/fa";
import { formatPrice } from "../../utils/formatPrice";
import { ROOM_TYPES, ROOM_AMENITIES } from "../../utils/constants";
import axios from "../../utils/axiosInstance"; 
// nếu bạn chưa có axiosInstance thì đổi thành axios + baseURL đúng backend

const ManagerRooms = () => {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    discount: 0,
    roomType: "single",
    maxGuests: 2,
    images: [],
    amenities: [],
    size: "",
    numberOfBeds: 1,
    bedType: "double",
    availability: true,
  });

  // ====== API functions (manager) ======
  const managerRoomAPI = {
    getRooms: async ({ page, limit, search, roomType }) => {
      const res = await axios.get("/manager/rooms", {
        params: { page, limit, search, roomType },
      });
      // manager.rooms.controller trả về {success, count, data}
      // hoặc manager.controller trả về có pages,total... tùy file bạn đang mount
      return res.data;
    },
    createRoom: async (data) => {
      const res = await axios.post("/manager/rooms", data);
      return res.data;
    },
    updateRoom: async (id, data) => {
      const res = await axios.put(`/manager/rooms/${id}`, data);
      return res.data;
    },
    deleteRoom: async (id) => {
      const res = await axios.delete(`/manager/rooms/${id}`);
      return res.data;
    },
  };

  // ====== Fetch rooms ======
  const { data: roomsData, isLoading, isError, error } = useQuery({
    queryKey: ["manager-rooms", page, searchTerm, filterType],
    queryFn: () =>
      managerRoomAPI.getRooms({
        page,
        limit: 10,
        search: searchTerm,
        roomType: filterType,
      }),
    keepPreviousData: true,
  });

  // Backend bạn đang có 2 kiểu response:
  // A) manager.rooms.controller: {success, count, data}
  // B) manager.controller (getRooms): {success, count,total,pages,data}
  const rooms = roomsData?.data || [];
  const total = roomsData?.total ?? roomsData?.count ?? rooms.length ?? 0;
  const pages = roomsData?.pages ?? 1;

  // ====== Mutations ======
  const createMutation = useMutation({
    mutationFn: (data) => managerRoomAPI.createRoom(data),
    onSuccess: () => {
      toast.success("Tạo phòng thành công!");
      queryClient.invalidateQueries(["manager-rooms"]);
      closeModal();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || "Tạo phòng thất bại");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => managerRoomAPI.updateRoom(id, data),
    onSuccess: () => {
      toast.success("Cập nhật phòng thành công!");
      queryClient.invalidateQueries(["manager-rooms"]);
      closeModal();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || "Cập nhật thất bại");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => managerRoomAPI.deleteRoom(id),
    onSuccess: () => {
      toast.success("Xóa phòng thành công!");
      queryClient.invalidateQueries(["manager-rooms"]);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || "Xóa phòng thất bại");
    },
  });

  // ====== Modal handlers ======
  const openCreateModal = () => {
    setEditingRoom(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      discount: 0,
      roomType: "single",
      maxGuests: 2,
      images: [],
      amenities: [],
      size: "",
      numberOfBeds: 1,
      bedType: "double",
      availability: true,
    });
    setShowModal(true);
  };

  const openEditModal = (room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name || "",
      description: room.description || "",
      price: room.price || "",
      discount: room.discount || 0,
      roomType: room.roomType || "single",
      maxGuests: room.maxGuests || 2,
      images: room.images || [],
      amenities: room.amenities || [],
      size: room.size || "",
      numberOfBeds: room.numberOfBeds || 1,
      bedType: room.bedType || "double",
      availability: room.availability ?? true,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRoom(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      price: Number(formData.price),
      discount: Number(formData.discount),
      maxGuests: Number(formData.maxGuests),
      numberOfBeds: Number(formData.numberOfBeds),
      size: Number(formData.size),
    };

    if (editingRoom) {
      updateMutation.mutate({ id: editingRoom._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc muốn xóa phòng này?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleImageUrlsChange = (value) => {
    const urls = value.split("\n").filter((url) => url.trim());
    setFormData({ ...formData, images: urls });
  };

  const [customAmenity, setCustomAmenity] = useState("");

  const toggleAmenity = (amenityValue) => {
    const currentAmenities = formData.amenities || [];
    if (currentAmenities.includes(amenityValue)) {
      setFormData({
        ...formData,
        amenities: currentAmenities.filter((a) => a !== amenityValue),
      });
    } else {
      setFormData({
        ...formData,
        amenities: [...currentAmenities, amenityValue],
      });
    }
  };

  const addCustomAmenity = () => {
    const val = customAmenity.trim();
    if (val && !formData.amenities.includes(val)) {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, val],
      });
      setCustomAmenity("");
    }
  };

  const removeCustomAmenity = (amenity) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.filter((a) => a !== amenity),
    });
  };

  // ====== UI states ======
  if (isLoading) return <Loading fullScreen />;

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">❌ Lỗi tải dữ liệu phòng</p>
          <p className="text-gray-600">
            {error?.response?.data?.message || error?.message || "Vui lòng thử lại sau"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Phòng của tôi</h1>
          <p className="text-gray-600">Tổng số: {total} phòng</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          <FaPlus className="mr-2" />
          Thêm phòng mới
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên phòng..."
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
            <option value="">Tất cả loại phòng</option>
            {ROOM_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Rooms Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phòng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đánh giá</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {rooms.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <FaHotel className="text-6xl text-gray-300 mb-4" />
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">Chưa có phòng nào</h3>
                      <p className="text-gray-500 mb-6">
                        {searchTerm || filterType
                          ? "Không tìm thấy phòng phù hợp."
                          : "Hãy thêm phòng đầu tiên để bắt đầu."}
                      </p>
                      {!searchTerm && !filterType && (
                        <button onClick={openCreateModal} className="btn btn-primary">
                          <FaPlus className="mr-2" />
                          Thêm phòng mới
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                rooms.map((room) => (
                  <tr key={room._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={room.images?.[0]}
                          alt={room.name}
                          className="w-16 h-16 object-cover rounded-lg bg-gray-100"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                        <div>
                          <div className="font-semibold">{room.name}</div>
                          <div className="text-sm text-gray-500">
                            {room.maxGuests} khách • {room.size}m²
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="capitalize text-sm">{room.roomType}</span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold">{formatPrice(room.price)}</div>
                      {room.discount > 0 && (
                        <div className="text-xs text-red-500">-{room.discount}%</div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FaStar className="text-yellow-500 mr-1" />
                        <span className="font-semibold">{room.rating?.toFixed(1) || "N/A"}</span>
                        <span className="text-xs text-gray-500 ml-1">
                          ({room.totalReviews || 0})
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          room.availability
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {room.availability ? "Còn phòng" : "Hết phòng"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditModal(room)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(room._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-center items-center space-x-2 p-4 border-t">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-outline btn-sm"
            >
              Trước
            </button>
            <span className="text-sm text-gray-600">
              Trang {page} / {pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="btn btn-outline btn-sm"
            >
              Sau
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">
                {editingRoom ? "Chỉnh sửa phòng" : "Thêm phòng mới"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Tên phòng *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                {/* description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Mô tả *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="input"
                    rows="3"
                    required
                  />
                </div>

                {/* roomType */}
                <div>
                  <label className="block text-sm font-medium mb-2">Loại phòng *</label>
                  <select
                    value={formData.roomType}
                    onChange={(e) =>
                      setFormData({ ...formData, roomType: e.target.value })
                    }
                    className="input"
                    required
                  >
                    {ROOM_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* price */}
                <div>
                  <label className="block text-sm font-medium mb-2">Giá (VNĐ) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="input"
                    required
                    min="0"
                  />
                </div>

                {/* discount */}
                <div>
                  <label className="block text-sm font-medium mb-2">Giảm giá (%)</label>
                  <input
                    type="number"
                    value={formData.discount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount: parseInt(e.target.value) || 0,
                      })
                    }
                    className="input"
                    min="0"
                    max="100"
                  />
                </div>

                {/* maxGuests */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Số khách tối đa *
                  </label>
                  <input
                    type="number"
                    value={formData.maxGuests}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxGuests: parseInt(e.target.value),
                      })
                    }
                    className="input"
                    required
                    min="1"
                  />
                </div>

                {/* size */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Diện tích (m²) *
                  </label>
                  <input
                    type="number"
                    value={formData.size}
                    onChange={(e) =>
                      setFormData({ ...formData, size: e.target.value })
                    }
                    className="input"
                    required
                    min="0"
                  />
                </div>

                {/* numberOfBeds */}
                <div>
                  <label className="block text-sm font-medium mb-2">Số giường *</label>
                  <input
                    type="number"
                    value={formData.numberOfBeds}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        numberOfBeds: parseInt(e.target.value),
                      })
                    }
                    className="input"
                    required
                    min="1"
                  />
                </div>

                {/* bedType */}
                <div>
                  <label className="block text-sm font-medium mb-2">Loại giường *</label>
                  <select
                    value={formData.bedType}
                    onChange={(e) =>
                      setFormData({ ...formData, bedType: e.target.value })
                    }
                    className="input"
                    required
                  >
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                    <option value="queen">Queen</option>
                    <option value="king">King</option>
                  </select>
                </div>

                {/* availability */}
                <div className="flex items-center">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.availability}
                      onChange={(e) =>
                        setFormData({ ...formData, availability: e.target.checked })
                      }
                      className="rounded text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium">Còn phòng</span>
                  </label>
                </div>

                {/* images */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    URL ảnh (mỗi URL một dòng)
                  </label>
                  <textarea
                    value={formData.images.join("\n")}
                    onChange={(e) => handleImageUrlsChange(e.target.value)}
                    className="input"
                    rows="3"
                    placeholder="https://.../image1.jpg&#10;https://.../image2.jpg"
                  />
                </div>

                {/* amenities */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-3">
                    Tiện nghi phòng
                  </label>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    {ROOM_AMENITIES.map((amenity) => (
                      <label
                        key={amenity.value}
                        className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          formData.amenities.includes(amenity.value)
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-primary/50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.amenities.includes(amenity.value)}
                          onChange={() => toggleAmenity(amenity.value)}
                          className="rounded text-primary focus:ring-primary"
                        />
                        <span className="text-xl">{amenity.icon}</span>
                        <span className="text-sm font-medium flex-1">
                          {amenity.label}
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-medium mb-2">
                      Tiện nghi khác
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={customAmenity}
                        onChange={(e) => setCustomAmenity(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && (e.preventDefault(), addCustomAmenity())
                        }
                        className="input flex-1"
                        placeholder="Nhập tiện nghi tùy chỉnh..."
                      />
                      <button
                        type="button"
                        onClick={addCustomAmenity}
                        className="btn btn-outline btn-sm"
                      >
                        <FaPlus />
                      </button>
                    </div>

                    {formData.amenities.filter(
                      (a) => !ROOM_AMENITIES.some((ra) => ra.value === a)
                    ).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.amenities
                          .filter((a) => !ROOM_AMENITIES.some((ra) => ra.value === a))
                          .map((amenity, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center space-x-1 bg-white px-3 py-1 rounded-full text-sm border border-gray-300"
                            >
                              <span>{amenity}</span>
                              <button
                                type="button"
                                onClick={() => removeCustomAmenity(amenity)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <FaTimes size={12} />
                              </button>
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={closeModal} className="btn btn-outline">
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Đang xử lý..."
                    : editingRoom
                    ? "Cập nhật"
                    : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerRooms;
