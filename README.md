# Oro — Smart Animation Device System

Hệ thống quản lý media + BLE animation device gồm 3 thành phần:

## Quick Start

### 1. Setup environment
```bash
cp .env.example .env
# Edit .env with your secrets
```

### 2. Start with Docker
```bash
docker-compose up -d
```

Services:
- **Backend API**: http://localhost:3000/api
- **API Docs (Swagger)**: http://localhost:3000/api/docs
- **Frontend**: http://localhost:3001
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)
- **PostgreSQL**: localhost:5432

### 3. Flutter App (development)
```bash
cd app
flutter pub get
flutter run
```

## Project Structure

```
Oro/
├── backend/              # NestJS API server
│   ├── src/
│   │   ├── auth/         # JWT auth (register, login, refresh)
│   │   ├── users/        # User CRUD + admin management
│   │   ├── media/        # Media upload, FFmpeg processing, animation jobs
│   │   ├── devices/      # BLE device registration
│   │   ├── storage/      # MinIO S3 storage service
│   │   └── common/       # Guards, decorators
│   └── Dockerfile
├── frontend/             # Next.js 14 web app
│   ├── src/
│   │   ├── app/          # App router pages (home, login, register, dashboard, admin)
│   │   ├── components/   # Reusable UI components
│   │   └── lib/          # API client, utilities
│   └── Dockerfile
├── app/                  # Flutter mobile app
│   └── lib/
│       ├── core/         # API client, BLE service, router, theme
│       └── features/     # Auth, media, device, profile screens
└── docker-compose.yml    # PostgreSQL + MinIO + Redis + Backend + Frontend
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| POST | /api/auth/refresh | Refresh token |
| GET | /api/users/me | Get profile |
| PUT | /api/users/me | Update profile |
| POST | /api/media/upload | Upload image/video |
| GET | /api/media | List user media |
| GET | /api/media/:id | Get media detail |
| DELETE | /api/media/:id | Delete media |
| POST | /api/media/:id/process-animation | Process video → RGB565 frames |
| GET | /api/media/animation-jobs/:id | Get job status |
| GET | /api/media/animation-jobs/:id/download | Download animation binary |
| POST | /api/devices | Register device |
| GET | /api/devices | List devices |
| GET | /api/admin/dashboard | Admin stats |
| GET | /api/admin/users | List all users (admin) |
| GET | /api/admin/media | List all media (admin) |

## Video Processing Pipeline

Video → FFmpeg (resize 320×240, extract frames) → Sharp (RGB888→RGB565) → Binary pack

Output format: `[Header 7B] + [Frame0 150KB] + [Frame1 150KB] + ...`
- Header: frameCount(2B) + fps(1B) + width(2B) + height(2B)
- Each frame: 320 × 240 × 2 = 153,600 bytes (RGB565 LE)

## BLE Protocol

- Service UUID: `0000FF00-...`
- Command (FF01): START_TRANSFER, END_TRANSFER, PLAY, STOP
- Data (FF02): Frame data chunks (Write Without Response)
- Status (FF03): Device notifications (Notify)
