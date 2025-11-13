@echo off
setlocal enabledelayedexpansion

:: Banner
echo.
echo [94m╔═══════════════════════════════════════════════════╗[0m
echo [94m║                                                   ║[0m
echo [94m║   🏨  HOTEL BOOKING SYSTEM - SETUP SCRIPT        ║[0m
echo [94m║                                                   ║[0m
echo [94m╚═══════════════════════════════════════════════════╝[0m
echo.

:: Check Node.js
echo [96m1. Checking Node.js...[0m
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [91m❌ Node.js is not installed![0m
    echo [93mPlease install Node.js 18+ from: https://nodejs.org/[0m
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [92m✓ Node.js %NODE_VERSION% installed[0m
echo.

:: Check npm
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [91m❌ npm is not installed![0m
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo [92m✓ npm %NPM_VERSION% installed[0m
echo.

:: Check MongoDB
echo [96m2. Checking MongoDB...[0m
where mongosh >nul 2>&1
if %errorlevel% equ 0 (
    echo [92m✓ MongoDB Shell installed[0m
    mongosh --eval "db.version()" --quiet >nul 2>&1
    if !errorlevel! equ 0 (
        for /f "tokens=*" %%i in ('mongosh --eval "db.version()" --quiet 2^>nul') do set MONGO_VERSION=%%i
        echo [92m✓ MongoDB !MONGO_VERSION! is running[0m
    ) else (
        echo [93m⚠️  MongoDB is not running[0m
        echo [93mYou can use MongoDB Atlas instead ^(cloud^)[0m
        echo [93mSee: backend\MONGODB_ATLAS_SETUP.md[0m
    )
) else (
    echo [93m⚠️  MongoDB not found[0m
    echo [93mPlease install MongoDB manually or use MongoDB Atlas ^(recommended^)[0m
    echo [93mSee: backend\MONGODB_ATLAS_SETUP.md[0m
)
echo.

:: Install Backend Dependencies
echo [96m3. Installing Backend Dependencies...[0m
cd backend
if not exist "package.json" (
    echo [91m❌ backend\package.json not found![0m
    cd ..
    pause
    exit /b 1
)
call npm install
if %errorlevel% equ 0 (
    echo [92m✓ Backend dependencies installed[0m
) else (
    echo [91m❌ Failed to install backend dependencies[0m
    cd ..
    pause
    exit /b 1
)
cd ..
echo.

:: Install Frontend Dependencies
echo [96m4. Installing Frontend Dependencies...[0m
cd frontend
if not exist "package.json" (
    echo [91m❌ frontend\package.json not found![0m
    cd ..
    pause
    exit /b 1
)
call npm install
if %errorlevel% equ 0 (
    echo [92m✓ Frontend dependencies installed[0m
) else (
    echo [91m❌ Failed to install frontend dependencies[0m
    cd ..
    pause
    exit /b 1
)
cd ..
echo.

:: Setup Backend .env
echo [96m5. Setting up Backend Environment...[0m
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        copy "backend\.env.example" "backend\.env" >nul
        echo [92m✓ Created backend\.env from template[0m
        echo [93m⚠️  Please edit backend\.env with your configuration:[0m
        echo    - MongoDB URI
        echo    - JWT Secret
        echo    - VNPay credentials ^(optional^)
        echo    - Cloudinary credentials ^(optional^)
        echo    - Email credentials ^(optional^)
    ) else (
        echo [93m⚠️  backend\.env.example not found, creating basic .env[0m
        (
            echo PORT=2409
            echo NODE_ENV=development
            echo MONGODB_URI=mongodb://localhost:27017/hotel_booking
            echo JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_min_32_chars
            echo JWT_EXPIRE=7d
            echo FRONTEND_URL=http://localhost:3000
        ) > "backend\.env"
        echo [92m✓ Created basic backend\.env[0m
    )
) else (
    echo [92m✓ backend\.env already exists[0m
)
echo.

:: Setup Frontend .env
echo [96m6. Setting up Frontend Environment...[0m
if not exist "frontend\.env" (
    (
        echo VITE_API_BASE_URL=http://localhost:2409/api
        echo VITE_APP_NAME=Hotel Booking
        echo VITE_APP_VERSION=1.0.0
    ) > "frontend\.env"
    echo [92m✓ Created frontend\.env[0m
) else (
    echo [92m✓ frontend\.env already exists[0m
)
echo.

:: Seed Database
echo [96m7. Database Setup[0m
set /p SEED_DB="[93mWould you like to seed the database with sample data? (y/n): [0m"
if /i "%SEED_DB%"=="y" (
    echo [96mSeeding database...[0m
    cd backend
    call npm run seed:import
    cd ..
    echo [92m✓ Database seeded with sample data[0m
    echo.
    echo [95m📝 Sample Accounts Created:[0m
    echo    Admin: [93madmin@hotel.com[0m / [93madmin123[0m
    echo    User:  [93muser1@example.com[0m / [93mpassword123[0m
) else (
    echo [93mSkipping database seeding[0m
)
echo.

:: Success
echo [92m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m
echo [92m  ✅  SETUP COMPLETED SUCCESSFULLY![0m
echo [92m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m
echo.
echo [96m📋 Next Steps:[0m
echo.
echo   1. [93mReview configuration:[0m
echo      [94mnotepad backend\.env[0m
echo.
echo   2. [93mStart the application:[0m
echo      [94mrun.bat[0m
echo.
echo   3. [93mAccess the application:[0m
echo      Frontend: [94mhttp://localhost:3000[0m
echo      Backend:  [94mhttp://localhost:2409[0m
echo.
echo   4. [93mStop the application:[0m
echo      [94mstop.bat[0m
echo.
echo [95m📚 Documentation:[0m
echo    • Backend:  [94mbackend\README.md[0m
echo    • Frontend: [94mfrontend\README.md[0m
echo    • API Docs: [94mbackend\API_REFERENCE.md[0m
echo.
echo [92mHappy Coding! 🚀[0m
echo.

pause

