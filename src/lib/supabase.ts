// Re-export from auto-generated client to avoid duplicate instances
export { supabase } from "@/integrations/supabase/client";

// Backend URL for edge functions
export const backendUrl = import.meta.env.VITE_SUPABASE_URL ?? "https://sozqvthgeuxnlwpncyyc.supabase.co";
