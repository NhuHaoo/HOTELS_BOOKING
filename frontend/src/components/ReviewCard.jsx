import { FaStar, FaThumbsUp } from 'react-icons/fa';
import { formatDate } from '../utils/dateUtils';

const ReviewCard = ({ review, onMarkHelpful }) => {
  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FaStar
        key={index}
        className={index < rating ? 'text-yellow-400' : 'text-gray-300'}
      />
    ));
  };

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-lg">
            {review.userId?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          
          {/* User Info */}
          <div>
            <h4 className="font-semibold text-gray-900">
              {review.userId?.name || 'Người dùng'}
            </h4>
            <p className="text-sm text-gray-600">
              {formatDate(review.createdAt, 'dd/MM/yyyy')}
            </p>
            {review.isVerified && (
              <span className="inline-block mt-1 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                ✓ Đã xác nhận
              </span>
            )}
          </div>
        </div>

        {/* Overall Rating */}
        <div className="flex items-center bg-primary text-white px-3 py-1 rounded-lg font-semibold">
          <FaStar className="mr-1" />
          {review.rating.toFixed(1)}
        </div>
      </div>

      {/* Rating Details */}
      {(review.cleanliness || review.comfort || review.location || review.service || review.valueForMoney) && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 text-sm">
          {review.cleanliness && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Vệ sinh:</span>
              <div className="flex">{renderStars(review.cleanliness).slice(0, review.cleanliness)}</div>
            </div>
          )}
          {review.comfort && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tiện nghi:</span>
              <div className="flex">{renderStars(review.comfort).slice(0, review.comfort)}</div>
            </div>
          )}
          {review.location && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Vị trí:</span>
              <div className="flex">{renderStars(review.location).slice(0, review.location)}</div>
            </div>
          )}
          {review.service && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Dịch vụ:</span>
              <div className="flex">{renderStars(review.service).slice(0, review.service)}</div>
            </div>
          )}
          {review.valueForMoney && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Giá cả:</span>
              <div className="flex">{renderStars(review.valueForMoney).slice(0, review.valueForMoney)}</div>
            </div>
          )}
        </div>
      )}

      {/* Comment */}
      <p className="text-gray-700 mb-4">{review.comment}</p>

      {/* Images */}
      {review.images && review.images.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          {review.images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`Review ${index + 1}`}
              className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-80"
            />
          ))}
        </div>
      )}

      {/* Helpful Button */}
      <div className="flex items-center space-x-4 text-sm text-gray-600">
        <button
          onClick={() => onMarkHelpful?.(review._id)}
          className="flex items-center space-x-2 hover:text-primary transition-colors"
        >
          <FaThumbsUp />
          <span>Hữu ích ({review.helpfulCount || 0})</span>
        </button>
      </div>
    </div>
  );
};

export default ReviewCard;

