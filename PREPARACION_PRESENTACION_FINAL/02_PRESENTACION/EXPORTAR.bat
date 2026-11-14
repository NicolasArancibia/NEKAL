@echo off
rem Doble clic para exportar la presentacion a PDF y sacar las capturas.
cd /d "%~dp0"
node exportar.mjs
echo.
pause
