# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ADAPT is a fitness tracking web app built with React + TypeScript + Vite. It handles calorie/macro tracking, meal logging (with barcode scanning and food image classification), workout tracking, and personalized TDEE-based nutrition targets. The backend runs as **Vite middleware plugins** — there is no separate server process.

## Commands

```bash
npm run dev       # Start dev server (includes all backend middleware)
npm run build     # tsc && vite build
npm run lint      # ESLint — must pass with zero warnings
npm run preview   # Preview production build
```

There is no test runner configured. There are no unit tests in this repo.

## Architecture

### Backend as Vite Middleware

The "backend" is entirely implemented as Vite plugins/middleware in [vite.config.ts](vite.config.ts). Two plugins serve REST endpoints during dev and build:

- **SQLite barcode API plugin** — serves barcode-to-nutrition lookups from `public/food_facts.sqlite`
- **Tracking API plugin** (`server/apiPlugin.ts`) — exposes REST endpoints for user profiles, meal logging, daily summaries, workout intensity, and recommendations

These plugins only run in the Vite process. There is no standalone Express or Node server.

### Key REST Endpoints (`server/apiPlugin.ts`)

| Endpoint | Purpose |
|---|---|
| `POST /api/users` | Create/update user profile |
| `GET /api/user/:id` | Fetch user data |
| `POST /api/log-meal` | Log a food entry |
| `GET /api/daily-summary/:userId` | Daily nutrition + fatigue score |
| `GET /api/recommendations/:userId` | Smart meal suggestions |
| `POST /api/workout-intensity` | Log workout intensity |

### Data Flow (Hybrid Local/Server)

`lib/dataService.ts` implements a **local-first** pattern:
- Primary storage: `localStorage` (works offline, immediate)
- Secondary: server API (persistence, personalized metrics when a user profile exists)
- Components listen for `storage_update` custom events to re-render after data changes

### Server Engines

All engines are in [server/](server/):

- **`database.ts`** — SQLite schema init (better-sqlite3, WAL mode). DB file: `public/adapt_tracking.sqlite`
- **`trackingEngine.ts`** — TDEE via Mifflin-St Jeor equation, goal-based calorie/macro targets (cut −500 kcal / bulk +400 kcal / maintain), protein targets (1.8–2.0 g/kg)
- **`fatigueEngine.ts`** — 0–100 fatigue score from calorie deficit (40 pts), protein gap (30 pts), workout intensity + nutrition penalty (30 pts)
- **`suggestionsEngine.ts`** — Ranks foods by protein-per-calorie ratio against remaining macro budget

### Food Data Sources

Two separate data sources are used together:
1. **`data/foodNutritionData.ts`** — TypeScript module with structured nutrition data (used for meal logging and suggestions)
2. **`public/food_facts.sqlite`** — 400MB+ SQLite DB for barcode-to-nutrition lookups

### ML Food Classification

`lib/foodClassifier.ts` uses TensorFlow.js with a custom model + MobileNet v1 stored in `public/models/`. It maps ImageNet class labels to Indian food categories using confidence-scored heuristics.

### Path Alias

`@/*` maps to the project root (configured in both `tsconfig.json` and `vite.config.ts`).

## Styling

Tailwind CSS 3.4 with Shadcn/ui (Radix UI primitives). CSS custom properties in [globals.css](globals.css) define the color system and support light/dark mode. Tailwind classes reference these variables via `tailwind.config.js`. Do not hardcode colors — use the CSS variable-backed utility classes.

## TypeScript

Strict mode is enabled. Run `tsc --noEmit` to type-check without building. The `lint` script runs ESLint and treats all warnings as errors.
