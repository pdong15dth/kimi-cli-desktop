# Kimi Code for Desktop

A native desktop application for Kimi Code CLI built with [Tauri v2](https://tauri.app).

## Architecture

- **Frontend**: Reuses the existing `web/` React + Vite UI
- **Backend (Rust)**: Thin Tauri layer providing system tray, global hotkey, native notifications, deep linking, and backend auto-discovery
- **Backend (Python)**: Connects to a running `kimi web` server (not bundled)

## Prerequisites

- [Rust](https://rustup.rs/) (latest stable)
- [Node.js](https://nodejs.org/) 20+
- `cargo-tauri` CLI v2: `cargo install tauri-cli --version "^2.0"`

## Development

Start the Kimi CLI web backend in one terminal:

```bash
kimi web --host 127.0.0.1 --port 5494 --no-open
```

Then run the desktop app in another terminal:

```bash
make desktop-dev
# or
cd apps/desktop && cargo tauri dev
```

The desktop app will:
1. Auto-discover the backend on `127.0.0.1:5494`
2. Load the `web/` frontend
3. Connect directly to the backend via HTTP/WebSocket

## Building

Build the desktop app for release:

```bash
make desktop-build
# or
cd apps/desktop && cargo tauri build
```

This produces platform-specific artifacts in `apps/desktop/src-tauri/target/release/bundle/`:
- macOS: `.dmg` / `.app`
- Windows: `.msi` / `.exe`
- Linux: `.AppImage` / `.deb`

## Features

### System Tray
- Show / Hide window
- New Session
- Quit

### Global Hotkey
- `Cmd/Ctrl+Shift+K`: Toggle window visibility

### Native Notifications
- Desktop notifications for new approval requests

### Deep Linking
- Register `kimi://` URL scheme
- `kimi://open?session=<id>` to open a specific session

### Backend Auto-Discovery
- Automatically detects a running `kimi web` server
- Scans ports 5494-5504 on localhost
- Configurable via Settings

## Project Structure

```
apps/desktop/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs          # Tauri app entry + tray + hotkey + deep link
│   │   ├── commands.rs      # Tauri commands exposed to frontend
│   │   └── backend.rs       # Backend discovery & health checks
│   ├── capabilities/
│   │   └── default.json     # Tauri v2 permission capabilities
│   ├── icons/               # App icons (generated from web/public/logo.png)
│   ├── Cargo.toml           # Rust dependencies
│   └── tauri.conf.json      # Tauri configuration
├── package.json             # npm scripts
└── README.md                # This file
```

## Frontend Integration

The desktop app reuses the `web/` UI with minimal changes:

- `web/src/main.tsx` — Detects Tauri runtime and fetches backend URL before bootstrap
- `web/src/hooks/utils.ts` — `getApiBaseUrl()` reads from `window.__KIMI_BACKEND_URL__`
- `web/src/lib/tauri.ts` — Safe Tauri API wrapper with browser fallback
- `web/src/hooks/useNativeNotifications.ts` — Desktop notification hook
- `web/src/hooks/useNativeFilePicker.ts` — Native file picker hook

## CORS

The desktop app runs on `tauri://localhost` (macOS) or `http://localhost` (Windows/Linux).
The Kimi CLI backend has been updated to allow `tauri://localhost` origins by default
(`src/kimi_cli/web/auth.py`).
