import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelAPI } from '../../api/hotel.api';
import Loading from '../../components/Loading';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaStar, FaSearch, FaMapMarkerAlt, FaTimes } from 'react-icons/fa';
import { HOTEL_AMENITIES } from '../../utils/constants';

const Hotels = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    rating: 5,
    images: [],
    amenities: [],
    policies: {
      checkInTime: '14:00',
      checkOutTime: '12:00',
      cancellationPolicy: '',
    },
    location: {
      type: 'Point',
      coordinates: [106.6297, 10.8231], // Default to Ho Chi Minh
    },
  });

  // Fetch hotels
  const { data: hotelsData, isLoading, isError, error } = useQuery({
    queryKey: ['admin-hotels', page, searchTerm, filterCity],
    queryFn: () => hotelAPI.getHotels({
      page,
      limit: 10,
      search: searchTerm,
      city: filterCity,
    }),
  });

  // Create hotel mutation
  const createMutation = useMutation({
    mutationFn: (data) => hotelAPI.createHotel(data),
    onSuccess: () => {
      toast.success('Tạo khách sạn thành công!');
      queryClient.invalidateQueries(['admin-hotels']);
      closeModal();
    },
    onError: (error) => {
      toast.error(error.message || 'Tạo khách sạn thất bại');
    },
  });

  // Update hotel mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => hotelAPI.updateHotel(id, data),
    onSuccess: () => {
      toast.success('Cập nhật khách sạn thành công!');
      queryClient.invalidateQueries(['admin-hotels']);
      closeModal();
    },
    onError: (error) => {
      toast.error(error.message || 'Cập nhật thất bại');
    },
  });

  // Delete hotel mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => hotelAPI.deleteHotel(id),
    onSuccess: () => {
      toast.success('Xóa khách sạn thành công!');
      queryClient.invalidateQueries(['admin-hotels']);
    },
    onError: (error) => {
      toast.error(error.message || 'Xóa khách sạn thất bại');
    },
  });

  const openCreateModal = () => {
    setEditingHotel(null);
    setFormData({
      name: '',
      description: '',
      address: '',
      city: '',
      phone: '',
      email: '',
      rating: 5,
      images: [],
      amenities: [],
      policies: {
        checkInTime: '14:00',
        checkOutTime: '12:00',
        cancellationPolicy: '',
      },
      location: {
        type: 'Point',
        coordinates: [106.6297, 10.8231],
      },
    });
    setShowModal(true);
  };

  const openEditModal = (hotel) => {
    setEditingHotel(hotel);
    setFormData({
      name: hotel.name,
      description: hotel.description,
      address: hotel.address,
      city: hotel.city,
      phone: hotel.phone,
      email: hotel.email,
      rating: hotel.rating || 5,
      images: hotel.images || [],
      amenities: hotel.amenities || [],
      policies: hotel.policies || {
        checkInTime: '14:00',
        checkOutTime: '12:00',
        cancellationPolicy: '',
      },
      location: hotel.location || {
        type: 'Point',
        coordinates: [106.6297, 10.8231],
      },
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingHotel(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingHotel) {
      updateMutation.mutate({ id: editingHotel._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc muốn xóa khách sạn này? Tất cả phòng thuộc khách sạn cũng sẽ bị ảnh hưởng.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleImageUrlsChange = (value) => {
    const urls = value.split('\n').filter(url => url.trim());
    setFormData({ ...formData, images: urls });
  };

  const [customAmenity, setCustomAmenity] = useState('');

  const toggleAmenity = (amenityValue) => {
    const currentAmenities = formData.amenities || [];
    if (currentAmenities.includes(amenityValue)) {
      setFormData({
        ...formData,
        amenities: currentAmenities.filter(a => a !== amenityValue)
      });
    } else {
      setFormData({
        ...formData,
        amenities: [...currentAmenities, amenityValue]
      });
    }
  };

  const addCustomAmenity = () => {
    if (customAmenity.trim() && !formData.amenities.includes(customAmenity.trim())) {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, customAmenity.trim()]
      });
      setCustomAmenity('');
    }
  };

  const removeCustomAmenity = (amenity) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.filter(a => a !== amenity)
    });
  };

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">❌ Lỗi tải dữ liệu khách sạn</p>
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
          <h1 className="text-2xl font-bold">Quản lý khách sạn</h1>
          <p className="text-gray-600">Tổng số: {hotelsData?.total || 0} khách sạn</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          <FaPlus className="mr-2" />
          Thêm khách sạn mới
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên khách sạn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <input
            type="text"
            placeholder="Lọc theo thành phố..."
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="input"
          />
        </div>
      </div>

      {/* Hotels Grid */}
      {hotelsData?.data?.length === 0 ? (
        <div className="card p-12 text-center">
          <FaHotel className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Chưa có khách sạn nào</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterCity 
              ? 'Không tìm thấy khách sạn phù hợp. Thử thay đổi bộ lọc.'
              : 'Hãy thêm khách sạn đầu tiên để bắt đầu.'}
          </p>
          {!searchTerm && !filterCity && (
            <button onClick={openCreateModal} className="btn btn-primary">
              <FaPlus className="mr-2" />
              Thêm khách sạn mới
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotelsData?.data?.map((hotel) => (
            <div key={hotel._id} className="card overflow-hidden hover:shadow-lg transition-shadow">
            <img
              src={hotel.images?.[0] || 'https://via.placeholder.com/400x250'}
              alt={hotel.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">{hotel.name}</h3>
                  <div className="flex items-center text-gray-600 text-sm mb-2">
                    <FaMapMarkerAlt className="mr-1" />
                    <span>{hotel.city}</span>
                  </div>
                </div>
                <div className="flex items-center bg-accent text-gray-900 px-2 py-1 rounded">
                  <FaStar className="mr-1" />
                  <span className="font-semibold">{hotel.rating}</span>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{hotel.address}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                <span>{hotel.totalRooms || 0} phòng</span>
                <span>{hotel.totalReviews || 0} đánh giá</span>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => openEditModal(hotel)}
                  className="flex-1 btn btn-outline btn-sm"
                >
                  <FaEdit className="mr-1" />
                  Sửa
                </button>
                <button
                  onClick={() => handleDelete(hotel._id)}
                  className="btn btn-outline btn-sm text-red-600 hover:bg-red-50"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Pagination */}
      {hotelsData?.pages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-outline btn-sm"
          >
            Trước
          </button>
          <span className="text-sm text-gray-600">
            Trang {page} / {hotelsData.pages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(hotelsData.pages, p + 1))}
            disabled={page === hotelsData.pages}
            className="btn btn-outline btn-sm"
          >
            Sau
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">
                {editingHotel ? 'Chỉnh sửa khách sạn' : 'Thêm khách sạn mới'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Tên khách sạn *</label>
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
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows="3"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Địa chỉ *</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Thành phố *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Số điện thoại *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Xếp hạng sao (1-5)</label>
                  <input
                    type="number"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                    className="input"
                    min="1"
                    max="5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Giờ nhận phòng</label>
                  <input
                    type="time"
                    value={formData.policies.checkInTime}
                    onChange={(e) => setFormData({
                      ...formData,
                      policies: { ...formData.policies, checkInTime: e.target.value }
                    })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Giờ trả phòng</label>
                  <input
                    type="time"
                    value={formData.policies.checkOutTime}
                    onChange={(e) => setFormData({
                      ...formData,
                      policies: { ...formData.policies, checkOutTime: e.target.value }
                    })}
                    className="input"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Chính sách hủy phòng</label>
                  <textarea
                    value={formData.policies.cancellationPolicy}
                    onChange={(e) => setFormData({
                      ...formData,
                      policies: { ...formData.policies, cancellationPolicy: e.target.value }
                    })}
                    className="input"
                    rows="2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Kinh độ (Longitude)</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.location.coordinates[0]}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: {
                        ...formData.location,
                        coordinates: [parseFloat(e.target.value), formData.location.coordinates[1]]
                      }
                    })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Vĩ độ (Latitude)</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.location.coordinates[1]}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: {
                        ...formData.location,
                        coordinates: [formData.location.coordinates[0], parseFloat(e.target.value)]
                      }
                    })}
                    className="input"
                  />
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
                    placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-3">Tiện nghi khách sạn</label>
                  
                  {/* Preset amenities */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    {HOTEL_AMENITIES.map((amenity) => (
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
                        <span className="text-sm font-medium flex-1">{amenity.label}</span>
                      </label>
                    ))}
                  </div>

                  {/* Custom amenities */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-medium mb-2">Tiện nghi khác</label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={customAmenity}
                        onChange={(e) => setCustomAmenity(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAmenity())}
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
                    {formData.amenities.filter(a => !HOTEL_AMENITIES.some(ha => ha.value === a)).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.amenities
                          .filter(a => !HOTEL_AMENITIES.some(ha => ha.value === a))
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
                  {(createMutation.isPending || updateMutation.isPending)
                    ? 'Đang xử lý...'
                    : editingHotel
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

export default Hotels;

