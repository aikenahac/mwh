# Mess with Humanity API Documentation

This API allows external applications (such as Expo mobile apps) to access the same functionality as the web application for managing Cards Against Humanity decks and cards.

## Authentication

All API endpoints require authentication using **Clerk**. External applications must use Clerk's authentication SDKs to obtain a valid session token.

Include the authentication token in the request headers as managed by Clerk's client libraries (e.g., `@clerk/clerk-expo` for React Native/Expo apps).

## Base URL

```
https://your-domain.com/api
```

For local development:
```
http://localhost:3000/api
```

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": { ... }
  }
}
```

### Common Error Codes
- `UNAUTHORIZED` (401): Missing or invalid authentication
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `BAD_REQUEST` (400): Invalid request data
- `VALIDATION_ERROR` (400): Request validation failed
- `INTERNAL_ERROR` (500): Server error

---

## Decks

### List Decks

Get all decks owned by or shared with the authenticated user.

```
GET /api/decks
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "My Deck",
      "description": "A custom deck",
      "user_id": "clerk_user_id",
      "cards": [...],
      "shares": [...],
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Create Deck

Create a new deck.

```
POST /api/decks
```

**Request Body:**
```json
{
  "name": "My New Deck",
  "description": "Optional description"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My New Deck",
    "description": "Optional description",
    "user_id": "clerk_user_id",
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```

---

### Get Deck

Get a specific deck with all cards and share information.

```
GET /api/decks/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My Deck",
    "description": "A custom deck",
    "user_id": "clerk_user_id",
    "cards": [
      {
        "id": "uuid",
        "type": "white",
        "pick": 1,
        "text": "A blank card.",
        "deck_id": "uuid",
        "created_at": "2025-01-01T00:00:00.000Z"
      }
    ],
    "shares": [
      {
        "id": "uuid",
        "deck_id": "uuid",
        "shared_with_user_id": "clerk_user_id",
        "shared_by_user_id": "clerk_user_id",
        "permission": "view",
        "created_at": "2025-01-01T00:00:00.000Z"
      }
    ],
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```

---

### Update Deck

Update a deck's name and/or description (owner only).

```
PATCH /api/decks/:id
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Updated Name",
    "description": "Updated description",
    "user_id": "clerk_user_id",
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```

---

### Delete Deck

Delete a deck (owner only). This will cascade delete all cards and shares.

```
DELETE /api/decks/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Deck deleted successfully"
  }
}
```

---

## Deck Sharing

### List Shares

Get all shares for a deck (owner only).

```
GET /api/decks/:id/shares
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "deck_id": "uuid",
      "shared_with_user_id": "clerk_user_id",
      "shared_by_user_id": "clerk_user_id",
      "permission": "view",
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Share Deck

Share a deck with another user by username (owner only).

```
POST /api/decks/:id/shares
```

**Request Body:**
```json
{
  "username": "target_username",
  "permission": "view"
}
```

**Permissions:**
- `view`: User can view the deck and its cards
- `collaborate`: User can view and edit cards (but not deck metadata or shares)

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "deck_id": "uuid",
    "shared_with_user_id": "clerk_user_id",
    "shared_by_user_id": "clerk_user_id",
    "permission": "view",
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```

---

### Update Share Permission

Update the permission level of an existing share (owner only).

```
PATCH /api/decks/:id/shares/:shareId
```

**Request Body:**
```json
{
  "permission": "collaborate"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "deck_id": "uuid",
    "shared_with_user_id": "clerk_user_id",
    "shared_by_user_id": "clerk_user_id",
    "permission": "collaborate",
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```

---

### Remove Share

Remove a deck share (owner only).

```
DELETE /api/decks/:id/shares/:shareId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Share removed successfully"
  }
}
```

---

## Cards

### Create Card

Create a new card in a deck.

```
POST /api/cards
```

**Request Body:**
```json
{
  "text": "A blank card.",
  "type": "white",
  "pick": 1,
  "deckId": "uuid"
}
```

**Card Types:**
- `white`: Answer card (white background, black text)
- `black`: Question card (black background, white text)

**Pick Value:**
- For black cards: Number of answer cards required (1-10)
- For white cards: Usually 1

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "white",
    "pick": 1,
    "text": "A blank card.",
    "deck_id": "uuid",
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```

**Permissions:**
- Owner: Can create cards
- Collaborator (shared with `collaborate` permission): Can create cards
- Viewer (shared with `view` permission): Cannot create cards

---

### Get Card

Get a specific card by ID.

```
GET /api/cards/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "white",
    "pick": 1,
    "text": "A blank card.",
    "deck_id": "uuid",
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```

**Permissions:**
- Anyone with view or edit access to the deck can get cards

---

### Update Card

Update a card's text, type, and/or pick value.

```
PATCH /api/cards/:id
```

**Request Body:**
```json
{
  "text": "Updated text",
  "type": "black",
  "pick": 2
}
```

All fields are optional; only include fields you want to update.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "black",
    "pick": 2,
    "text": "Updated text",
    "deck_id": "uuid",
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```

**Permissions:**
- Owner: Can update cards
- Collaborator (shared with `collaborate` permission): Can update cards
- Viewer (shared with `view` permission): Cannot update cards

---

### Delete Card

Delete a card.

```
DELETE /api/cards/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Card deleted successfully"
  }
}
```

**Permissions:**
- Owner: Can delete cards
- Collaborator (shared with `collaborate` permission): Can delete cards
- Viewer (shared with `view` permission): Cannot delete cards

---

## Example Usage with Expo/React Native

Here's an example of how to use the API with Clerk authentication in an Expo app:

```typescript
import { useAuth } from '@clerk/clerk-expo';

function useApi() {
  const { getToken } = useAuth();

  const fetchDecks = async () => {
    const token = await getToken();

    const response = await fetch('https://your-domain.com/api/decks', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error.message);
    }

    return result.data;
  };

  const createDeck = async (name: string, description: string) => {
    const token = await getToken();

    const response = await fetch('https://your-domain.com/api/decks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, description }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error.message);
    }

    return result.data;
  };

  return { fetchDecks, createDeck };
}
```

## Rate Limiting

Currently, there are no rate limits enforced on the API. This may change in the future.

## Pagination

The current API does not implement pagination. All results are returned in a single response. If you have a large number of decks or cards, you may want to implement client-side filtering or request pagination support.

## WebSocket/Real-time Updates

The API does not currently support WebSocket connections or real-time updates. Clients must poll endpoints to check for changes.

## CORS

The API supports CORS for all origins. If you need to restrict this in production, update the Next.js configuration.
