@echo off
cd /d "c:\Users\www\OneDrive - MUST University\Desktop\Dashboard"
echo Starting backend server...
start "Backend Server" cmd /k "node server.js"
echo Starting frontend dev server...
npm run dev

