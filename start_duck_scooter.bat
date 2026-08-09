@echo off
REM Launches Duck Scooter Dash. Serves the folder over localhost (browsers
REM block ES module imports on file:// URLs) then opens it in the default
REM browser. Skips spinning up a second server if one's already listening
REM on the port -- safe to double-click repeatedly.
REM
REM NOTE: this machine has NO Python on the persisted PATH (only a 0-byte
REM Microsoft Store stub that exits 9009), so we must resolve the interpreter
REM by absolute path. A dev shell inherits a richer PATH and hides this.
cd /d "%~dp0"

set "PYEXE=%APPDATA%\uv\python\cpython-3.14.6-windows-x86_64-none\pythonw.exe"
if not exist "%PYEXE%" set "PYEXE=%APPDATA%\uv\python\cpython-3.11.15-windows-x86_64-none\pythonw.exe"
if not exist "%PYEXE%" (
    echo Could not find a Python interpreter to serve the game.
    echo Looked in %APPDATA%\uv\python\
    pause
    exit /b 1
)

netstat -ano | findstr /r /c":8934 .*LISTENING" >nul
if errorlevel 1 (
  start "" /min "%PYEXE%" -m http.server 8934
  ping -n 3 127.0.0.1 >nul
)

start "" http://localhost:8934/index.html
