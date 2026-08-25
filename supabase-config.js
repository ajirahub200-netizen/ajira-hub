// Supabase configuration for Ajira & Connection Hub TZ

const SUPABASE_URL = "https://jvgvmnzekjkaakgqkoct.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_5h9e4kX950OSHjhKvcGTDg_X8AILbMk";

// Create Supabase client
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);