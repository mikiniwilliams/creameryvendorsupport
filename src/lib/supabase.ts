import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const FALLBACK_BACKEND_URL = "https://sozqvthgeuxnlwpncyyc.supabase.co";
const FALLBACK_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvenF2dGhnZXV4bmx3cG5jeXljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNjY0NTMsImV4cCI6MjA4Nzc0MjQ1M30.glyZo7V3anXSzKQ5VFejcoohn_VQizFgsNc3UKHu-tI";

export const backendUrl = import.meta.env.VITE_SUPABASE_URL ?? FALLBACK_BACKEND_URL;
const publishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  FALLBACK_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(backendUrl, publishableKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
