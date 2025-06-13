"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Crown, Medal, Award, RefreshCw, AlertCircle, Users, Loader2, TrendingUp, Star } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

interface TeamInfo {
  id: string | number
  name: string
  color: string
}

interface UserForRanking {
  id: string
  name: string
  team_id?: string | number | null
  teams?: TeamInfo
}

interface RankingEntry {
  position: number
  user_id: string
  users: UserForRanking | null
  matches_played: number
  matches_won: number
  matches_lost: number
  points: number
  sets_won?: number // Para mostrar diferenciales opcionalmente
  sets_lost?: number
  games_won?: number
  games_lost?: number
  average?: number
}

interface RankingTableProps {
  tournamentId: number
  categoryId: number
  tournamentName?: string
  categoryName?: string
  showTitle?: boolean
  title?: string
  searchTerm?: string // Añadido para filtrar por nombre
}

export default function RankingTable({
  tournamentId,
  categoryId,
  tournamentName: initialTournamentName,
  categoryName: initialCategoryName,
  showTitle = true,
  title: customTitle,
  searchTerm = "",
}: RankingTableProps) {
  const [rankings, setRankings] = useState<RankingEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tournamentName, setTournamentName] = useState<string>(initialTournamentName || "N/A")
  const [categoryName, setCategoryName] = useState<string>(initialCategoryName || "N/A")
  const { toast } = useToast()

  const fetchTournamentAndCategoryDetails = useCallback(async () => {
    if (!initialCategoryName && categoryId) {
      const { data: catData } = await supabase.from("categories").select("name").eq("id", categoryId).single()
      setCategoryName(catData?.name || "Desconocida")
    }
    if (!initialTournamentName && tournamentId) {
      const { data: tourData } = await supabase.from("tournaments").select("name").eq("id", tournamentId).single()
      setTournamentName(tourData?.name || "Desconocido")
    }
  }, [categoryId, tournamentId, initialCategoryName, initialTournamentName])

  const fetchDisplayRankings = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const query = supabase
        .from("rankings")
        .select(
          `
          position, user_id, matches_played, matches_won, matches_lost, points,
          sets_won, sets_lost, games_won, games_lost, average,
          users (id, name, team_id) 
        `,
        )
        .eq("tournament_id", tournamentId)
        .eq("category_id", categoryId)
        .order("position", { ascending: true })

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError
      if (!data) {
        setRankings([])
        return
      }

      const teamIds = data.map((r: any) => r.users?.team_id).filter(Boolean)
      const uniqueTeamIds = [...new Set(teamIds)]
      const teamsMap = new Map<string | number, TeamInfo>()

      if (uniqueTeamIds.length > 0) {
        const { data: teamsData } = await supabase.from("teams").select("id, name, color").in("id", uniqueTeamIds)
        teamsData?.forEach((team: TeamInfo) => teamsMap.set(team.id, team))
      }

      const enrichedRankings = data.map((r: any) => ({
        ...r,
        users: r.users ? { ...r.users, teams: r.users.team_id ? teamsMap.get(r.users.team_id) : undefined } : null,
      })) as RankingEntry[]

      setRankings(enrichedRankings)
    } catch (err: any) {
      setError(err.message || "Error al cargar clasificación.")
      setRankings([])
    } finally {
      setIsLoading(false)
    }
  }, [tournamentId, categoryId])

  useEffect(() => {
    if (!initialTournamentName || !initialCategoryName) fetchTournamentAndCategoryDetails()
    fetchDisplayRankings()
  }, [fetchDisplayRankings, fetchTournamentAndCategoryDetails, initialTournamentName, initialCategoryName])

  const handleUpdateRankingsAPI = async () => {
    setIsUpdating(true)
    setError(null)
    try {
      const response = await fetch("/api/update-rankings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId, categoryId }),
      })
      const result = await response.json()
      if (!response.ok || result.error) throw new Error(result.error || "Falló la actualización.")
      toast({ title: "Éxito", description: `Rankings actualizados. ${result.rankingsCount} jugadores.` })
      fetchDisplayRankings()
    } catch (err: any) {
      setError(err.message)
      toast({ title: "Error API", description: err.message, variant: "destructive" })
    } finally {
      setIsUpdating(false)
    }
  }

  const filteredRankings = rankings.filter((r) => r.users?.name?.toLowerCase().includes(searchTerm.toLowerCase()))

  const getPositionDisplay = (position: number) => {
    const commonClasses = "h-6 w-6"
    if (position === 1) return <Crown className={`${commonClasses} text-yellow-400`} />
    if (position === 2) return <Medal className={`${commonClasses} text-slate-400`} />
    if (position === 3) return <Award className={`${commonClasses} text-amber-600`} />
    return <span className="font-semibold text-sm">{position}</span>
  }

  const pageTitle = customTitle || "Tabla de Posiciones"

  // Render logic... (similar to previous, simplified for brevity here but full in actual file)
  if (isLoading && filteredRankings.length === 0 && searchTerm === "") {
    // Show loader only if no search term or initial load
    return (
      <Card className="professional-card animate-fadeIn">
        {showTitle && (
          <CardHeader className="border-b">
            <CardTitle className="text-xl">{pageTitle}</CardTitle>
          </CardHeader>
        )}
        <CardContent className="p-6 text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary mb-3" />
          <p className="text-muted-foreground text-sm">Cargando clasificación...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="professional-card animate-fadeIn">
        {showTitle && (
          <CardHeader className="border-b">
            <CardTitle className="text-xl text-destructive">{pageTitle} - Error</CardTitle>
          </CardHeader>
        )}
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>Error al Cargar Rankings</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="text-center mt-4">
            <Button onClick={handleUpdateRankingsAPI} disabled={isUpdating} className="professional-btn-primary">
              {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Reintentar Actualización
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="professional-card animate-fadeIn shadow-lg overflow-hidden my-6">
      {showTitle && (
        <CardHeader className="border-b bg-muted/30 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-lg sm:text-xl font-semibold text-foreground flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                {tournamentName} - {categoryName}
              </CardTitle>
              {customTitle && (
                <CardDescription className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  {customTitle}
                </CardDescription>
              )}
            </div>
            <Button
              onClick={handleUpdateRankingsAPI}
              disabled={isUpdating}
              size="sm"
              className="w-full sm:w-auto professional-btn-secondary"
            >
              {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              {isUpdating ? "Actualizando..." : "Actualizar"}
            </Button>
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0">
        {filteredRankings.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-md font-semibold text-foreground mb-1">
              {searchTerm ? "No se encontraron jugadores con ese nombre." : "No hay jugadores clasificados."}
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              {searchTerm
                ? "Intenta con otro término de búsqueda."
                : "Intenta actualizar o verifica si hay partidos jugados."}
            </p>
            {isLoading && !isUpdating && <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[60px] text-center px-2 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Pos
                  </TableHead>
                  <TableHead className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Jugador
                  </TableHead>
                  <TableHead className="hidden md:table-cell px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Equipo
                  </TableHead>
                  <TableHead className="w-[50px] text-center px-2 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    PJ
                  </TableHead>
                  <TableHead className="w-[50px] text-center px-2 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    PG
                  </TableHead>
                  <TableHead className="w-[50px] text-center px-2 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    PP
                  </TableHead>
                  <TableHead className="w-[70px] text-center px-2 py-3 text-xs font-medium text-primary uppercase tracking-wider">
                    Puntos
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRankings.map((r) => (
                  <TableRow key={r.user_id} className="hover:bg-muted/20 border-b last:border-b-0">
                    <TableCell className="text-center font-medium px-2 py-3">
                      {getPositionDisplay(r.position)}
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={`https://avatar.vercel.sh/${r.users?.name?.replace(/\s+/g, "-") || "jugador"}.png?size=32`}
                            alt={r.users?.name || "Jugador"}
                          />
                          <AvatarFallback>{r.users?.name?.charAt(0).toUpperCase() || "J"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium text-foreground truncate max-w-[120px] sm:max-w-none">
                            {r.users?.name || "N/A"}
                          </div>
                          {r.position <= 3 && (
                            <Badge
                              variant="outline"
                              className={`text-xs mt-0.5 ${r.position === 1 ? "border-yellow-400 text-yellow-500" : r.position === 2 ? "border-slate-400 text-slate-500" : "border-amber-600 text-amber-700"}`}
                            >
                              {r.position === 1 ? "Líder" : `Top ${r.position}`}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell px-3 py-3">
                      {r.users?.teams ? (
                        <Badge
                          style={{
                            backgroundColor: r.users.teams.color || "#A1A1AA",
                            color: contrastColor(r.users.teams.color || "#A1A1AA"),
                          }}
                          className="text-xs px-1.5 py-0.5"
                        >
                          {r.users.teams.name}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                          Sin equipo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-sm px-2 py-3">{r.matches_played}</TableCell>
                    <TableCell className="text-center text-sm font-semibold text-green-600 px-2 py-3">
                      {r.matches_won}
                    </TableCell>
                    <TableCell className="text-center text-sm font-semibold text-red-600 px-2 py-3">
                      {r.matches_lost}
                    </TableCell>
                    <TableCell className="text-center text-md font-bold text-primary px-2 py-3">{r.points}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      {filteredRankings.length > 0 && showTitle && (
        <div className="p-3 sm:p-4 bg-muted/30 border-t">
          <h4 className="font-semibold mb-2 flex items-center text-foreground text-xs">
            <Star className="mr-1.5 h-3.5 w-3.5 text-yellow-500" />
            Sistema de Clasificación (Desempates):
          </h4>
          <ol className="list-decimal list-inside space-y-0.5 text-xs text-muted-foreground pl-2">
            <li>Mayor cantidad de Puntos.</li>
            <li>Mayor Promedio (Puntos / Partidos Jugados).</li>
            <li>Mayor Diferencial de Partidos (Ganados - Perdidos).</li>
            <li>Mayor Diferencial de Sets (Ganados - Perdidos).</li>
            <li>Mayor Diferencial de Games (Ganados - Perdidos).</li>
          </ol>
        </div>
      )}
    </Card>
  )
}

function contrastColor(hexColor: string): string {
  if (!hexColor || hexColor.length < 4) return "#FFFFFF"
  let r, g, b
  if (hexColor.length === 4) {
    r = Number.parseInt(hexColor[1] + hexColor[1], 16)
    g = Number.parseInt(hexColor[2] + hexColor[2], 16)
    b = Number.parseInt(hexColor[3] + hexColor[3], 16)
  } else if (hexColor.length === 7) {
    r = Number.parseInt(hexColor.slice(1, 3), 16)
    g = Number.parseInt(hexColor.slice(3, 5), 16)
    b = Number.parseInt(hexColor.slice(5, 7), 16)
  } else {
    return "#FFFFFF"
  }
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return "#FFFFFF"
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? "#000000" : "#FFFFFF"
}
