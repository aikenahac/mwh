# Mess with Humanity

Mess with Humanity is a web application that allows users to create custom decks for the popular card game Cards Against Humanity. Create, edit, and print your own cards with ease.

## Features
- [x] User authentication (Clerk)
- [x] Create and edit decks
- [x] Add and edit cards (white answer cards and black question cards)
- [x] Support for "Pick 2" black cards
- [x] Generate printable PDFs of decks (4 cards per A4 page, landscape)
- [x] Share decks
- [x] Collaborate on decks
- [x] Admin panel
    - Importing system-level decks
    - Adding new admins
- [ ] CAH online player

## Tech Stack

- **Framework**: Next.js 15 (App Router, Turbopack)
- **Authentication**: Clerk
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS v4, shadcn/ui
- **PDF Generation**: @react-pdf/renderer
- **Internationalization**: next-intl
- **State Management**: TanStack Query, Zustand
- **Forms**: React Hook Form with Zod validation

## Development

### Requirements
- Node.js 20+
- pnpm
- PostgreSQL database
- Clerk account ([clerk.com](https://clerk.com))

### Setup

#### 1. Install dependencies:
```bash
pnpm install
```

#### 2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/

# PostgreSQL Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/mwh

# Docker Postgres (for docker-compose)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=mwh
```

**Getting Clerk Keys:**
1. Sign up at [clerk.com](https://clerk.com)
2. Create a new project
3. On a new project, the keys appear on the overview (otherwise **Configure** -> **API keys**)
4. Copy your publishable key and secret key

#### 3. Start the database:

**Option A: Using Docker (recommended):**
```bash
docker-compose up -d
```

**Option B: Local PostgreSQL:**
Make sure PostgreSQL is running and create a database named `mwh`.

#### 4. Run database migrations:
```bash
pnpm db:push
```

#### 5. Start the development server:
```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Available Commands

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

## Production Deployment

### Docker

The provided production docker compose (`docker-compose.prod.yaml`) is meant for my specific setup, running on Portainer and Traefik as a reverse proxy.

To remove traefik, just remove the `proxy` network from the compose and the `labels` from the `app` service.

The application will be available on port `3101`.

**Note**: Make sure your `.env` file contains all required environment variables, especially the Clerk keys which are needed at build time.

## Project Structure

```
src/
├── app/
│   ├── (app)/              # Protected routes (require authentication)
│   │   ├── page.tsx        # Home page
│   │   ├── decks/          # Deck management routes
│   │   └── cards/          # Card management routes
│   └── auth/               # Clerk authentication routes
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── cards/              # Card-related components
│   └── decks/              # Deck-related components
├── lib/
│   ├── api/                # Data fetching functions
│   ├── db/                 # Database schema and connection
│   ├── schemas.ts          # Zod validation schemas
│   ├── routes.ts           # Centralized route definitions
│   └── utils.ts            # Utility functions
└── i18n/                   # Internationalization
```

---
###### To my girlfriend, who just complained about there not being a K-Pop expansion once
