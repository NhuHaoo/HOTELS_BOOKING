import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../api/admin.api';
import Loading from '../../components/Loading';
import toast from 'react-hot-toast';
import { FaSearch, FaStar, FaTrash, FaThumbsUp } from 'react-icons/fa';
import { formatDate } from '../../utils/dateUtils';

const Reviews = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [page, setPage] = useState(1);

  // Fetch reviews
  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['admin-reviews', page, searchTerm, filterRating],
    queryFn: () => adminAPI.getReviews({
      page,
      limit: 15,
      search: searchTerm,
      rating: filterRating,
    }),
  });

  // Delete review mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteReview(id),
    onSuccess: () => {
      toast.success('Xóa đánh giá thành công!');
      queryClient.invalidateQueries(['admin-reviews']);
    },
    onError: (error) => {
      toast.error(error.message || 'Xóa đánh giá thất bại');
    },
  });

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc muốn xóa đánh giá này?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Quản lý đánh giá</h1>
        <p className="text-gray-600">Tổng số: {reviewsData?.total || 0} đánh giá</p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo phòng hoặc người dùng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="input"
          >
            <option value="">Tất cả đánh giá</option>
            <option value="5">⭐⭐⭐⭐⭐ 5 sao</option>
            <option value="4">⭐⭐⭐⭐ 4 sao</option>
            <option value="3">⭐⭐⭐ 3 sao</option>
            <option value="2">⭐⭐ 2 sao</option>
            <option value="1">⭐ 1 sao</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviewsData?.data?.map((review) => (
          <div key={review._id} className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start space-x-4">
              {/* Room Image */}
              <img
                src={review.roomId?.images?.[0]}
                alt={review.roomId?.name}
                className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
              />

              {/* Review Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{review.roomId?.name}</h3>
                    <p className="text-sm text-gray-600">{review.hotelId?.name}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(review._id)}
                    className="text-red-600 hover:text-red-800 p-2"
                    title="Xóa đánh giá"
                  >
                    <FaTrash />
                  </button>
                </div>

                {/* Rating */}
                <div className="flex items-center space-x-3 mb-3">
                  <div className="flex items-center bg-accent text-gray-900 px-3 py-1 rounded-lg">
                    <FaStar className="mr-1" />
                    <span className="font-semibold">{review.rating}</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    bởi <span className="font-semibold">{review.userId?.name}</span>
                  </span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-600">{formatDate(review.createdAt)}</span>
                </div>

                {/* Comment */}
                <p className="text-gray-700 mb-3">{review.comment}</p>

                {/* Detailed Ratings */}
                {(review.cleanlinessRating || review.serviceRating || review.locationRating) && (
                  <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                    {review.cleanlinessRating && (
                      <div>
                        <span className="text-gray-600">Vệ sinh: </span>
                        <span className="font-semibold">{review.cleanlinessRating}/5</span>
                      </div>
                    )}
                    {review.serviceRating && (
                      <div>
                        <span className="text-gray-600">Dịch vụ: </span>
                        <span className="font-semibold">{review.serviceRating}/5</span>
                      </div>
                    )}
                    {review.locationRating && (
                      <div>
                        <span className="text-gray-600">Vị trí: </span>
                        <span className="font-semibold">{review.locationRating}/5</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Images */}
                {review.images?.length > 0 && (
                  <div className="flex space-x-2 mb-3">
                    {review.images.slice(0, 4).map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`Review ${index + 1}`}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ))}
                    {review.images.length > 4 && (
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-sm text-gray-600">
                        +{review.images.length - 4}
                      </div>
                    )}
                  </div>
                )}

                {/* Helpful Count */}
                {review.helpfulCount > 0 && (
                  <div className="flex items-center text-sm text-gray-600">
                    <FaThumbsUp className="mr-1 text-primary" />
                    <span>{review.helpfulCount} người thấy hữu ích</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {reviewsData?.pages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-outline btn-sm"
          >
            Trước
          </button>
          <span className="text-sm text-gray-600">
            Trang {page} / {reviewsData.pages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(reviewsData.pages, p + 1))}
            disabled={page === reviewsData.pages}
            className="btn btn-outline btn-sm"
          >
            Sau
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = reviewsData?.data?.filter(r => r.rating === rating).length || 0;
          const percentage = reviewsData?.total ? (count / reviewsData.total * 100).toFixed(1) : 0;
          return (
            <div key={rating} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">{rating} ⭐</span>
                <span className="text-sm text-gray-600">{count}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-accent h-2 rounded-full"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-600 mt-1">{percentage}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Reviews;

