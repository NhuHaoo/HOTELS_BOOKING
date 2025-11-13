# Hotel Booking System - Backend API

Backend API RESTful cho hệ thống đặt phòng khách sạn thông minh, xây dựng với Node.js, Express và MongoDB.

## 🚀 Tính năng

- ✅ Xác thực và phân quyền người dùng (JWT)
- ✅ Quản lý khách sạn và phòng
- ✅ Tìm kiếm và lọc phòng nâng cao
- ✅ Đặt phòng và quản lý booking
- ✅ Thanh toán VNPay
- ✅ Đánh giá và review
- ✅ Yêu thích phòng
- ✅ Gợi ý phòng thông minh (AI)
- ✅ Dashboard quản trị
- ✅ Upload ảnh với Cloudinary
- ✅ Tìm kiếm theo vị trí địa lý

## 🛠️ Công nghệ sử dụng

- **Runtime**: Node.js (>=18)
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT + Bcrypt
- **Payment**: VNPay API
- **Image Upload**: Cloudinary + Multer
- **Email**: NodeMailer
- **Logging**: Morgan + Winston
- **Validation**: Joi

## 📦 Cài đặt

### Yêu cầu

- Node.js >= 18
- MongoDB >= 5.0
- npm hoặc yarn

### Các bước cài đặt

1. Clone repository:
```bash
git clone <repository-url>
cd backend
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Cấu hình biến môi trường:
```bash
cp .env.example .env
```

Chỉnh sửa file `.env` với thông tin của bạn:
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/hotel_booking

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d

# VNPay
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_password

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

4. Tạo thư mục uploads:
```bash
mkdir uploads
```

5. Khởi động server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server sẽ chạy tại: `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication

#### Đăng ký
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Nguyen Van A",
  "email": "user@example.com",
  "phone": "0123456789",
  "password": "password123"
}
```

#### Đăng nhập
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "name": "Nguyen Van A",
      "email": "user@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Rooms

#### Lấy danh sách phòng
```http
GET /api/rooms?city=DaNang&minPrice=500000&maxPrice=2000000&page=1&limit=10
```

#### Tìm kiếm phòng
```http
GET /api/rooms/search?keyword=deluxe
```

#### Lấy phòng khả dụng
```http
GET /api/rooms/available?checkIn=2024-01-01&checkOut=2024-01-05&guests=2
```

#### Lấy chi tiết phòng
```http
GET /api/rooms/:id
```

#### Tạo phòng mới (Admin)
```http
POST /api/rooms
Authorization: Bearer <token>
Content-Type: application/json

{
  "hotelId": "...",
  "name": "Deluxe Room",
  "description": "Spacious room with ocean view",
  "price": 1500000,
  "roomType": "deluxe",
  "maxGuests": 2,
  "amenities": ["wifi", "tv", "minibar"],
  "images": ["url1", "url2"]
}
```

### Bookings

#### Tạo đặt phòng
```http
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "roomId": "...",
  "checkIn": "2024-01-01",
  "checkOut": "2024-01-05",
  "guests": 2,
  "guestName": "Nguyen Van A",
  "guestEmail": "user@example.com",
  "guestPhone": "0123456789"
}
```

#### Lấy danh sách booking
```http
GET /api/bookings
Authorization: Bearer <token>
```

#### Hủy booking
```http
PUT /api/bookings/:id/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Đổi lịch trình"
}
```

### Payments

#### Tạo link thanh toán VNPay
```http
POST /api/payments/vnpay/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookingId": "...",
  "bankCode": "NCB"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?..."
  }
}
```

### Reviews

#### Tạo đánh giá
```http
POST /api/reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "roomId": "...",
  "rating": 5,
  "comment": "Phòng rất đẹp và sạch sẽ",
  "cleanliness": 5,
  "comfort": 5,
  "location": 4,
  "service": 5,
  "valueForMoney": 4
}
```

#### Lấy đánh giá của phòng
```http
GET /api/reviews/:roomId?page=1&limit=10
```

### Favorites

#### Thêm vào yêu thích
```http
POST /api/favorites
Authorization: Bearer <token>
Content-Type: application/json

