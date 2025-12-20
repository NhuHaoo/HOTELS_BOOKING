# Hotel Booking System - Backend

Backend API for the Hotel Booking System built with Node.js and Express.

## 🛠 Tech Stack

- **Runtime**: Node.js v16+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Cloudinary + Multer
- **Payment**: VNPay Payment Gateway
- **Email**: NodeMailer
- **AI**: OpenAI API (GPT-4o-mini)
- **Weather**: OpenWeatherMap API

## 📦 Installation

```bash
npm install
```

## 🚀 Development

```bash
npm run dev
```

The API will be available at `http://localhost:2409`

## 🏗 Production

```bash
npm start
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middlewares/     # Custom middlewares
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   ├── app.js           # Express app setup
│   └── server.js        # Server entry point
├── uploads/             # Local file uploads
└── package.json
```

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=2409
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/hotel_booking
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret
```

## 🗄️ Database Seeding

```bash
# Import sample data
npm run seed:import

# Delete all data
npm run seed:delete

# Import and sync
npm run seed:sync
```

## 📚 API Endpoints

- **Authentication**: `/api/auth/*`
- **Hotels**: `/api/hotels/*`
- **Rooms**: `/api/rooms/*`
- **Bookings**: `/api/bookings/*`
- **Payments**: `/api/payments/*`
- **Reviews**: `/api/reviews/*`
- **AI**: `/api/ai/*`
- **Admin**: `/api/admin/*`

## 🔐 Features

- JWT-based authentication
- Role-based access control (Admin, Manager, User)
- RESTful API design
- Error handling middleware
- File upload with Cloudinary
- Payment gateway integration
- AI chatbot with function calling
- Geospatial queries
- Aggregation pipelines
