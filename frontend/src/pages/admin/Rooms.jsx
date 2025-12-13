// frontend/src/pages/admin/Rooms.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomAPI } from '../../api/room.api';
import { hotelAPI } from '../../api/hotel.api';
import Loading from '../../components/Loading';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaStar, FaSearch, FaTimes } from 'react-icons/fa';
import { FaHotel } from 'react-icons/fa';
import { formatPrice } from '../../utils/formatPrice';
import { ROOM_TYPES, ROOM_AMENITIES } from '../../utils/constants';

const Rooms = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  // ❗ FORM DATA: thêm maxAdults, maxChildren – KHÔNG cần maxGuests
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discount: 0,
    roomType: 'standard',
    hotelId: '',
    images: [],
    amenities: [],
    size: '',
    numberOfBeds: 1,
    bedType: 'Single',
    availability: true,
    maxAdults: 2,
    maxChildren: 0,
  });

  // Fetch rooms
  const { data: roomsData, isLoading, isError, error } = useQuery({
    queryKey: ['admin-rooms', page, searchTerm, filterType],
    queryFn: () =>
      roomAPI.getRooms({
        page,
        limit: 10,
        search: searchTerm,
        roomType: filterType,
      }),
  });

  // Fetch hotels for dropdown
  const { data: hotelsData } = useQuery({
    queryKey: ['hotels-list'],
    queryFn: () => hotelAPI.getHotels({ limit: 100 }),
  });

  // Create room mutation
  const createMutation = useMutation({
    mutationFn: (data) => roomAPI.createRoom(data),
    onSuccess: () => {
      toast.success('Tạo phòng thành công!');
      queryClient.invalidateQueries(['admin-rooms']);
      closeModal();
    },
    onError: (error) => {
      toast.error(error.message || 'Tạo phòng thất bại');
    },
  });

  // Update room mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => roomAPI.updateRoom(id, data),
    onSuccess: () => {
      toast.success('Cập nhật phòng thành công!');
      queryClient.invalidateQueries(['admin-rooms']);
      closeModal();
    },
    onError: (error) => {
      toast.error(error.message || 'Cập nhật thất bại');
    },
  });

  // Delete room mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => roomAPI.deleteRoom(id),
    onSuccess: () => {
      toast.success('Xóa phòng thành công!');
      queryClient.invalidateQueries(['admin-rooms']);
    },
    onError: (error) => {
      toast.error(error.message || 'Xóa phòng thất bại');
    },
  });

  const openCreateModal = () => {
    setEditingRoom(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      discount: 0,
      roomType: 'standard',
      hotelId: '',
      images: [],
      amenities: [],
      size: '',
      numberOfBeds: 1,
      bedType: 'Single',
      availability: true,
      maxAdults: 2,
      maxChildren: 0,
    });
    setShowModal(true);
  };

  const openEditModal = (room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      description: room.description,
      price: room.price,
      discount: room.discount || 0,
      roomType: room.roomType,
      hotelId: room.hotelId?._id || room.hotelId,
      images: room.images || [],
      amenities: room.amenities || [],
      size: room.size,
      numberOfBeds: room.numberOfBeds,
      bedType: room.bedType,
      availability: room.availability,
      // nếu room cũ chưa có field này thì fallback
      maxAdults: room.maxAdults ?? room.maxGuests ?? 2,
      maxChildren: room.maxChildren ?? 0,
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
      // đảm bảo kiểu number
      price: Number(formData.price),
      discount: Number(formData.discount) || 0,
      size: Number(formData.size) || 0,
      numberOfBeds: Number(formData.numberOfBeds) || 1,
      maxAdults: Number(formData.maxAdults) || 1,
      maxChildren: Number(formData.maxChildren) || 0,
    };

    if (editingRoom) {
      updateMutation.mutate({ id: editingRoom._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc muốn xóa phòng này?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleImageUrlsChange = (value) => {
    const urls = value.split('\n').filter((url) => url.trim());
    setFormData({ ...formData, images: urls });
  };

  const [customAmenity, setCustomAmenity] = useState('');

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
    if (customAmenity.trim() && !formData.amenities.includes(customAmenity.trim())) {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, customAmenity.trim()],
      });
      setCustomAmenity('');
    }
  };

  const removeCustomAmenity = (amenity) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.filter((a) => a !== amenity),
    });
  };

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">❌ Lỗi tải dữ liệu phòng</p>
          <p className="text-gray-600">{error?.message || 'Vui lòng thử lại sau'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý phòng</h1>
          <p className="text-gray-600">Tổng số: {roomsData?.total || 0} phòng</p>
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
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên phòng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
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
        <div className="overflow-hidden">
          <table className="w-full table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-[20%] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Phòng
                </th>
                <th className="w-[15%] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Khách sạn
                </th>
                <th className="w-[10%] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Loại
                </th>
                <th className="w-[12%] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Giá
                </th>
                <th className="w-[12%] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Đánh giá
                </th>
                <th className="w-[12%] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Sức chứa
                </th>
                <th className="w-[9%] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trạng thái
                </th>
                <th className="w-[10%] px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {roomsData?.data?.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <FaHotel className="text-6xl text-gray-300 mb-4" />
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        Chưa có phòng nào
                      </h3>
                      <p className="text-gray-500 mb-6">
                        {searchTerm || filterType
                          ? 'Không tìm thấy phòng phù hợp. Thử thay đổi bộ lọc.'
                          : 'Hãy thêm phòng đầu tiên để bắt đầu.'}
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
                roomsData?.data?.map((room) => (
                  <tr key={room._id} className="hover:bg-gray-50">
                    <td className="px-2 py-3">
                      <div className="flex items-center space-x-2">
                        <img
                          src={room.images?.[0]}
                          alt={room.name}
                          className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm truncate">{room.name}</div>
                          <div className="text-xs text-gray-500 truncate">
                            {room.maxAdults ?? 0} NL • {room.maxChildren ?? 0} TE • {room.size}m²
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-xs truncate">{room.hotelId?.name || 'N/A'}</div>
                      <div className="text-xs text-gray-500 truncate">{room.hotelId?.city}</div>
                    </td>
                    <td className="px-2 py-3">
                      <span className="capitalize text-xs truncate">{room.roomType}</span>
                    </td>
                    <td className="px-2 py-3">
                      <div className="font-semibold text-sm">{formatPrice(room.price)}</div>
                      {room.discount > 0 && (
                        <div className="text-xs text-red-500">-{room.discount}%</div>
                      )}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center">
                        <FaStar className="text-yellow-500 mr-1 flex-shrink-0" size={12} />
                        <span className="font-semibold text-xs">
                          {room.rating?.toFixed(1) || 'N/A'}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">
                          ({room.totalReviews || 0})
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <span className="text-xs truncate">
                        Tối đa {room.maxAdults + (room.maxChildren || 0)} khách
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          room.availability
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {room.availability ? 'Còn phòng' : 'Hết phòng'}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-right">
                      <div className="flex justify-end space-x-1">
                      <button
                        onClick={() => openEditModal(room)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Sửa"
                      >
                          <FaEdit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(room._id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Xóa"
                      >
                          <FaTrash size={14} />
                      </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {roomsData?.pages > 1 && (
          <div className="flex justify-center items-center space-x-2 p-4 border-t">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-outline btn-sm"
            >
              Trước
            </button>
            <span className="text-sm text-gray-600">
              Trang {page} / {roomsData.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(roomsData.pages, p + 1))}
              disabled={page === roomsData.pages}
              className="btn btn-outline btn-sm"
            >
              Sau
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">
                {editingRoom ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-sm font-medium mb-2">Khách sạn *</label>
                  <select
                    value={formData.hotelId}
                    onChange={(e) =>
                      setFormData({ ...formData, hotelId: e.target.value })
                    }
                    className="input"
                    required
                  >
                    <option value="">Chọn khách sạn</option>
                    {hotelsData?.data?.map((hotel) => (
                      <option key={hotel._id} value={hotel._id}>
                        {hotel.name} - {hotel.city}
                      </option>
                    ))}
                  </select>
                </div>

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

                {/* SỐ NGƯỜI LỚN & TRẺ EM */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Số người lớn tối đa *
                  </label>
                  <input
                    type="number"
                    value={formData.maxAdults}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxAdults: parseInt(e.target.value) || 1,
                      })
                    }
                    className="input"
                    required
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Số trẻ em tối đa
                  </label>
                  <input
                    type="number"
                    value={formData.maxChildren}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxChildren: parseInt(e.target.value) || 0,
                      })
                    }
                    className="input"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Diện tích (m²) *</label>
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

                <div>
                  <label className="block text-sm font-medium mb-2">Số giường *</label>
                  <input
                    type="number"
                    value={formData.numberOfBeds}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        numberOfBeds: parseInt(e.target.value) || 1,
                      })
                    }
                    className="input"
                    required
                    min="1"
                  />
                </div>

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
                    <option value="Single">Single</option>
                    <option value="Double">Double</option>
                    <option value="Queen">Queen</option>
                    <option value="King">King</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.availability}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          availability: e.target.checked,
                        })
                      }
                      className="rounded text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium">Còn phòng</span>
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    URL ảnh (mỗi URL một dòng)
                  </label>
                  <textarea
                    value={formData.images.join('\n')}
                    onChange={(e) => handleImageUrlsChange(e.target.value)}
                    className="input"
                    rows="3"
                    placeholder={
                      'https://example.com/image1.jpg\nhttps://example.com/image2.jpg'
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-3">
                    Tiện nghi phòng
                  </label>

                  {/* Preset amenities */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    {ROOM_AMENITIES.map((amenity) => (
                      <label
                        key={amenity.value}
                        className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          formData.amenities.includes(amenity.value)
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-primary/50'
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

                  {/* Custom amenities */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-medium mb-2">
                      Tiện nghi khác
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={customAmenity}
                        onChange={(e) => setCustomAmenity(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === 'Enter' &&
                          (e.preventDefault(), addCustomAmenity())
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

                    {/* Display custom amenities */}
                    {formData.amenities.filter(
                      (a) => !ROOM_AMENITIES.some((ra) => ra.value === a)
                    ).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.amenities
                          .filter(
                            (a) => !ROOM_AMENITIES.some((ra) => ra.value === a)
                          )
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
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn-outline"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Đang xử lý...'
                    : editingRoom
                    ? 'Cập nhật'
                    : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;
