import { useState, useRef, useEffect } from 'react';
import { FaComments, FaTimes, FaPaperPlane, FaTrash, FaStar, FaMapMarkerAlt, FaExternalLinkAlt } from 'react-icons/fa';
import { aiAPI } from '../api/ai.api';
import { formatPrice } from '../utils/formatPrice';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const ChatbotWidget = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const messagesEndRef = useRef(null);

  // Default welcome message
  const getDefaultMessage = () => [
      {
        type: 'bot',
        text: 'Xin chào! 👋 Tôi là trợ lý ảo của hệ thống đặt phòng khách sạn. Tôi có thể giúp bạn:\n\n• Tìm kiếm và đặt phòng\n• Tra cứu giá phòng\n• Hỗ trợ thanh toán\n• Giải đáp chính sách\n\nBạn cần hỗ trợ gì ạ? 😊',
        timestamp: new Date(),
      },
    ];

  // Load messages on mount and when user changes
  useEffect(() => {
    const loadMessages = async () => {
      setIsLoadingMessages(true);
      try {
        if (isAuthenticated && user) {
          // Load from API for logged-in users
          try {
            const response = await aiAPI.getChatMessages();
            if (response.data.success && response.data.data) {
              const loadedMessages = response.data.data.map(msg => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
              }));
              setMessages(loadedMessages);
            } else {
              setMessages(getDefaultMessage());
            }
          } catch (error) {
            console.error('Error loading messages from API:', error);
            // Fallback to localStorage if API fails
            const saved = localStorage.getItem('chatbot_messages');
            if (saved) {
              try {
                const parsed = JSON.parse(saved);
                setMessages(parsed.map(msg => ({
                  ...msg,
                  timestamp: new Date(msg.timestamp)
                })));
              } catch (e) {
                setMessages(getDefaultMessage());
              }
            } else {
              setMessages(getDefaultMessage());
            }
          }
        } else {
          // Load from localStorage for non-logged-in users
          const saved = localStorage.getItem('chatbot_messages');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              setMessages(parsed.map(msg => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
              })));
            } catch (e) {
              setMessages(getDefaultMessage());
            }
          } else {
            setMessages(getDefaultMessage());
          }
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        setMessages(getDefaultMessage());
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [isAuthenticated, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Save messages whenever they change
  useEffect(() => {
    if (isLoadingMessages) return; // Don't save while loading

    const saveMessages = async () => {
      try {
        if (isAuthenticated && user) {
          // Save to API for logged-in users
          try {
            await aiAPI.saveChatMessages(messages);
          } catch (error) {
            console.error('Error saving messages to API:', error);
            // Fallback to localStorage if API fails
            localStorage.setItem('chatbot_messages', JSON.stringify(messages));
          }
        } else {
          // Save to localStorage for non-logged-in users
    localStorage.setItem('chatbot_messages', JSON.stringify(messages));
        }
      } catch (error) {
        console.error('Error saving messages:', error);
      }
    };

    saveMessages();
  }, [messages, isAuthenticated, user, isLoadingMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clear conversation
  const handleClearConversation = async () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ cuộc trò chuyện?')) {
      const initialMessage = {
        type: 'bot',
        text: 'Xin chào! 👋 Tôi là trợ lý ảo của hệ thống đặt phòng khách sạn. Tôi có thể giúp bạn:\n\n• Tìm kiếm và đặt phòng\n• Tra cứu giá phòng\n• Hỗ trợ thanh toán\n• Giải đáp chính sách\n\nBạn cần hỗ trợ gì ạ? 😊',
        timestamp: new Date(),
      };
      
      setMessages([initialMessage]);
      
      try {
        if (isAuthenticated && user) {
          // Clear from API for logged-in users
          try {
            await aiAPI.clearChatMessages();
          } catch (error) {
            console.error('Error clearing messages from API:', error);
            // Fallback: clear localStorage
            localStorage.removeItem('chatbot_messages');
          }
        } else {
          // Clear from localStorage for non-logged-in users
          localStorage.removeItem('chatbot_messages');
        }
      } catch (error) {
        console.error('Error clearing messages:', error);
      localStorage.removeItem('chatbot_messages');
      }
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
        <div className="mt-2 space-y-1.5">
          {result.rooms.map((room, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              <div className="flex gap-1.5">
                {/* Room Image */}
                {room.image && (
                  <img 
                    src={room.image} 
                    alt={room.name}
                    className="w-16 h-16 object-cover"
                  />
                )}
                
                {/* Room Info */}
                <div className="flex-1 p-1.5 min-w-0">
                  <h4 className="font-semibold text-[10px] text-gray-900 truncate">{room.name}</h4>
                  <p className="text-[10px] text-gray-600 truncate">{room.hotel}</p>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <FaMapMarkerAlt className="text-gray-400 text-[10px]" />
                    <span className="text-[10px] text-gray-500">{room.city}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <div className="flex items-center gap-0.5">
                      <FaStar className="text-yellow-500 text-[10px]" />
                      <span className="text-[10px] font-semibold">{room.rating?.toFixed(1)}</span>
                    </div>
                    <span className="text-xs font-bold text-accent">{formatPrice(room.price)}</span>
                  </div>
                  
                  {/* Action Button */}
                  <button
                    onClick={() => {
                      navigate(room.link);
                      setIsOpen(false);
                    }}
                    className="w-full text-[10px] bg-primary text-white px-1.5 py-0.5 rounded hover:bg-primary-dark transition-colors mt-1"
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
        <div className="mt-2 bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          {/* Room Images */}
          {room.images && room.images.length > 0 && (
            <img 
              src={room.images[0]} 
              alt={room.name}
              className="w-full h-20 object-cover"
            />
          )}
          
          {/* Room Details */}
          <div className="p-2">
            <h3 className="font-bold text-xs text-gray-900 mb-0.5">{room.name}</h3>
            <p className="text-[10px] text-gray-600 mb-1">{room.hotel.name}</p>
            
            <div className="flex items-center gap-1 mb-1">
              <div className="flex items-center gap-0.5">
                <FaStar className="text-yellow-500 text-[10px]" />
                <span className="text-[10px] font-semibold">{room.rating?.toFixed(1)}</span>
                <span className="text-[10px] text-gray-500">({room.totalReviews})</span>
              </div>
            </div>
            
            <p className="text-[10px] text-gray-700 line-clamp-2 mb-1">{room.description}</p>
            
            {/* Amenities */}
            {room.amenities && room.amenities.length > 0 && (
              <div className="flex flex-wrap gap-0.5 mb-1">
                {room.amenities.slice(0, 3).map((amenity, idx) => (
                  <span key={idx} className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                    {amenity}
                  </span>
                ))}
                {room.amenities.length > 3 && (
                  <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                    +{room.amenities.length - 3}
                  </span>
                )}
              </div>
            )}
            
            {/* Price & Actions */}
            <div className="flex items-center justify-between pt-1 border-t">
              <div>
                <span className="text-sm font-bold text-accent">{formatPrice(room.price)}</span>
                <span className="text-[10px] text-gray-500"> / đêm</span>
              </div>
            </div>
            
            <button
              onClick={() => {
                navigate(room.link);
                setIsOpen(false);
              }}
              className="w-full text-center text-[10px] bg-primary text-white px-2 py-1 rounded hover:bg-primary-dark transition-colors flex items-center justify-center gap-1 mt-1.5 font-semibold"
            >
              <FaExternalLinkAlt size={10} />
              Xem chi tiết
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
        className="fixed bottom-4 right-4 bg-primary text-white p-3 rounded-full shadow-lg hover:bg-primary-dark transition-all hover:scale-110 z-50"
      >
        {isOpen ? <FaTimes size={20} /> : <FaComments size={20} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl z-50 animate-slide-up flex flex-col max-h-[calc(100vh-6rem)]">
          {/* Header */}
          <div className="bg-primary text-white p-3 rounded-t-xl flex-shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base">Trợ lý ảo AI 🤖</h3>
                <p className="text-xs text-gray-200">Luôn sẵn sàng hỗ trợ bạn</p>
              </div>
              {messages.length > 1 && (
                <button
                  onClick={handleClearConversation}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                  title="Xóa cuộc trò chuyện"
                >
                  <FaTrash size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3 min-h-0">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl p-2.5 ${
                    message.type === 'user'
                      ? 'bg-primary text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-900 rounded-bl-none'
                  }`}
                >
                  <p className="text-xs whitespace-pre-line leading-relaxed">{message.text}</p>
                  
                  {/* Render rich content for function results */}
                  {message.functionResult && renderFunctionResult(message.functionCalled, message.functionResult)}
                  
                  <p className="text-[10px] mt-1 opacity-70">
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
                <div className="bg-gray-100 rounded-xl rounded-bl-none p-2.5">
                  <div className="flex space-x-1.5">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length <= 1 && (
            <div className="px-3 pb-2 flex-shrink-0">
              <p className="text-[10px] text-gray-600 mb-1.5">Câu hỏi gợi ý:</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(question)}
                    className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t flex-shrink-0">
            <div className="flex space-x-1.5 items-center">
              {messages.length > 1 && (
                <button
                  type="button"
                  onClick={handleClearConversation}
                  className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                  title="Xóa cuộc trò chuyện"
                >
                  <FaTrash size={14} />
                </button>
              )}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Nhập câu hỏi..."
                className="flex-1 input text-xs py-1.5 px-2"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="btn btn-primary px-3 py-1.5 flex-shrink-0 text-xs"
              >
                <FaPaperPlane size={12} />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;

