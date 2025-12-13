import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { managerAPI } from '../../api/manager.api';
import Loading from '../../components/Loading';
import toast from 'react-hot-toast';
import { FaEdit, FaSave, FaTimes, FaMapMarkerAlt, FaPhone, FaEnvelope, FaGlobe, FaPlus, FaToggleOn, FaToggleOff, FaCheckCircle, FaBan, FaExclamationTriangle } from 'react-icons/fa';
import { hotelAPI } from '../../api/hotel.api';
import { HOTEL_AMENITIES } from '../../utils/constants';

const ManagerHotel = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    introduction: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    website: '',
    hotelType: 'hotel',
    starRating: 3,
    images: [],
    amenities: [],
    checkInTime: '14:00',
    checkOutTime: '12:00',
    cancellationPolicy: {
      freeCancellationDays: 3,
      cancellationFee: 0,
      refundable: true,
    },
    reschedulePolicy: {
      freeRescheduleDays: 3,
      rescheduleFee: 10,
      allowed: true,
    },
    location: {
      type: 'Point',
      coordinates: [106.6297, 10.8231],
    },
  });

  const [customAmenity, setCustomAmenity] = useState('');

  // Fetch hotel
  const { data: hotelData, isLoading, isError, error } = useQuery({
    queryKey: ['manager-hotel'],
    queryFn: () => managerAPI.getHotel(),
  });

  // Update hotel mutation
  const updateMutation = useMutation({
    mutationFn: (data) => managerAPI.updateHotel(data),
    onSuccess: () => {
      toast.success('Cập nhật thông tin khách sạn thành công!');
      queryClient.invalidateQueries(['manager-hotel']);
      setShowModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Cập nhật thất bại');
    },
  });

  // Toggle hotel active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: (id) => hotelAPI.toggleHotelActive(id),
    onSuccess: () => {
      toast.success('Cập nhật trạng thái thành công!');
      queryClient.invalidateQueries(['manager-hotel']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Cập nhật trạng thái thất bại');
    },
  });

  // Load hotel data into form
  useEffect(() => {
    if (hotelData?.data) {
      const hotel = hotelData.data;
      setFormData({
        name: hotel.name || '',
        description: hotel.description || '',
        introduction: hotel.introduction || '',
        address: hotel.address || '',
        city: hotel.city || '',
        phone: hotel.phone || '',
        email: hotel.email || '',
        website: hotel.website || '',
        hotelType: hotel.hotelType || 'hotel',
        starRating: hotel.starRating || 3,
        images: hotel.images || [],
        amenities: hotel.amenities || [],
        checkInTime: hotel.checkInTime || '14:00',
        checkOutTime: hotel.checkOutTime || '12:00',
        cancellationPolicy: hotel.cancellationPolicy || {
          freeCancellationDays: 3,
          cancellationFee: 0,
          refundable: true,
        },
        reschedulePolicy: hotel.reschedulePolicy || {
          freeRescheduleDays: 3,
          rescheduleFee: 10,
          allowed: true,
        },
        location: hotel.location || {
          type: 'Point',
          coordinates: [106.6297, 10.8231],
        },
      });
    }
  }, [hotelData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleImageUrlsChange = (value) => {
    const urls = value.split('\n').filter(url => url.trim());
    setFormData({ ...formData, images: urls });
  };

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
          <p className="text-red-500 text-lg mb-4">❌ Lỗi tải thông tin khách sạn</p>
          <p className="text-gray-600">{error?.message || 'Vui lòng thử lại sau'}</p>
        </div>
      </div>
    );
  }

  const hotel = hotelData?.data;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Thông tin khách sạn</h1>
          <p className="text-gray-600">Quản lý và cập nhật thông tin khách sạn của bạn</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary shadow-lg hover:shadow-xl transition-shadow"
        >
          <FaEdit className="mr-2" />
          Chỉnh sửa thông tin
        </button>
      </div>

      {/* Hotel Info Card */}
      {hotel && (
        <div className="card shadow-lg border-0 overflow-hidden">
          {/* Status Toggle for Manager */}
          {hotel.status !== 'violation' && (
            <div className={`mb-6 p-5 rounded-xl border-2 ${
              hotel.isActive 
                ? 'bg-green-50 border-green-200' 
                : 'bg-orange-50 border-orange-200'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-bold text-gray-900 text-lg">Trạng thái hoạt động</h4>
                    {hotel.isActive ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
                        <FaCheckCircle /> Đang hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-300">
                        <FaBan /> Đã tắt
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">
                    {hotel.isActive 
                      ? '✅ Khách sạn đang hiển thị trong kết quả tìm kiếm và có thể nhận đặt phòng' 
                      : '⚠️ Khách sạn đã bị ẩn khỏi kết quả tìm kiếm, khách hàng không thể tìm thấy'}
                  </p>
                </div>
                <button
                  onClick={() => toggleActiveMutation.mutate(hotel._id)}
                  className={`btn ${hotel.isActive ? 'btn-warning' : 'btn-success'} btn-sm shadow-md hover:shadow-lg transition-all whitespace-nowrap`}
                  disabled={toggleActiveMutation.isPending}
                >
                  {toggleActiveMutation.isPending ? (
                    'Đang xử lý...'
                  ) : hotel.isActive ? (
                    <>
                      <FaToggleOff className="mr-2" />
                      Tắt hoạt động
                    </>
                  ) : (
                    <>
                      <FaToggleOn className="mr-2" />
                      Bật hoạt động
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Images */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-xl font-bold text-gray-900">Hình ảnh khách sạn</h3>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                  {hotel.images?.length || 0} ảnh
                </span>
              </div>
              {hotel.images && hotel.images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {hotel.images.map((img, index) => (
                    <div key={index} className="relative group overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300">
                      <img
                        src={img}
                        alt={`${hotel.name} ${index + 1}`}
                        className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 text-center">
                  <p className="text-gray-500">Chưa có hình ảnh</p>
                  <p className="text-sm text-gray-400 mt-1">Vui lòng thêm hình ảnh trong phần chỉnh sửa</p>
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="bg-gradient-to-br from-white to-blue-50 p-6 rounded-xl border border-blue-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">Thông tin cơ bản</h3>
              <div className="space-y-4">
                <div className="p-3 bg-white rounded-lg border border-gray-100">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tên khách sạn</span>
                  <p className="text-lg font-bold text-gray-900 mt-1">{hotel.name}</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-gray-100">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Trạng thái</span>
                  <div className="mt-2">
                    {hotel.status === 'active' && hotel.isActive ? (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-300">
                        <FaCheckCircle /> Đang hoạt động
                      </span>
                    ) : hotel.status === 'suspended' ? (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">
                        <FaBan /> Tạm khóa
                      </span>
                    ) : hotel.status === 'violation' ? (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold bg-red-100 text-red-800 border border-red-300">
                        <FaExclamationTriangle /> Vi phạm
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold bg-gray-100 text-gray-800 border border-gray-300">
                        <FaToggleOff /> Không hoạt động
                      </span>
                    )}
                    {hotel.status === 'violation' && hotel.violationReason && (
                      <p className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded border border-red-200">⚠️ Lý do: {hotel.violationReason}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-lg border border-gray-100">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Loại</span>
                    <p className="text-base font-semibold text-gray-900 mt-1 capitalize">{hotel.hotelType}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-gray-100">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Xếp hạng</span>
                    <p className="text-base font-semibold text-gray-900 mt-1">{'⭐'.repeat(hotel.starRating || 0)} {hotel.starRating} sao</p>
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-gray-100">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Đánh giá trung bình</span>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-2xl font-bold text-blue-600">{hotel.rating?.toFixed(1) || 0}</p>
                    <span className="text-sm text-gray-500">/ 5.0</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-gradient-to-br from-white to-purple-50 p-6 rounded-xl border border-purple-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">Thông tin liên hệ</h3>
              <div className="space-y-4">
                <div className="p-3 bg-white rounded-lg border border-gray-100">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FaMapMarkerAlt className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Địa chỉ</span>
                      <p className="text-base font-semibold text-gray-900 mt-1">{hotel.address}</p>
                      <p className="text-sm text-gray-600 mt-1">{hotel.city}</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FaPhone className="text-green-600" />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Số điện thoại</span>
                      <p className="text-base font-semibold text-gray-900 mt-1">{hotel.phone}</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <FaEnvelope className="text-red-600" />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</span>
                      <p className="text-base font-semibold text-gray-900 mt-1 break-all">{hotel.email}</p>
                    </div>
                  </div>
                </div>
                {hotel.website && (
                  <div className="p-3 bg-white rounded-lg border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <FaGlobe className="text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Website</span>
                        <a 
                          href={hotel.website} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-base font-semibold text-blue-600 hover:text-blue-800 hover:underline mt-1 block break-all"
                        >
                          {hotel.website}
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="md:col-span-2 bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">Mô tả khách sạn</h3>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">{hotel.description}</p>
            </div>

            {hotel.introduction && (
              <div className="md:col-span-2 bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">Giới thiệu</h3>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{hotel.introduction}</p>
              </div>
            )}

            {/* Policies */}
            <div className="md:col-span-2 bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">Chính sách</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Giờ nhận phòng</span>
                  <p className="text-2xl font-bold text-blue-900 mt-2">{hotel.checkInTime || '14:00'}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                  <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Giờ trả phòng</span>
                  <p className="text-2xl font-bold text-purple-900 mt-2">{hotel.checkOutTime || '12:00'}</p>
                </div>
              </div>
              {hotel.cancellationPolicy && (
                <div className="mb-4 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <FaExclamationTriangle className="text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-blue-900">Chính sách hủy phòng</h4>
                  </div>
                  <div className="space-y-2 text-sm text-blue-800 ml-12">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">✓</span>
                      <p>Hủy miễn phí trước <strong>{hotel.cancellationPolicy.freeCancellationDays || 1} ngày</strong> nhận phòng</p>
                    </div>
                    {hotel.cancellationPolicy.cancellationFee > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">⚠</span>
                        <p>Phí hủy: <strong>{hotel.cancellationPolicy.cancellationFee}%</strong> giá trị đặt phòng</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{hotel.cancellationPolicy.refundable ? '✓' : '✗'}</span>
                      <p>Hoàn tiền: <strong>{hotel.cancellationPolicy.refundable ? 'Có' : 'Không'}</strong></p>
                    </div>
                  </div>
                </div>
              )}
              {hotel.reschedulePolicy && (
                <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <FaEdit className="text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-purple-900">Chính sách đổi lịch</h4>
                  </div>
                  <div className="space-y-2 text-sm text-purple-800 ml-12">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">✓</span>
                      <p>Đổi miễn phí trước <strong>{hotel.reschedulePolicy.freeRescheduleDays || 3} ngày</strong> nhận phòng</p>
                    </div>
                    {hotel.reschedulePolicy.rescheduleFee > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">⚠</span>
                        <p>Phí đổi lịch: <strong>{hotel.reschedulePolicy.rescheduleFee}%</strong> giá trị đặt phòng</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{hotel.reschedulePolicy.allowed ? '✓' : '✗'}</span>
                      <p>Cho phép đổi lịch: <strong>{hotel.reschedulePolicy.allowed ? 'Có' : 'Không'}</strong></p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Amenities */}
            {hotel.amenities && hotel.amenities.length > 0 && (
              <div className="md:col-span-2 bg-white p-6 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Tiện nghi khách sạn</h3>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-full">
                    {hotel.amenities.length} tiện nghi
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {hotel.amenities.map((amenity, index) => {
                    const amenityObj = HOTEL_AMENITIES.find(a => a.value === amenity);
                    return (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-2 rounded-lg text-sm font-medium text-gray-800 border border-indigo-200 shadow-sm hover:shadow-md transition-shadow"
                      >
                        {amenityObj?.icon && <span className="text-lg">{amenityObj.icon}</span>}
                        <span>{amenityObj?.label || amenity}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl">
            <div className="p-6 border-b sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Chỉnh sửa thông tin khách sạn</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <FaTimes className="text-gray-600" />
                </button>
              </div>
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
                  <label className="block text-sm font-medium mb-2">Giới thiệu</label>
                  <textarea
                    value={formData.introduction}
                    onChange={(e) => setFormData({ ...formData, introduction: e.target.value })}
                    className="input"
                    rows="3"
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
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Loại khách sạn</label>
                  <select
                    value={formData.hotelType}
                    onChange={(e) => setFormData({ ...formData, hotelType: e.target.value })}
                    className="input"
                  >
                    <option value="hotel">Khách sạn</option>
                    <option value="resort">Resort</option>
                    <option value="apartment">Căn hộ</option>
                    <option value="villa">Villa</option>
                    <option value="hostel">Nhà trọ</option>
                    <option value="motel">Motel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Xếp hạng sao (1-5)</label>
                  <input
                    type="number"
                    value={formData.starRating}
                    onChange={(e) => setFormData({ ...formData, starRating: parseInt(e.target.value) })}
                    className="input"
                    min="1"
                    max="5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Giờ nhận phòng</label>
                  <input
                    type="time"
                    value={formData.checkInTime}
                    onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Giờ trả phòng</label>
                  <input
                    type="time"
                    value={formData.checkOutTime}
                    onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                    className="input"
                  />
                </div>

                {/* Chính sách hủy phòng */}
                <div className="md:col-span-2 border-t pt-4 mt-4">
                  <h3 className="text-lg font-semibold mb-3">Chính sách hủy phòng</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Số ngày hủy miễn phí
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.cancellationPolicy?.freeCancellationDays || 3}
                        onChange={(e) => setFormData({
                          ...formData,
                          cancellationPolicy: {
                            ...formData.cancellationPolicy,
                            freeCancellationDays: parseInt(e.target.value) || 0
                          }
                        })}
                        className="input"
                      />
                      <p className="text-xs text-gray-500 mt-1">Số ngày trước check-in</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Phí hủy (VNĐ)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.cancellationPolicy?.cancellationFee || 0}
                        onChange={(e) => setFormData({
                          ...formData,
                          cancellationPolicy: {
                            ...formData.cancellationPolicy,
                            cancellationFee: parseFloat(e.target.value) || 0
                          }
                        })}
                        className="input"
                        disabled
                      />
                      <p className="text-xs text-gray-500 mt-1">Tự động tính: 50% tổng tiền đã thanh toán khi hủy trong vòng 3 ngày (hoàn lại 50%)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Có hoàn tiền
                      </label>
                      <select
                        value={formData.cancellationPolicy?.refundable ? 'true' : 'false'}
                        onChange={(e) => setFormData({
                          ...formData,
                          cancellationPolicy: {
                            ...formData.cancellationPolicy,
                            refundable: e.target.value === 'true'
                          }
                        })}
                        className="input"
                      >
                        <option value="true">Có</option>
                        <option value="false">Không</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Chính sách đổi lịch */}
                <div className="md:col-span-2 border-t pt-4 mt-4">
                  <h3 className="text-lg font-semibold mb-3">Chính sách đổi lịch</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Số ngày đổi miễn phí
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.reschedulePolicy?.freeRescheduleDays || 3}
                        onChange={(e) => setFormData({
                          ...formData,
                          reschedulePolicy: {
                            ...formData.reschedulePolicy,
                            freeRescheduleDays: parseInt(e.target.value) || 0
                          }
                        })}
                        className="input"
                      />
                      <p className="text-xs text-gray-500 mt-1">Số ngày trước check-in</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Phí đổi lịch (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.reschedulePolicy?.rescheduleFee || 10}
                        onChange={(e) => setFormData({
                          ...formData,
                          reschedulePolicy: {
                            ...formData.reschedulePolicy,
                            rescheduleFee: parseFloat(e.target.value) || 10
                          }
                        })}
                        className="input"
                      />
                      <p className="text-xs text-gray-500 mt-1">Phí đổi lịch khi đổi trong vòng 3 ngày (mặc định: 10%)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Cho phép đổi lịch
                      </label>
                      <select
                        value={formData.reschedulePolicy?.allowed ? 'true' : 'false'}
                        onChange={(e) => setFormData({
                          ...formData,
                          reschedulePolicy: {
                            ...formData.reschedulePolicy,
                            allowed: e.target.value === 'true'
                          }
                        })}
                        className="input"
                      >
                        <option value="true">Có</option>
                        <option value="false">Không</option>
                      </select>
                    </div>
                  </div>
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
                        <FaTimes className="rotate-45" />
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
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-outline"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Đang lưu...' : (
                    <>
                      <FaSave className="mr-2" />
                      Lưu thay đổi
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerHotel;

