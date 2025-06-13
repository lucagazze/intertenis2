"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase/client"
import MainNav from "@/components/layout/main-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { CheckCircle, Clock, ThumbsUp, ThumbsDown } from "lucide-react"
import { cn } from "@/lib/utils"

// Componente para mostrar un partido individual, con resaltado de ganador
const PlayedMatchCard = ({ match, currentUserId }: { match: any; currentUserId: string }) => {
  const isWinner = match.winner_id === currentUserId
  const winnerName = match.winner_id === match.player1_id ? match.player1?.name : match.player2?.name

  return (
    <Card
      className={cn("transition-all", isWinner ? "border-green-500 bg-green-50" : "border-destructive/50 bg-red-50")}
    >
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-grow">
            <div className="flex items-center space-x-2 mb-2">
              <p className="font-semibold text-lg">
                {match.player1?.name} vs {match.player2?.name}
              </p>
              <Badge variant={isWinner ? "default" : "destructive"} className={cn(isWinner ? "bg-green-600" : "")}>
                {isWinner ? "Victoria" : "Derrota"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Resultado: <span className="font-medium text-foreground">{match.result || "No reportado"}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Ganador: <span className="font-medium text-foreground">{winnerName}</span>
            </p>
          </div>
          <div className="text-sm text-muted-foreground mt-2 sm:mt-0">
            {new Date(match.scheduled_date).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function MyMatchesPage() {
  const [user, setUser] = useState<any>(null)
  const [allMatches, setAllMatches] = useState<any[]>([])
  const [activeTournament, setActiveTournament] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push("/login")
        return
      }

      const { data: userData } = await supabase.from("users").select("*").eq("id", session.user.id).single()
      setUser(userData)

      const { data: tournamentData } = await supabase
        .from("tournaments")
        .select("*")
        .eq("active", true)
        .limit(1)
        .single()
      setActiveTournament(tournamentData)

      if (userData && tournamentData) {
        const { data: matchesData } = await supabase
          .from("matches")
          .select(`*, player1:users!matches_player1_id_fkey(name), player2:users!matches_player2_id_fkey(name)`)
          .eq("tournament_id", tournamentData.id)
          .or(`player1_id.eq.${userData.id},player2_id.eq.${userData.id}`)
          .order("scheduled_date", { ascending: false })
        setAllMatches(matchesData || [])
      }
      setLoading(false)
    }
    fetchData()
  }, [router])

  const { upcomingMatches, playedMatches, wonMatches, lostMatches } = useMemo(() => {
    const upcoming = allMatches.filter((m) => ["scheduled", "confirmed"].includes(m.status))
    const played = allMatches.filter((m) => m.status === "played")
    const won = played.filter((m) => m.winner_id === user?.id)
    const lost = played.filter((m) => m.winner_id !== null && m.winner_id !== user?.id)
    return { upcomingMatches: upcoming, playedMatches: played, wonMatches: won, lostMatches: lost }
  }, [allMatches, user?.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MainNav />
        <div className="container py-8 text-center">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <div className="container py-8 space-y-8">
        <header className="page-header-background">
          <div className="decorative-circle-1"></div>
          <div className="decorative-circle-2"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-2">Mis Partidos</h1>
            <p className="text-lg opacity-90">
              Tu historial de partidos en {activeTournament?.name || "el torneo actual"}
            </p>
          </div>
        </header>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="upcoming">
              <Clock className="mr-2 h-4 w-4" /> Por Jugar ({upcomingMatches.length})
            </TabsTrigger>
            <TabsTrigger value="played">
              <CheckCircle className="mr-2 h-4 w-4" /> Jugados ({playedMatches.length})
            </TabsTrigger>
            <TabsTrigger value="won">
              <ThumbsUp className="mr-2 h-4 w-4" /> Ganados ({wonMatches.length})
            </TabsTrigger>
            <TabsTrigger value="lost">
              <ThumbsDown className="mr-2 h-4 w-4" /> Perdidos ({lostMatches.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Partidos Próximos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingMatches.length > 0 ? (
                  upcomingMatches.map((match) => (
                    <Card key={match.id}>
                      <CardContent className="p-4">
                        {match.player1.name} vs {match.player2.name}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p>No tienes partidos próximos.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="played" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Partidos Jugados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {playedMatches.length > 0 ? (
                  playedMatches.map((match) => <PlayedMatchCard key={match.id} match={match} currentUserId={user.id} />)
                ) : (
                  <p>No has jugado ningún partido todavía.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="won" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Partidos Ganados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {wonMatches.length > 0 ? (
                  wonMatches.map((match) => <PlayedMatchCard key={match.id} match={match} currentUserId={user.id} />)
                ) : (
                  <p>Aún no has ganado partidos en este torneo. ¡Sigue así!</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lost" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Partidos Perdidos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {lostMatches.length > 0 ? (
                  lostMatches.map((match) => <PlayedMatchCard key={match.id} match={match} currentUserId={user.id} />)
                ) : (
                  <p>¡Felicidades! No has perdido ningún partido hasta ahora.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
