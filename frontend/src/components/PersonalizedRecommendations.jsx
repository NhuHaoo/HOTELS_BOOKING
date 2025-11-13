import { useQuery } from '@tanstack/react-query';
import { aiAPI } from '../api/ai.api';
import RoomCard from './RoomCard';
import Loading from './Loading';
import useAuthStore from '../store/useAuthStore';
import { FaRobot, FaHistory, FaMapMarkerAlt, FaDollarSign, FaBed, FaLightbulb } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const PersonalizedRecommendations = () => {
  const { isAuthenticated } = useAuthStore();

  // Only fetch if user is logged in
  const { data, isLoading, error } = useQuery({
    queryKey: ['personalized-recommendations'],
    queryFn: () => aiAPI.getPersonalizedRecommendations(6),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // If not authenticated, don't show this section
  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <section className="section-padding bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container-custom">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md mb-4">
              <FaRobot className="text-primary text-xl animate-pulse" />
              <span className="font-semibold text-primary">AI đang phân tích...</span>
            </div>
          </div>
          <Loading />
        </div>
      </section>
    );
  }

  if (error || !data?.data) {
    return null;
  }

  const { data: rooms, isPersonalized, preferences, aiInsights, message } = data;

  return (
    <section className="section-padding bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-gradient-to-br from-accent/10 to-primary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="container-custom relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white px-6 py-2 rounded-full shadow-lg mb-4 animate-fade-in">
            <FaRobot className="text-2xl animate-bounce" />
            <span className="font-bold text-lg">Gợi ý dành riêng cho bạn</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 text-gradient-primary">
            {isPersonalized ? '🎯 Phòng phù hợp với bạn' : '✨ Phòng phổ biến'}
          </h2>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {message || 'AI phân tích sở thích của bạn để đưa ra gợi ý tốt nhất'}
          </p>
        </div>

        {/* AI Insights */}
        {aiInsights && (
          <div className="max-w-4xl mx-auto mb-12 animate-slide-up">
            <div className="glass rounded-2xl p-6 border-2 border-white/40 shadow-luxury">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="bg-gradient-to-br from-primary to-secondary p-3 rounded-xl">
                    <FaLightbulb className="text-white text-2xl" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">💡 Lời khuyên từ AI</h3>
                  <p className="text-gray-700 leading-relaxed">{aiInsights}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Preferences Summary (only if personalized) */}
        {isPersonalized && preferences && (
          <div className="max-w-4xl mx-auto mb-12 animate-slide-up delay-100">
            <div className="bg-white rounded-2xl shadow-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaHistory className="text-primary text-xl" />
                <h3 className="text-lg font-bold text-gray-900">Sở thích của bạn</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Favorite Cities */}
                {preferences.favoriteCities && preferences.favoriteCities.length > 0 && (
                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
                    <FaMapMarkerAlt className="text-blue-600 text-xl mt-1" />
                    <div>
                      <p className="text-sm text-blue-800 font-semibold mb-1">Thành phố yêu thích</p>
                      <p className="text-blue-900">{preferences.favoriteCities.join(', ')}</p>
                    </div>
                  </div>
                )}

                {/* Average Price */}
                {preferences.averagePrice > 0 && (
                  <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl">
                    <FaDollarSign className="text-green-600 text-xl mt-1" />
                    <div>
                      <p className="text-sm text-green-800 font-semibold mb-1">Mức giá trung bình</p>
                      <p className="text-green-900">{preferences.averagePrice.toLocaleString()} VNĐ</p>
                    </div>
                  </div>
                )}

                {/* Favorite Room Types */}
                {preferences.favoriteRoomTypes && preferences.favoriteRoomTypes.length > 0 && (
                  <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl">
                    <FaBed className="text-purple-600 text-xl mt-1" />
                    <div>
                      <p className="text-sm text-purple-800 font-semibold mb-1">Loại phòng ưa thích</p>
                      <p className="text-purple-900">{preferences.favoriteRoomTypes.join(', ')}</p>
                    </div>
                  </div>
                )}
              </div>

              {preferences.bookingCount > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-600">
                    📊 Phân tích dựa trên <span className="font-bold text-primary">{preferences.bookingCount}</span> lần đặt phòng trước đó
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recommended Rooms */}
        {rooms && rooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {rooms.map((room, index) => (
              <div 
                key={room._id} 
                className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <RoomCard room={room} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="glass rounded-2xl p-8 max-w-md mx-auto">
              <FaRobot className="text-6xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Chưa có gợi ý phù hợp</p>
              <Link to="/search" className="btn btn-primary">
                Khám phá phòng
              </Link>
            </div>
          </div>
        )}

        {/* CTA */}
        {rooms && rooms.length > 0 && (
          <div className="text-center animate-fade-in delay-200">
            <Link 
              to="/search" 
              className="inline-flex items-center gap-2 btn btn-outline btn-lg hover:shadow-xl"
            >
              Xem tất cả phòng →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default PersonalizedRecommendations;

