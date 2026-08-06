@echo off
REM Launches Duck Scooter Dash. Serves the folder over localhost (browsers
REM block ES module imports on file:// URLs) then opens it in the default
REM browser. Skips spinning up a second server if one's already listening
REM on the port -- safe to double-click repeatedly.
cd /d "%~dp0"

netstat -ano | findstr /r /c":8934 .*LISTENING" >nul
if errorlevel 1 (
  start "Duck Scooter Dash - server (closing this window stops the game)" cmd /k python -m http.server 8934
  ping -n 3 127.0.0.1 >nul
)

start "" http://localhost:8934/index.html
