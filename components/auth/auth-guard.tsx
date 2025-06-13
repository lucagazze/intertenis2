"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"

interface AuthGuardProps {
  children: React.ReactNode
  adminOnly?: boolean
}

export default function AuthGuard({ children, adminOnly = false }: AuthGuardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true)
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Error getting session:", sessionError.message)
          router.push("/login")
          setLoading(false)
          return
        }

        if (!session) {
          console.log("User not authenticated, redirecting to login")
          router.push("/login")
          setLoading(false)
          return
        }

        // User is authenticated
        if (adminOnly) {
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("role")
            .eq("id", session.user.id)
            .single()

          if (userError) {
            console.error("Error fetching user role:", userError.message)
            // Decide on a safe redirect, e.g., to dashboard or login
            router.push("/dashboard")
            setLoading(false)
            return
          }

          if (!userData || userData.role !== "admin") {
            console.log("User is not an admin, redirecting.")
            // Redirect to a general dashboard or a specific non-admin area
            router.push("/dashboard")
            setLoading(false)
            return
          }
        }
        // If all checks pass
        setAuthorized(true)
      } catch (error: any) {
        // Catch any other unexpected errors during the auth check
        console.error("Unexpected auth check error:", error.message)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, adminOnly]) // supabase client is stable, router and adminOnly are dependencies

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-tennis-cream to-tennis-white">
        <div className="text-center tennis-fade-in">
          {/* Assuming tennis-spinner is defined in your globals.css */}
          <div
            className="tennis-spinner mx-auto mb-4"
            style={{
              border: "4px solid rgba(0, 0, 0, 0.1)",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              borderLeftColor: "#09f", // Example color, replace with your theme's primary color
              animation: "spin 1s ease infinite",
            }}
          ></div>
          <p className="text-xl font-semibold text-tennis-gray-dark">Verificando autenticación...</p>
          <p className="text-tennis-gray mt-2">Por favor espere</p>
        </div>
      </div>
    )
  }

  return authorized ? <>{children}</> : null
}
