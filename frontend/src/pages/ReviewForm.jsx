import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomAPI } from '../api/room.api';
import { reviewAPI } from '../api/review.api';
import toast from 'react-hot-toast';
import { FaStar } from 'react-icons/fa';
import Loading from '../components/Loading';

const ReviewForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const roomId = searchParams.get('roomId');
  const bookingId = searchParams.get('bookingId');

  const [formData, setFormData] = useState({
    rating: 5,
    cleanlinessRating: 5,
    serviceRating: 5,
    locationRating: 5,
    facilitiesRating: 5,
    valueForMoneyRating: 5,
    comment: '',
    images: [],
  });

  // Fetch room details
  const { data: roomData, isLoading } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => roomAPI.getRoom(roomId),
    enabled: !!roomId,
  });

  // Create review mutation
  const createReviewMutation = useMutation({
    mutationFn: (data) => reviewAPI.createReview(data),
    onSuccess: () => {
      toast.success('Đánh giá của bạn đã được gửi!');
      queryClient.invalidateQueries(['reviews', roomId]);
      navigate(`/rooms/${roomId}`);
    },
    onError: (error) => {
      toast.error(error.message || 'Gửi đánh giá thất bại');
    },
  });

  const room = roomData?.data;

  const handleRatingClick = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUrlsChange = (value) => {
    const urls = value.split('\n').filter(url => url.trim());
    setFormData({ ...formData, images: urls });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!roomId) {
      toast.error('Thông tin phòng không hợp lệ');
      return;
    }

    createReviewMutation.mutate({
      roomId,
      bookingId,
      ...formData,
    });
  };

  if (!roomId) {
    return (
      <div className="container-custom py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Thông tin không hợp lệ</h2>
        <button onClick={() => navigate('/profile')} className="btn btn-primary">
          Quay lại trang cá nhân
        </button>
      </div>
    );
  }

  if (isLoading) {
    return <Loading fullScreen />;
  }

  if (!room) {
    return (
      <div className="container-custom py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Không tìm thấy phòng</h2>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          Về trang chủ
        </button>
      </div>
    );
  }

  const RatingStars = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <FaStar
              className={`text-2xl ${
                star <= value ? 'text-yellow-500' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container-custom max-w-3xl">
        {/* Header */}
        <div className="card p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">Đánh giá của bạn</h1>
          <div className="flex items-start space-x-4">
            <img
              src={room.images?.[0]}
              alt={room.name}
              className="w-24 h-24 object-cover rounded-lg"
            />
            <div>
              <h3 className="font-semibold text-lg">{room.name}</h3>
              <p className="text-sm text-gray-600">{room.hotelId?.name}</p>
            </div>
          </div>
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="card p-6 space-y-6">
          {/* Overall Rating */}
          <div>
            <h3 className="font-bold mb-4">Đánh giá tổng thể</h3>
            <RatingStars
              label="Đánh giá chung"
              value={formData.rating}
              onChange={(value) => handleRatingClick('rating', value)}
            />
          </div>

          {/* Detailed Ratings */}
          <div>
            <h3 className="font-bold mb-4">Đánh giá chi tiết</h3>
            <div className="space-y-4">
              <RatingStars
                label="Vệ sinh"
                value={formData.cleanlinessRating}
                onChange={(value) => handleRatingClick('cleanlinessRating', value)}
              />
              <RatingStars
                label="Dịch vụ"
                value={formData.serviceRating}
                onChange={(value) => handleRatingClick('serviceRating', value)}
              />
              <RatingStars
                label="Vị trí"
                value={formData.locationRating}
                onChange={(value) => handleRatingClick('locationRating', value)}
              />
              <RatingStars
                label="Tiện nghi"
                value={formData.facilitiesRating}
                onChange={(value) => handleRatingClick('facilitiesRating', value)}
              />
              <RatingStars
                label="Giá trị"
                value={formData.valueForMoneyRating}
                onChange={(value) => handleRatingClick('valueForMoneyRating', value)}
              />
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block font-bold mb-2">
              Nhận xét của bạn *
            </label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              className="input"
              rows="5"
              placeholder="Chia sẻ trải nghiệm của bạn về phòng này..."
              required
              minLength="10"
            />
            <p className="text-sm text-gray-500 mt-1">
              Tối thiểu 10 ký tự
            </p>
          </div>

          {/* Images */}
          <div>
            <label className="block font-bold mb-2">
              Hình ảnh (tùy chọn)
            </label>
            <textarea
              value={formData.images.join('\n')}
              onChange={(e) => handleImageUrlsChange(e.target.value)}
              className="input"
              rows="3"
              placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg&#10;Mỗi URL một dòng"
            />
            <p className="text-sm text-gray-500 mt-1">
              Thêm hình ảnh để minh họa cho đánh giá của bạn
            </p>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-sm text-blue-900 mb-2">
              💡 Mẹo viết đánh giá hữu ích
            </h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Chia sẻ trải nghiệm thực tế của bạn</li>
              <li>• Đề cập đến những điểm nổi bật hoặc cần cải thiện</li>
              <li>• Sử dụng ngôn ngữ lịch sự và xây dựng</li>
              <li>• Thêm hình ảnh để đánh giá sinh động hơn</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={createReviewMutation.isPending}
              className="flex-1 btn btn-primary"
            >
              {createReviewMutation.isPending ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 btn btn-outline"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewForm;

