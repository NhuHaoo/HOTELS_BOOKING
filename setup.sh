#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Banner
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🏨  HOTEL BOOKING SYSTEM - SETUP SCRIPT        ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check Node.js
echo -e "${CYAN}1. Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed!${NC}"
    echo -e "${YELLOW}Please install Node.js 18+ from: https://nodejs.org/${NC}"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js $NODE_VERSION installed${NC}"
echo ""

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed!${NC}"
    exit 1
fi
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓ npm $NPM_VERSION installed${NC}"
echo ""

# Check MongoDB
echo -e "${CYAN}2. Checking MongoDB...${NC}"
if command -v mongosh &> /dev/null; then
    echo -e "${GREEN}✓ MongoDB Shell installed${NC}"
    if mongosh --eval "db.version()" --quiet &> /dev/null 2>&1; then
        MONGO_VERSION=$(mongosh --eval "db.version()" --quiet 2>/dev/null)
        echo -e "${GREEN}✓ MongoDB $MONGO_VERSION is running${NC}"
    else
        echo -e "${YELLOW}⚠️  MongoDB is not running${NC}"
        echo -e "${YELLOW}You can use MongoDB Atlas instead (cloud)${NC}"
        echo -e "${YELLOW}See: backend/MONGODB_ATLAS_SETUP.md${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  MongoDB not found${NC}"
    echo -e "${YELLOW}Would you like to install MongoDB? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        if command -v brew &> /dev/null; then
            echo -e "${CYAN}Installing MongoDB via Homebrew...${NC}"
            bash backend/install-mongodb.sh
        else
            echo -e "${YELLOW}Homebrew not found. Please install MongoDB manually or use MongoDB Atlas${NC}"
            echo -e "${YELLOW}See: backend/MONGODB_ATLAS_SETUP.md${NC}"
        fi
    else
        echo -e "${YELLOW}Skipping MongoDB installation. You can use MongoDB Atlas${NC}"
    fi
fi
echo ""

# Install Backend Dependencies
echo -e "${CYAN}3. Installing Backend Dependencies...${NC}"
cd backend
if [ -f "package.json" ]; then
    npm install
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${RED}❌ backend/package.json not found!${NC}"
    exit 1
fi
cd ..
echo ""

# Install Frontend Dependencies
echo -e "${CYAN}4. Installing Frontend Dependencies...${NC}"
cd frontend
if [ -f "package.json" ]; then
    npm install
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${RED}❌ frontend/package.json not found!${NC}"
    exit 1
fi
cd ..
echo ""

# Setup Backend .env
echo -e "${CYAN}5. Setting up Backend Environment...${NC}"
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo -e "${GREEN}✓ Created backend/.env from template${NC}"
        echo -e "${YELLOW}⚠️  Please edit backend/.env with your configuration:${NC}"
        echo -e "   - MongoDB URI"
        echo -e "   - JWT Secret"
        echo -e "   - VNPay credentials (optional)"
        echo -e "   - Cloudinary credentials (optional)"
        echo -e "   - Email credentials (optional)"
    else
        echo -e "${YELLOW}⚠️  backend/.env.example not found, creating basic .env${NC}"
        cat > backend/.env << 'EOF'
PORT=2409
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/hotel_booking
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_min_32_chars
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
EOF
        echo -e "${GREEN}✓ Created basic backend/.env${NC}"
    fi
else
    echo -e "${GREEN}✓ backend/.env already exists${NC}"
fi
echo ""

# Setup Frontend .env
echo -e "${CYAN}6. Setting up Frontend Environment...${NC}"
if [ ! -f "frontend/.env" ]; then
    cat > frontend/.env << 'EOF'
VITE_API_BASE_URL=http://localhost:2409/api
VITE_APP_NAME=Hotel Booking
VITE_APP_VERSION=1.0.0
EOF
    echo -e "${GREEN}✓ Created frontend/.env${NC}"
else
    echo -e "${GREEN}✓ frontend/.env already exists${NC}"
fi
echo ""

# Seed Database
echo -e "${CYAN}7. Database Setup${NC}"
echo -e "${YELLOW}Would you like to seed the database with sample data? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "${CYAN}Seeding database...${NC}"
    cd backend
    npm run seed:import
    cd ..
    echo -e "${GREEN}✓ Database seeded with sample data${NC}"
    echo ""
    echo -e "${PURPLE}📝 Sample Accounts Created:${NC}"
    echo -e "   Admin: ${YELLOW}admin@hotel.com${NC} / ${YELLOW}admin123${NC}"
    echo -e "   User:  ${YELLOW}user1@example.com${NC} / ${YELLOW}password123${NC}"
else
    echo -e "${YELLOW}Skipping database seeding${NC}"
fi
echo ""

# Make scripts executable
echo -e "${CYAN}8. Setting up run scripts...${NC}"
chmod +x run.sh
chmod +x stop.sh
chmod +x setup.sh 2>/dev/null
echo -e "${GREEN}✓ Scripts are now executable${NC}"
echo ""

# Success
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅  SETUP COMPLETED SUCCESSFULLY!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}📋 Next Steps:${NC}"
echo ""
echo -e "  1. ${YELLOW}Review configuration:${NC}"
echo -e "     ${BLUE}nano backend/.env${NC}"
echo ""
echo -e "  2. ${YELLOW}Start the application:${NC}"
echo -e "     ${BLUE}./run.sh${NC}"
echo ""
echo -e "  3. ${YELLOW}Access the application:${NC}"
echo -e "     Frontend: ${BLUE}http://localhost:3000${NC}"
echo -e "     Backend:  ${BLUE}http://localhost:2409${NC}"
echo ""
echo -e "  4. ${YELLOW}Stop the application:${NC}"
echo -e "     ${BLUE}./stop.sh${NC}"
echo ""
echo -e "${PURPLE}📚 Documentation:${NC}"
echo -e "   • Backend:  ${BLUE}backend/README.md${NC}"
echo -e "   • Frontend: ${BLUE}frontend/README.md${NC}"
echo -e "   • API Docs: ${BLUE}backend/API_REFERENCE.md${NC}"
echo ""
echo -e "${GREEN}Happy Coding! 🚀${NC}"
echo ""

