'use client';

import { useSession } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

export function useCreateClerkSupabaseClient() {
  const { session } = useSession();

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!,
    {
      global: {
        // Get the custom Supabase token from Clerk
        fetch: async (url, options = {}) => {
          // The Clerk `session` object has the getToken() method
          const clerkToken = await session?.getToken({
            // Pass the name of the JWT template you created in the Clerk Dashboard
            // For this tutorial, you named it 'supabase'
            template: 'supabase',
          });

          // Insert the Clerk Supabase token into the headers
          const headers = new Headers(options?.headers);
          headers.set('Authorization', `Bearer ${clerkToken}`);

          // Call the default fetch
          return fetch(url, {
            ...options,
            headers,
          });
        },
      },
    },
  );
}
