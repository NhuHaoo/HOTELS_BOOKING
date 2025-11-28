import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "../../utils/axiosInstance";
import Loading from "../../components/Loading";
import toast from "react-hot-toast";
import { FaSearch, FaStar, FaTrash } from "react-icons/fa";
import { formatDate } from "../../utils/dateUtils";

const ManagerReviews = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRating, setFilterRating] = useState("");
  const [page, setPage] = useState(1);

  // API gọi cho manager
  const fetchManagerReviews = async () => {
    const res = await axios.get("/manager/reviews", {
      params: {
        page,
        limit: 15,
        search: searchTerm,
        rating: filterRating,
      },
    });
    return res.data;
  };

  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ["manager-reviews", page, searchTerm, filterRating],
    queryFn: fetchManagerReviews,
  });

  // Delete review
  const deleteMutation = useMutation({
    mutationFn: (id) => axios.delete(`/manager/reviews/${id}`),
    onSuccess: () => {
      toast.success("Xóa đánh giá thành công!");
      queryClient.invalidateQueries(["manager-reviews"]);
    },
    onError: () => {
      toast.error("Xóa đánh giá thất bại!");
    },
  });

  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc muốn xóa đánh giá này?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <Loading fullScreen />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Đánh giá khách hàng</h1>
        <p className="text-gray-600">
          Tổng số: {reviewsData?.total || 0} đánh giá
        </p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên phòng hoặc người dùng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Filter rating */}
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

      {/* Review List */}
      <div className="space-y-4">
        {reviewsData?.data?.map((review) => (
          <div key={review._id} className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start space-x-4">
              {/* Room image */}
              <img
                src={review.roomId?.images?.[0]}
                alt={review.roomId?.name}
                className="w-24 h-24 object-cover rounded-lg"
              />

              <div className="flex-1">
                {/* Header */}
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

                  <span className="text-gray-500">•</span>

                  <span className="text-sm text-gray-600">{formatDate(review.createdAt)}</span>
                </div>

                {/* Comment */}
                <p className="text-gray-700 mb-3">{review.comment}</p>

                {/* Images */}
                {review.images?.length > 0 && (
                  <div className="flex space-x-2 mb-3">
                    {review.images.slice(0, 4).map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        className="w-16 h-16 rounded object-cover"
                      />
                    ))}

                    {review.images.length > 4 && (
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-sm">
                        +{review.images.length - 4}
                      </div>
                    )}
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
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-outline btn-sm"
          >
            Trước
          </button>

          <span className="text-sm text-gray-600">
            Trang {page} / {reviewsData.pages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(reviewsData.pages, p + 1))}
            disabled={page === reviewsData.pages}
            className="btn btn-outline btn-sm"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
};

export default ManagerReviews;
