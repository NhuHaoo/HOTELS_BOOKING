# 🏨 Hotel Booking System

[![Node.js](https://img.shields.io/badge/Node.js-v16+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18+-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v4.4+-brightgreen.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> A modern, full-stack hotel booking system with AI-powered recommendations, real-time weather integration, interactive maps, and VNPay payment gateway.

![Hotel Booking System](https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=400&fit=crop)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [Payment Integration](#-payment-integration)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🎯 Core Features

- ✅ **User Authentication & Authorization** (JWT-based with role management)
- ✅ **Hotel & Room Management** (CRUD operations with image uploads)
- ✅ **Advanced Search & Filtering** (location, price, amenities, dates)
- ✅ **Real-time Booking System** with availability checking
- ✅ **VNPay Payment Integration** (QR Code, ATM, International Cards)
- ✅ **Review & Rating System** with photo uploads
- ✅ **Favorites/Wishlist** functionality
- ✅ **User Profile Management** with booking history

### 🤖 AI-Powered Features

- 🧠 **AI Chatbot** powered by OpenAI GPT-4o-mini
  - Natural language room search
  - Personalized recommendations
  - Function calling for real-time data
- 🎯 **Smart Recommendations** based on:
  - User booking history
  - Location preferences
  - Price range analysis
  - Amenity preferences
- 📊 **Trending Destinations** with AI insights

### 🌐 Additional Features

- 🌤️ **Real-time Weather Integration** (OpenWeatherMap API)
- 🗺️ **Interactive Maps** with Mapbox GL JS
- 📱 **Responsive Design** (Mobile, Tablet, Desktop)
- 🎨 **Modern UI/UX** with Glassmorphism & Animations
- 📧 **Email Notifications** for booking confirmations
- 🔍 **Geolocation Search** with distance calculation
- 📊 **Admin Dashboard** with analytics

---

## 🛠 Tech Stack

### Backend

- **Runtime**: Node.js v16+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Cloudinary + Multer
- **Payment**: VNPay Payment Gateway
- **Email**: NodeMailer
- **AI**: OpenAI API (GPT-4o-mini)
- **Weather**: OpenWeatherMap API

### Frontend

- **Framework**: React 18 with Vite
- **Routing**: React Router v6
- **State Management**: Zustand + TanStack Query
- **Styling**: TailwindCSS
- **HTTP Client**: Axios
- **Maps**: Mapbox GL JS
- **Animations**: Framer Motion concepts
- **Forms**: React Hook Form (validation)
- **Icons**: React Icons
- **Notifications**: React Hot Toast
- **Date Picker**: React Datepicker

### Development Tools

- **Package Manager**: npm
- **Version Control**: Git
- **Code Quality**: ESLint
- **API Testing**: Postman (collection included)

---

## 📋 Prerequisites

Before running this project, ensure you have:

- **Node.js** v16 or higher ([Download](https://nodejs.org/))
- **MongoDB** v4.4 or higher ([Download](https://www.mongodb.com/try/download/community))
- **Git** ([Download](https://git-scm.com/))
- **npm** or **yarn** (comes with Node.js)

### API Keys Required (for full functionality):

1. **Cloudinary** (Image uploads) - [Sign up](https://cloudinary.com/)
2. **OpenAI** (AI Chatbot) - [Get API Key](https://platform.openai.com/)
3. **OpenWeatherMap** (Weather data) - [Get API Key](https://openweathermap.org/api)
4. **Mapbox** (Maps) - [Get Token](https://www.mapbox.com/)
5. **VNPay** (Payment gateway) - [Register](https://sandbox.vnpayment.vn/)

---

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

#### For Linux/macOS:

```bash
# Clone the repository
git clone <repository-url>
cd QuanLyKhachSan

# Run setup script (installs dependencies, creates .env files)
chmod +x setup.sh
./setup.sh

# Start the application
./run.sh
```

#### For Windows:

```cmd
# Clone the repository
git clone <repository-url>
cd QuanLyKhachSan

# Run setup script
setup.bat

# Start the application
run.bat
```

### Option 2: Manual Setup

#### 1. Clone and Install Dependencies

```bash
# Clone repository
git clone <repository-url>
cd QuanLyKhachSan

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

#### 2. Configure Environment Variables

**Backend** (`backend/.env`):

```env
# Server Configuration
PORT=2409
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/hotel_booking

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Cloudinary (Image Upload)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=Hotel Booking <noreply@hotel.com>

# OpenAI (AI Chatbot)
OPENAI_API_KEY=sk-proj-your-api-key-here
OPENAI_MODEL=gpt-4o-mini

# Weather API
WEATHER_API_KEY=your_weather_api_key

# VNPay Payment Gateway (Sandbox)
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:2409/api/payments/vnpay/return
VNPAY_API_URL=https://sandbox.vnpayment.vn/merchant_webapi/api/transaction
```

**Frontend** (`frontend/.env`):

```env
VITE_API_URL=http://localhost:2409/api
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

#### 3. Seed Database (Optional but recommended)

```bash
cd backend
npm run seed:import
```

This creates:

- 11 sample users (including admin)
- 3 hotels with locations
- 12 rooms with images and amenities
- 50 bookings
- 15+ reviews
- 30 favorites

#### 4. Start Development Servers

**Using Scripts:**

```bash
# From project root
./run.sh          # Linux/macOS
run.bat           # Windows
```

**Manual Start:**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

#### 5. Access the Application

- 🌐 **Frontend**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:2409
- 📚 **API Docs**: http://localhost:2409/api

**Demo Accounts:**

- Admin: `admin@example.com` / `admin123`
- User: `user1@example.com` / `password123`
- Manager: `manager1@example.com` / `admin123`

---

## 📁 Project Structure

```
QuanLyKhachSan/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   │   ├── cloudinary.js
│   │   │   ├── db.js
│   │   │   ├── env.js
│   │   │   └── vnpay.js
│   │   ├── controllers/     # Route controllers
│   │   │   ├── admin.controller.js
│   │   │   ├── ai.controller.js
│   │   │   ├── auth.controller.js
│   │   │   ├── booking.controller.js
│   │   │   ├── favorite.controller.js
│   │   │   ├── hotel.controller.js
│   │   │   ├── payment.controller.js
│   │   │   ├── review.controller.js
│   │   │   └── room.controller.js
│   │   ├── middlewares/     # Custom middlewares
│   │   │   ├── auth.middleware.js
│   │   │   ├── error.middleware.js
│   │   │   ├── role.middleware.js
│   │   │   └── upload.middleware.js
│   │   ├── models/          # Mongoose models
│   │   │   ├── Booking.js
│   │   │   ├── Favorite.js
│   │   │   ├── Hotel.js
│   │   │   ├── Review.js
│   │   │   ├── Room.js
│   │   │   └── User.js
│   │   ├── routes/          # API routes
│   │   │   ├── admin.routes.js
│   │   │   ├── ai.routes.js
│   │   │   ├── auth.routes.js
│   │   │   ├── booking.routes.js
│   │   │   ├── favorite.routes.js
│   │   │   ├── hotel.routes.js
│   │   │   ├── payment.routes.js
│   │   │   ├── review.routes.js
│   │   │   ├── room.routes.js
│   │   │   └── upload.routes.js
│   │   ├── utils/           # Utility functions
│   │   │   ├── email.utils.js
│   │   │   ├── geo.utils.js
│   │   │   ├── jwt.utils.js
│   │   │   ├── seeder.js
│   │   │   └── vnpay.utils.js
│   │   ├── app.js           # Express app setup
│   │   └── server.js        # Server entry point
│   ├── uploads/             # Local file uploads
│   ├── .env                 # Environment variables
│   ├── package.json
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── api/             # API client services
│   │   │   ├── ai.api.js
│   │   │   ├── auth.api.js
│   │   │   ├── axiosClient.js
│   │   │   ├── booking.api.js
│   │   │   ├── favorite.api.js
│   │   │   ├── hotel.api.js
│   │   │   ├── payment.api.js
│   │   │   ├── review.api.js
│   │   │   ├── room.api.js
│   │   │   └── upload.api.js
│   │   ├── components/      # Reusable components
│   │   │   ├── ChatBot.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Loading.jsx
│   │   │   ├── RoomCard.jsx
│   │   │   └── ...
│   │   ├── layouts/         # Layout components
│   │   │   ├── AdminLayout.jsx
│   │   │   └── MainLayout.jsx
│   │   ├── pages/           # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── SearchResult.jsx
│   │   │   ├── RoomDetail.jsx
│   │   │   ├── Booking.jsx
│   │   │   ├── BookingDetail.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── PaymentSuccess.jsx
│   │   │   ├── PaymentFailed.jsx
│   │   │   └── admin/
│   │   │       ├── Dashboard.jsx
│   │   │       ├── Hotels.jsx
│   │   │       ├── Rooms.jsx
│   │   │       ├── Bookings.jsx
│   │   │       ├── Users.jsx
│   │   │       └── Reviews.jsx
│   │   ├── router/          # Routing configuration
│   │   │   └── AppRouter.jsx
│   │   ├── store/           # Zustand stores
│   │   │   ├── useAuthStore.js
│   │   │   └── useBookingStore.js
│   │   ├── utils/           # Utility functions
│   │   │   ├── dateUtils.js
│   │   │   ├── formatPrice.js
│   │   │   └── validation.js
│   │   ├── App.jsx          # Root component
│   │   ├── main.jsx         # App entry point
│   │   └── index.css        # Global styles
│   ├── public/              # Static assets
│   ├── .env                 # Environment variables
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── README.md
│
├── .gitignore
├── run.sh                   # Start script (Linux/macOS)
├── run.bat                  # Start script (Windows)
├── setup.sh                 # Setup script (Linux/macOS)
├── setup.bat                # Setup script (Windows)
├── stop.sh                  # Stop script (Linux/macOS)
├── stop.bat                 # Stop script (Windows)
├── POSTMAN_COLLECTION.json  # API testing collection
└── README.md                # This file
```

---

## ⚙️ Configuration

### Backend Environment Variables

| Variable                | Description                          | Required    | Default                 |
| ----------------------- | ------------------------------------ | ----------- | ----------------------- |
| `PORT`                  | Backend server port                  | No          | `2409`                  |
| `NODE_ENV`              | Environment (development/production) | No          | `development`           |
| `FRONTEND_URL`          | Frontend URL for CORS                | No          | `http://localhost:3000` |
| `MONGODB_URI`           | MongoDB connection string            | Yes         | -                       |
| `JWT_SECRET`            | Secret key for JWT signing           | Yes         | -                       |
| `JWT_EXPIRE`            | JWT expiration time                  | No          | `7d`                    |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name                | Yes\*       | -                       |
| `CLOUDINARY_API_KEY`    | Cloudinary API key                   | Yes\*       | -                       |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret                | Yes\*       | -                       |
| `EMAIL_HOST`            | SMTP host                            | No\*\*      | -                       |
| `EMAIL_PORT`            | SMTP port                            | No\*\*      | `587`                   |
| `EMAIL_USER`            | Email username                       | No\*\*      | -                       |
| `EMAIL_PASSWORD`        | Email password                       | No\*\*      | -                       |
| `EMAIL_FROM`            | Sender email                         | No\*\*      | -                       |
| `OPENAI_API_KEY`        | OpenAI API key                       | No\*\*\*    | -                       |
| `OPENAI_MODEL`          | OpenAI model name                    | No          | `gpt-4o-mini`           |
| `WEATHER_API_KEY`       | OpenWeatherMap API key               | No          | -                       |
| `VNPAY_TMN_CODE`        | VNPay terminal code                  | Yes\*\*\*\* | -                       |
| `VNPAY_HASH_SECRET`     | VNPay hash secret                    | Yes\*\*\*\* | -                       |
| `VNPAY_URL`             | VNPay payment URL                    | Yes\*\*\*\* | -                       |
| `VNPAY_RETURN_URL`      | VNPay callback URL                   | Yes\*\*\*\* | -                       |

\* Required for image uploads  
\*\* Required for email notifications  
\*\*\* Required for AI chatbot  
\*\*\*\* Required for payment processing

### Frontend Environment Variables

| Variable            | Description         | Required | Default                     |
| ------------------- | ------------------- | -------- | --------------------------- |
| `VITE_API_URL`      | Backend API URL     | Yes      | `http://localhost:2409/api` |
| `VITE_MAPBOX_TOKEN` | Mapbox access token | Yes\*    | -                           |

\* Required for map features

---

## 📚 API Documentation

### Base URL

```
http://localhost:2409/api
```

### Authentication Endpoints

#### Register

```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "0901234567",
  "password": "password123"
}
```

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    }
  }
}
```

### Room Endpoints

#### Search Rooms

```http
GET /rooms?
  location=Hanoi&
  checkIn=2024-01-01&
  checkOut=2024-01-05&
  guests=2&
  minPrice=100000&
  maxPrice=500000&
  amenities=wifi,pool&
  sort=-rating&
  page=1&
  limit=10
```

#### Get Room Details

```http
GET /rooms/:id
```

### Booking Endpoints

#### Create Booking

```http
POST /bookings
Authorization: Bearer {token}
Content-Type: application/json

{
  "roomId": "room_id",
  "checkIn": "2024-01-01",
  "checkOut": "2024-01-05",
  "guests": 2,
  "guestName": "John Doe",
  "guestEmail": "john@example.com",
  "guestPhone": "0901234567",
  "specialRequests": "Early check-in please"
}
```

#### Get My Bookings

```http
GET /bookings
Authorization: Bearer {token}
```

### Payment Endpoints

#### Create VNPay Payment

```http
POST /payments/vnpay/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "bookingId": "booking_id",
  "bankCode": "VNPAYQR"  // Optional: VNPAYQR, VNBANK, INTCARD
}
```

### AI Endpoints

#### Chat with AI

```http
POST /ai/chat
Content-Type: application/json

{
  "message": "Find me a hotel in Hanoi under 500k",
  "conversationHistory": []
}
```

#### Get Personalized Recommendations

```http
GET /ai/personalized-recommendations?limit=6
Authorization: Bearer {token}
```

### Admin Endpoints

#### Dashboard Stats

```http
GET /admin/dashboard/stats
Authorization: Bearer {admin_token}
```

#### Manage Users

```http
GET /admin/users
POST /admin/users
PUT /admin/users/:id
DELETE /admin/users/:id
Authorization: Bearer {admin_token}
```

For complete API documentation, import `POSTMAN_COLLECTION.json` into Postman.

---

## 💳 Payment Integration

### VNPay Setup

#### 1. Register for Sandbox Account

Visit [VNPay Sandbox](https://sandbox.vnpayment.vn/apis/vnpay-demo/) and get your credentials:

- Terminal ID (TMN Code)
- Hash Secret
- Payment URL
- Return URL

#### 2. Configure Environment Variables

Add to `backend/.env`:

```env
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:2409/api/payments/vnpay/return
```

#### 3. Payment Flow

1. User creates booking
2. System generates VNPay payment URL
3. User redirects to VNPay sandbox
4. User completes payment
5. VNPay redirects back with transaction result
6. System verifies signature and updates booking status
7. User sees success/failed page with confetti animation

#### 4. Test Cards

Use VNPay sandbox test cards:

- **NCB Bank**: Card `9704198526191432198` | Date `07/15` | OTP `123456`
- Or use the payment simulation interface

#### 5. Payment Methods Supported

- 📱 **VNPAYQR**: QR Code payment
- 🏦 **VNBANK**: Domestic ATM cards
- 💳 **INTCARD**: International cards (VISA/MasterCard/JCB)

---

## 🗄️ Database Management

### Seeding Database

#### Import Sample Data

```bash
cd backend
npm run seed:import
```

This creates:

- **11 users** (1 admin, 10 regular users)
- **3 hotels** (Hanoi, Ho Chi Minh, Da Nang)
- **12 rooms** (various types and prices)
- **50 bookings** (50% checked-out for reviews)
- **15+ reviews** with ratings
- **30 favorites**

#### Delete All Data

```bash
npm run seed:destroy
```

#### Import & Sync (Recommended)

```bash
npm run seed:sync
```

This imports data AND syncs room ratings with reviews.

### Manual Database Operations

```bash
# Connect to MongoDB
mongo

# Use database
use hotel_booking

# View collections
show collections

# Count documents
db.users.count()
db.rooms.count()
db.bookings.count()

# Find specific data
db.users.find({ role: 'admin' })
db.bookings.find({ paymentStatus: 'paid' })
```

---

## 🧪 Testing

### Backend Testing

```bash
cd backend

# Test VNPay integration
node test-vnpay.js

# Check API endpoints
curl http://localhost:2409/api/rooms
curl http://localhost:2409/api/hotels
```

### Frontend Testing

```bash
cd frontend

# Build production version
npm run build

# Preview production build
npm run preview

# Run lint
npm run lint
```

### API Testing with Postman

1. Import `POSTMAN_COLLECTION.json`
2. Set environment variables:
   - `base_url`: `http://localhost:2409/api`
   - `token`: Get from login response
3. Run collection tests

---

## 🚀 Deployment

### Backend Deployment

#### Using Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create your-hotel-api

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your_mongodb_atlas_uri
heroku config:set JWT_SECRET=your_secret
# ... (set all other env vars)

# Deploy
git subtree push --prefix backend heroku main

# View logs
heroku logs --tail
```

#### Using DigitalOcean/AWS EC2

```bash
# SSH to server
ssh user@your-server-ip

# Clone repository
git clone <repo-url>
cd QuanLyKhachSan/backend

# Install dependencies
npm install --production

# Install PM2
npm install -g pm2

# Start with PM2
pm2 start src/server.js --name hotel-api
pm2 save
pm2 startup

# Setup Nginx reverse proxy
sudo nano /etc/nginx/sites-available/hotel-api
```

Nginx config:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:2409;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Frontend Deployment

#### Using Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel

# Set environment variables in Vercel dashboard
```

#### Using Netlify

```bash
# Build
cd frontend
npm run build

# Deploy dist/ folder to Netlify
# Or connect GitHub repo for auto-deploy
```

#### Using Nginx (Self-hosted)

```bash
# Build production
cd frontend
npm run build

# Copy to web root
sudo cp -r dist/* /var/www/html/

# Nginx config for SPA
location / {
    try_files $uri $uri/ /index.html;
}
```

### Environment Variables for Production

**Backend**:

- Update `FRONTEND_URL` to your production frontend URL
- Update `VNPAY_RETURN_URL` to your production API URL
- Use MongoDB Atlas for database
- Use production API keys (Cloudinary, OpenAI, etc.)

**Frontend**:

- Update `VITE_API_URL` to your production backend URL

---

## 🐛 Troubleshooting

### Common Issues

#### Backend won't start

**Issue**: Port 2409 already in use

```bash
# Find and kill process
lsof -ti:2409 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :2409   # Windows (find PID)
taskkill /PID <pid> /F         # Windows (kill process)
```

**Issue**: MongoDB connection failed

```bash
# Check if MongoDB is running
sudo systemctl status mongod   # Linux
brew services list             # macOS
net start MongoDB              # Windows

# Start MongoDB
sudo systemctl start mongod    # Linux
brew services start mongodb-community  # macOS
net start MongoDB              # Windows
```

#### Frontend build errors

**Issue**: Module not found

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Issue**: Environment variables not loaded

- Ensure `.env` file exists in `frontend/` directory
- Variable names must start with `VITE_`
- Restart dev server after changing `.env`

#### Payment issues

**Issue**: VNPay returns "Merchant not valid"

- Verify TMN Code and Hash Secret are correct
- Check if sandbox account is active
- Ensure return URL is accessible

**Issue**: Payment success but redirects to failed page

- Check backend logs for errors
- Ensure FRONTEND_URL is set correctly
- Verify email configuration (non-critical)

#### Database issues

**Issue**: Seeder fails with validation error

```bash
# Clear database and try again
cd backend
npm run seed:destroy
npm run seed:import
```

**Issue**: Duplicate key error

```bash
# Drop indexes
mongo
use hotel_booking
db.bookings.dropIndexes()
exit

# Re-seed
npm run seed:import
```

### Debug Mode

Enable detailed logging:

**Backend**:

```env
NODE_ENV=development
DEBUG=express:*
```

**Frontend**:

```javascript
// In axiosClient.js
console.log("Request:", config);
console.log("Response:", response);
```

### Getting Help

If you encounter issues:

1. Check backend logs: `tail -f backend.log`
2. Check frontend logs: `tail -f frontend.log`
3. Check MongoDB logs: `tail -f /var/log/mongodb/mongod.log`
4. Enable debug mode and check console
5. Search existing issues or create a new one

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Coding Standards

- Follow existing code style
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation for new features
- Test thoroughly before submitting

---

## 📝 Scripts Reference

### Backend Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run seed:import    # Import sample data
npm run seed:destroy   # Delete all data
npm run seed:sync      # Import data and sync ratings
```

### Frontend Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

### Project Scripts (Root)

```bash
./run.sh           # Start both servers (Linux/macOS)
./setup.sh         # Initial setup (Linux/macOS)
./stop.sh          # Stop all servers (Linux/macOS)

run.bat            # Start both servers (Windows)
setup.bat          # Initial setup (Windows)
stop.bat           # Stop all servers (Windows)
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Nguyen Anh** - _Initial work_ - [GitHub](https://github.com/nguyeenxahndev)

---

## 🙏 Acknowledgments

- [iVIVU.com](https://www.ivivu.com/) for UI/UX inspiration
- [OpenAI](https://openai.com/) for GPT-4o-mini API
- [VNPay](https://vnpay.vn/) for payment gateway
- [Cloudinary](https://cloudinary.com/) for image hosting
- [Mapbox](https://www.mapbox.com/) for mapping service
- [OpenWeatherMap](https://openweathermap.org/) for weather data

---

## 📞 Support

For support, email support@hotel.com or join our Slack channel.

---

## 🎯 Roadmap

- [ ] Multi-language support (i18n)
- [ ] Real-time notifications with Socket.io
- [ ] Mobile app (React Native)
- [ ] Social login (Google, Facebook)
- [ ] Advanced analytics dashboard
- [ ] Loyalty program
- [ ] Gift cards & vouchers
- [ ] Multi-currency support
- [ ] Dark mode
- [ ] PWA support

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Made with ❤️ by Nguyen Anh

[⬆ Back to Top](#-hotel-booking-system)

</div>
