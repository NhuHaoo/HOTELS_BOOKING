// frontend/src/pages/HotelRooms.jsx

import { useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { hotelAPI } from "../api/hotel.api";
import { roomAPI } from "../api/room.api";
import Loading from "../components/Loading";
import RoomCard from "../components/RoomCard";
import {
  FaMapMarkerAlt,
  FaStar,
  FaHotel,
  FaPhone,
  FaEnvelope,
  FaClock,
  FaCheckCircle,
} from "react-icons/fa";

const HotelRooms = () => {
  const { hotelId } = useParams();
  const location = useLocation();
  const hotelFromState = location.state?.hotel || null;
  const searchFilters = location.state?.searchFilters || null;

  const [selectedImage, setSelectedImage] = useState(0);

  // Hotel
  const {
    data: hotelRes,
    isLoading: hotelLoading,
    isError: hotelError,
  } = useQuery({
    queryKey: ["hotel", hotelId],
    queryFn: () => hotelAPI.getHotel(hotelId),
    enabled: !!hotelId && !hotelFromState,
  });

  const hotel = hotelFromState || hotelRes?.data || hotelRes || null;

  // Rooms
  const {
    data: roomsRes,
    isLoading: roomsLoading,
    isError: roomsError,
  } = useQuery({
    queryKey: ["rooms-by-hotel", hotelId, searchFilters],
    queryFn: () => roomAPI.getRoomsByHotel(hotelId, searchFilters || {}),
    enabled: !!hotelId,
  });

  const rooms = roomsRes?.data || roomsRes || [];

  // Ảnh khách sạn
  const hotelImages = (() => {
    if (hotel?.images && Array.isArray(hotel.images) && hotel.images.length) {
      return hotel.images;
    }
    if (Array.isArray(rooms) && rooms.length > 0) {
      const imgs = [];
      rooms.forEach((room) => {
        if (Array.isArray(room.images)) {
          room.images.forEach((img) => {
            if (img && !imgs.includes(img)) {
              imgs.push(img);
            }
          });
        }
      });
      return imgs;
    }
    return [];
  })();

  const mainImage =
    hotelImages[selectedImage] ||
    hotel?.thumbnail ||
    "https://via.placeholder.com/800x450?text=Hotel";

  // 🔥 TIỆN NGHI KHÁCH SẠN:
  // 1) Nếu hotel.amenities là mảng và có phần tử → dùng
  // 2) Nếu không → gộp tiện nghi từ tất cả rooms[*].amenities
  const hotelAmenities = (() => {
    if (Array.isArray(hotel?.amenities) && hotel.amenities.length) {
      return hotel.amenities;
    }
    const set = new Set();
    rooms.forEach((room) => {
      if (Array.isArray(room.amenities)) {
        room.amenities.forEach((a) => a && set.add(a));
      }
    });
    return Array.from(set);
  })();

  // Chính sách hủy (có thì dùng, không có cũng không sao)
  const hotelCancellationPolicy =
    hotel?.cancellationPolicy || rooms[0]?.hotelId?.cancellationPolicy || null;

  if ((hotelLoading && !hotelFromState) || roomsLoading) {
    return <Loading />;
  }

  if (hotelError) return <p className="p-6">Không tải được thông tin khách sạn.</p>;
  if (roomsError) return <p className="p-6">Không tải được danh sách phòng.</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      <div className="container-custom py-8 space-y-6">
        {/* ========== GALLERY ẢNH KHÁCH SẠN ========== */}
        <div className="grid grid-cols-4 gap-2">
          <div className="col-span-4 md:col-span-3 h-80 md:h-96 rounded-xl overflow-hidden">
            <img
              src={mainImage}
              alt={hotel?.name || "Hotel"}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="col-span-4 md:col-span-1 grid grid-cols-4 md:grid-cols-1 gap-2">
            {(hotelImages.length ? hotelImages : [mainImage])
              .slice(0, 4)
              .map((img, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`h-20 md:h-24 rounded-lg overflow-hidden cursor-pointer border ${
                    selectedImage === index
                      ? "border-primary ring-2 ring-primary"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={img}
                    alt={`Hotel ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-110 transition-transform"
                  />
                </button>
              ))}
          </div>
        </div>

        {/* ========== THÔNG TIN KHÁCH SẠN ========== */}
        {hotel && (
          <div className="card p-6">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="font-bold text-2xl md:text-3xl">
                  {hotel.name}
                </h1>

                {hotel.hotelType && (
                  <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                    <FaHotel />
                    {hotel.hotelType === "hotel"
                      ? "Khách sạn"
                      : hotel.hotelType === "resort"
                      ? "Resort"
                      : hotel.hotelType === "apartment"
                      ? "Căn hộ"
                      : hotel.hotelType === "villa"
                      ? "Villa"
                      : hotel.hotelType === "hostel"
                      ? "Hostel"
                      : hotel.hotelType === "motel"
                      ? "Motel"
                      : hotel.hotelType}
                  </span>
                )}

                {hotel.starRating && (
                  <div className="flex items-center gap-1">
                    {[...Array(hotel.starRating)].map((_, i) => (
                      <FaStar key={i} className="text-yellow-400 text-sm" />
                    ))}
                  </div>
                )}
              </div>

              {hotel.address && (
                <div className="flex items-center text-gray-600 mb-2 text-sm">
                  <FaMapMarkerAlt className="mr-2" />
                  <span>
                    {hotel.address}
                    {hotel.city ? `, ${hotel.city}` : ""}
                  </span>
                </div>
              )}

              {hotel.rating && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center bg-primary text-white px-3 py-1 rounded-lg">
                    <FaStar className="mr-1" />
                    <span className="font-semibold">
                      {hotel.rating.toFixed ? hotel.rating.toFixed(1) : hotel.rating}
                    </span>
                  </div>
                  <span className="text-gray-600 text-sm">
                    ({hotel.totalReviews || 0} đánh giá)
                  </span>
                </div>
              )}
            </div>

            {hotel.introduction && (
              <div className="pt-4 border-t mt-4">
                <h4 className="font-semibold mb-2">Giới thiệu khách sạn</h4>
                <p className="text-gray-700 leading-relaxed">
                  {hotel.introduction}
                </p>
              </div>
            )}

            {hotel.description && (
              <div className="pt-4 border-t mt-4">
                <h4 className="font-semibold mb-2">Mô tả</h4>
                <p className="text-gray-700 leading-relaxed">
                  {hotel.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t mt-4">
              {hotel.phone && (
                <div className="flex items-center space-x-2">
                  <FaPhone className="text-primary" />
                  <div>
                    <div className="text-xs text-gray-500">Điện thoại</div>
                    <a
                      href={`tel:${hotel.phone}`}
                      className="font-semibold hover:text-primary"
                    >
                      {hotel.phone}
                    </a>
                  </div>
                </div>
              )}

              {hotel.email && (
                <div className="flex items-center space-x-2">
                  <FaEnvelope className="text-primary" />
                  <div>
                    <div className="text-xs text-gray-500">Email</div>
                    <a
                      href={`mailto:${hotel.email}`}
                      className="font-semibold hover:text-primary"
                    >
                      {hotel.email}
                    </a>
                  </div>
                </div>
              )}

              {hotel.checkInTime && (
                <div className="flex items-center space-x-2">
                  <FaClock className="text-primary" />
                  <div>
                    <div className="text-xs text-gray-500">Giờ nhận phòng</div>
                    <span className="font-semibold">{hotel.checkInTime}</span>
                  </div>
                </div>
              )}

              {hotel.checkOutTime && (
                <div className="flex items-center space-x-2">
                  <FaClock className="text-primary" />
                  <div>
                    <div className="text-xs text-gray-500">Giờ trả phòng</div>
                    <span className="font-semibold">{hotel.checkOutTime}</span>
                  </div>
                </div>
              )}
            </div>

            {/* TIỆN NGHI KHÁCH SẠN */}
            {hotelAmenities.length > 0 && (
              <div className="pt-4 border-t mt-4">
                <h4 className="font-semibold mb-3">Tiện nghi khách sạn</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {hotelAmenities.map((amenity, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 text-sm"
                    >
                      <span className="text-primary">✓</span>
                      <span className="capitalize">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CHÍNH SÁCH ĐỔI / HỦY */}
            {hotelCancellationPolicy && (
              <div className="pt-4 border-t mt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <FaCheckCircle className="text-primary" />
                  Chính sách đổi / hủy
                </h4>
                <div className="space-y-2 text-sm">
                  {hotelCancellationPolicy.freeCancellationDays > 0 && (
                    <div className="flex items-center gap-2 text-green-700">
                      <FaCheckCircle />
                      <span>
                        Hủy miễn phí trước{" "}
                        {hotelCancellationPolicy.freeCancellationDays} ngày
                      </span>
                    </div>
                  )}
                  {hotelCancellationPolicy.refundable ? (
                    <div className="flex items-center gap-2 text-green-700">
                      <FaCheckCircle />
                      <span>Có thể hoàn tiền</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-700">
                      <span>✗</span>
                      <span>Không hoàn tiền</span>
                    </div>
                  )}
                  {hotelCancellationPolicy.cancellationFee > 0 && (
                    <div className="text-gray-700">
                      Phí hủy: {hotelCancellationPolicy.cancellationFee}%
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========== DANH SÁCH PHÒNG ========== */}
        <section className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-semibold mb-4">Danh sách phòng</h2>

          {rooms.length === 0 ? (
            <p>Khách sạn hiện chưa có phòng khả dụng.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <RoomCard key={room._id} room={room} hotel={hotel} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default HotelRooms;
