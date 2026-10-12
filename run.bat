@echo off
title Homeroom 360 - AI Architecture Studio
echo =======================================================
echo HE THONG QUAN LY LOP CHU NHIEM THONG MINH (HOMEROOM 360)
echo Theo so do kien truc: Net Trinh - AI Architecture Studio
echo =======================================================
echo.
echo Dang kiem tra moi truong va thu vien...
python -c "import fastapi, uvicorn" 2>nul
if %errorlevel% neq 0 (
    echo Dang cai dat thu vien can thiet: fastapi uvicorn aiofiles pydantic...
    pip install -r requirements.txt
)

echo.
echo Khoi dong may chu tai: http://127.0.0.1:8000
echo Nhan Ctrl+C de dung may chu.
echo.
start http://127.0.0.1:8000
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
