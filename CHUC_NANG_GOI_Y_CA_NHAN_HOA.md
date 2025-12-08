# CHỨC NĂNG GỢI Ý CÁ NHÂN HÓA
## Hệ thống Đặt phòng Khách sạn

---

## 1. GIỚI THIỆU

### 1.1. Tổng quan
Chức năng **Gợi ý Cá nhân hóa** là một tính năng thông minh sử dụng công nghệ AI (OpenAI GPT-4o-mini) để phân tích lịch sử đặt phòng của người dùng và đưa ra các gợi ý phòng khách sạn phù hợp với sở thích cá nhân.

### 1.2. Mục tiêu
- **Cá nhân hóa trải nghiệm**: Đưa ra gợi ý phù hợp với từng người dùng
- **Tăng tỷ lệ chuyển đổi**: Giúp người dùng tìm được phòng phù hợp nhanh hơn
- **Cải thiện trải nghiệm**: Sử dụng AI để tạo lời khuyên thông minh
- **Tối ưu hóa tìm kiếm**: Giảm thời gian tìm kiếm phòng phù hợp

---

## 2. CÔNG NGHỆ SỬ DỤNG

### 2.1. Backend
- **Node.js/Express.js**: Framework xây dựng API
- **MongoDB/Mongoose**: Lưu trữ và truy vấn dữ liệu
- **OpenAI GPT-4o-mini**: Tạo AI insights cá nhân hóa

### 2.2. Frontend
- **React.js**: Framework giao diện người dùng
- **TanStack Query**: Quản lý state và caching
- **Zustand**: Quản lý authentication state

---

## 3. LUỒNG HOẠT ĐỘNG

### 3.1. Sơ đồ tổng quan

```
┌─────────────────┐
│  User đăng nhập │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ Frontend: Personalized      │
│ Recommendations Component   │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Gọi API: GET                │
│ /api/ai/personalized-        │
│ recommendations?limit=6      │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Backend: Kiểm tra           │
│ Authentication (JWT)        │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Lấy lịch sử booking         │
│ (10 booking gần nhất)       │
└────────┬────────────────────┘
         │
         ├─────────────────────┐
         │                     │
         ▼                     ▼
    CÓ LỊCH SỬ            KHÔNG CÓ
         │                     │
         │                     ▼
         │              ┌──────────────────┐
         │              │ Trả về phòng     │
         │              │ phổ biến         │
         │              │ (top-rated)      │
         │              └──────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ PHÂN TÍCH SỞ THÍCH          │
│ - Thành phố                 │
│ - Mức giá                   │
│ - Loại phòng                │
│ - Tiện nghi                 │
│ - Số khách                  │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ RÚT TRÍCH SỞ THÍCH HÀNG ĐẦU │
│ - Top 3 thành phố            │
│ - Top 2 loại phòng           │
│ - Giá trung bình             │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ XÂY DỰNG QUERY TÌM KIẾM     │
│ - Lọc theo thành phố        │
│ - Lọc theo loại phòng        │
│ - Lọc theo giá (±30%)        │
│ - Loại trừ phòng đã đặt      │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ TÌM PHÒNG GỢI Ý             │
│ Sắp xếp theo rating          │
└────────┬────────────────────┘
         │
         ├─────────────────────┐
         │                     │
         ▼                     ▼
    ĐỦ PHÒNG              THIẾU PHÒNG
         │                     │
         │                     ▼
         │              ┌──────────────────┐
         │              │ Mở rộng tìm kiếm │
         │              │ (±50% giá)        │
         │              └──────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ GỌI OPENAI GPT-4o-mini      │
│ Tạo AI Insights             │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ TRẢ VỀ KẾT QUẢ              │
│ - Danh sách phòng            │
│ - Sở thích người dùng        │
│ - AI Insights                │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Frontend: Hiển thị           │
│ - AI Insights                │
│ - Sở thích                   │
│ - Danh sách phòng            │
└─────────────────────────────┘
```

---

## 4. CHI TIẾT XỬ LÝ

### 4.1. Thu thập dữ liệu

**Bước 1: Lấy lịch sử booking**
```javascript
const userBookings = await Booking.find({ userId })
  .populate({
    path: 'roomId',
    populate: { path: 'hotelId' }
  })
  .sort('-createdAt')
  .limit(10);
```

**Dữ liệu thu thập:**
- Danh sách booking (tối đa 10 gần nhất)
- Thông tin phòng (roomId) với đầy đủ chi tiết
- Thông tin khách sạn (hotelId) bao gồm thành phố, địa chỉ

**Xử lý trường hợp không có lịch sử:**
- Nếu `userBookings.length === 0`
- Trả về phòng phổ biến (top-rated)
- `isPersonalized: false`
- Không có AI insights

