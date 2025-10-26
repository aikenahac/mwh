export const Routes = {
  // Auth
  SIGN_IN: '/auth/sign-in',
  SIGN_UP: '/auth/sign-up',

  HOME: '/',

  // Decks
  DECKS: '/decks',
  DECK: (id: string) => `/decks/${id}`,
  DECK_EDIT: (id: string) => `/decks/${id}/edit`,
  DECK_PRINT: (id: string) => `/decks/${id}/print`,

  // Cards
  CARDS: '/cards',
  CARD: (id: string) => `/cards/${id}`,
  CARD_EDIT: (id: string) => `/cards/${id}/edit`,
  CARD_CREATE: (deckId: string) => `/cards/create/${deckId}`,

  // Docs
  DOCS: '/docs',
  DOCS_PRIVACY_POLICY: '/docs/privacy-policy',
  DOCS_TERMS_OF_SERVICE: '/docs/tos',

  // Admin
  ADMIN: '/admin',
  ADMIN_SYSTEM_DECKS: '/admin/system-decks',
  ADMIN_USER_ROLES: '/admin/user-roles',

  SOURCE_CODE: 'https://github.com/aikenahac/mwh',

  // API Routes
  API: {
    // Decks
    DECKS: '/api/decks',
    DECK: (id: string) => `/api/decks/${id}`,
    DECK_SHARES: (id: string) => `/api/decks/${id}/shares`,
    DECK_SHARE: (id: string, shareId: string) => `/api/decks/${id}/shares/${shareId}`,

    // Cards
    CARDS: '/api/cards',
    CARD: (id: string) => `/api/cards/${id}`,
  },
};
