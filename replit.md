# AutoPilot - Browser Automation Dashboard

## Overview

AutoPilot is a lightweight browser-automation dashboard built with a full-stack TypeScript architecture. It uses Lightpanda (a headless browser) and SQLite to let users create, manage, and run browser automations (click, type, wait, navigate) through a modern web UI. The app is designed to run on minimal resources (0.1 CPU, 250 MB RAM).

The main page is a dashboard (no login/signup required) where users can list, create, edit, delete, and start/stop automations. Each automation consists of a series of steps (goto, click, type, wait) that are executed against websites using a persistent Lightpanda browser session.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 + TypeScript with Vite as the build tool
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state, React Hook Form for form state
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Fonts**: Inter (sans), Space Grotesk (display), JetBrains Mono (mono)
- **Key Pages**:
  - `/` — Dashboard: lists all automations with start/stop/edit/delete controls
  - `/create` — Create new automation with step builder
  - `/edit/:id` — Edit existing automation
  - `/settings` — Placeholder settings page
- **Layout**: Sidebar + main content area. The Sidebar component shows navigation and browser health status.
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend
- **Framework**: Express.js on Node.js with TypeScript
- **Runtime**: tsx for development, esbuild for production bundling
- **Database**: SQLite via `better-sqlite3` (NOT PostgreSQL) — the database file lives at `./data/sqlite.db`
- **ORM**: Drizzle ORM with SQLite dialect. Schema is defined in `shared/schema.ts` using `drizzle-orm/sqlite-core`
- **Schema Push**: Use `drizzle-kit push` with the SQLite config. There are two drizzle configs — `drizzle.config.ts` (PostgreSQL, legacy/unused) and `drizzle.sqlite.config.ts` (SQLite, actual). The `db:push` script uses the default config, which may need to be pointed to the SQLite one.
- **Browser Automation**: `@lightpanda/browser` npm package starts a CDP server on port 9222. Puppeteer-core connects to it to execute automation steps.
- **API Structure**: RESTful JSON API under `/api/` prefix, defined in `shared/routes.ts` with Zod validation schemas
- **Dev Server**: Vite dev middleware is integrated into Express for HMR during development
- **Production**: Client is built to `dist/public`, server is bundled with esbuild to `dist/index.cjs`

### API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/automations` | List all automations |
| GET | `/api/automations/:id` | Get single automation |
| POST | `/api/automations` | Create automation |
| PUT | `/api/automations/:id` | Update automation |
| DELETE | `/api/automations/:id` | Delete automation |
| POST | `/api/automations/:id/start` | Start running automation |
| POST | `/api/automations/:id/stop` | Stop running automation |
| GET | `/api/health` | Get browser/system health status |

### Database Schema
Single table `automations` in SQLite:
- `id` — integer, primary key, auto-increment
- `name` — text, required
- `url` — text, required (target website)
- `schedule` — text, optional (cron or interval string)
- `steps` — text as JSON (array of Step objects with id, type, selector, value)
- `status` — text enum: "stopped" | "running" | "error"
- `lastRun` — integer timestamp, optional
- `createdAt` — integer timestamp

Step types: `goto`, `click`, `type`, `wait`

### Shared Code
The `shared/` directory contains code used by both frontend and backend:
- `schema.ts` — Drizzle table definitions, Zod validation schemas, TypeScript types
- `routes.ts` — API route definitions with paths, methods, input/output Zod schemas

### Build System
- **Development**: `npm run dev` runs tsx which starts Express with Vite middleware
- **Production Build**: `npm run build` runs `script/build.ts` which builds the Vite client and bundles the server with esbuild
- **Production Start**: `npm start` runs the bundled `dist/index.cjs`

### Important Notes
- This project uses **SQLite, not PostgreSQL**. The `drizzle.config.ts` file references PostgreSQL but is not the active config. The actual database connection is in `server/db.ts` using `better-sqlite3`.
- When running `db:push`, use the SQLite config: `npx drizzle-kit push --config=drizzle.sqlite.config.ts`
- The Lightpanda browser binary needs to be available in the environment for automation execution to work.
- The app is designed for very low resource usage — avoid adding heavy dependencies.

## External Dependencies

### Core Services
- **SQLite** (`better-sqlite3`): Local file-based database at `./data/sqlite.db`. No external database server needed.
- **Lightpanda** (`@lightpanda/browser`): Headless browser engine that starts a CDP (Chrome DevTools Protocol) server on `127.0.0.1:9222`
- **Puppeteer Core** (`puppeteer-core`): Connects to Lightpanda's CDP server to control browser pages

### Key NPM Packages
- **Drizzle ORM** + **drizzle-zod** + **drizzle-kit**: Database ORM, schema validation, and migration tooling
- **Zod**: Runtime schema validation for API inputs/outputs
- **TanStack React Query**: Server state management on the frontend
- **React Hook Form** + `@hookform/resolvers`: Form handling with Zod validation
- **shadcn/ui** components (Radix UI primitives): Full component library
- **Tailwind CSS**: Utility-first CSS framework
- **Wouter**: Lightweight client-side routing
- **date-fns**: Date formatting utilities
- **Lucide React**: Icon library
- **nanoid**: ID generation

### Replit-Specific Plugins
- `@replit/vite-plugin-runtime-error-modal`: Error overlay in development
- `@replit/vite-plugin-cartographer`: Replit integration (dev only)
- `@replit/vite-plugin-dev-banner`: Dev banner (dev only)