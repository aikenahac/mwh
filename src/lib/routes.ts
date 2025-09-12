export const Routes = {
  // Auth
  SIGN_IN: '/auth/sign-in',
  SIGN_UP: '/auth/sign-up',

  HOME: '/',

  // Decks
  DECKS: '/decks',
  DECK: (id: string) => `/decks/${id}`,
  DECK_EDIT: (id: string) => `/decks/${id}/edit`,

  // Cards
  CARDS: '/cards',
  CARD: (id: string) => `/cards/${id}`,
  CARD_EDIT: (id: string) => `/cards/${id}/edit`,
  CARD_CREATE: (deckId: string) => `/cards/create/${deckId}`,
};