---

### 4.2. Phân tích sở thích

Hệ thống phân tích 5 yếu tố chính:

#### 4.2.1. Thành phố yêu thích
```javascript
// Đếm số lần đặt phòng ở mỗi thành phố
if (hotel?.city) {
  preferences.cities[hotel.city] = (preferences.cities[hotel.city] || 0) + 1;
}
```

**Ví dụ:**
- Đà Nẵng: 3 lần
- Hà Nội: 2 lần
- Hồ Chí Minh: 1 lần

#### 4.2.2. Mức giá
```javascript
// Tính min, max, và trung bình
const price = room.finalPrice || room.price;
preferences.priceRange.min = Math.min(preferences.priceRange.min, price);
preferences.priceRange.max = Math.max(preferences.priceRange.max, price);
totalPrice += price;
preferences.priceRange.avg = totalPrice / bookingCount;
```

**Ví dụ:**
- Min: 1.000.000 VNĐ
- Max: 2.000.000 VNĐ
- Avg: 1.500.000 VNĐ

#### 4.2.3. Loại phòng
```javascript
// Đếm tần suất mỗi loại phòng
if (room.roomType) {
  preferences.roomTypes[room.roomType] = 
    (preferences.roomTypes[room.roomType] || 0) + 1;
}
```

**Ví dụ:**
- Deluxe: 4 lần
- Suite: 1 lần
- Double: 1 lần

#### 4.2.4. Tiện nghi
```javascript
// Đếm tần suất mỗi tiện nghi
room.amenities.forEach(amenity => {
  preferences.amenities[amenity] = 
    (preferences.amenities[amenity] || 0) + 1;
});
```

**Ví dụ:**
- WiFi: 6 lần
- TV: 5 lần
- Mini bar: 4 lần

#### 4.2.5. Số khách tối đa
```javascript
// Lấy số khách tối đa cao nhất
if (room.maxGuests) {
  preferences.maxGuests = Math.max(preferences.maxGuests, room.maxGuests);
}
```

**Ví dụ:** 4 người

---

### 4.3. Rút trích sở thích hàng đầu

**Top 3 thành phố yêu thích:**
```javascript
const favoriteCities = Object.entries(preferences.cities)
  .sort((a, b) => b[1] - a[1])  // Sắp xếp giảm dần
  .slice(0, 3)                   // Lấy top 3
  .map(([city]) => city);
```

**Top 2 loại phòng yêu thích:**
```javascript
const favoriteRoomTypes = Object.entries(preferences.roomTypes)
  .sort((a, b) => b[1] - a[1])  // Sắp xếp giảm dần
  .slice(0, 2)                  // Lấy top 2
  .map(([type]) => type);
```

**Kết quả ví dụ:**
- `favoriteCities`: ['Đà Nẵng', 'Hà Nội', 'Hồ Chí Minh']
- `favoriteRoomTypes`: ['deluxe', 'suite']

---

### 4.4. Xây dựng query tìm kiếm

**Query cơ bản:**
```javascript
const query = {
  isActive: true,              // Chỉ phòng đang hoạt động
  availability: true,          // Chỉ phòng còn trống
  _id: { 
    $nin: userBookings.map(b => b.roomId?._id) 
  }  // Loại trừ phòng đã đặt
};
```

**Lọc theo giá (linh hoạt ±30%):**
```javascript
if (preferences.priceRange.avg > 0) {
  const priceFlexibility = 0.3;
  query.price = {
    $gte: preferences.priceRange.avg * (1 - priceFlexibility), // 70%
    $lte: preferences.priceRange.avg * (1 + priceFlexibility)  // 130%
  };
}
```

**Ví dụ:** Giá trung bình 1.500.000 VNĐ
- Min: 1.050.000 VNĐ (70%)
- Max: 1.950.000 VNĐ (130%)

**Lọc theo loại phòng:**
```javascript
if (favoriteRoomTypes.length > 0) {
  query.roomType = { $in: favoriteRoomTypes };
}
```

**Lọc theo thành phố:**
```javascript
if (favoriteCities.length > 0) {
  const hotels = await Hotel.find({ 
    city: { $in: favoriteCities }
  }).select('_id');
  query.hotelId = { $in: hotels.map(h => h._id) };
}
```

---

### 4.5. Tìm phòng gợi ý

**Tìm kiếm chính:**
```javascript
let recommendedRooms = await Room.find(query)
  .populate('hotelId')
  .sort('-rating')  // Sắp xếp theo rating cao nhất
  .limit(limit);    // Giới hạn số lượng
```

