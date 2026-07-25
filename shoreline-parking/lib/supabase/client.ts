import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

/**
 * Returns a singleton Supabase client for use in the browser (client
 * components, hooks). Safe to call repeatedly — it only creates the
 * client once per page load.
 */
export function getBrowserClient() {
  if (!client) {
    client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}
