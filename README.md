# Mess with Humanity

Mess with Humanity is a web application that allows users to create custom decks for the popular card game Cards Against Humanity.

## Features
- [x] Create decks
- [x] Edit decks
- [x] Add cards
- [ ] Share decks
- [ ] Collaborate on decks

## Development

### Requirements
- node
- pnpm
- clerk account
- supabase account

### Clerk Setup
ToDo

### Supabase Setup
ToDo

### Project Setup

#### 1. Install dependencies:
```bash
pnpm install
```

#### 2. Create .env file:
```bash
cp .env.example .env
```

```
# .env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_ACCESS_TOKEN=

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/
```
