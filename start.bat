@echo off
title PhishGuard Launcher
color 0B

echo.
echo  ██████╗ ██╗  ██╗██╗███████╗██╗  ██╗ ██████╗ ██╗   ██╗ █████╗ ██████╗ ██████╗ 
echo  ██╔══██╗██║  ██║██║██╔════╝██║  ██║██╔════╝ ██║   ██║██╔══██╗██╔══██╗██╔══██╗
echo  ██████╔╝███████║██║███████╗███████║██║  ███╗██║   ██║███████║██████╔╝██║  ██║
echo  ██╔═══╝ ██╔══██║██║╚════██║██╔══██║██║   ██║██║   ██║██╔══██║██╔══██╗██║  ██║
echo  ██║     ██║  ██║██║███████║██║  ██║╚██████╔╝╚██████╔╝██║  ██║██║  ██║██████╔╝
echo  ╚═╝     ╚═╝  ╚═╝╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ 
echo.
echo  AI-Powered Phishing Detection Platform
echo  =========================================
echo.

echo [1/2] Starting Backend (Flask) on http://localhost:5000 ...
start "PhishGuard Backend" cmd /k "cd /d "c:\Users\Shubham Kumar\Downloads\phishguard\backend" && "c:\Users\Shubham Kumar\Downloads\phishguard\.venv\Scripts\python.exe" run.py"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend (Vite) on http://localhost:5173 ...
start "PhishGuard Frontend" cmd /k "cd /d "c:\Users\Shubham Kumar\Downloads\phishguard\frontend" && npm run dev"

timeout /t 5 /nobreak >nul

echo.
echo  Both servers are starting...
echo.
echo  Frontend:  http://localhost:5173
echo  Backend:   http://localhost:5000
echo.
echo  Opening browser...
start "" "http://localhost:5173"

echo.
echo  Press any key to exit this launcher (servers will keep running).
pause >nul
