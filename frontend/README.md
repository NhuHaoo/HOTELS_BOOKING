# 🏨 Hotel Booking System - Frontend

Frontend application for the Smart Hotel Booking System, built with React, TailwindCSS, and modern web technologies.

## 🚀 Tech Stack

- **Framework**: React 18 with Vite
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form
- **Date Picker**: React Datepicker
- **Charts**: Recharts
- **Icons**: React Icons
- **Notifications**: React Hot Toast
- **Maps**: Mapbox GL (optional)

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Backend API running on port 5000

## 🔧 Installation

### 1. Clone the repository

```bash
cd frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

Create a `.env` file in the root directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api

# Mapbox (optional)
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here

# Weather API (optional)
VITE_WEATHER_API_KEY=your_weather_api_key_here

# App Configuration
VITE_APP_NAME=Hotel Booking
VITE_APP_VERSION=1.0.0
```

### 4. Start development server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
frontend/
├── src/
│   ├── api/                    # API services
│   │   ├── axiosClient.js     # Axios configuration
│   │   ├── auth.api.js        # Auth API
│   │   ├── room.api.js        # Room API
│   │   ├── booking.api.js     # Booking API
│   │   ├── review.api.js      # Review API
│   │   ├── favorite.api.js    # Favorite API
│   │   ├── ai.api.js          # AI API
│   │   └── admin.api.js       # Admin API
│   │
│   ├── components/            # Reusable components
│   │   ├── Header.jsx        # Navigation header
│   │   ├── Footer.jsx        # Footer
│   │   ├── RoomCard.jsx      # Room display card
│   │   ├── ReviewCard.jsx    # Review display card
│   │   ├── HeroSearchBar.jsx # Hero search form
│   │   ├── ChatbotWidget.jsx # AI chatbot widget
│   │   ├── Loading.jsx       # Loading component
│   │   ├── Pagination.jsx    # Pagination component
│   │   └── ProtectedRoute.jsx # Route guard
│   │
│   ├── pages/                 # Page components
│   │   ├── Home.jsx          # Homepage
│   │   ├── Login.jsx         # Login page
│   │   ├── Register.jsx      # Register page
│   │   ├── SearchResult.jsx  # Search results
│   │   ├── RoomDetail.jsx    # Room details
│   │   ├── Booking.jsx       # Booking page
│   │   ├── Profile.jsx       # User profile
│   │   ├── Favorites.jsx     # Favorite rooms
│   │   └── admin/
│   │       └── Dashboard.jsx # Admin dashboard
│   │
│   ├── layouts/              # Layout components
│   │   ├── MainLayout.jsx   # Main app layout
│   │   └── AdminLayout.jsx  # Admin layout
│   │
│   ├── store/                # Zustand stores
│   │   ├── useAuthStore.js  # Auth state
│   │   ├── useBookingStore.js # Booking state
│   │   └── useSearchStore.js  # Search state
│   │
│   ├── utils/                # Utility functions
│   │   ├── formatPrice.js   # Price formatting
│   │   ├── dateUtils.js     # Date utilities
│   │   ├── weatherUtils.js  # Weather API
│   │   ├── validation.js    # Form validation
│   │   └── constants.js     # App constants
│   │
│   ├── router/              # Routing configuration
│   │   └── AppRouter.jsx    # Main router
│   │
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # App entry point
│   └── index.css            # Global styles
│
├── public/                   # Static assets
├── index.html               # HTML template
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind configuration
├── package.json            # Dependencies
└── README.md               # This file
```

## 🎨 Features

### User Features
- ✅ Browse and search rooms
- ✅ Advanced filtering (price, type, amenities, rating)
- ✅ View room details with gallery
- ✅ Book rooms with date selection
- ✅ VNPay payment integration
- ✅ Manage bookings
- ✅ Write and view reviews
- ✅ Favorite rooms
- ✅ AI chatbot support
- ✅ Personalized recommendations
- ✅ User profile management

### Admin Features
- ✅ Dashboard with statistics
- ✅ Revenue analytics with charts
- ✅ Manage hotels and rooms
- ✅ View all bookings
- ✅ Manage users and reviews

## 🎯 Key Components

### HeroSearchBar
Main search component on homepage with:
- Destination selection
- Date range picker
- Guest count selector
- Search functionality

### RoomCard
Reusable room display card with:
- Room image and info
- Rating display
- Price with discount
- Favorite toggle
- Book now button

### ChatbotWidget
AI-powered chatbot with:
- Floating button
- Real-time chat
- Suggested questions
- Integration with backend AI API

## 🔐 Authentication

The app uses JWT-based authentication:

1. Login/Register → Receive JWT token
2. Token stored in localStorage
3. Axios interceptor adds token to requests
4. Protected routes check authentication
5. Auto-redirect on 401 errors

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: 
  - sm: 640px
  - md: 768px
  - lg: 1024px
  - xl: 1280px
- Touch-friendly interfaces
- Optimized images and loading

## 🎨 UI/UX Design

### Color Scheme
- **Primary**: #003580 (Navy Blue)
- **Secondary**: #0071c2 (Light Blue)
- **Accent**: #febb02 (Yellow/Gold)
- **Background**: #f5f7fa (Light Gray)

### Design Principles
- Clean and modern interface
- Consistent spacing and typography
- Smooth animations and transitions
- Intuitive navigation
- Accessible components

## 🚀 Build & Deployment

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod
```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_BASE_URL` | Backend API URL | Yes |
| `VITE_MAPBOX_ACCESS_TOKEN` | Mapbox token | No |
| `VITE_WEATHER_API_KEY` | Weather API key | No |
| `VITE_APP_NAME` | App name | No |
| `VITE_APP_VERSION` | App version | No |

## 🧪 Testing

```bash
# Run tests (if configured)
npm test
```

## 🔍 Code Quality

```bash
# Lint code
npm run lint
```

## 🐛 Troubleshooting

### Port already in use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port in vite.config.js
```

### API connection issues

1. Check backend is running on port 5000
2. Verify VITE_API_BASE_URL in .env
3. Check CORS configuration in backend
4. Clear browser cache and localStorage

### Build errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📦 Dependencies

### Main Dependencies
- `react`: ^18.2.0
- `react-dom`: ^18.2.0
- `react-router-dom`: ^6.20.0
- `@tanstack/react-query`: ^5.14.0
- `axios`: ^1.6.2
- `zustand`: ^4.4.7
- `react-hook-form`: ^7.48.2
- `date-fns`: ^2.30.0
- `react-datepicker`: ^4.24.0
- `react-icons`: ^4.12.0
- `framer-motion`: ^10.16.16
- `recharts`: ^2.10.3
- `react-hot-toast`: ^2.4.1

### Dev Dependencies
- `vite`: ^5.0.8
- `tailwindcss`: ^3.3.6
- `postcss`: ^8.4.32
- `autoprefixer`: ^10.4.16

## 📚 Documentation

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [TailwindCSS Documentation](https://tailwindcss.com/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [React Router Documentation](https://reactrouter.com/)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Authors

- Development Team

## 🆘 Support

For support, email support@hotelbooking.com or create an issue in the repository.

## 🎉 Acknowledgments

- Design inspiration from iVIVU.com
- Backend API team
- Open source community

---

**Made with ❤️ for Hotel Booking System**

**Version**: 1.0.0  
**Last Updated**: October 2025

