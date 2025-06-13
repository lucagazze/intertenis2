"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, LogIn, AlertCircle } from "lucide-react"
import Image from "next/image"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(
          authError.message === "Invalid login credentials"
            ? "Email o contraseña incorrectos."
            : "Error de autenticación. Inténtalo de nuevo.",
        )
        return
      }

      if (!authData.user) {
        setError("No se pudo autenticar al usuario.")
        return
      }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role, active")
        .eq("id", authData.user.id)
        .single()

      if (userError || !userData) {
        await supabase.auth.signOut() // Limpiar sesión si el usuario no existe en nuestra DB
        setError("Usuario no encontrado en el sistema.")
        return
      }

      if (!userData.active) {
        await supabase.auth.signOut()
        setError("Tu cuenta está desactivada. Contacta al administrador.")
        return
      }

      router.push(userData.role === "admin" ? "/admin" : "/dashboard")
      router.refresh() // Forzar actualización para que el layout recoja la nueva sesión
    } catch (err) {
      setError("Ocurrió un error inesperado. Por favor, inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background">
      <Image
        src="/placeholder-0cs7s.png"
        alt="Fondo abstracto de tenis"
        fill
        quality={80}
        className="object-cover opacity-20 z-0"
        priority
      />
      <div className="relative z-10 w-full max-w-md px-4 animate-fadeIn">
        <Card className="professional-card shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <Image
              src="/placeholder-pm8b1.png"
              alt="Liga Intertenis Logo"
              width={72}
              height={72}
              className="mx-auto mb-4 rounded-full shadow-md"
            />
            <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              Liga Intertenis
            </CardTitle>
            <CardDescription className="text-muted-foreground !mt-2">
              Ingresa tus credenciales para acceder al sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="professional-alert professional-alert-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error de Acceso</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="professional-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="professional-input"
                />
              </div>
              <Button type="submit" className="w-full professional-btn-primary py-3 text-base" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" />
                    Iniciar Sesión
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center text-xs text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Liga Intertenis. Todos los derechos reservados.</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
