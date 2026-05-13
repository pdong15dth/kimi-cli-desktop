#!/bin/bash
kimi web --host 127.0.0.1 --port 5494 --no-open &
sleep 3
cargo tauri dev
