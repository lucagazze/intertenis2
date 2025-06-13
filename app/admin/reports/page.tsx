"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import MainNav from "@/components/layout/main-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { Trophy, Users, Calendar, Award, Activity, BarChart3 } from "lucide-react"

export default function ReportsPage() {
  const [tournaments, setTournaments] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedTournament, setSelectedTournament] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMatches: 0,
    playedMatches: 0,
    pendingMatches: 0,
    totalSurveys: 0,
    activePlayers: 0,
  })
  const [matchesData, setMatchesData] = useState([])
  const [playersData, setPlayersData] = useState([])
  const [teamStats, setTeamStats] = useState([])
  const [monthlyActivity, setMonthlyActivity] = useState([])

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (selectedTournament) {
      fetchReportData()
    }
  }, [selectedTournament, selectedCategory])

  const fetchInitialData = async () => {
    // Obtener torneos
    const { data: tournamentsData } = await supabase
      .from("tournaments")
      .select("*")
      .order("created_at", { ascending: false })

    setTournaments(tournamentsData || [])
    if (tournamentsData && tournamentsData.length > 0) {
      setSelectedTournament(tournamentsData[0].id.toString())
    }

    // Obtener categorías
    const { data: categoriesData } = await supabase.from("categories").select("*").eq("active", true).order("name")

    setCategories(categoriesData || [])

    // Estadísticas generales
    await fetchGeneralStats()
  }

  const fetchGeneralStats = async () => {
    try {
      // Total usuarios
      const { count: usersCount } = await supabase.from("users").select("*", { count: "exact", head: true })

      // Total partidos
      const { count: matchesCount } = await supabase.from("matches").select("*", { count: "exact", head: true })

      // Partidos jugados
      const { count: playedCount } = await supabase
        .from("matches")
        .select("*", { count: "exact", head: true })
        .eq("status", "played")

      // Partidos pendientes
      const { count: pendingCount } = await supabase
        .from("matches")
        .select("*", { count: "exact", head: true })
        .in("status", ["scheduled", "confirmed"])

      // Encuestas
      const { count: surveysCount } = await supabase
        .from("availability_surveys")
        .select("*", { count: "exact", head: true })

      // Jugadores activos
      const { count: activePlayersCount } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("active", true)
        .eq("role", "player")

      setStats({
        totalUsers: usersCount || 0,
        totalMatches: matchesCount || 0,
        playedMatches: playedCount || 0,
        pendingMatches: pendingCount || 0,
        totalSurveys: surveysCount || 0,
        activePlayers: activePlayersCount || 0,
      })
    } catch (error) {
      console.error("Error fetching general stats:", error)
    }
  }

  const fetchReportData = async () => {
    try {
      // Datos de partidos por estado
      const { data: matchesStatusData } = await supabase
        .from("matches")
        .select("status")
        .eq("tournament_id", Number.parseInt(selectedTournament))

      const statusCounts =
        matchesStatusData?.reduce((acc: any, match: any) => {
          acc[match.status] = (acc[match.status] || 0) + 1
          return acc
        }, {}) || {}

      const matchesChartData = Object.entries(statusCounts).map(([status, count]) => ({
        status:
          status === "scheduled"
            ? "Programado"
            : status === "confirmed"
              ? "Confirmado"
              : status === "played"
                ? "Jugado"
                : status === "cancelled"
                  ? "Cancelado"
                  : status,
        count,
      }))

      setMatchesData(matchesChartData)

      // Datos de jugadores por categoría
      const categoryFilter = selectedCategory ? { category: selectedCategory } : {}

      const { data: playersCategory } = await supabase
        .from("users")
        .select("category")
        .eq("role", "player")
        .eq("active", true)
        .match(categoryFilter)

      const categoryCounts =
        playersCategory?.reduce((acc: any, player: any) => {
          const cat = player.category || "Sin categoría"
          acc[cat] = (acc[cat] || 0) + 1
          return acc
        }, {}) || {}

      const playersChartData = Object.entries(categoryCounts).map(([category, count]) => ({
        category,
        count,
      }))

      setPlayersData(playersChartData)

      // Estadísticas por equipo
      const { data: teamsData } = await supabase.from("teams").select("*")
      const { data: usersTeamData } = await supabase
        .from("users")
        .select("team_id")
        .eq("role", "player")
        .eq("active", true)

      const teamCounts =
        usersTeamData?.reduce((acc: any, user: any) => {
          const teamId = user.team_id || "sin_equipo"
          acc[teamId] = (acc[teamId] || 0) + 1
          return acc
        }, {}) || {}

      const teamStatsData = Object.entries(teamCounts).map(([teamId, count]) => {
        const team = teamsData?.find((t: any) => t.id.toString() === teamId)
        return {
          name: team?.name || "Sin equipo",
          players: count,
          color: team?.color || "#6b7280",
        }
      })

      setTeamStats(teamStatsData)

      // Actividad mensual (últimos 6 meses)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      const { data: monthlyMatches } = await supabase
        .from("matches")
        .select("created_at")
        .eq("tournament_id", Number.parseInt(selectedTournament))
        .gte("created_at", sixMonthsAgo.toISOString())

      const monthlyData =
        monthlyMatches?.reduce((acc: any, match: any) => {
          const month = new Date(match.created_at).toLocaleDateString("es-ES", { month: "short", year: "numeric" })
          acc[month] = (acc[month] || 0) + 1
          return acc
        }, {}) || {}

      const monthlyChartData = Object.entries(monthlyData).map(([month, count]) => ({
        month,
        partidos: count,
      }))

      setMonthlyActivity(monthlyChartData)
    } catch (error) {
      console.error("Error fetching report data:", error)
    }
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNav />

      <div className="max-w-7xl mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Reportes y Estadísticas</h1>
          <p className="text-gray-600">Análisis detallado de la actividad de la liga</p>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Torneo</label>
            <Select value={selectedTournament} onValueChange={setSelectedTournament}>
              <SelectTrigger>
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
            <label className="text-sm font-medium">Categoría (opcional)</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((category: any) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jugadores Activos</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activePlayers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Partidos</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMatches}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Partidos Jugados</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.playedMatches}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Partidos Pendientes</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingMatches}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Encuestas</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSurveys}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="matches" className="space-y-6">
          <TabsList>
            <TabsTrigger value="matches">Estado de Partidos</TabsTrigger>
            <TabsTrigger value="players">Jugadores por Categoría</TabsTrigger>
            <TabsTrigger value="teams">Estadísticas por Equipo</TabsTrigger>
            <TabsTrigger value="activity">Actividad Mensual</TabsTrigger>
          </TabsList>

          <TabsContent value="matches">
            <Card>
              <CardHeader>
                <CardTitle>Estado de Partidos</CardTitle>
                <CardDescription>Distribución de partidos por estado</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={matchesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="players">
            <Card>
              <CardHeader>
                <CardTitle>Jugadores por Categoría</CardTitle>
                <CardDescription>Distribución de jugadores activos</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={playersData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teams">
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas por Equipo</CardTitle>
                <CardDescription>Número de jugadores por equipo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamStats.map((team: any, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: team.color }} />
                        <span className="font-medium">{team.name}</span>
                      </div>
                      <Badge variant="outline">{team.players} jugadores</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Actividad Mensual</CardTitle>
                <CardDescription>Partidos creados por mes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="partidos" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
