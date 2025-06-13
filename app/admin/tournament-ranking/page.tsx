"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import MainNav from "@/components/layout/main-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trophy, Users, Target, RefreshCw, Crown, Medal, Award, Star } from "lucide-react"

interface TournamentRanking {
  position: number
  user_id: string
  user_name: string
  team_name: string
  team_color: string
  matches_played: number
  matches_won: number
  matches_lost: number
  sets_won: number
  sets_lost: number
  games_won: number
  games_lost: number
  points: number
  average: number
}

export default function TournamentRankingPage() {
  const [tournaments, setTournaments] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedTournament, setSelectedTournament] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [rankings, setRankings] = useState<TournamentRanking[]>([])
  const [participants, setParticipants] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchTournaments()
    fetchCategories()
  }, [])

  useEffect(() => {
    if (selectedTournament && selectedCategory) {
      fetchTournamentData()
    }
  }, [selectedTournament, selectedCategory])

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase.from("tournaments").select("*").order("name")
      if (error) throw error
      setTournaments(data || [])
    } catch (error) {
      console.error("Error fetching tournaments:", error)
    }
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from("categories").select("*").eq("active", true).order("name")
      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const fetchTournamentData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([fetchParticipants(), generateTournamentRanking()])
    } catch (error) {
      console.error("Error fetching tournament data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchParticipants = async () => {
    try {
      // Intentar obtener participantes de la tabla tournament_participants
      const { data: participantsData, error: participantsError } = await supabase
        .from("tournament_participants")
        .select(`
          user_id,
          users!inner(id, name, team_id, active),
          teams(name, color)
        `)
        .eq("tournament_id", Number.parseInt(selectedTournament))
        .eq("category_id", Number.parseInt(selectedCategory))
        .eq("users.active", true)

      if (participantsError || !participantsData || participantsData.length === 0) {
        // Fallback: obtener usuarios por categoría
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select(`
            id, name, team_id, active,
            teams(name, color)
          `)
          .eq("category", selectedCategory)
          .eq("active", true)

        if (usersError) throw usersError

        const formattedUsers = (usersData || []).map((user: any) => ({
          user_id: user.id,
          users: user,
          teams: user.teams,
        }))

        setParticipants(formattedUsers)
      } else {
        setParticipants(participantsData)
      }
    } catch (error) {
      console.error("Error fetching participants:", error)
      setParticipants([])
    }
  }

  const generateTournamentRanking = async () => {
    try {
      const tournamentId = Number.parseInt(selectedTournament)
      const categoryId = Number.parseInt(selectedCategory)

      // Obtener partidos jugados del torneo
      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .eq("category_id", categoryId)
        .eq("status", "played")

      if (matchesError) throw matchesError

      // Obtener equipos
      const { data: teamsData } = await supabase.from("teams").select("*")

      // Inicializar estadísticas para cada participante
      const userStats: Record<string, TournamentRanking> = {}

      participants.forEach((participant: any) => {
        const user = participant.users
        const team = teamsData?.find((t: any) => t.id === user.team_id) || participant.teams

        userStats[user.id] = {
          position: 0,
          user_id: user.id,
          user_name: user.name,
          team_name: team?.name || "Sin equipo",
          team_color: team?.color || "#64748B",
          matches_played: 0,
          matches_won: 0,
          matches_lost: 0,
          sets_won: 0,
          sets_lost: 0,
          games_won: 0,
          games_lost: 0,
          points: 0,
          average: 0,
        }
      })

      // Procesar partidos
      if (matchesData && matchesData.length > 0) {
        matchesData.forEach((match: any) => {
          // Solo procesar partidos donde ambos jugadores están en la lista
          if (!userStats[match.player1_id] || !userStats[match.player2_id]) {
            return
          }

          // Procesar jugador 1
          const player1Stats = userStats[match.player1_id]
          player1Stats.matches_played++
          player1Stats.sets_won += match.result_player1_sets || 0
          player1Stats.sets_lost += match.result_player2_sets || 0
          player1Stats.games_won += match.result_player1_games || 0
          player1Stats.games_lost += match.result_player2_games || 0

          if (match.winner_id === match.player1_id) {
            player1Stats.matches_won++
            player1Stats.points += 3
          } else {
            player1Stats.matches_lost++
          }

          // Procesar jugador 2
          const player2Stats = userStats[match.player2_id]
          player2Stats.matches_played++
          player2Stats.sets_won += match.result_player2_sets || 0
          player2Stats.sets_lost += match.result_player1_sets || 0
          player2Stats.games_won += match.result_player2_games || 0
          player2Stats.games_lost += match.result_player1_games || 0

          if (match.winner_id === match.player2_id) {
            player2Stats.matches_won++
            player2Stats.points += 3
          } else {
            player2Stats.matches_lost++
          }
        })
      }

      // Calcular promedios
      Object.values(userStats).forEach((stats) => {
        stats.average = stats.matches_played > 0 ? stats.points / stats.matches_played : 0
      })

      // Ordenar por criterios profesionales
      const rankingsArray = Object.values(userStats)
      rankingsArray.sort((a, b) => {
        if (a.average !== b.average) return b.average - a.average
        const aDiff = a.matches_won - a.matches_lost
        const bDiff = b.matches_won - b.matches_lost
        if (aDiff !== bDiff) return bDiff - aDiff
        const aSetsDiff = a.sets_won - a.sets_lost
        const bSetsDiff = b.sets_won - b.sets_lost
        if (aSetsDiff !== bSetsDiff) return bSetsDiff - aSetsDiff
        const aGamesDiff = a.games_won - a.games_lost
        const bGamesDiff = b.games_won - b.games_lost
        return bGamesDiff - aGamesDiff
      })

      // Asignar posiciones
      rankingsArray.forEach((ranking, index) => {
        ranking.position = index + 1
      })

      setRankings(rankingsArray)

      // Actualizar rankings en la base de datos
      await updateRankingsInDatabase(rankingsArray, tournamentId, categoryId)
    } catch (error) {
      console.error("Error generating tournament ranking:", error)
    }
  }

  const updateRankingsInDatabase = async (
    rankingsArray: TournamentRanking[],
    tournamentId: number,
    categoryId: number,
  ) => {
    try {
      // Eliminar rankings existentes
      await supabase.from("rankings").delete().eq("tournament_id", tournamentId).eq("category_id", categoryId)

      // Insertar nuevos rankings
      const rankingsToInsert = rankingsArray.map((ranking) => ({
        tournament_id: tournamentId,
        category_id: categoryId,
        user_id: ranking.user_id,
        position: ranking.position,
        matches_played: ranking.matches_played,
        matches_won: ranking.matches_won,
        matches_lost: ranking.matches_lost,
        sets_won: ranking.sets_won,
        sets_lost: ranking.sets_lost,
        games_won: ranking.games_won,
        games_lost: ranking.games_lost,
        points: ranking.points,
        average: ranking.average,
        last_updated: new Date().toISOString(),
      }))

      const { error } = await supabase.from("rankings").insert(rankingsToInsert)
      if (error) throw error

      setMessage("Rankings actualizados exitosamente")
    } catch (error) {
      console.error("Error updating rankings:", error)
    }
  }

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />
      default:
        return (
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="font-bold text-gray-700 text-sm">{position}</span>
          </div>
        )
    }
  }

  const getTournamentName = () => {
    const tournament = tournaments.find((t) => t.id.toString() === selectedTournament)
    return tournament?.name || "Seleccionar torneo"
  }

  const getCategoryName = () => {
    const category = categories.find((c) => c.id.toString() === selectedCategory)
    return category?.name || "Seleccionar categoría"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-tennis-cream to-tennis-white">
      <MainNav />

      <div className="tennis-container py-8 space-y-8">
        {/* Header */}
        <div className="tennis-fade-in">
          <div className="tennis-gradient rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <h1 className="text-3xl lg:text-4xl font-bold mb-3 flex items-center">
                <Trophy className="h-10 w-10 mr-4" />
                Ranking del Torneo
              </h1>
              <p className="text-tennis-white opacity-90 text-lg">
                Clasificación y estadísticas específicas por torneo
              </p>
              <div className="flex items-center space-x-6 mt-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span className="font-semibold">{participants.length} Participantes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span className="font-semibold">Sistema Profesional</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tournament Selection */}
        <div className="tennis-slide-up">
          <Card className="tennis-card">
            <CardHeader className="border-b border-tennis-gray-light">
              <CardTitle className="flex items-center space-x-2 text-tennis-gray-dark">
                <Target className="h-5 w-5 text-tennis-green" />
                <span>Seleccionar Torneo y Categoría</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-tennis-gray-dark">Torneo</label>
                  <Select value={selectedTournament} onValueChange={setSelectedTournament}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Seleccionar torneo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tournaments.map((tournament: any) => (
                        <SelectItem key={tournament.id} value={tournament.id.toString()}>
                          {tournament.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-tennis-gray-dark">Categoría</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-tennis-gray-dark">Acciones</label>
                  <Button
                    onClick={fetchTournamentData}
                    disabled={!selectedTournament || !selectedCategory || isLoading}
                    className="tennis-btn-primary w-full"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                    {isLoading ? "Actualizando..." : "Actualizar Ranking"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Messages */}
        {message && (
          <Alert className="tennis-slide-up">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {/* Tournament Info */}
        {selectedTournament && selectedCategory && (
          <div className="tennis-slide-up">
            <Card className="tennis-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Trophy className="h-6 w-6 text-tennis-green" />
                    <span>
                      {getTournamentName()} - {getCategoryName()}
                    </span>
                  </span>
                  <Badge className="bg-tennis-green text-white">{participants.length} Participantes</Badge>
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Rankings Table */}
        {rankings.length > 0 && (
          <div className="tennis-slide-up">
            <Card className="tennis-card">
              <CardHeader className="border-b border-tennis-gray-light">
                <CardTitle className="flex items-center space-x-3 text-tennis-gray-dark">
                  <Crown className="h-6 w-6 text-tennis-green" />
                  <span>Clasificación del Torneo</span>
                </CardTitle>
                <CardDescription>Rankings actualizados automáticamente con cada resultado cargado</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pos</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jugador</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipo</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">PJ</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">PG</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">PP</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">SG</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">SP</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">GG</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">GP</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pts</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Prom</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankings.map((ranking, index) => (
                        <tr
                          key={ranking.user_id}
                          className={`border-b border-gray-100 hover:bg-gray-50 ${index < 3 ? "bg-yellow-50" : ""}`}
                        >
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              {getPositionIcon(ranking.position)}
                              {ranking.position <= 3 && <Star className="h-4 w-4 text-yellow-500" />}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-tennis-gradient rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                  {ranking.user_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{ranking.user_name}</div>
                                {ranking.position <= 3 && (
                                  <div className="text-xs text-yellow-600 font-medium">Top Performer</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge style={{ backgroundColor: ranking.team_color }} className="text-white font-medium">
                              {ranking.team_name}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center font-semibold">{ranking.matches_played}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-bold text-green-600">{ranking.matches_won}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-bold text-red-600">{ranking.matches_lost}</span>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-700">{ranking.sets_won}</td>
                          <td className="px-4 py-3 text-center text-gray-700">{ranking.sets_lost}</td>
                          <td className="px-4 py-3 text-center text-gray-700">{ranking.games_won}</td>
                          <td className="px-4 py-3 text-center text-gray-700">{ranking.games_lost}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-bold text-tennis-green text-lg">{ranking.points}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <Target className="h-4 w-4 text-tennis-green" />
                              <span className="font-bold text-tennis-green text-lg">{ranking.average.toFixed(3)}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Ranking Criteria */}
                <div className="p-6 bg-gray-50 border-t">
                  <h4 className="font-bold mb-4 flex items-center text-gray-800">
                    <Trophy className="h-5 w-5 mr-2 text-tennis-green" />
                    Criterios de Clasificación
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="space-y-2">
                      <p>
                        <strong>1. Promedio:</strong> Puntos totales / Partidos jugados
                      </p>
                      <p>
                        <strong>2. Diferencial de partidos:</strong> Partidos ganados - Partidos perdidos
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p>
                        <strong>3. Diferencial de sets:</strong> Sets ganados - Sets perdidos
                      </p>
                      <p>
                        <strong>4. Diferencial de games:</strong> Games ganados - Games perdidos
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* No Data State */}
        {selectedTournament && selectedCategory && rankings.length === 0 && !isLoading && (
          <div className="tennis-slide-up">
            <Card className="tennis-card">
              <CardContent className="p-12 text-center">
                <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay datos de ranking</h3>
                <p className="text-gray-500 mb-6">
                  Los rankings se generarán automáticamente cuando se jueguen partidos en este torneo
                </p>
                <Button onClick={fetchTournamentData} className="tennis-btn-primary">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Verificar Datos
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
