# Mess with Humanity

Mess with Humanity is a web application that allows users to create custom decks for the popular card game Cards Against Humanity. Create, edit, and print your own cards with ease.

## Features
- [x] User authentication (Clerk)
- [x] Create and edit decks
- [x] Add and edit cards (white answer cards and black question cards)
- [x] Support for "Pick 2" black cards
- [x] Generate printable PDFs of decks (4 cards per A4 page, landscape)
- [x] Export decks as JSON (compatible with [crhallberg.com/cah](https://crhallberg.com/cah/) format)
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

## Exporting and Importing Decks

### Export Functionality

You can export your custom decks as JSON files in two ways:

1. **Export a Single Deck**: On any deck page, click the export button (download icon) to download that deck as a JSON file
2. **Export All Decks**: On the decks list page, click "Export All" to download all your decks in a single JSON file

### JSON Format

The JSON export format is compatible with the official Cards Against Humanity JSON format used at [crhallberg.com/cah](https://crhallberg.com/cah/). This allows for easy sharing and importing of custom decks.

**Format Structure:**
```json
[
  {
    "name": "Deck Name",
    "white": [
      {
        "text": "Answer card text",
        "pack": 300
      }
    ],
    "black": [
      {
        "text": "Question card text with blanks ___",
        "pick": 1,
        "pack": 300
      }
    ]
  }
]
```

**Pack Numbers:**
- Single deck exports use a random pack number between 400-600 to avoid conflicts with official CAH packs
- When exporting all decks, pack numbers start at 300 and increment by 1 for each deck (300, 301, 302, etc.)
- Official CAH packs from [crhallberg.com/cah](https://crhallberg.com/cah/) use pack numbers below 300

### Importing Decks

Admins can import decks in this format through the Admin Panel (`/admin/system-decks`). The importer accepts JSON files (max 5MB) in the same format as the exports.

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

## Credits

- [Cards Against Humanity](https://www.cardsagainsthumanity.com/) - inspiration, content for cards (gameplay feature, currently on `beta`)
- [crhallberg.com/cah](https://crhallberg.com/cah/) - JSON version of card content

---
###### To my girlfriend, who just complained about there not being a K-Pop expansion once
