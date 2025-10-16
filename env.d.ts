declare namespace NodeJS {
  export interface ProcessEnv {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
    CLERK_SECRET_KEY: string;
    NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL: string;
    NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL: string;

    DATABASE_URL: string;

    POSTGRES_USER: string;
    POSTGRES_PASSWORD: string;
    POSTGRES_DB: string;
  }
}
