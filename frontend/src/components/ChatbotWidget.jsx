import { useState, useRef, useEffect } from 'react';
import { FaComments, FaTimes, FaPaperPlane, FaTrash, FaStar, FaMapMarkerAlt, FaExternalLinkAlt } from 'react-icons/fa';
import { aiAPI } from '../api/ai.api';
import { formatPrice } from '../utils/formatPrice';
import { useNavigate } from 'react-router-dom';

const ChatbotWidget = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  
  // Initialize messages from localStorage or default
  const getInitialMessages = () => {
    const saved = localStorage.getItem('chatbot_messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert timestamp strings back to Date objects
        return parsed.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      } catch (e) {
        console.error('Error parsing saved messages:', e);
      }
    }
    return [
      {
        type: 'bot',
        text: 'Xin chào! 👋 Tôi là trợ lý ảo của hệ thống đặt phòng khách sạn. Tôi có thể giúp bạn:\n\n• Tìm kiếm và đặt phòng\n• Tra cứu giá phòng\n• Hỗ trợ thanh toán\n• Giải đáp chính sách\n\nBạn cần hỗ trợ gì ạ? 😊',
        timestamp: new Date(),
      },
    ];
  };

  const [messages, setMessages] = useState(getInitialMessages);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chatbot_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clear conversation
  const handleClearConversation = () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ cuộc trò chuyện?')) {
      const initialMessage = {
        type: 'bot',
        text: 'Xin chào! 👋 Tôi là trợ lý ảo của hệ thống đặt phòng khách sạn. Tôi có thể giúp bạn:\n\n• Tìm kiếm và đặt phòng\n• Tra cứu giá phòng\n• Hỗ trợ thanh toán\n• Giải đáp chính sách\n\nBạn cần hỗ trợ gì ạ? 😊',
        timestamp: new Date(),
      };
      setMessages([initialMessage]);
      localStorage.removeItem('chatbot_messages');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      type: 'user',
      text: inputText,
      timestamp: new Date(),
    };

    const currentInput = inputText;
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Build conversation context from message history
      // Only include last 10 messages to avoid token limits
      const conversationContext = messages
        .slice(-10) // Last 10 messages only
        .filter(msg => msg.type !== 'error') // Exclude error messages
        .map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.text
        }));

      // Call AI API with context
      const response = await aiAPI.chat(currentInput, conversationContext);
      
      const botMessage = {
        type: 'bot',
        text: response.data.response,
        timestamp: new Date(),
        functionCalled: response.data.functionCalled,
        functionResult: response.data.functionResult,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage = {
        type: 'bot',
        text: 'Xin lỗi, tôi gặp sự cố. Vui lòng thử lại sau. 😔',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    'Tìm phòng ở Đà Nẵng',
    'Phòng có giá dưới 1 triệu',
    'Khách sạn nào có view biển?',
    'Phòng cho 2 người ở Hà Nội',
  ];

  const handleSuggestionClick = (question) => {
    setInputText(question);
  };

  // Render rich content based on function call results
  const renderFunctionResult = (functionName, result) => {
    if (!result || !result.success) return null;

    // Render search rooms results
    if (functionName === 'searchRooms' && result.rooms) {
      return (
        <div className="mt-3 space-y-2">
          {result.rooms.map((room, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              <div className="flex gap-2">
                {/* Room Image */}
                {room.image && (
                  <img 
                    src={room.image} 
                    alt={room.name}
                    className="w-24 h-24 object-cover"
                  />
                )}
                
                {/* Room Info */}
                <div className="flex-1 p-2 min-w-0">
                  <h4 className="font-semibold text-xs text-gray-900 truncate">{room.name}</h4>
                  <p className="text-xs text-gray-600 truncate">{room.hotel}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <FaMapMarkerAlt className="text-gray-400 text-xs" />
                    <span className="text-xs text-gray-500">{room.city}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1">
                      <FaStar className="text-yellow-500 text-xs" />
                      <span className="text-xs font-semibold">{room.rating?.toFixed(1)}</span>
                    </div>
                    <span className="text-sm font-bold text-accent">{formatPrice(room.price)}</span>
                  </div>
                  
                  {/* Action Button */}
                  <button
                    onClick={() => {
                      navigate(room.link);
                      setIsOpen(false);
                    }}
                    className="w-full text-xs bg-primary text-white px-2 py-1 rounded hover:bg-primary-dark transition-colors mt-2"
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Render room details
    if (functionName === 'getRoomDetails' && result.room) {
      const room = result.room;
      return (
        <div className="mt-3 bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          {/* Room Images */}
          {room.images && room.images.length > 0 && (
            <img 
              src={room.images[0]} 
              alt={room.name}
              className="w-full h-32 object-cover"
            />
          )}
          
          {/* Room Details */}
          <div className="p-3">
            <h3 className="font-bold text-sm text-gray-900 mb-1">{room.name}</h3>
            <p className="text-xs text-gray-600 mb-2">{room.hotel.name}</p>
            
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1">
                <FaStar className="text-yellow-500 text-sm" />
                <span className="text-sm font-semibold">{room.rating?.toFixed(1)}</span>
                <span className="text-xs text-gray-500">({room.totalReviews} đánh giá)</span>
              </div>
            </div>
            
            <p className="text-xs text-gray-700 line-clamp-2 mb-2">{room.description}</p>
            
            {/* Amenities */}
            {room.amenities && room.amenities.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {room.amenities.slice(0, 4).map((amenity, idx) => (
                  <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                    {amenity}
                  </span>
                ))}
                {room.amenities.length > 4 && (
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                    +{room.amenities.length - 4}
                  </span>
                )}
              </div>
            )}
            
            {/* Price & Actions */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                <span className="text-lg font-bold text-accent">{formatPrice(room.price)}</span>
                <span className="text-xs text-gray-500"> / đêm</span>
              </div>
            </div>
            
            <button
              onClick={() => {
                navigate(room.link);
                setIsOpen(false);
              }}
              className="w-full text-center text-sm bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 mt-3 font-semibold"
            >
              <FaExternalLinkAlt size={12} />
              Xem chi tiết phòng
            </button>
          </div>
        </div>
      );
    }

    // Note: createBookingLink function removed - users should view details first
    return null;
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary-dark transition-all hover:scale-110 z-50"
      >
        {isOpen ? <FaTimes size={24} /> : <FaComments size={24} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl z-50 animate-slide-up">
          {/* Header */}
          <div className="bg-primary text-white p-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Trợ lý ảo AI 🤖</h3>
                <p className="text-sm text-gray-200">Luôn sẵn sàng hỗ trợ bạn</p>
              </div>
              {messages.length > 1 && (
                <button
                  onClick={handleClearConversation}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Xóa cuộc trò chuyện"
                >
                  <FaTrash size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="h-96 overflow-y-auto no-scrollbar p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3 ${
                    message.type === 'user'
                      ? 'bg-primary text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-900 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.text}</p>
                  
                  {/* Render rich content for function results */}
                  {message.functionResult && renderFunctionResult(message.functionCalled, message.functionResult)}
                  
                  <p className="text-xs mt-1 opacity-70">
                    {message.timestamp.toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-none p-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-gray-600 mb-2">Câu hỏi gợi ý:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(question)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Nhập câu hỏi của bạn..."
                className="flex-1 input"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="btn btn-primary px-4"
              >
                <FaPaperPlane />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;

