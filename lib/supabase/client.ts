import { createClient } from "@supabase/supabase-js"

// Usar las variables de entorno o los valores hardcodeados como fallback
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jckmdublpmjcwqdwtxfk.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impja21kdWJscG1qY3dxZHd0eGZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MjM5MTAsImV4cCI6MjA2NDE5OTkxMH0.tftTV2tG0Sv5dOvfmzsrLyqjxmtQmrbvlp4n6Wjbv-A"

if (!supabaseUrl) {
  console.error("Critical: Missing NEXT_PUBLIC_SUPABASE_URL environment variable.")
  // Podrías lanzar un error aquí si prefieres que la app no inicie sin la URL
  // throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
}

if (!supabaseAnonKey) {
  console.error("Critical: Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.")
  // throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // Importante para flujos OAuth y magic links
    storageKey: "supabase-auth",
  },
})

// Helper functions (opcionales, pero pueden ser útiles)
export async function isAuthenticated() {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      console.error("Error checking authentication:", error)
      return false
    }
    return !!data.session
  } catch (err) {
    console.error("Exception checking authentication:", err)
    return false
  }
}

export async function getCurrentUserServer() {
  // Esta función es un placeholder, idealmente usarías el helper de Supabase para RSC o rutas de API
  // Para uso en el cliente, getCurrentUser() en las páginas es mejor.
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser() // Esto es para el servidor
    return user
  } catch (error) {
    console.error("Error getting current user on server:", error)
    return null
  }
}
