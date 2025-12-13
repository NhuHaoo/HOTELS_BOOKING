import { useQuery } from '@tanstack/react-query';
import HeroSearchBar from '../components/HeroSearchBar';
import RoomCard from '../components/RoomCard';
import Loading from '../components/Loading';
import PersonalizedRecommendations from '../components/PersonalizedRecommendations';
import { roomAPI } from '../api/room.api';
import { aiAPI } from '../api/ai.api';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaFire, FaStar, FaHotel, FaShieldAlt, FaHeadset, FaArrowRight } from 'react-icons/fa';

const Home = () => {
  // Fetch popular rooms
  const { data: popularRooms, isLoading: loadingPopular } = useQuery({
    queryKey: ['popular-rooms'],
    queryFn: () => aiAPI.getPopularRooms(8),
  });

  // Fetch trending destinations
  const { data: trendingDestinations, isLoading: loadingTrending } = useQuery({
    queryKey: ['trending-destinations'],
    queryFn: () => aiAPI.getTrendingDestinations(6),
  });

  // Fetch featured rooms
  const { data: featuredRooms, isLoading: loadingFeatured } = useQuery({
    queryKey: ['featured-rooms'],
    queryFn: () => roomAPI.getRooms({ page: 1, limit: 6, sort: '-rating' }),
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section - Ultra Enhanced */}
      <section
        className="relative min-h-[520px] md:min-h-[620px] bg-cover bg-center flex items-center overflow-hidden"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80')",
        }}
      >
        {/* Multi-layer Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/95 via-blue-800/85 to-blue-600/75"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
        
        {/* Animated Decorative Elements */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-yellow-400/10 to-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/10 to-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-cyan-400/5 to-blue-500/5 rounded-full blur-3xl animate-pulse delay-[2000ms]"></div>

        {/* Content */}
        <div className="container-custom relative z-10 py-10 md:py-12">
          <div className="max-w-4xl mx-auto text-center text-white mb-16">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 mb-6 animate-fade-in">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-4 py-1.5 rounded-full text-xs font-bold shadow-xl border-2 border-yellow-300/50 hover:scale-105 transition-transform">
                ✨ Hệ thống đặt phòng #1 Việt Nam
              </span>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-4 animate-fade-in leading-[1.1] tracking-tight">
              <span className="block text-white drop-shadow-2xl">Khám phá và Đặt phòng</span>
              <span className="block bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-300 bg-clip-text text-transparent drop-shadow-2xl mt-2">
                Khách sạn tuyệt vời
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-sm md:text-base lg:text-lg text-blue-100 animate-slide-up mb-4 leading-relaxed max-w-3xl mx-auto font-medium">
              Tìm kiếm hàng ngàn khách sạn với giá tốt nhất trên toàn quốc
            </p>
            <p className="text-xs md:text-sm text-blue-200 animate-slide-up delay-100 mb-6">
              🚀 Đặt nhanh • 💰 Giá rẻ • ⭐ Uy tín
            </p>

            {/* Enhanced Stats */}
            <div className="flex flex-wrap justify-center gap-3 md:gap-4 animate-slide-up delay-200 mb-6">
              <div className="group bg-white/15 backdrop-blur-lg rounded-2xl px-4 md:px-5 py-3 border border-white/30 shadow-2xl hover:bg-white/25 hover:scale-105 transition-all duration-300">
                <div className="text-xl md:text-2xl font-black bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">10,000+</div>
                <div className="text-[11px] md:text-xs text-blue-100 font-semibold mt-1">Khách sạn</div>
              </div>
              <div className="group bg-white/15 backdrop-blur-lg rounded-2xl px-4 md:px-5 py-3 border border-white/30 shadow-2xl hover:bg-white/25 hover:scale-105 transition-all duration-300">
                <div className="text-xl md:text-2xl font-black bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">50,000+</div>
                <div className="text-[11px] md:text-xs text-blue-100 font-semibold mt-1">Đặt phòng</div>
              </div>
              <div className="group bg-white/15 backdrop-blur-lg rounded-2xl px-4 md:px-5 py-3 border border-white/30 shadow-2xl hover:bg-white/25 hover:scale-105 transition-all duration-300">
                <div className="text-xl md:text-2xl font-black bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">4.8⭐</div>
                <div className="text-[11px] md:text-xs text-blue-100 font-semibold mt-1">Đánh giá</div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <HeroSearchBar />
        </div>

        {/* Scroll Indicator - Enhanced */}
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="flex flex-col items-center gap-2 text-white/80 hover:text-white transition-colors cursor-pointer">
            <span className="text-xs font-semibold">Khám phá thêm</span>
            <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center hover:border-white transition-colors">
              <div className="w-1.5 h-3 bg-white/70 rounded-full mt-2"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Personalized Recommendations Section - AI Powered */}
      <PersonalizedRecommendations />

      {/* Popular Rooms Section - Enhanced */}
      <section className="py-12 md:py-14 bg-gradient-to-b from-white to-gray-50">
        <div className="container-custom">
          {/* Section Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full mb-4">
              <FaFire className="animate-pulse" />
              <span className="font-semibold">Hot nhất tuần này</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Phòng phổ biến nhất
            </h2>
            <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto">
              Được khách hàng lựa chọn và đặt nhiều nhất trong 7 ngày qua
            </p>
          </div>

          {loadingPopular ? (
            <Loading />
          ) : popularRooms?.data?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {popularRooms.data.slice(0, 8).map((room, index) => (
                <div key={room._id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <RoomCard room={room} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏨</div>
              <p className="text-gray-600">Chưa có dữ liệu phòng phổ biến</p>
            </div>
          )}

          <div className="text-center mt-12">
            <Link 
              to="/search" 
              className="inline-flex items-center gap-2 btn btn-primary btn-lg group"
            >
              <span>Xem tất cả phòng</span>
              <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Trending Destinations - Enhanced */}
      <section className="py-12 md:py-14 bg-white">
        <div className="container-custom">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-primary px-4 py-2 rounded-full mb-4">
              <FaMapMarkerAlt className="animate-pulse" />
              <span className="font-semibold">Địa điểm yêu thích</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Điểm đến xu hướng
            </h2>
            <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto">
              Khám phá những điểm đến hot nhất được khách du lịch yêu thích
            </p>
          </div>

          {loadingTrending ? (
            <Loading />
          ) : trendingDestinations?.data?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendingDestinations.data.map((destination, index) => (
                <Link
                  key={index}
                  to={`/search?city=${destination._id}`}
                  className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
                >
                  <div className="relative h-64 md:h-72">
                    <img
                      src={`https://source.unsplash.com/800x600/?${destination._id},vietnam,hotel`}
                      alt={destination._id}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80"></div>
                    
                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-4">
                      <div className="flex items-center text-white mb-3">
                        <FaMapMarkerAlt className="text-accent mr-2 text-lg" />
                        <span className="text-xl md:text-2xl font-bold">{destination._id}</span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-white/90 text-sm">
                        <span className="flex items-center gap-1">
                          <FaHotel />
                          {destination.totalRooms} phòng
                        </span>
                        <span className="flex items-center gap-1">
                          <FaStar className="text-yellow-400" />
                          {destination.avgRating?.toFixed(1)}
                        </span>
                      </div>

                      {/* Hover Arrow */}
                      <div className="absolute top-6 right-6 bg-white/20 backdrop-blur-sm p-3 rounded-full opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                        <FaArrowRight className="text-white" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📍</div>
              <p className="text-gray-600">Chưa có dữ liệu điểm đến</p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Rooms - Enhanced */}
      <section className="py-12 md:py-14 bg-gradient-to-b from-gray-50 to-white">
        <div className="container-custom">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-yellow-50 text-accent px-4 py-2 rounded-full mb-4">
              <FaStar className="animate-pulse" />
              <span className="font-semibold">Được đánh giá cao nhất</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Phòng đánh giá cao
            </h2>
            <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto">
              Những phòng được khách hàng đánh giá và yêu thích nhất
            </p>
          </div>

          {loadingFeatured ? (
            <Loading />
          ) : featuredRooms?.data?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredRooms.data.map((room, index) => (
                <div key={room._id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <RoomCard room={room} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⭐</div>
              <p className="text-gray-600">Chưa có dữ liệu phòng</p>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us - Enhanced */}
      <section className="py-12 md:py-14 bg-gradient-to-br from-primary via-primary-dark to-primary">
        <div className="container-custom">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Tại sao chọn chúng tôi?
            </h2>
            <p className="text-gray-200 text-sm md:text-base max-w-2xl mx-auto">
              Trải nghiệm đặt phòng tuyệt vời với nhiều ưu đãi hấp dẫn
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Feature 1 */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2 group">
              <div className="bg-accent/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FaHotel className="text-accent text-2xl" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Giá tốt nhất</h3>
              <p className="text-gray-200 leading-relaxed text-sm">
                Cam kết giá tốt nhất thị trường. Hoàn tiền 100% nếu tìm thấy giá rẻ hơn trong vòng 24h.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2 group">
              <div className="bg-accent/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FaShieldAlt className="text-accent text-2xl" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Thanh toán an toàn</h3>
              <p className="text-gray-200 leading-relaxed text-sm">
                Hệ thống thanh toán được mã hóa SSL 256-bit. Bảo mật tuyệt đối thông tin cá nhân.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2 group">
              <div className="bg-accent/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FaHeadset className="text-accent text-2xl" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Hỗ trợ 24/7</h3>
              <p className="text-gray-200 leading-relaxed text-sm">
                Đội ngũ chăm sóc khách hàng chuyên nghiệp luôn sẵn sàng hỗ trợ bạn mọi lúc, mọi nơi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - New */}
      <section className="py-12 md:py-14 bg-white">
        <div className="container-custom">
          <div className="bg-gradient-to-r from-primary to-primary-dark rounded-3xl p-8 md:p-10 text-center text-white relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">
                Sẵn sàng cho chuyến đi tiếp theo?
              </h2>
              <p className="text-sm md:text-base text-gray-200 mb-8 max-w-2xl mx-auto">
                Đăng ký nhận ưu đãi đặc biệt và khám phá hàng ngàn khách sạn tuyệt vời
              </p>
              <Link 
                to="/search" 
                className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 transform hover:scale-105 shadow-xl"
              >
                <span>Khám phá ngay</span>
                <FaArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
