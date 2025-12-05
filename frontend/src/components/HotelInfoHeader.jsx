import { FaMapMarkerAlt, FaStar } from "react-icons/fa";

const HotelInfoHeader = ({ hotel }) => {
  if (!hotel) return null;

  return (
    <section className="bg-white rounded-xl shadow-md p-4 mb-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Ảnh khách sạn */}
        <div className="md:w-1/3">
          <img
            src={hotel.thumbnail || hotel.imageUrl}
            alt={hotel.name}
            className="w-full h-48 object-cover rounded-lg"
          />
        </div>

        {/* Thông tin chính */}
        <div className="md:w-2/3 flex flex-col justify-between">
          <div>
            <h1 className="text-2xl font-semibold mb-2">{hotel.name}</h1>

            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <FaMapMarkerAlt />
              <span>{hotel.address}</span>
            </div>

            {hotel.rating && (
              <div className="flex items-center gap-1 text-yellow-500 mb-2">
                <FaStar />
                <span className="font-semibold">{hotel.rating}</span>
                <span className="text-gray-500 text-sm">
                  ({hotel.totalReviews || 0} đánh giá)
                </span>
              </div>
            )}

            {hotel.description && (
              <p className="text-gray-700 text-sm line-clamp-3">
                {hotel.description}
              </p>
            )}
          </div>

          {/* Tiện nghi nổi bật */}
          {Array.isArray(hotel.amenities) && hotel.amenities.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {hotel.amenities.slice(0, 6).map((amenity) => (
                <span
                  key={amenity}
                  className="text-xs bg-gray-100 px-3 py-1 rounded-full"
                >
                  {amenity}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HotelInfoHeader;
