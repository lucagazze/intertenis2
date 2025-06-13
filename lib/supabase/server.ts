import { createClient } from "@supabase/supabase-js"

// Use environment variables with proper fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jckmdublpmjcwqdwtxfk.supabase.co"
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.service_role

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
}

if (!supabaseServiceKey) {
  console.warn("Missing SUPABASE_SERVICE_ROLE_KEY - using anon key as fallback")
}

// Create admin client with service role key if available, otherwise use anon key
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impja21kdWJscG1qY3dxZHd0eGZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MjM5MTAsImV4cCI6MjA2NDE5OTkxMH0.tftTV2tG0Sv5dOvfmzsrLyqjxmtQmrbvlp4n6Wjbv-A",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)