{
  "roomId": "..."
}
```

#### Lấy danh sách yêu thích
```http
GET /api/favorites
Authorization: Bearer <token>
```

#### Xóa khỏi yêu thích
```http
DELETE /api/favorites/:id
Authorization: Bearer <token>
```

### AI & Recommendations

#### Gợi ý phòng
```http
GET /api/ai/recommendations
Authorization: Bearer <token>
```

#### Phòng phổ biến
```http
GET /api/ai/popular?limit=10
```

#### Chatbot
```http
POST /api/ai/chat
Content-Type: application/json

{
  "message": "Tôi muốn đặt phòng ở Đà Nẵng"
}
```

### Admin

#### Dashboard
```http
GET /api/admin/dashboard
Authorization: Bearer <admin-token>
```

#### Doanh thu
```http
GET /api/admin/revenue?startDate=2024-01-01&endDate=2024-12-31&groupBy=month
Authorization: Bearer <admin-token>
```

#### Analytics
```http
GET /api/admin/analytics
Authorization: Bearer <admin-token>
```

## 🗂️ Cấu trúc thư mục

```
backend/
├── src/
│   ├── config/           # Cấu hình (DB, VNPay, Cloudinary)
│   ├── models/           # MongoDB Models
│   ├── controllers/      # Business logic
│   ├── routes/           # API routes
│   ├── middlewares/      # Custom middleware
│   ├── utils/            # Helper functions
│   ├── app.js            # Express app setup
│   └── server.js         # Server entry point
├── uploads/              # Temporary file uploads
├── .env                  # Environment variables
├── .env.example          # Environment template
├── package.json          # Dependencies
└── README.md             # Documentation
```

## 🔐 Authentication

API sử dụng JWT (JSON Web Tokens) để xác thực. Thêm token vào header của request:

```
Authorization: Bearer <your-token>
```

## 📝 Roles & Permissions

- **user**: Người dùng thông thường (đặt phòng, đánh giá, yêu thích)
- **admin**: Quản trị viên (quản lý phòng, khách sạn, xem thống kê)

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port | No (default: 5000) |
| NODE_ENV | Environment (development/production) | No |
| MONGODB_URI | MongoDB connection string | Yes |
| JWT_SECRET | JWT secret key | Yes |
| JWT_EXPIRE | JWT expiration time | No (default: 7d) |
| VNPAY_TMN_CODE | VNPay terminal code | Yes |
| VNPAY_HASH_SECRET | VNPay hash secret | Yes |
| CLOUDINARY_CLOUD_NAME | Cloudinary cloud name | Yes |
| CLOUDINARY_API_KEY | Cloudinary API key | Yes |
| CLOUDINARY_API_SECRET | Cloudinary API secret | Yes |
| EMAIL_HOST | SMTP host | Yes |
| EMAIL_USER | SMTP username | Yes |
| EMAIL_PASSWORD | SMTP password | Yes |
| FRONTEND_URL | Frontend URL for CORS | No |

## 🚨 Error Handling

API trả về response theo format:

Success:
```json
{
  "success": true,
  "data": {...}
}
```

Error:
```json
{
  "success": false,
  "message": "Error message"
}
```

## 📊 Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## 🧪 Testing

```bash
# Run tests (coming soon)
npm test
```

## 🚀 Deployment

### Production Build

1. Set environment to production:
```bash
NODE_ENV=production
```

2. Start server:
```bash
npm start
```

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start src/server.js --name hotel-api

# Monitor
pm2 monit

# Logs
pm2 logs hotel-api
```

## 📞 Support

Nếu có vấn đề hoặc câu hỏi, vui lòng tạo issue hoặc liên hệ qua email.

## 📄 License

ISC

## 👥 Contributors

- Developer Team

## 🎯 Roadmap

- [ ] WebSocket cho real-time notifications
- [ ] Tích hợp OpenAI GPT-5 cho chatbot
- [ ] Elasticsearch cho tìm kiếm nâng cao
- [ ] Redis cho caching
- [ ] Unit & Integration tests
- [ ] API documentation với Swagger
- [ ] Docker containerization
- [ ] CI/CD pipeline

---

**Made with ❤️ by Hotel Booking Team**

