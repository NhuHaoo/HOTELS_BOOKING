import { useQuery } from '@tanstack/react-query';
import { favoriteAPI } from '../api/favorite.api';
import RoomCard from '../components/RoomCard';
import Loading from '../components/Loading';
import { Link } from 'react-router-dom';
import { FaHeart } from 'react-icons/fa';

const Favorites = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoriteAPI.getFavorites(),
  });

  const handleFavoriteChange = () => {
    refetch();
  };

  if (isLoading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-8">
          <FaHeart className="text-red-500 text-3xl" />
          <h1 className="text-3xl font-bold">Phòng yêu thích</h1>
        </div>

        {data?.data?.length > 0 ? (
          <>
            <p className="text-gray-600 mb-6">
              Bạn có {data.count} phòng trong danh sách yêu thích
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data.data.map((favorite) => (
                <RoomCard
                  key={favorite._id}
                  room={favorite.roomId}
                  initialFavorited={true}
                  onFavoriteChange={handleFavoriteChange}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="text-8xl mb-6">💔</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Chưa có phòng yêu thích nào
            </h2>
            <p className="text-gray-600 mb-8">
              Khám phá và thêm những phòng bạn thích vào danh sách yêu thích
            </p>
            <Link to="/search" className="btn btn-primary">
              Tìm phòng ngay
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;

