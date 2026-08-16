@echo off
REM ===========================================================================
REM  Cogs & Cadavers - THE server menu.  Double-click it.
REM
REM  Also takes an argument, so it works from a shortcut or another script:
REM      Server.bat start | stop | restart | status | backup | errors
REM  With no argument you get the menu.
REM
REM  Everything here goes through tools\serverctl.py, which is the only start/
REM  stop path with the guards on it: it waits for RCON to actually open rather
REM  than assuming, it flushes the world before stopping, and it NEVER kills the
REM  process on a timeout - it says so and leaves it alone.
REM
REM  WHY THAT MATTERS. On 2026-08-15 a world was lost because a restart timed
REM  out and java was killed mid-save - level.dat AND level.dat_old were both
REM  unreadable afterwards. On 2026-08-16 a session ended with no shutdown
REM  sequence in the log at all: closed window, no save. This file exists so the
REM  safe path is also the easy one.
REM
REM  Written 2026-08-16 so Ethan stops having to ask for a restart every time.
REM ===========================================================================
title Cogs ^& Cadavers - server

set "REPO=C:\MCServer\repo"
set "INSTANCE=C:\MCServer\instance"

REM -- Find Python. `py` is the Windows launcher and is the stable choice: on
REM -- this machine a plain `python` resolves into an unrelated project's venv
REM -- (unsloth_studio), which would break this file the day that venv moves.
REM -- serverctl.py is pure stdlib, so any 3.x will do.
set "PY="
where py >nul 2>&1 && set "PY=py"
if not defined PY where python >nul 2>&1 && set "PY=python"
if not defined PY (
  echo.
  echo   XX  No Python on PATH. Install it, or start the server with Play.bat.
  echo.
  pause
  exit /b 1
)

REM -- Argument mode: do the one thing and leave. No menu, no pause, so this is
REM -- safe to call from a shortcut or another script.
if not "%~1"=="" (
  call :run %~1
  exit /b %errorlevel%
)

:menu
cls
echo.
echo   ===========================================================
echo      COGS ^& CADAVERS
echo   ===========================================================
echo.
call :status
echo.
echo     [1]  Start
echo     [2]  Stop           - saves the world first
echo     [3]  Restart        - use after ANY script change
echo     [4]  Status
echo     [5]  Backup the world
echo     [6]  Check the log for errors
echo.
echo     [Q]  Quit this menu - the server keeps running
echo.
echo   -----------------------------------------------------------
echo    Closing this window does NOT stop the server. Use [2].
echo   -----------------------------------------------------------
echo.
set "CHOICE="
set /p "CHOICE=  Choose: "
if not defined CHOICE goto menu

if "%CHOICE%"=="1" call :run start
if "%CHOICE%"=="2" call :run stop
if "%CHOICE%"=="3" call :run restart
if "%CHOICE%"=="4" call :run status
if "%CHOICE%"=="5" call :run backup
if "%CHOICE%"=="6" call :run errors
if /i "%CHOICE%"=="Q" goto quit

echo.
pause
goto menu

REM ---------------------------------------------------------------------------
REM  One dispatcher, so the menu and the argument form can never drift apart.
REM ---------------------------------------------------------------------------
:run
if /i "%~1"=="start" (
  echo.
  echo   ==^> Starting. Takes about a minute - it waits for the server to really
  echo       accept connections, not just for java to appear.
  echo.
  %PY% "%REPO%\tools\serverctl.py" start
  goto :eof
)
if /i "%~1"=="stop" (
  echo.
  echo   ==^> Stopping. Flushes the world to disk first.
  echo.
  %PY% "%REPO%\tools\serverctl.py" stop --message "Server going down."
  goto :eof
)
if /i "%~1"=="restart" (
  echo.
  echo   ==^> Restarting. Required for KubeJS script changes - /kubejs reload
  echo       does NOT re-fire ServerEvents.loaded, so a reload leaves half the
  echo       systems running their old boot state.
  echo.
  %PY% "%REPO%\tools\serverctl.py" restart --message "Server restarting shortly."
  goto :eof
)
if /i "%~1"=="status" (
  echo.
  %PY% "%REPO%\tools\serverctl.py" status
  goto :eof
)
if /i "%~1"=="backup" (
  echo.
  echo   ==^> World plus the configs that make it mean anything. Safe while up.
  echo.
  powershell -NoProfile -ExecutionPolicy Bypass -File "%REPO%\server\scripts\backup.ps1" -InstanceDir "%INSTANCE%" -Live
  goto :eof
)
if /i "%~1"=="errors" (
  echo.
  echo   ==^> Real errors only. Known noise is filtered, but KubeJS script errors
  echo       ARE included - they log without a level.
  echo.
  %PY% "%REPO%\tools\logq.py" errors
  goto :eof
)
echo.
echo   XX  Unknown: %~1
echo       Use: start ^| stop ^| restart ^| status ^| backup ^| errors
goto :eof

:status
REM One quiet line at the top of the menu, so the state is visible BEFORE you
REM pick something rather than after.
tasklist /fi "imagename eq java.exe" 2>nul | find /i "java.exe" >nul
if errorlevel 1 (echo      status:  OFFLINE) else (echo      status:  RUNNING)
goto :eof

:quit
cls
echo.
call :status
echo.
echo   Menu closed. If it is RUNNING it stays running - come back here and
echo   pick [2] when you want it down.
echo.
exit /b 0
