# AI Resume Tracker (Frontend)

A production-oriented React + TypeScript frontend for resume analysis and job application tracking.

## Tech Stack

- React 18
- TypeScript (strict mode)
- Vite 5
- Tailwind CSS
- Axios

## Features

- Authentication flow with email verification (OTP)
- Resume upload and AI analysis views
- Job application tracking with status insights
- Dashboard metrics and activity overview
- Centralized API error handling and resilient UI fallbacks

## Prerequisites

- Node.js 18+ (recommended)
- npm 9+
- Backend API running on `http://localhost:5000`

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment:
   ```bash
   cp .env.example .env
   ```
3. Start development server:
   ```bash
   npm run dev
   ```
4. Open:
   - Frontend: `http://localhost:5173`
   - API proxy target: `http://localhost:5000`

## Environment Variables

| Name | Required | Default | Description |
| --- | --- | --- | --- |
| `VITE_API_URL` | No | `/api` | Backend base URL. Use `/api` with Vite proxy in local dev. |

## Available Scripts

- `npm run dev` - start Vite dev server
- `npm run typecheck` - run TypeScript checks
- `npm run build` - typecheck and production build
- `npm run preview` - preview built app locally
- `npm run start` - run dev server with host binding

## Project Structure

```text
src/
  components/        # Page-level and reusable UI components
  services/          # API client and endpoint helpers
  types/             # Shared TypeScript domain models
  utils/             # Formatting and error helpers
  App.tsx            # Auth gate and top-level routing state
  main.tsx           # App bootstrap + error boundary
```

## Reliability and UX Standards

- Strict TypeScript with domain-level shared types
- Shared API error parsing (`src/utils/getApiErrorMessage.ts`)
- Global React error boundary (`src/components/ErrorBoundary.tsx`)
- Reusable loading states (`src/components/LoadingScreen.tsx`)
- Centralized formatting helpers (`src/utils/formatters.ts`)

## Troubleshooting

- `403` on login/register:
  - Clear `localStorage` token and retry.
  - Ensure backend auth routes are reachable at `http://localhost:5000/api/auth/*`.
- Vite proxy issues:
  - Confirm backend is running on port `5000`.
  - Confirm `VITE_API_URL` is not overriding `/api` unexpectedly.
