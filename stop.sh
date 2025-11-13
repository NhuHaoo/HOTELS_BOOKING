#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  🛑 STOPPING HOTEL BOOKING SYSTEM${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Stop processes by PID files
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}⏳ Stopping backend (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}✓ Backend stopped${NC}"
    fi
    rm -f .backend.pid
fi

if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}⏳ Stopping frontend (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}✓ Frontend stopped${NC}"
    fi
    rm -f .frontend.pid
fi

# Kill any remaining processes on ports
if lsof -ti:2409 > /dev/null 2>&1; then
    echo -e "${YELLOW}⏳ Killing remaining processes on port 2409...${NC}"
    lsof -ti:2409 | xargs kill -9 2>/dev/null
fi

if lsof -ti:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}⏳ Killing remaining processes on port 3000...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null
fi

echo ""
echo -e "${GREEN}✅ All servers stopped successfully!${NC}"
echo ""

