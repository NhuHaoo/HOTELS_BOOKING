@echo off
setlocal enabledelayedexpansion

:: Colors (using PowerShell for colored output)
set "RESET=[0m"
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "PURPLE=[95m"
set "CYAN=[96m"

:: Banner
echo.
echo [94m╔═══════════════════════════════════════════════════╗[0m
echo [94m║                                                   ║[0m
echo [94m║   🏨  HOTEL BOOKING SYSTEM - RUN SCRIPT          ║[0m
echo [94m║                                                   ║[0m
echo [94m╚═══════════════════════════════════════════════════╝[0m
echo.

:: Check if node is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [91m❌ Node.js is not installed![0m
    echo [93mPlease install Node.js 18+ from: https://nodejs.org/[0m
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [92m✓ Node.js version: %NODE_VERSION%[0m
echo.

:: Check if MongoDB is running
echo [96m📡 Checking MongoDB...[0m
mongosh --eval "db.version()" --quiet >nul 2>&1
if %errorlevel% equ 0 (
    echo [92m✓ MongoDB is running[0m
) else (
    echo [93m⚠️  MongoDB is not running![0m
    echo [93mYou can use MongoDB Atlas instead ^(cloud^)[0m
    echo [93mSee: backend\MONGODB_ATLAS_SETUP.md[0m
)
echo.

:: Function to check if dependencies are installed
echo [96m📦 Checking dependencies...[0m

if not exist "backend\node_modules" (
    echo [93m📦 Installing Backend dependencies...[0m
    cd backend
    call npm install
    cd ..
    echo [92m✓ Backend dependencies installed[0m
) else (
    echo [92m✓ Backend dependencies already installed[0m
)

if not exist "frontend\node_modules" (
    echo [93m📦 Installing Frontend dependencies...[0m
    cd frontend
    call npm install
    cd ..
    echo [92m✓ Frontend dependencies installed[0m
) else (
    echo [92m✓ Frontend dependencies already installed[0m
)
echo.

:: Check if .env files exist
if not exist "backend\.env" (
    echo [93m⚠️  backend\.env not found![0m
    echo [93mCreating from .env.example...[0m
    if exist "backend\.env.example" (
        copy "backend\.env.example" "backend\.env" >nul
        echo [92m✓ Created backend\.env[0m
        echo [93mPlease edit backend\.env with your configuration[0m
    )
)

if not exist "frontend\.env" (
    echo [93m⚠️  frontend\.env not found![0m
    echo [93mCreating default .env...[0m
    (
        echo VITE_API_BASE_URL=http://localhost:2409/api
        echo VITE_APP_NAME=Hotel Booking
        echo VITE_APP_VERSION=1.0.0
    ) > "frontend\.env"
    echo [92m✓ Created frontend\.env[0m
)
echo.

:: Kill existing processes on ports 2409 and 3000
echo [96m🔍 Checking for existing processes...[0m

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :2409') do (
    taskkill /PID %%a /F >nul 2>&1
    echo [93mKilled process on port 2409[0m
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    taskkill /PID %%a /F >nul 2>&1
    echo [93mKilled process on port 3000[0m
)
echo.

:: Start Backend
echo [95m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m
echo [95m  🚀 Starting Backend Server ^(Port 2409^)[0m
echo [95m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m
cd backend
start /B npm run dev > ..\backend.log 2>&1
echo [92m✓ Backend started[0m
echo [96m  Log: backend.log[0m
cd ..

:: Wait for backend to start
echo [93m⏳ Waiting for backend to be ready...[0m
set BACKEND_READY=0
for /L %%i in (1,1,30) do (
    timeout /t 1 /nobreak >nul
    curl -s http://localhost:2409 >nul 2>&1
    if !errorlevel! equ 0 (
        echo [92m✓ Backend is ready![0m
        set BACKEND_READY=1
        goto backend_ready
    )
    echo|set /p="."
)

:backend_ready
if %BACKEND_READY% equ 0 (
    echo.
    echo [91m❌ Backend failed to start. Check backend.log[0m
    pause
    exit /b 1
)
echo.

:: Start Frontend
echo.
echo [95m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m
echo [95m  🎨 Starting Frontend ^(Port 3000^)[0m
echo [95m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m
cd frontend
start /B npm run dev > ..\frontend.log 2>&1
echo [92m✓ Frontend started[0m
echo [96m  Log: frontend.log[0m
cd ..

:: Wait for frontend to start
echo [93m⏳ Waiting for frontend to be ready...[0m
set FRONTEND_READY=0
for /L %%i in (1,1,30) do (
    timeout /t 1 /nobreak >nul
    curl -s http://localhost:3000 >nul 2>&1
    if !errorlevel! equ 0 (
        echo [92m✓ Frontend is ready![0m
        set FRONTEND_READY=1
        goto frontend_ready
    )
    echo|set /p="."
)

:frontend_ready
if %FRONTEND_READY% equ 0 (
    echo.
    echo [91m❌ Frontend failed to start. Check frontend.log[0m
    pause
    exit /b 1
)
echo.

:: Success message
echo.
echo [92m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m
echo [92m  ✅  APPLICATION STARTED SUCCESSFULLY![0m
echo [92m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m
echo.
echo [96m📱 Frontend:  [93mhttp://localhost:3000[0m
echo [96m🔧 Backend:   [93mhttp://localhost:2409[0m
echo [96m📚 API Docs:  [93mhttp://localhost:2409/api[0m
echo.
echo [95m🔑 Demo Accounts:[0m
echo    Admin:  [93madmin@example.com[0m / [93madmin123[0m
echo    User:   [93muser1@example.com[0m / [93mpassword123[0m
echo.
echo [94m💡 Tips:[0m
echo    • View backend logs:  [93mtype backend.log[0m
echo    • View frontend logs: [93mtype frontend.log[0m
echo    • Stop application:   [93mstop.bat[0m
echo    • Seed database:      [93mcd backend ^&^& npm run seed:import[0m
echo.
echo [92mBoth servers are running. Press Ctrl+C to stop (or close this window and run stop.bat)[0m
echo.

:: Open browser
timeout /t 2 /nobreak >nul
start http://localhost:3000

:: Keep window open
pause

