import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { env } from "@/lib/env";

/**
 * Server-side Supabase client for use in Server Components, Server Actions,
 * and Route Handlers. Runs as the authenticated user (RLS applies) — never
 * the service-role key. See design doc's DAL pattern: every data-access
 * function built on this client must still check authorization itself.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component, which can't set cookies.
            // Fine for now; Phase 3 auth middleware will refresh sessions.
          }
        },
      },
    },
  );
}
