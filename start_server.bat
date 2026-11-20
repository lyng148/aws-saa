@echo off
echo ========================================================
echo   Coursera AWS Certified Solutions Architect Quiz
echo ========================================================
echo   Dang khoi dong web server cuc bo...
echo   Dia chi: http://localhost:8000
echo ========================================================
start http://localhost:8000
python -m http.server 8000
pause
