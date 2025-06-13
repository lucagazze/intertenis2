"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import MainNav from "@/components/layout/main-nav" // Asegúrate que MainNav esté actualizado
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Users,
  Calendar,
  Trophy,
  TrendingUp,
  BarChart3,
  FileText,
  Activity,
  ArrowRight,
  ServerCrash,
} from "lucide-react"
import Image from "next/image"
import { Loader2 } from "lucide-react"

// Placeholder para AuthGuard, si lo implementas
// import AuthGuard from "@/components/auth/auth-guard";

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ElementType
  description: string
  colorClass: string
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, description, colorClass }) => (
  <Card className="professional-card animate-slideInUp">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className={`h-5 w-5 ${colorClass}`} />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-foreground">{value}</div>
      <p className="text-xs text-muted-foreground pt-1">{description}</p>
    </CardContent>
  </Card>
)

interface ActionCardProps {
  title: string
  description: string
  href: string
  icon: React.ElementType
  colorClass: string
}

const ActionCard: React.FC<ActionCardProps> = ({ title, description, href, icon: Icon, colorClass }) => (
  <Card className="professional-card group animate-slideInUp hover:border-primary">
    <CardHeader>
      <div
        className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${colorClass} text-primary-foreground shadow-md group-hover:scale-105 transition-transform`}
      >
        <Icon className="h-6 w-6" />
      </div>
      <CardTitle className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
        {title}
      </CardTitle>
      <CardDescription className="text-muted-foreground text-sm leading-relaxed min-h-[40px]">
        {description}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <Button asChild className="w-full professional-btn-primary group-hover:shadow-lg transition-shadow">
        <a href={href}>
          Acceder <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </a>
      </Button>
    </CardContent>
  </Card>
)

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeMatches: 0,
    activeTournaments: 0,
    pendingSurveys: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null) // Considera usar un tipo más específico
  const router = useRouter()

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError || !session?.user) {
          router.push("/login")
          return
        }

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role") // Solo necesitamos el rol para esta verificación
          .eq("id", session.user.id)
          .single()

        if (userError || !userData || userData.role !== "admin") {
          // Podrías redirigir a una página de "no autorizado" o al dashboard del jugador
          router.push("/login")
          return
        }
        setUser(userData) // Guardar datos del usuario si es necesario para MainNav u otros
        await fetchStats()
      } catch (err: any) {
        console.error("Error en checkAuthAndFetchData:", err)
        setError("No se pudo cargar el panel de administración. Inténtalo de nuevo.")
      } finally {
        setIsLoading(false)
      }
    }
    checkAuthAndFetchData()
  }, [router])

  const fetchStats = async () => {
    try {
      const [usersResult, matchesResult, tournamentsResult, surveysResult] = await Promise.all([
        supabase.from("users").select("id", { count: "exact", head: true }).eq("active", true),
        supabase.from("matches").select("id", { count: "exact", head: true }).in("status", ["scheduled", "confirmed"]),
        supabase.from("tournaments").select("id", { count: "exact", head: true }).eq("active", true),
        supabase.from("availability_surveys").select("id", { count: "exact", head: true }).eq("status", "open"),
      ])

      setStats({
        totalUsers: usersResult.count || 0,
        activeMatches: matchesResult.count || 0,
        activeTournaments: tournamentsResult.count || 0,
        pendingSurveys: surveysResult.count || 0,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
      setError("No se pudieron cargar las estadísticas. Algunos datos podrían no estar disponibles.")
    }
  }

  // Si usas AuthGuard, este loading se manejaría allí
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <MainNav /> {/* MainNav debería manejar su propio estado de usuario o recibirlo */}
        <main className="flex-1 tennis-container py-8">
          <div className="flex h-[60vh] items-center justify-center">
            <div className="text-center animate-fadeIn">
              <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
              <p className="text-xl font-semibold text-foreground">Cargando Panel de Administración...</p>
              <p className="text-muted-foreground mt-2">Preparando tu centro de control.</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <MainNav />
        <main className="flex-1 tennis-container py-8">
          <div className="flex h-[60vh] items-center justify-center">
            <Card className="w-full max-w-lg professional-card text-center">
              <CardHeader>
                <ServerCrash className="mx-auto h-16 w-16 text-destructive mb-4" />
                <CardTitle className="text-2xl text-destructive">Error al Cargar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">{error}</p>
                <Button onClick={() => window.location.reload()} className="professional-btn-primary">
                  <Activity className="mr-2 h-4 w-4" />
                  Reintentar
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  const managementActions = [
    {
      title: "Gestión de Usuarios",
      description: "Administra jugadores y administradores.",
      href: "/admin/users",
      icon: Users,
      colorClass: "from-blue-500 to-sky-500",
    },
    {
      title: "Gestión de Torneos",
      description: "Crea, edita y supervisa torneos.",
      href: "/admin/tournaments",
      icon: Trophy,
      colorClass: "from-amber-500 to-yellow-500",
    },
    {
      title: "Gestión de Partidos",
      description: "Programa partidos y registra resultados.",
      href: "/admin/matches",
      icon: Calendar,
      colorClass: "from-green-500 to-emerald-500",
    },
    {
      title: "Encuestas",
      description: "Gestiona encuestas de disponibilidad.",
      href: "/admin/surveys",
      icon: FileText,
      colorClass: "from-purple-500 to-violet-500",
    },
    {
      title: "Rankings Globales",
      description: "Visualiza las clasificaciones generales.",
      href: "/rankings",
      icon: TrendingUp,
      colorClass: "from-pink-500 to-rose-500",
    },
    {
      title: "Reportes",
      description: "Analiza datos y genera informes.",
      href: "/admin/reports",
      icon: BarChart3,
      colorClass: "from-teal-500 to-cyan-500",
    },
  ]

  return (
    // <AuthGuard adminOnly> {/* Envolver con AuthGuard si se implementa */}
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-secondary/30 to-background">
      <MainNav />
      <main className="flex-1 tennis-container py-8 space-y-10">
        <section className="animate-fadeIn">
          <div className="page-header-background">
            <div className="decorative-circle-1 w-48 h-48 -top-10 -right-10 animate-pulse"></div>
            <div className="decorative-circle-2 w-60 h-60 -bottom-12 -left-12 animate-pulse delay-75"></div>
            <div className="relative z-10">
              <h1 className="text-4xl font-bold mb-3">Panel de Administración</h1>
              <p className="text-lg opacity-90 max-w-2xl">
                Bienvenido al centro de control de Liga Intertenis. Gestiona todos los aspectos de la liga de forma
                eficiente y profesional.
              </p>
              <div className="mt-6">
                <Image
                  src="/placeholder-d5hms.png"
                  alt="Admin Dashboard Graphic"
                  width={300}
                  height={150}
                  className="rounded-lg shadow-md opacity-80"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Usuarios Activos"
            value={stats.totalUsers}
            icon={Users}
            description="Jugadores y admins registrados."
            colorClass="text-blue-500"
          />
          <StatCard
            title="Partidos Activos"
            value={stats.activeMatches}
            icon={Calendar}
            description="Programados o confirmados."
            colorClass="text-green-500"
          />
          <StatCard
            title="Torneos en Curso"
            value={stats.activeTournaments}
            icon={Trophy}
            description="Competiciones activas."
            colorClass="text-amber-500"
          />
          <StatCard
            title="Encuestas Abiertas"
            value={stats.pendingSurveys}
            icon={FileText}
            description="Esperando respuestas."
            colorClass="text-purple-500"
          />
        </section>

        <section className="animate-fadeIn delay-200">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-semibold text-foreground">Acciones Rápidas</h2>
            <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
              Accede directamente a las secciones más importantes para la gestión de la liga.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {managementActions.map((action, index) => (
              <ActionCard key={index} {...action} />
            ))}
          </div>
        </section>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        &copy; {new Date().getFullYear()} Liga Intertenis. Potenciado por IA.
      </footer>
    </div>
    // </AuthGuard>
  )
}
