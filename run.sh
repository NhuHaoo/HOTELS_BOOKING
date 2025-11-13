#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🏨  HOTEL BOOKING SYSTEM - RUN SCRIPT          ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed!${NC}"
    echo -e "${YELLOW}Please install Node.js 18+ from: https://nodejs.org/${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js version: $(node -v)${NC}"
echo ""

# Check if MongoDB is running (for backend)
echo -e "${CYAN}📡 Checking MongoDB...${NC}"
if command -v mongosh &> /dev/null; then
    if mongosh --eval "db.version()" --quiet &> /dev/null; then
        echo -e "${GREEN}✓ MongoDB is running${NC}"
    else
        echo -e "${YELLOW}⚠️  MongoDB is not running!${NC}"
        echo -e "${YELLOW}Starting MongoDB...${NC}"
        if command -v brew &> /dev/null; then
            brew services start mongodb-community 2>/dev/null || mongod --fork --logpath /tmp/mongod.log 2>/dev/null
        else
            mongod --fork --logpath /tmp/mongod.log 2>/dev/null
        fi
        sleep 3
    fi
else
    echo -e "${YELLOW}⚠️  MongoDB not found. Backend may not work properly.${NC}"
    echo -e "${YELLOW}See: backend/MONGODB_ATLAS_SETUP.md for cloud option${NC}"
fi
echo ""

# Function to check if dependencies are installed
check_dependencies() {
    local dir=$1
    local name=$2
    
    if [ ! -d "$dir/node_modules" ]; then
        echo -e "${YELLOW}📦 Installing $name dependencies...${NC}"
        cd "$dir"
        npm install
        cd ..
        echo -e "${GREEN}✓ $name dependencies installed${NC}"
    else
        echo -e "${GREEN}✓ $name dependencies already installed${NC}"
    fi
}

# Check dependencies
echo -e "${CYAN}📦 Checking dependencies...${NC}"
check_dependencies "backend" "Backend"
check_dependencies "frontend" "Frontend"
echo ""

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  backend/.env not found!${NC}"
    echo -e "${YELLOW}Creating from .env.example...${NC}"
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo -e "${GREEN}✓ Created backend/.env${NC}"
        echo -e "${YELLOW}Please edit backend/.env with your configuration${NC}"
    fi
fi

if [ ! -f "frontend/.env" ]; then
    echo -e "${YELLOW}⚠️  frontend/.env not found!${NC}"
    echo -e "${YELLOW}Creating default .env...${NC}"
    cat > frontend/.env << 'EOF'
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Hotel Booking
VITE_APP_VERSION=1.0.0
EOF
    echo -e "${GREEN}✓ Created frontend/.env${NC}"
fi
echo ""

# Kill existing processes on ports 2409 and 3000
echo -e "${CYAN}🔍 Checking for existing processes...${NC}"
if lsof -ti:2409 &> /dev/null; then
    echo -e "${YELLOW}Killing process on port 2409...${NC}"
    lsof -ti:2409 | xargs kill -9 2>/dev/null
fi
if lsof -ti:3000 &> /dev/null; then
    echo -e "${YELLOW}Killing process on port 3000...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null
fi
echo ""

# Start Backend
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${PURPLE}  🚀 Starting Backend Server (Port 2409)${NC}"
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
echo -e "${CYAN}  Log: backend.log${NC}"
cd ..

# Wait for backend to start
echo -e "${YELLOW}⏳ Waiting for backend to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:2409 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is ready!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Backend failed to start. Check backend.log${NC}"
        exit 1
    fi
    sleep 1
    echo -n "."
done
echo ""

# Start Frontend
echo ""
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${PURPLE}  🎨 Starting Frontend (Port 3000)${NC}"
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
echo -e "${CYAN}  Log: frontend.log${NC}"
cd ..

# Wait for frontend to start
echo -e "${YELLOW}⏳ Waiting for frontend to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend is ready!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Frontend failed to start. Check frontend.log${NC}"
        exit 1
    fi
    sleep 1
    echo -n "."
done
echo ""

# Success message
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅  APPLICATION STARTED SUCCESSFULLY!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}📱 Frontend:  ${YELLOW}http://localhost:3000${NC}"
echo -e "${CYAN}🔧 Backend:   ${YELLOW}http://localhost:2409${NC}"
echo -e "${CYAN}📚 API Docs:  ${YELLOW}http://localhost:2409/api${NC}"
echo ""
echo -e "${PURPLE}🔑 Demo Accounts:${NC}"
echo -e "   Admin:  ${YELLOW}admin@example.com${NC} / ${YELLOW}admin123${NC}"
echo -e "   User:   ${YELLOW}user1@example.com${NC} / ${YELLOW}password123${NC}"
echo ""
echo -e "${CYAN}📊 Process IDs:${NC}"
echo -e "   Backend PID:  ${YELLOW}$BACKEND_PID${NC}"
echo -e "   Frontend PID: ${YELLOW}$FRONTEND_PID${NC}"
echo ""
echo -e "${BLUE}💡 Tips:${NC}"
echo -e "   • View backend logs:  ${YELLOW}tail -f backend.log${NC}"
echo -e "   • View frontend logs: ${YELLOW}tail -f frontend.log${NC}"
echo -e "   • Stop application:   ${YELLOW}./stop.sh${NC}"
echo -e "   • Seed database:      ${YELLOW}cd backend && npm run seed:import${NC}"
echo ""
echo -e "${GREEN}Press Ctrl+C to stop all servers${NC}"
echo ""

# Save PIDs to file for stop script
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid

# Wait for user interrupt
trap "echo -e '\n${YELLOW}Stopping servers...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; rm -f .backend.pid .frontend.pid; echo -e '${GREEN}✓ Servers stopped${NC}'; exit 0" INT

# Keep script running
wait

