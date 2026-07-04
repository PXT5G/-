# BananaOS

**BananaOS** is a premium mobile web operating system that runs entirely inside the browser. Phase 1 delivers the complete base system — boot sequence, lock screen, home screen, system overlays, frameworks, and backend API — without any standalone applications.

## Architecture

```
bananaos/
├── apps/
│   ├── web/          # Next.js 15 + React 19 frontend (OS shell)
│   └── api/          # Express + MongoDB + Socket.io backend
├── packages/
│   └── shared/       # Shared TypeScript types
├── docker-compose.yml
└── package.json      # npm workspaces monorepo
```

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | Next.js 15, React 19, TypeScript, TailwindCSS, Framer Motion, Zustand, React Query, PWA |
| Backend | Node.js, Express, MongoDB, Socket.io, JWT, Zod |
| Infrastructure | Docker, docker-compose |

## Phase 1 — Base System

### OS Shell
- Splash Screen & Boot Animation
- Lock Screen (clock, notifications, PIN, Face ID, fingerprint, swipe unlock)
- Home Screen (app grid, pages, widgets, dock)
- Status Bar (time, battery, WiFi, signal, notifications)
- Dynamic Island (compact, expanded, activity modes)
- Notification Center
- Control Center (WiFi, Bluetooth, brightness, volume, theme, silent, flashlight, rotation)
- Global Search
- Wallpaper System (gradient, animated, image)
- Theme Engine (light / dark / system, gold accents)

### Frameworks
- App Launcher & Installation Framework
- App Routing System (`appRouter.ts`)
- Window Manager & Multi-tasking
- Widget System
- Permissions System
- Notification Framework
- Sound & Haptic Frameworks
- File System Framework
- Settings Framework
- User Authentication & Session Manager
- Realtime Framework (Socket.io)
- Admin Framework

## Getting Started

### Prerequisites
- Node.js 20+
- MongoDB 7+ (or Docker)

### Development

```bash
# Install dependencies
npm install

# Start MongoDB (Docker)
docker compose up mongodb -d

# Copy API environment
cp apps/api/.env.example apps/api/.env

# Run both frontend and backend
npm run dev
```

- **Frontend:** http://localhost:3000
- **API:** http://localhost:4000
- **Health check:** http://localhost:4000/health

### Production Build

```bash
npm run build
npm run start
```

### Docker (full stack)

```bash
docker compose up --build
```

## Project Structure

```
apps/web/src/
├── app/              # Next.js app router
├── components/
│   ├── os/           # OS shell components
│   ├── settings/     # Settings framework
│   └── ui/           # Reusable UI primitives
├── layouts/          # PhoneFrame, OSLayout
├── hooks/            # useOSBoot, useGestures, useThemeEngine, etc.
├── animations/       # Framer Motion presets
├── stores/           # Zustand state management
├── providers/        # React context providers
├── services/         # API & realtime services
├── types/            # TypeScript definitions
└── utils/            # Helpers

apps/api/src/
├── api/
│   ├── routes/       # Express route definitions
│   ├── controllers/  # Request handlers
│   └── middleware/   # Auth, rate limiting, validation
├── database/
│   ├── models/       # Mongoose schemas
│   └── connection.ts
├── services/         # JWT, Socket.io
└── config/           # Environment validation
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh token |
| GET | `/api/auth/profile` | Get profile |
| GET | `/api/apps/catalog` | App catalog |
| POST | `/api/apps/install/:bundleId` | Install app |
| GET | `/api/notifications` | List notifications |
| GET/PATCH | `/api/settings` | User settings |
| GET/POST | `/api/filesystem` | Virtual filesystem |
| GET | `/api/admin/dashboard` | Admin dashboard |

## Environment Variables

### API (`apps/api/.env`)
```
PORT=4000
MONGODB_URI=mongodb://localhost:27017/bananaos
JWT_SECRET=your-secret-min-16-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-16-chars
CORS_ORIGIN=http://localhost:3000
```

### Web
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Design System

- **Colors:** Black `#0A0A0A`, White `#FFFFFF`, Gold `#D4AF37`
- **Style:** Glassmorphism, premium shadows, rounded corners
- **Motion:** 120fps spring animations, `prefers-reduced-motion` support
- **Accessibility:** WCAG 2.1 AA contrast, semantic HTML, ARIA labels

## Security

- JWT access + refresh tokens with bcrypt password hashing
- Helmet security headers, CORS, rate limiting
- Zod input validation on all endpoints
- Permission system for app-level access control
- Session management with device tracking

## License

Proprietary — BananaOS Phase 1 Base System
