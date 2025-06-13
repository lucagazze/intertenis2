"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client" // Asegúrate que este cliente esté bien configurado
import MainNav from "@/components/layout/main-nav"
import RankingTable from "@/components/rankings/ranking-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Target, Users, Search, Filter, Calendar, TrendingUp, Medal, Crown, AlertTriangle } from "lucide-react"

export default function RankingsPage() {
  const [user, setUser] = useState<any>(null)
  const [tournaments, setTournaments] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedTournament, setSelectedTournament] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState<string>("")
  // const [activeTournament, setActiveTournament] = useState<any>(null) // No parece usarse activamente
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [tournamentStats, setTournamentStats] = useState({
    totalPlayers: 0,
    totalMatches: 0,
    completedMatches: 0,
    activeCategories: 0,
  })
  const router = useRouter()

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      setIsLoading(true)
      setAuthError(null)
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Error en getSession:", sessionError)
          setAuthError(
            `Error de autenticación: ${sessionError.message}. Verifica la configuración de Supabase y tu conexión.`,
          )
          // No redirigir inmediatamente, mostrar error primero
          setIsLoading(false)
          return
        }

        if (!session?.user) {
          router.push("/login")
          return
        }

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (userError || !userData) {
          console.error("Error fetching user data or no user data:", userError)
          setAuthError("No se pudieron cargar los datos del usuario. Intenta iniciar sesión de nuevo.")
          // Considerar redirigir a login si userData es crucial y no se encuentra
          // router.push("/login");
          setIsLoading(false)
          return
        }
        setUser(userData)

        // Fetch tournaments
        const { data: tournamentsData, error: tournamentsError } = await supabase
          .from("tournaments")
          .select("*")
          .order("created_at", { ascending: false })
        if (tournamentsError) throw tournamentsError
        setTournaments(tournamentsData || [])

        const activeTournamentData = tournamentsData?.find((t: any) => t.active)
        if (activeTournamentData) {
          // setActiveTournament(activeTournamentData) // No parece usarse
          setSelectedTournament(activeTournamentData.id.toString())
        }

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select("*")
          .eq("active", true)
          .order("name")
        if (categoriesError) throw categoriesError
        setCategories(categoriesData || [])

        if (userData.role === "player" && userData.category && categoriesData) {
          const userCategory = categoriesData.find((cat: any) => cat.id.toString() === userData.category)
          if (userCategory) setSelectedCategory(userData.category)
          else if (categoriesData.length > 0) setSelectedCategory(categoriesData[0].id.toString())
        } else if (categoriesData && categoriesData.length > 0) {
          setSelectedCategory(categoriesData[0].id.toString())
        }
      } catch (error: any) {
        console.error("Error en checkAuthAndFetchData:", error)
        // Si el error es 'TypeError: Failed to fetch', es probable que sea un problema de red/CORS/configuración de Supabase
        if (error.message.toLowerCase().includes("failed to fetch")) {
          setAuthError(
            "Error de conexión con el servidor de autenticación. Verifica tu conexión y la configuración de Supabase (Site URL).",
          )
        } else {
          setAuthError(`Error al cargar datos: ${error.message}`)
        }
        // No redirigir a login aquí para que el usuario vea el mensaje de error.
        // Podrías añadir un botón para reintentar o ir a login.
      } finally {
        setIsLoading(false)
      }
    }
    checkAuthAndFetchData()
  }, [router])

  useEffect(() => {
    const fetchTournamentStats = async () => {
      if (!selectedTournament) return
      try {
        const { data: matchesData } = await supabase
          .from("matches")
          .select("player1_id, player2_id")
          .eq("tournament_id", Number.parseInt(selectedTournament))
        const uniquePlayers = new Set(matchesData?.flatMap((m: any) => [m.player1_id, m.player2_id]).filter(Boolean))
        const { count: totalMatches } = await supabase
          .from("matches")
          .select("*", { count: "exact", head: true })
          .eq("tournament_id", Number.parseInt(selectedTournament))
        const { count: completedMatches } = await supabase
          .from("matches")
          .select("*", { count: "exact", head: true })
          .eq("tournament_id", Number.parseInt(selectedTournament))
          .eq("status", "played")
        const { data: categoriesInTournament } = await supabase
          .from("matches")
          .select("category_id")
          .eq("tournament_id", Number.parseInt(selectedTournament))
        const uniqueCategories = new Set(categoriesInTournament?.map((m: any) => m.category_id))
        setTournamentStats({
          totalPlayers: uniquePlayers.size,
          totalMatches: totalMatches || 0,
          completedMatches: completedMatches || 0,
          activeCategories: uniqueCategories.size,
        })
      } catch (error) {
        console.error("Error fetching tournament stats:", error)
      }
    }
    if (selectedTournament) fetchTournamentStats()
  }, [selectedTournament])

  const getTournamentName = (tournamentId: string) =>
    tournaments.find((t: any) => t.id.toString() === tournamentId)?.name || "Torneo no encontrado"
  const getCategoryName = (categoryId: string) =>
    categories.find((c: any) => c.id.toString() === categoryId)?.name || "Categoría no encontrada"

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-tennis-cream to-tennis-white">
        {" "}
        <MainNav />
        <div className="max-w-7xl mx-auto py-6 px-4 flex items-center justify-center h-64">
          <div className="text-center tennis-fade-in">
            {" "}
            <Trophy className="h-16 w-16 text-tennis-green mx-auto mb-4 animate-pulse" />{" "}
            <p className="text-xl font-semibold text-tennis-gray-dark">Cargando Rankings...</p>{" "}
          </div>
        </div>
      </div>
    )
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-tennis-cream to-tennis-white">
        {" "}
        <MainNav />
        <div className="max-w-xl mx-auto py-12 px-4 text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-red-700 mb-2">Error de Autenticación</h2>
          <p className="text-tennis-gray-dark mb-6">{authError}</p>
          <Button onClick={() => router.push("/login")} className="tennis-btn-primary">
            Ir a Inicio de Sesión
          </Button>
        </div>
      </div>
    )
  }

  if (!user && !isLoading) {
    // Si no hay usuario y no está cargando (después del intento de auth)
    // Esto podría ser redundante si authError ya causó un render, pero es un fallback.
    // router.push("/login") // Podría causar un loop si el login también falla. Mejor mostrar mensaje.
    return (
      <div className="min-h-screen bg-gradient-to-br from-tennis-cream to-tennis-white">
        {" "}
        <MainNav />
        <div className="max-w-xl mx-auto py-12 px-4 text-center">
          <p className="text-tennis-gray-dark mb-6">Sesión no válida o expirada.</p>
          <Button onClick={() => router.push("/login")} className="tennis-btn-primary">
            Ir a Inicio de Sesión
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-tennis-cream to-tennis-white">
      {" "}
      <MainNav />
      <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
        <div className="tennis-fade-in">
          <div className="page-header-background">
            {" "}
            <div className="decorative-circle-1"></div> <div className="decorative-circle-2"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  {" "}
                  <h1 className="text-4xl font-bold mb-3 flex items-center">
                    {" "}
                    <Crown className="h-10 w-10 mr-4 text-tennis-yellow" /> Rankings Profesionales{" "}
                  </h1>{" "}
                  <p className="text-tennis-white opacity-90 text-lg">
                    {" "}
                    Sistema de clasificación oficial de la Liga Intertenis{" "}
                  </p>
                  <div className="flex items-center space-x-6 mt-4">
                    {" "}
                    <div className="flex items-center space-x-2">
                      {" "}
                      <Users className="h-5 w-5" />{" "}
                      <span className="font-semibold">{tournamentStats.totalPlayers} Jugadores</span>{" "}
                    </div>{" "}
                    <div className="flex items-center space-x-2">
                      {" "}
                      <Trophy className="h-5 w-5" />{" "}
                      <span className="font-semibold">{tournamentStats.completedMatches} Partidos Jugados</span>{" "}
                    </div>{" "}
                    <div className="flex items-center space-x-2">
                      {" "}
                      <Target className="h-5 w-5" />{" "}
                      <span className="font-semibold">{tournamentStats.activeCategories} Categorías</span>{" "}
                    </div>{" "}
                  </div>
                </div>{" "}
                <div className="hidden lg:block">
                  {" "}
                  <div className="text-8xl opacity-20">🏆</div>{" "}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="tennis-slide-up">
          <Card className="tennis-card bg-white">
            <CardHeader className="border-b border-tennis-gray-light">
              <div className="flex items-center justify-between">
                <div>
                  {" "}
                  <CardTitle className="flex items-center space-x-2 text-tennis-gray-dark">
                    {" "}
                    <Filter className="h-5 w-5 text-tennis-green" /> <span>Filtros de Clasificación</span>{" "}
                  </CardTitle>{" "}
                  <CardDescription>
                    {" "}
                    Selecciona el torneo y categoría para visualizar los rankings oficiales{" "}
                  </CardDescription>{" "}
                </div>{" "}
                <Badge variant="outline" className="bg-tennis-green text-white border-tennis-green">
                  {" "}
                  Sistema Profesional{" "}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  {" "}
                  <label className="text-sm font-semibold text-tennis-gray-dark flex items-center">
                    {" "}
                    <Calendar className="h-4 w-4 mr-2 text-tennis-green" /> Torneo{" "}
                  </label>
                  <Select value={selectedTournament} onValueChange={setSelectedTournament}>
                    {" "}
                    <SelectTrigger className="bg-white border border-gray-300">
                      {" "}
                      <SelectValue placeholder="Seleccionar torneo" />{" "}
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {" "}
                      {tournaments.map((tournament: any) => (
                        <SelectItem key={tournament.id} value={tournament.id.toString()}>
                          {" "}
                          <div className="flex items-center space-x-2">
                            {" "}
                            <span className="font-medium">{tournament.name}</span>{" "}
                            {tournament.active && <Badge className="tennis-badge-gold text-xs">Activo</Badge>}{" "}
                          </div>{" "}
                        </SelectItem>
                      ))}{" "}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  {" "}
                  <label className="text-sm font-semibold text-tennis-gray-dark flex items-center">
                    {" "}
                    <Target className="h-4 w-4 mr-2 text-tennis-green" /> Categoría{" "}
                  </label>
                  <Select
                    value={selectedCategory}
                    onValueChange={(value) => setSelectedCategory(value === "all" ? "" : value)}
                  >
                    {" "}
                    <SelectTrigger className="bg-white border border-gray-300">
                      {" "}
                      <SelectValue placeholder="Seleccionar categoría" />{" "}
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {" "}
                      <SelectItem value="all">Todas las categorías</SelectItem>{" "}
                      {categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {" "}
                          <div className="flex items-center space-x-2">
                            {" "}
                            <Medal className="h-4 w-4 text-tennis-green" />{" "}
                            <span className="font-medium">{category.name}</span>{" "}
                          </div>{" "}
                        </SelectItem>
                      ))}{" "}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  {" "}
                  <label className="text-sm font-semibold text-tennis-gray-dark flex items-center">
                    {" "}
                    <Search className="h-4 w-4 mr-2 text-tennis-green" /> Buscar Jugador{" "}
                  </label>{" "}
                  <Input
                    placeholder="Nombre del jugador..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white border border-gray-300"
                  />{" "}
                </div>
              </div>
              {selectedTournament && selectedCategory && (
                <div className="mt-6 p-4 bg-gradient-to-r from-tennis-green to-tennis-court rounded-lg text-white">
                  {" "}
                  <div className="flex items-center space-x-2">
                    {" "}
                    <TrendingUp className="h-5 w-5" />{" "}
                    <span className="font-semibold text-lg">
                      {" "}
                      {getTournamentName(selectedTournament)} - {getCategoryName(selectedCategory)}{" "}
                    </span>{" "}
                  </div>{" "}
                  <p className="text-tennis-white opacity-90 mt-1">
                    Rankings oficiales actualizados en tiempo real
                  </p>{" "}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        {selectedTournament && selectedCategory ? (
          <div className="space-y-6 tennis-slide-up">
            {user?.role === "admin" ? (
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="grid w-full bg-white shadow-lg rounded-xl p-2 border border-tennis-gray-light">
                  {" "}
                  {categories.map((category: any) => (
                    <TabsTrigger
                      key={category.id}
                      value={category.id.toString()}
                      className="data-[state=active]:bg-tennis-gradient data-[state=active]:text-white rounded-lg transition-all font-semibold"
                    >
                      {" "}
                      <div className="flex items-center space-x-2">
                        {" "}
                        <Medal className="h-4 w-4" /> <span>{category.name}</span>{" "}
                      </div>{" "}
                    </TabsTrigger>
                  ))}{" "}
                </TabsList>
                {categories.map((category: any) => (
                  <TabsContent key={category.id} value={category.id.toString()}>
                    {" "}
                    <RankingTable
                      tournamentId={Number.parseInt(selectedTournament)}
                      categoryId={category.id}
                      showTitle={false}
                      searchTerm={searchTerm}
                    />{" "}
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <RankingTable
                tournamentId={Number.parseInt(selectedTournament)}
                categoryId={Number.parseInt(selectedCategory)}
                showTitle={false}
                searchTerm={searchTerm}
              />
            )}
          </div>
        ) : (
          <Card className="tennis-card bg-white">
            {" "}
            <CardContent className="p-16">
              {" "}
              <div className="text-center">
                {" "}
                <Trophy className="h-20 w-20 text-tennis-gray mx-auto mb-6" />{" "}
                <h3 className="text-2xl font-bold text-tennis-gray-dark mb-3">Selecciona Torneo y Categoría</h3>{" "}
                <p className="text-tennis-gray text-lg">
                  {" "}
                  Utiliza los filtros superiores para visualizar los rankings oficiales{" "}
                </p>{" "}
                <div className="mt-6">
                  {" "}
                  <Button className="tennis-btn-primary">
                    {" "}
                    <Filter className="h-4 w-4 mr-2" /> Configurar Filtros{" "}
                  </Button>{" "}
                </div>{" "}
              </div>{" "}
            </CardContent>{" "}
          </Card>
        )}
      </div>
    </div>
  )
}
