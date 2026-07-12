# 🔥 Inferno

A desktop-style cloud file manager with a custom path display format, built with React, Express, PostgreSQL, and Clerk auth. Also ships as a standalone Electron desktop app with SQLite and local filesystem storage.

---

## Features

- **Cloud web app** — drag-and-drop file uploads, folder navigation, recent files, storage stats
- **Clerk auth** — Google + GitHub login, protected routes
- **Custom path bar** — `inferno--|path|to|file` format with `|` separators
- **Electron desktop app** — fully offline, SQLite database, local file storage, no auth required

---

## Tech Stack

| Layer | Web App | Desktop App |
|---|---|---|
| Frontend | React + Vite + Tailwind v4 | React + Vite + Tailwind v4 |
| Backend | Express + PostgreSQL (Drizzle ORM) | Express + SQLite (better-sqlite3) |
| Storage | Google Cloud Storage (presigned URLs) | Local filesystem |
| Auth | Clerk (Google + GitHub OAuth) | None |
| Packaging | Replit (cloud) | Electron + electron-builder |

---

## Project Structure

```
├── artifacts/
│   ├── inferno/          # React + Vite frontend (web)
│   └── api-server/       # Express API server
├── lib/
│   ├── db/               # Drizzle ORM + PostgreSQL schema
│   ├── api-zod/          # Zod validation schemas
│   ├── api-client-react/ # React Query hooks (codegen)
│   └── object-storage-web/ # Uppy upload helper
└── inferno-desktop/      # Standalone Electron desktop app
    ├── src/main/         # Electron main process + Express server
    ├── src/preload/      # Context bridge
    └── src/renderer/     # React frontend
```

---

## Getting Started

### Web App (Replit)

The web app runs on Replit with managed PostgreSQL, object storage, and Clerk auth. Clone the repo and open in Replit — workflows start automatically.

### Desktop App

```bash
cd inferno-desktop
npm install
npm run dev        # Development mode
npm run dist:win   # Build Windows installer (.exe)
npm run dist:mac   # Build macOS disk image (.dmg)
npm run dist:linux # Build Linux AppImage
```

Data is stored in your OS user data directory:
- **Windows:** `%APPDATA%\inferno-desktop`
- **macOS:** `~/Library/Application Support/inferno-desktop`
- **Linux:** `~/.config/inferno-desktop`

---

## Path Format

Inferno uses a custom path display format:

```
inferno--|Documents|Projects|Website
```

`--` separates the app name from the path. `|` is used as the path separator instead of `/` or `\`.
