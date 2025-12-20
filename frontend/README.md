# Hotel Booking System - Frontend

Frontend application for the Hotel Booking System built with React and Vite.

## 🛠 Tech Stack

- **Framework**: React 18 with Vite
- **Routing**: React Router v6
- **State Management**: Zustand + TanStack Query
- **Styling**: TailwindCSS
- **HTTP Client**: Axios
- **Maps**: Mapbox GL JS
- **Icons**: React Icons
- **Notifications**: React Hot Toast
- **Date Picker**: React Datepicker

## 📦 Installation

```bash
npm install
```

## 🚀 Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## 🏗 Build

```bash
npm run build
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── api/             # API client services
│   ├── components/       # Reusable components
│   ├── layouts/          # Layout components
│   ├── pages/            # Page components
│   ├── router/            # Routing configuration
│   ├── store/            # Zustand stores
│   ├── utils/            # Utility functions
│   ├── App.jsx            # Root component
│   └── main.jsx           # App entry point
├── public/                # Static assets
└── package.json
```

## ⚙️ Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:2409/api
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

## 🎨 Features

- User authentication and authorization
- Hotel and room search with advanced filters
- Booking management
- AI-powered chatbot
- Personalized recommendations
- Payment integration
- Review and rating system
- Responsive design