**Xử lý khi không đủ phòng:**
```javascript
if (recommendedRooms.length < limit) {
  // Mở rộng tìm kiếm với tiêu chí linh hoạt hơn
  const additionalQuery = {
    isActive: true,
    availability: true,
    price: {
      $gte: preferences.priceRange.avg * 0.5,  // 50%
      $lte: preferences.priceRange.avg * 1.5   // 150%
    }
  };
  
  const additionalRooms = await Room.find(additionalQuery)
    .populate('hotelId')
    .sort('-rating')
    .limit(limit - recommendedRooms.length);
  
  recommendedRooms = [...recommendedRooms, ...additionalRooms];
}
```

---

### 4.6. Tạo AI Insights bằng OpenAI

**Bước 1: Tạo user summary**
```javascript
const userSummary = `
Khách hàng đã đặt ${userBookings.length} lần.
Thành phố yêu thích: ${favoriteCities.join(', ')}
Loại phòng ưa thích: ${favoriteRoomTypes.join(', ')}
Mức giá trung bình: ${Math.round(preferences.priceRange.avg).toLocaleString()} VNĐ
Số khách tối đa: ${preferences.maxGuests} người
`;
```

**Bước 2: Gọi OpenAI API**
```javascript
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: config.openaiApiKey });

const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    {
      role: 'system',
      content: 'Bạn là chuyên gia tư vấn du lịch thông minh. Phân tích sở thích của khách hàng và đưa ra lời khuyên cá nhân hóa ngắn gọn (2-3 câu).'
    },
    {
      role: 'user',
      content: `Dựa vào lịch sử: ${userSummary}\n\nĐưa ra lời khuyên cá nhân hóa cho khách hàng này.`
    }
  ],
  max_tokens: 150,
  temperature: 0.7
});

aiInsights = completion.choices[0].message.content;
```

**Ví dụ AI Insights:**
> "Dựa trên lịch sử đặt phòng của bạn, bạn thường chọn phòng ở Đà Nẵng và Hà Nội với mức giá khoảng 1.500.000 VNĐ. Chúng tôi gợi ý bạn thử các khách sạn view biển ở Đà Nẵng hoặc khu vực trung tâm Hà Nội để có trải nghiệm tương tự."

---

## 5. API ENDPOINT

### 5.1. Thông tin endpoint

**URL:** `GET /api/ai/personalized-recommendations`

**Authentication:** Required (JWT Token)

**Query Parameters:**
- `limit` (optional): Số lượng phòng gợi ý (mặc định: 6)

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

