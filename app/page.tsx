"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"

export default function HomePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("Error obteniendo sesión:", sessionError)
        router.push("/login")
        return
      }

      if (session?.user) {
        try {
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("role")
            .eq("id", session.user.id)
            .single()

          if (userError) {
            console.error("Error obteniendo datos del usuario:", userError)
            await supabase.auth.signOut()
            router.push("/login")
            return
          }

          if (userData?.role === "admin") {
            router.push("/admin")
          } else {
            router.push("/dashboard")
          }
        } catch (err) {
          console.error("Error procesando datos del usuario:", err)
          setError("Error al procesar los datos del usuario. Por favor, inicie sesión nuevamente.")
          await supabase.auth.signOut()
          router.push("/login")
        }
      } else {
        router.push("/login")
      }
    } catch (err) {
      console.error("Error en checkAuth:", err)
      setError("Error al verificar la autenticación. Por favor, inicie sesión nuevamente.")
      router.push("/login")
    } finally {
      setIsLoading(false)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-tennis-cream to-tennis-white">
        <div className="text-center tennis-fade-in max-w-md p-6 bg-white rounded-xl shadow-lg">
          <div className="text-red-600 text-xl mb-4">⚠️ Error de autenticación</div>
          <p className="text-tennis-gray-dark mb-4">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 bg-tennis-green text-white rounded-lg hover:bg-tennis-green-dark transition-colors"
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-tennis-cream to-tennis-white">
        <div className="text-center tennis-fade-in">
          <div className="tennis-spinner mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-tennis-gray-dark">Cargando Liga de Intertenis...</p>
          <p className="text-tennis-gray mt-2">Verificando autenticación</p>
        </div>
      </div>
    )
  }

  return null
}
