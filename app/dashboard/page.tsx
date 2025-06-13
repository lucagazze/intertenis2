"use client"

import { CardFooter } from "@/components/ui/card"

import { AvatarFallback } from "@/components/ui/avatar"

import { AvatarImage } from "@/components/ui/avatar"

import { Avatar } from "@/components/ui/avatar"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import MainNav from "@/components/layout/main-nav"
import AvailabilitySurvey from "@/components/dashboard/availability-survey"
import MatchCard from "@/components/matches/match-card" // Asegúrate que MatchCard esté actualizado
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import {
  Trophy,
  Calendar,
  TrendingUp,
  Award,
  Activity,
  Zap,
  Bell,
  AlertTriangle,
  CheckCircle,
  Mail,
  Shield,
  Play,
  X,
  Loader2,
  ServerCrash,
  Info,
  ListChecks,
  ArrowRight,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

// Placeholder para AuthGuard
// import AuthGuard from "@/components/auth/auth-guard";

interface StatDisplayProps {
  icon: React.ElementType
  label: string
  value: string | number
  colorClass?: string
  isLoading?: boolean
}

const StatDisplay: React.FC<StatDisplayProps> = ({
  icon: Icon,
  label,
  value,
  colorClass = "text-primary",
  isLoading,
}) => (
  <div className="professional-card p-4 sm:p-6 flex flex-col items-center text-center animate-slideInUp">
    <div
      className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${colorClass.replace("text-", "from-").replace("500", "400")} via-${colorClass.replace("text-", "from-").replace("500", "500")} to-${colorClass.replace("text-", "from-").replace("500", "600")} text-primary-foreground shadow-lg`}
    >
      <Icon className="h-6 w-6" />
    </div>
    <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
    {isLoading ? (
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
    ) : (
      <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
    )}
  </div>
)

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [upcomingMatches, setUpcomingMatches] = useState([])
  const [activeTournament, setActiveTournament] = useState<any>(null)
  const [nextMatchAlert, setNextMatchAlert] = useState<any>(null)
  const [pendingSurveys, setPendingSurveys] = useState([])
  const [stats, setStats] = useState({
    totalMatchesPlayed: 0,
    matchesWon: 0,
    winPercentage: 0,
    currentStreak: 0,
  })
  const [personalRanking, setPersonalRanking] = useState<any>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()

  const [showMatchDetailsModal, setShowMatchDetailsModal] = useState(false)
  const [showSurveyModal, setShowSurveyModal] = useState(false)
  const [selectedMatchForDetails, setSelectedMatchForDetails] = useState<any>(null)
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; message: string } | null>(null)

  useEffect(() => {
    const loadInitialData = async () => {
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
          .select("*")
          .eq("id", session.user.id)
          .single()
        if (userError || !userData) {
          await supabase.auth.signOut()
          router.push("/login")
          return
        }
        setUser(userData)

        const { data: tournamentData, error: tournamentError } = await supabase
          .from("tournaments")
          .select("*")
          .eq("active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        if (tournamentError) throw tournamentError
        setActiveTournament(tournamentData)

        if (userData && tournamentData) {
          await Promise.all([
            fetchUserUpcomingMatches(userData.id, tournamentData.id),
            fetchUserStats(userData.id, tournamentData.id),
            fetchPendingSurveys(userData.id, tournamentData.id, userData.category),
            fetchPersonalRanking(userData.id, tournamentData.id, userData.category),
          ])
        } else if (userData && !tournamentData) {
          // Usuario existe pero no hay torneo activo, cargar datos básicos del usuario
          setStats({ totalMatchesPlayed: 0, matchesWon: 0, winPercentage: 0, currentStreak: 0 })
          setPersonalRanking(null)
          setUpcomingMatches([])
        }
      } catch (err: any) {
        console.error("Error loading dashboard:", err)
        setError(err.message || "No se pudo cargar tu dashboard. Por favor, intenta recargar la página.")
      } finally {
        setIsLoading(false)
      }
    }
    loadInitialData()
  }, [router])

  const showToast = (type: "success" | "error", message: string) => {
    setToastMessage({ type, message })
    setTimeout(() => setToastMessage(null), 5000)
  }

  const fetchUserUpcomingMatches = async (userId: string, tournamentId: number) => {
    const { data, error } = await supabase
      .from("matches")
      .select(
        "*, player1:users!matches_player1_id_fkey(name), player2:users!matches_player2_id_fkey(name)", // Removed avatar_url
      )
      .eq("tournament_id", tournamentId)
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .in("status", ["scheduled", "confirmed"])
      .order("scheduled_date", { ascending: true })

    if (error) throw error
    setUpcomingMatches(data || [])

    const next = data?.find((match) => new Date(match.scheduled_date) > new Date())
    if (next && (!next.player1_confirmed || !next.player2_confirmed)) {
      const userIsPlayer1 = next.player1_id === userId
      const userConfirmed = userIsPlayer1 ? next.player1_confirmed : next.player2_confirmed
      if (!userConfirmed) {
        setNextMatchAlert(next)
      } else {
        setNextMatchAlert(null) // Ya confirmó su parte
      }
    } else {
      setNextMatchAlert(null)
    }
  }

  const fetchPendingSurveys = async (userId: string, tournamentId: number, category: string) => {
    if (!tournamentId || !category) {
      setPendingSurveys([])
      return
    }
    const { data: surveysData, error: surveysError } = await supabase
      .from("availability_surveys")
      .select("*, survey_responses!left(id, user_id)") // Ensure user_id is selected from survey_responses
      .eq("tournament_id", tournamentId)
      .eq("category_id", Number.parseInt(category))
      .eq("status", "open")

    if (surveysError) throw surveysError

    const pending =
      surveysData?.filter((survey) => {
        const responses = survey.survey_responses as any[] // Cast to any[] to access user_id
        return !responses.some((response) => response.user_id === userId)
      }) || []
    setPendingSurveys(pending)
  }

  const fetchUserStats = async (userId: string, tournamentId: number) => {
    const { data: allMatches, error } = await supabase
      .from("matches")
      .select("status, winner_id")
      .eq("tournament_id", tournamentId)
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)

    if (error) throw error

    if (allMatches) {
      const played = allMatches.filter((m) => m.status === "played")
      const won = played.filter((m) => m.winner_id === userId).length
      const totalPlayed = played.length
      const winRate = totalPlayed > 0 ? Math.round((won / totalPlayed) * 100) : 0

      let streak = 0
      // Ordenar por fecha si estuviera disponible, sino por orden de aparición (asumiendo que es cronológico)
      const sortedPlayedMatches = played // Idealmente ordenar por fecha de finalización
      for (let i = sortedPlayedMatches.length - 1; i >= 0; i--) {
        if (sortedPlayedMatches[i].winner_id === userId) streak++
        else break
      }
      setStats({ totalMatchesPlayed: totalPlayed, matchesWon: won, winPercentage: winRate, currentStreak: streak })
    }
  }

  const fetchPersonalRanking = async (userId: string, tournamentId: number, category: string) => {
    if (!tournamentId || !category) {
      setPersonalRanking(null)
      return
    }
    const { data, error } = await supabase
      .from("rankings")
      .select("position, points, average, matches_won, matches_lost")
      .eq("tournament_id", tournamentId)
      .eq("category_id", Number.parseInt(category))
      .eq("user_id", userId)
      .maybeSingle()
    if (error) throw error
    setPersonalRanking(data)
  }

  const formatMatchDateAlert = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "short" })} a las ${date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`
  }

  const handleShowMatchDetails = (match: any) => {
    setSelectedMatchForDetails(match)
    setShowMatchDetailsModal(true)
  }
  const handleConfirmMatch = async (matchId: number) => {
    if (!selectedMatchForDetails || !user) return
    const isPlayer1 = selectedMatchForDetails.player1_id === user.id
    const updateField = isPlayer1 ? "player1_confirmed" : "player2_confirmed"
    const { error } = await supabase
      .from("matches")
      .update({ [updateField]: true })
      .eq("id", matchId)

    if (!error) {
      setShowMatchDetailsModal(false)
      if (user && activeTournament) {
        // Ensure user and activeTournament are defined
        await fetchUserUpcomingMatches(user.id, activeTournament.id) // Refrescar partidos
      }
      showToast("success", "¡Partido confirmado exitosamente!")
    } else {
      showToast("error", "Error al confirmar el partido.")
    }
  }

  const handleSurveyComplete = async () => {
    setShowSurveyModal(false)
    if (user && activeTournament) {
      await fetchPendingSurveys(user.id, activeTournament.id, user.category)
    }
    showToast("success", "¡Encuesta de disponibilidad completada!")
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <MainNav />
        <main className="flex-1 tennis-container py-8">
          <div className="flex h-[60vh] items-center justify-center">
            <div className="text-center animate-fadeIn">
              <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
              <p className="text-xl font-semibold text-foreground">Cargando tu Dashboard...</p>
              <p className="text-muted-foreground mt-2">Un momento, estamos preparando todo.</p>
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

  if (!user) return null // Ya debería haber redirigido si no hay usuario

  const categoryId = user.category ? Number.parseInt(user.category) : null

  return (
    // <AuthGuard> {/* Envolver con AuthGuard si se implementa */}
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-secondary/30 to-background">
      <MainNav />
      <main className="flex-1 tennis-container py-8 space-y-10">
        {/* Toast Messages */}
        {toastMessage && (
          <div className="fixed top-20 right-5 z-[100] animate-fadeIn">
            <Alert
              className={`professional-alert ${toastMessage.type === "success" ? "border-green-500 text-green-700 [&>svg]:text-green-500" : "professional-alert-destructive"}`}
            >
              {toastMessage.type === "success" ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
              <AlertDescription>{toastMessage.message}</AlertDescription>
            </Alert>
          </div>
        )}

        <section className="animate-fadeIn">
          <div className="page-header-background">
            <Image
              src="/abstract-tennis-court.png"
              alt="Jugador de tenis en acción"
              fill
              style={{ objectFit: "cover" }}
              quality={75}
              className="absolute inset-0 opacity-20 z-0"
              priority
            />
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center md:space-x-6">
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg mb-4 md:mb-0">
                  <AvatarImage
                    src={user.avatar_url || `https://avatar.vercel.sh/${user.email}.png?size=96`}
                    alt={user.name}
                  />
                  <AvatarFallback className="text-3xl">{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-4xl font-bold">¡Hola, {user.name}!</h1>
                  <p className="text-lg opacity-90 mt-1">Bienvenido a tu centro de mando en Liga Intertenis.</p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2 p-3 bg-black/20 rounded-lg backdrop-blur-sm">
                  <Mail className="h-5 w-5 opacity-80" /> <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-black/20 rounded-lg backdrop-blur-sm">
                  <Shield className="h-5 w-5 opacity-80" /> <span>Categoría: {user.category || "N/A"}</span>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-black/20 rounded-lg backdrop-blur-sm col-span-2 sm:col-span-1">
                  <Trophy className="h-5 w-5 opacity-80" />{" "}
                  <span className="truncate">Torneo: {activeTournament?.name || "Ninguno activo"}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Alertas Importantes */}
        {nextMatchAlert && (
          <Alert
            variant="default"
            className="professional-alert border-accent text-accent-foreground [&>svg]:text-accent animate-fadeIn"
          >
            <Bell className="h-5 w-5" />
            <AlertTitle className="font-semibold">¡Partido Próximo por Confirmar!</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                Tienes un partido contra{" "}
                <strong>
                  {nextMatchAlert.player1_id === user.id ? nextMatchAlert.player2.name : nextMatchAlert.player1.name}
                </strong>{" "}
                programado para el {formatMatchDateAlert(nextMatchAlert.scheduled_date)}.
                {nextMatchAlert.venue && ` en ${nextMatchAlert.venue}.`}
              </div>
              <Button
                size="sm"
                className="mt-2 sm:mt-0 professional-btn-primary bg-accent hover:bg-accent/90 text-accent-foreground"
                onClick={() => handleShowMatchDetails(nextMatchAlert)}
              >
                <Play className="mr-2 h-4 w-4" /> Ver y Confirmar
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {pendingSurveys.length > 0 && (
          <Alert
            variant="default"
            className="professional-alert border-blue-500 text-blue-700 [&>svg]:text-blue-500 animate-fadeIn"
          >
            <ListChecks className="h-5 w-5" />
            <AlertTitle className="font-semibold">Encuesta de Disponibilidad Pendiente</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              Completa tu disponibilidad para la próxima semana y no te pierdas ningún partido.
              <Button
                size="sm"
                className="mt-2 sm:mt-0 professional-btn-primary bg-blue-500 hover:bg-blue-600"
                onClick={() => setShowSurveyModal(true)}
              >
                <Calendar className="mr-2 h-4 w-4" /> Completar Encuesta
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {!activeTournament && !isLoading && (
          <Alert
            variant="default"
            className="professional-alert border-yellow-500 text-yellow-700 [&>svg]:text-yellow-500 animate-fadeIn"
          >
            <Info className="h-5 w-5" />
            <AlertTitle className="font-semibold">No hay Torneos Activos</AlertTitle>
            <AlertDescription>
              Actualmente no hay ningún torneo activo. Mantente atento a las comunicaciones o contacta al administrador.
            </AlertDescription>
          </Alert>
        )}

        {/* Estadísticas Clave */}
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatDisplay
            icon={TrendingUp}
            label="Efectividad"
            value={`${stats.winPercentage}%`}
            colorClass="text-green-500"
            isLoading={isLoading && !stats.winPercentage}
          />
          <StatDisplay
            icon={Award}
            label="Partidos Ganados"
            value={stats.matchesWon}
            colorClass="text-blue-500"
            isLoading={isLoading && !stats.matchesWon}
          />
          <StatDisplay
            icon={Zap}
            label="Racha Actual"
            value={stats.currentStreak}
            colorClass="text-amber-500"
            isLoading={isLoading && !stats.currentStreak}
          />
          <StatDisplay
            icon={Trophy}
            label="Posición Ranking"
            value={personalRanking?.position ? `#${personalRanking.position}` : "N/A"}
            colorClass="text-purple-500"
            isLoading={isLoading && !personalRanking}
          />
        </section>

        {/* Próximos Partidos */}
        <section className="animate-fadeIn">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-semibold text-foreground">Próximos Partidos</h2>
            <Button asChild variant="outline" className="professional-btn-outline">
              <Link href="/my-matches">
                Ver Todos <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          {upcomingMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingMatches.slice(0, 4).map(
                (
                  match: any, // Mostrar hasta 4 próximos
                ) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    currentUserId={user.id}
                    onUpdate={() => user && activeTournament && fetchUserUpcomingMatches(user.id, activeTournament.id)}
                    onShowDetails={() => handleShowMatchDetails(match)}
                    className="animate-slideInUp"
                  />
                ),
              )}
            </div>
          ) : (
            <Card className="professional-card text-center py-12">
              <CardContent>
                <Calendar className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Sin Partidos Próximos</h3>
                <p className="text-muted-foreground">
                  {activeTournament
                    ? "No tienes partidos programados por el momento."
                    : "No hay torneo activo para programar partidos."}
                </p>
                {activeTournament && pendingSurveys.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Asegúrate de haber completado tu encuesta de disponibilidad.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </section>

        {/* Modales */}
        {showMatchDetailsModal && selectedMatchForDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn p-4">
            <Card className="professional-card w-full max-w-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Detalles del Partido</CardTitle>
                <CardDescription>
                  {selectedMatchForDetails.player1.name} vs {selectedMatchForDetails.player2.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  <strong className="text-muted-foreground">Fecha:</strong>{" "}
                  {formatMatchDateAlert(selectedMatchForDetails.scheduled_date)}
                </p>
                {selectedMatchForDetails.venue && (
                  <p>
                    <strong className="text-muted-foreground">Lugar:</strong> {selectedMatchForDetails.venue}
                  </p>
                )}
                {/* Aquí podrías añadir más detalles si es necesario */}
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowMatchDetailsModal(false)}
                  className="w-full sm:w-auto professional-btn-outline"
                >
                  Cerrar
                </Button>
                <Button
                  onClick={() => handleConfirmMatch(selectedMatchForDetails.id)}
                  className="w-full sm:w-auto professional-btn-primary"
                  disabled={
                    (selectedMatchForDetails.player1_id === user.id && selectedMatchForDetails.player1_confirmed) ||
                    (selectedMatchForDetails.player2_id === user.id && selectedMatchForDetails.player2_confirmed)
                  }
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {(selectedMatchForDetails.player1_id === user.id && selectedMatchForDetails.player1_confirmed) ||
                  (selectedMatchForDetails.player2_id === user.id && selectedMatchForDetails.player2_confirmed)
                    ? "Ya Confirmado"
                    : "Confirmar Asistencia"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {showSurveyModal && activeTournament && categoryId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn p-4">
            <Card className="professional-card w-full max-w-2xl max-h-[90vh] flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Encuesta de Disponibilidad</CardTitle>
                  <CardDescription>Indica tus horarios para la próxima semana.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowSurveyModal(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                <AvailabilitySurvey
                  categoryId={categoryId}
                  tournamentId={activeTournament.id}
                  onComplete={handleSurveyComplete}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        &copy; {new Date().getFullYear()} Liga Intertenis. Tu pasión, nuestra plataforma.
      </footer>
    </div>
    // </AuthGuard>
  )
}
