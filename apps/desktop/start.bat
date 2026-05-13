@echo off
start /B kimi web --host 127.0.0.1 --port 5494 --no-open
timeout /t 3 /nobreak > nul
cargo tauri dev