### 5.2. Response Format

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Gợi ý phòng dựa trên sở thích của bạn",
  "isPersonalized": true,
  "preferences": {
    "favoriteCities": ["Đà Nẵng", "Hà Nội", "Hồ Chí Minh"],
    "favoriteRoomTypes": ["deluxe", "suite"],
    "averagePrice": 1500000,
    "bookingCount": 5
  },
  "aiInsights": "Dựa trên lịch sử đặt phòng của bạn...",
  "data": [
    {
      "_id": "...",
      "name": "Phòng Deluxe View Biển",
      "price": 1800000,
      "roomType": "deluxe",
      "hotelId": {
        "_id": "...",
        "name": "Grand Hotel Đà Nẵng",
        "city": "Đà Nẵng"
      },
      ...
    }
  ]
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "success": false,
  "message": "Server error"
}
```

---

## 6. GIAO DIỆN NGƯỜI DÙNG

### 6.1. Component Frontend

**File:** `frontend/src/components/PersonalizedRecommendations.jsx`

**Điều kiện hiển thị:**
- Chỉ hiển thị khi user đã đăng nhập
- Tự động fetch khi component mount
- Cache kết quả trong 5 phút

### 6.2. Các phần hiển thị

#### 6.2.1. Header Section
- Icon robot với animation
- Tiêu đề: "Gợi ý dành riêng cho bạn"
- Mô tả ngắn gọn

#### 6.2.2. AI Insights Section
- Hiển thị lời khuyên từ AI (nếu có)
- Icon bóng đèn
- Background gradient đẹp mắt

#### 6.2.3. User Preferences Section
- **Thành phố yêu thích**: Hiển thị top 3 thành phố
- **Mức giá trung bình**: Hiển thị giá trung bình
- **Loại phòng ưa thích**: Hiển thị top 2 loại phòng
- **Số lần đặt phòng**: Hiển thị tổng số booking

#### 6.2.4. Recommended Rooms Section
- Grid layout (3 cột trên desktop)
- Mỗi phòng hiển thị bằng component `RoomCard`
- Animation fade-in khi load
- Link đến trang chi tiết phòng

---

## 7. VÍ DỤ THỰC TẾ

### 7.1. Scenario 1: User có lịch sử đặt phòng

**Input:**
- User ID: `507f1f77bcf86cd799439011`
- Lịch sử booking: 5 lần
  - Đà Nẵng (Deluxe): 3 lần, giá 1.200.000 - 1.800.000 VNĐ
  - Hà Nội (Suite): 2 lần, giá 2.000.000 - 2.500.000 VNĐ

**Xử lý:**
1. Phân tích sở thích:
   - Thành phố: Đà Nẵng (3), Hà Nội (2)
   - Loại phòng: Deluxe (3), Suite (2)
   - Giá trung bình: 1.700.000 VNĐ

2. Rút trích:
   - Top 3 thành phố: ['Đà Nẵng', 'Hà Nội']
   - Top 2 loại phòng: ['deluxe', 'suite']
   - Giá trung bình: 1.700.000 VNĐ

3. Query tìm kiếm:
   - Thành phố: Đà Nẵng hoặc Hà Nội
   - Loại phòng: Deluxe hoặc Suite
   - Giá: 1.190.000 - 2.210.000 VNĐ (±30%)

4. AI Insights:
   > "Bạn thường chọn phòng Deluxe ở Đà Nẵng và Suite ở Hà Nội với mức giá khoảng 1.7 triệu. Chúng tôi gợi ý bạn thử các khách sạn view biển ở Đà Nẵng hoặc khu vực trung tâm Hà Nội để có trải nghiệm tương tự."

**Output:**
- 6 phòng gợi ý phù hợp với sở thích
- Hiển thị sở thích người dùng
- AI insights cá nhân hóa

---

### 7.2. Scenario 2: User mới (chưa có lịch sử)

**Input:**
- User ID: `507f1f77bcf86cd799439012`
- Lịch sử booking: 0 lần

**Xử lý:**
1. Kiểm tra: `userBookings.length === 0`
2. Trả về phòng phổ biến (top-rated)
3. Không có AI insights
4. `isPersonalized: false`

**Output:**
- 6 phòng phổ biến (sắp xếp theo rating)
- Message: "Gợi ý phòng phổ biến cho khách hàng mới"
- Không hiển thị sở thích

---

## 8. TỐI ƯU HÓA VÀ HIỆU NĂNG

### 8.1. Caching
- **Frontend**: Cache kết quả trong 5 phút (staleTime: 5 * 60 * 1000)
- **Backend**: Không cache (luôn tính toán mới để đảm bảo độ chính xác)

### 8.2. Query Optimization
- Giới hạn số lượng booking phân tích: 10 booking gần nhất
- Sử dụng MongoDB indexes cho các trường thường query
- Populate chỉ các trường cần thiết

### 8.3. Error Handling
- Xử lý lỗi khi không có OpenAI API key (bỏ qua AI insights)
- Xử lý lỗi khi không đủ phòng (mở rộng tìm kiếm)
- Fallback về phòng phổ biến khi có lỗi

---

## 9. BẢO MẬT

### 9.1. Authentication
- Yêu cầu JWT token hợp lệ
- Chỉ user đã đăng nhập mới có thể sử dụng
- Middleware `protect` kiểm tra authentication

### 9.2. Data Privacy
- Chỉ phân tích dữ liệu của chính user đó
- Không chia sẻ thông tin giữa các user
- AI insights chỉ dựa trên dữ liệu của user hiện tại

---

## 10. KẾT LUẬN

### 10.1. Ưu điểm
✅ **Cá nhân hóa cao**: Dựa trên lịch sử thực tế của từng user  
✅ **Thông minh**: Sử dụng AI để tạo lời khuyên  
✅ **Linh hoạt**: Tự động mở rộng tìm kiếm khi không đủ kết quả  
✅ **Hiệu năng tốt**: Cache và tối ưu query  
✅ **User-friendly**: Giao diện đẹp, dễ sử dụng  

### 10.2. Hạn chế
⚠️ Yêu cầu user phải có lịch sử đặt phòng để có gợi ý chính xác  
⚠️ Phụ thuộc vào OpenAI API (cần API key)  
⚠️ Chi phí API khi có nhiều user sử dụng  

### 10.3. Hướng phát triển
🔮 Phân tích thêm các yếu tố: mùa, thời gian, đánh giá  
🔮 Machine Learning để cải thiện độ chính xác  
🔮 A/B testing để tối ưu thuật toán  
🔮 Thêm gợi ý dựa trên collaborative filtering  

---

**Tài liệu được tạo bởi:** Hệ thống Đặt phòng Khách sạn  
**Ngày:** 2025  
**Phiên bản:** 1.0

