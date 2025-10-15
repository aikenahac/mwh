# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mess with Humanity is a Next.js web application that allows users to create custom decks for the card game Cards Against Humanity. The app uses Clerk for authentication, PostgreSQL database with Drizzle ORM, and supports PDF generation for printing custom cards.

## Commands

### Development
```bash
pnpm dev              # Start development server with Turbopack
pnpm build            # Build production bundle
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm format           # Format with Prettier and fix lint issues
```

### Database (Drizzle + PostgreSQL)
```bash
pnpm db:generate      # Generate migrations from schema
pnpm db:migrate       # Run migrations
pnpm db:push          # Push schema changes (development)
pnpm db:studio        # Open Drizzle Studio
```

## Architecture

### Authentication

The application uses **Clerk** for authentication:

- **Middleware** (`src/middleware.ts`): Clerk middleware protects all routes except static files and Next.js internals
- All authenticated routes automatically have access to the user via Clerk's `auth()` function

### Route Structure

The app uses Next.js 15 App Router with route groups:

- **`(app)/`**: Protected routes requiring authentication
  - `/` - Home page
  - `/decks` - List all user's decks
  - `/decks/[id]` - View specific deck with all cards
  - `/cards/create/[deckId]` - Create new card for a deck
  - `/cards/[id]/edit` - Edit existing card
- **`auth/`**: Authentication routes (Clerk sign-in/sign-up)
  - `/auth/sign-in/[[...rest]]` - Clerk sign-in page
  - `/auth/sign-up/[[...rest]]` - Clerk sign-up page

### Data Layer

**Database** (`src/lib/db/`):
- Uses **Drizzle ORM** with **PostgreSQL** via `node-postgres` (pg)
- Schema defined in `src/lib/db/schema.ts`
- Database connection in `src/lib/db/index.ts` with connection pooling
- Tables: `Deck` and `Card` with relations
- Enums: `cardtype` (white, black) and `black_card_type` (normal, pick_2)

**API Functions** (`src/lib/api/`):
- `deck.ts`: Functions for fetching decks (`getDecks`, `getDeckById`)
- `card.ts`: Functions for fetching cards (`getCardById`)
- All functions use Zod schemas for runtime validation
- Return types are strongly typed using Zod inference
- Use Drizzle's relational query API for joins

**Server Actions** (`src/app/(app)/*/actions.ts`):
- Located alongside their route segments
- Handle mutations (create, update, delete)
- Use `'use server'` directive
- Validate with Zod schemas from `src/lib/schemas.ts`
- Redirect after successful mutations using `src/lib/routes.ts`
- Direct Drizzle operations for mutations (insert, update, delete)

### Data Models

**Card Types**:
- `white`: Answer cards (white background, black text)
- `black`: Question cards (black background, white text)

**Black Card Types**:
- `normal`: Standard single-answer question
- `pick_2`: Question requiring two answer cards

### Centralized Route Management

All routes are defined in `src/lib/routes.ts` as a `Routes` object. Always use this object for navigation and redirects rather than hardcoding paths.

### PDF Generation

The app uses `@react-pdf/renderer` for generating printable card PDFs:
- Component: `src/components/decks/deck/print-document.tsx`
- Creates A4 landscape pages with 4 cards per page (6.3cm x 8.8cm each)
- Alternates between card fronts and backs for printing
- Styling uses react-pdf's StyleSheet API (similar to React Native)

### Internationalization

Uses `next-intl` with a hardcoded `'en'` locale. Configuration is in `src/i18n/request.ts` and message files are in `messages/en.json`.

### Styling

- **Tailwind CSS v4** with PostCSS
- UI components from shadcn/ui in `src/components/ui/`
- Utility function `cn()` in `src/lib/utils.ts` for conditional class merging (clsx + tailwind-merge)
- Theme support via `next-themes` (`src/components/theme-provider.tsx`)

### State Management

- **TanStack Query (React Query)** for server state (`src/components/query-provider.tsx`)
- **Zustand** available for client state (imported but may not be actively used)
- **React Hook Form** with Zod validation for forms

## Environment Setup

Required environment variables (see `.env.example`):

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=  # Clerk publishable key
CLERK_SECRET_KEY=                   # Clerk secret key
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/

# PostgreSQL Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/mwh  # PostgreSQL connection string

# Docker Postgres variables (for docker-compose.prod.yaml)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=mwh
```

## Key Patterns

1. **Server Actions**: Always use server actions for mutations, place them in `actions.ts` files alongside routes
2. **Type Safety**: Use Zod schemas for both validation and TypeScript type inference
3. **Authentication**: Check authentication using `await auth()` from `@clerk/nextjs/server` in server actions and API functions
4. **Result Type**: Use the custom `Result<T, E>` type from `src/lib/utils.ts` for operations that can fail (e.g., `getDeckById`)
5. **Route References**: Always use the `Routes` object from `src/lib/routes.ts` instead of hardcoded paths
6. **Database Operations**: Use Drizzle ORM for all database operations; mutations use `db.insert()`, `db.update()`, `db.delete()` and queries use `db.query` relational API
