@echo off
setlocal

echo.
echo [94m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m
echo [94m  🛑 STOPPING HOTEL BOOKING SYSTEM[0m
echo [94m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m
echo.

:: Kill processes on port 2409 (Backend)
echo [93m⏳ Stopping backend (Port 2409)...[0m
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :2409 ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
    if !errorlevel! equ 0 (
        echo [92m✓ Backend stopped (PID: %%a)[0m
    )
)

:: Kill processes on port 3000 (Frontend)
echo [93m⏳ Stopping frontend (Port 3000)...[0m
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
    if !errorlevel! equ 0 (
        echo [92m✓ Frontend stopped (PID: %%a)[0m
    )
)

:: Also kill any node processes related to the project
echo [93m⏳ Cleaning up Node.js processes...[0m
for /f "tokens=2" %%a in ('tasklist ^| findstr "node.exe"') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo [92m✅ All servers stopped successfully![0m
echo.

pause

