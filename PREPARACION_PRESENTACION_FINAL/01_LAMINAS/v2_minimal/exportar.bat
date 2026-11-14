@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Exportando las laminas minimal de Nekal...
node exportar.mjs
echo.
pause
