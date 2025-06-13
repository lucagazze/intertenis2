"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import MainNav from "@/components/layout/main-nav"
import RankingTable from "@/components/rankings/ranking-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Calendar, Users, Target, Crown, Medal, Award, Star } from "lucide-react"

export default function TournamentPublicPage() {
  const [tournaments, setTournaments] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedTournament, setSelectedTournament] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [matches, setMatches] = useState([])
  const [stats, setStats] = useState({
    totalMatches: 0,
    playedMatches: 0,
    totalPlayers: 0,
    categories: 0,
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (selectedTournament && selectedCategory) {
      fetchTournamentData()
    }
  }, [selectedTournament, selectedCategory])

  const fetchInitialData = async () => {
    try {
      // Fetch active tournaments
      const { data: tournamentsData } = await supabase.from("tournaments").select("*").eq("active", true).order("name")

      setTournaments(tournamentsData || [])
      if (tournamentsData && tournamentsData.length > 0) {
        setSelectedTournament(tournamentsData[0].id.toString())
      }

      // Fetch categories
      const { data: categoriesData } = await supabase.from("categories").select("*").eq("active", true).order("name")

      setCategories(categoriesData || [])
      if (categoriesData && categoriesData.length > 0) {
        setSelectedCategory(categoriesData[0].id.toString())
      }
    } catch (error) {
      console.error("Error fetching initial data:", error)
    }
  }

  const fetchTournamentData = async () => {
    try {
      // Fetch matches
      const { data: matchesData } = await supabase
        .from("matches")
        .select(`
          *,
          player1:users!matches_player1_id_fkey(name),
          player2:users!matches_player2_id_fkey(name)
        `)
        .eq("tournament_id", Number.parseInt(selectedTournament))
        .eq("category_id", Number.parseInt(selectedCategory))
        .order("scheduled_date", { ascending: true })

      setMatches(matchesData || [])

      // Calculate stats
      const totalMatches = matchesData?.length || 0
      const playedMatches = matchesData?.filter((m: any) => m.status === "played").length || 0

      // Get unique players
      const playerIds = new Set<string>()
      matchesData?.forEach((match: any) => {
        playerIds.add(match.player1_id)
        playerIds.add(match.player2_id)
      })

      setStats({
        totalMatches,
        playedMatches,
        totalPlayers: playerIds.size,
        categories: 1, // Current category
      })
    } catch (error) {
      console.error("Error fetching tournament data:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: "Programado", variant: "outline" as const },
      confirmed: { label: "Confirmado", variant: "default" as const },
      played: { label: "Jugado", variant: "secondary" as const },
      cancelled: { label: "Cancelado", variant: "destructive" as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: "outline" as const,
    }

    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getTournamentName = () => {
    const tournament = tournaments.find((t: any) => t.id.toString() === selectedTournament)
    return tournament?.name || "Torneo"
  }

  const getCategoryName = () => {
    const category = categories.find((c: any) => c.id.toString() === selectedCategory)
    return category?.name || "Categoría"
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
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold mb-3 flex items-center">
                    <Crown className="h-10 w-10 mr-4" />
                    Liga Profesional de Tenis
                  </h1>
                  <p className="text-tennis-white opacity-90 text-lg">
                    Torneo oficial con sistema de puntuación profesional
                  </p>
                  <div className="flex items-center space-x-6 mt-4">
                    <div className="flex items-center space-x-2">
                      <Trophy className="h-5 w-5" />
                      <span className="font-semibold">Sistema ATP</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="h-5 w-5" />
                      <span className="font-semibold">Rankings Oficiales</span>
                    </div>
                  </div>
                </div>
                <Badge className="bg-white text-tennis-green font-bold px-4 py-2">
                  <Medal className="h-4 w-4 mr-2" />
                  Torneo Oficial
                </Badge>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
            </CardContent>
          </Card>
        </div>

        {selectedTournament && selectedCategory && (
          <>
            {/* Tournament Stats */}
            <div className="tennis-slide-up">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="tennis-card">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-tennis-gradient rounded-full flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-tennis-gray-dark">{stats.totalMatches}</p>
                        <p className="text-sm text-tennis-gray">Total Partidos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="tennis-card">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                        <Trophy className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-tennis-gray-dark">{stats.playedMatches}</p>
                        <p className="text-sm text-tennis-gray">Partidos Jugados</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="tennis-card">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-tennis-gray-dark">{stats.totalPlayers}</p>
                        <p className="text-sm text-tennis-gray">Jugadores</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="tennis-card">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                        <Award className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-tennis-gray-dark">
                          {Math.round((stats.playedMatches / stats.totalMatches) * 100) || 0}%
                        </p>
                        <p className="text-sm text-tennis-gray">Progreso</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="rankings" className="space-y-6 tennis-slide-up">
              <TabsList className="grid w-full grid-cols-2 bg-white shadow-lg rounded-xl p-2 border border-tennis-gray-light">
                <TabsTrigger
                  value="rankings"
                  className="data-[state=active]:bg-tennis-gradient data-[state=active]:text-white rounded-lg transition-all font-semibold"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Clasificación Oficial
                </TabsTrigger>
                <TabsTrigger
                  value="matches"
                  className="data-[state=active]:bg-tennis-gradient data-[state=active]:text-white rounded-lg transition-all font-semibold"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Partidos ({matches.length})
                </TabsTrigger>
              </TabsList>

              {/* Rankings Tab */}
              <TabsContent value="rankings">
                <RankingTable
                  tournamentId={Number.parseInt(selectedTournament)}
                  categoryId={Number.parseInt(selectedCategory)}
                  showTitle={true}
                  searchTerm=""
                  filterByCategory={true}
                />
              </TabsContent>

              {/* Matches Tab */}
              <TabsContent value="matches">
                <Card className="tennis-card">
                  <CardHeader className="border-b border-tennis-gray-light">
                    <CardTitle className="flex items-center space-x-3 text-tennis-gray-dark">
                      <Calendar className="h-6 w-6 text-tennis-green" />
                      <span>Fixture del Torneo</span>
                    </CardTitle>
                    <CardDescription>
                      {getTournamentName()} - {getCategoryName()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {matches.length === 0 ? (
                      <div className="text-center py-16">
                        <Calendar className="h-16 w-16 text-tennis-gray mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-tennis-gray-dark mb-2">No hay partidos</h3>
                        <p className="text-tennis-gray">Los partidos aparecerán cuando se programen</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Enfrentamiento
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                Estado
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                Resultado
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Cancha
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {matches.map((match: any) => (
                              <tr key={match.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <div className="text-xs">
                                    <div className="font-medium text-gray-900">
                                      {match.scheduled_date
                                        ? new Date(match.scheduled_date).toLocaleDateString("es-ES")
                                        : "Por definir"}
                                    </div>
                                    <div className="text-gray-500">
                                      {match.scheduled_date
                                        ? new Date(match.scheduled_date).toLocaleTimeString("es-ES", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })
                                        : ""}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-sm font-medium text-gray-900">
                                    {match.player1?.name} vs {match.player2?.name}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">{getStatusBadge(match.status)}</td>
                                <td className="px-4 py-3 text-center">
                                  {match.status === "played" ? (
                                    <div className="text-xs">
                                      <div className="font-bold text-green-600">
                                        {match.result_player1_sets} - {match.result_player2_sets}
                                      </div>
                                      <div className="text-gray-500">
                                        ({match.result_player1_games} - {match.result_player2_games})
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-gray-500 text-xs">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-xs text-gray-600">{match.venue || "Por definir"}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  )
}
