const Loading = ({ fullScreen = false, size = 'default', text = 'Đang tải...' }) => {
  const sizeClasses = {
    small: 'h-8 w-8 border-2',
    default: 'h-12 w-12 border-3',
    large: 'h-16 w-16 border-4',
  };

  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Modern Spinner */}
      <div className="relative">
        <div className={`${sizeClasses[size]} border-gray-200 rounded-full`}></div>
        <div className={`${sizeClasses[size]} border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0`}></div>
      </div>

      {/* Pulsing Dots */}
      <div className="flex gap-2">
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-75"></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150"></div>
      </div>

      {/* Loading Text */}
      {text && (
        <p className="text-gray-600 font-medium animate-pulse">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner />
    </div>
  );
};

export default Loading;
