@echo off
echo Starting DevOps Copilot Voice Agent Backend...
call backend\.venv\Scripts\activate.bat
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
pause
