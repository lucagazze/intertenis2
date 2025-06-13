"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import MainNav from "@/components/layout/main-nav"
import MatchResultForm from "@/components/matches/match-result-form"
import EditResultModal from "@/components/matches/edit-result-modal"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Edit, Trash2, Trophy, Calendar, Users, CheckCircle, XCircle, Search, Filter } from "lucide-react"

interface Match {
  id: number
  tournament_id: number
  category_id: number
  player1_id: string
  player2_id: string
  scheduled_date: string
  venue?: string
  status: string
  player1_confirmed: boolean
  player2_confirmed: boolean
  result_player1_sets: number
  result_player2_sets: number
  result_player1_games: number
  result_player2_games: number
  winner_id?: string
  notes?: string
  player1?: { name: string }
  player2?: { name: string }
}

export default function MatchesManagement() {
  const [matches, setMatches] = useState<Match[]>([])
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([])
  const [users, setUsers] = useState([])
  const [tournaments, setTournaments] = useState([])
  const [categories, setCategories] = useState([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isResultModalOpen, setIsResultModalOpen] = useState(false)
  const [isEditResultModalOpen, setIsEditResultModalOpen] = useState(false)
  const [editingMatch, setEditingMatch] = useState<Match | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [tournamentFilter, setTournamentFilter] = useState("all")
  const [formData, setFormData] = useState({
    tournament_id: "",
    category_id: "",
    player1_id: "",
    player2_id: "",
    scheduled_date: "",
    venue: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        await Promise.all([fetchMatches(), fetchUsers(), fetchTournaments(), fetchCategories()])
      } catch (err) {
        console.error("Error loading data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    filterMatches()
  }, [matches, searchTerm, statusFilter, tournamentFilter])

  useEffect(() => {
    if (formData.tournament_id && formData.category_id) {
      fetchTournamentUsers(formData.tournament_id, formData.category_id)
    } else {
      setUsers([])
    }
  }, [formData.tournament_id, formData.category_id])

  const filterMatches = () => {
    let filtered = matches

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (match) =>
          match.player1?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          match.player2?.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((match) => match.status === statusFilter)
    }

    // Tournament filter
    if (tournamentFilter !== "all") {
      filtered = filtered.filter((match) => match.tournament_id.toString() === tournamentFilter)
    }

    setFilteredMatches(filtered)
  }

  const fetchMatches = async () => {
    try {
      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select("*")
        .order("scheduled_date", { ascending: false })

      if (matchesError) throw matchesError

      const { data: usersData, error: usersError } = await supabase.from("users").select("id, name")
      if (usersError) throw usersError

      const matchesWithPlayers = (matchesData || []).map((match: any) => {
        const player1 = usersData?.find((u: any) => u.id === match.player1_id)
        const player2 = usersData?.find((u: any) => u.id === match.player2_id)
        return {
          ...match,
          player1: player1 || { name: "Usuario no encontrado" },
          player2: player2 || { name: "Usuario no encontrado" },
        }
      })

      setMatches(matchesWithPlayers)
    } catch (error: any) {
      console.error("Error fetching matches:", error)
      throw error
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from("users").select("id, name, role").eq("active", true).order("name")
      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      throw error
    }
  }

  const fetchTournamentUsers = async (tournamentId: string, categoryId: string) => {
    try {
      if (!tournamentId || !categoryId) {
        setUsers([])
        return
      }

      const { data, error } = await supabase
        .from("tournament_participants")
        .select(`
        user_id,
        users!inner(id, name, role, active)
      `)
        .eq("tournament_id", Number.parseInt(tournamentId))
        .eq("category_id", Number.parseInt(categoryId))
        .eq("users.active", true)
        .eq("users.role", "player")

      if (error) throw error

      const tournamentUsers = (data || []).map((participant: any) => participant.users)
      setUsers(tournamentUsers)
    } catch (error) {
      console.error("Error fetching tournament users:", error)
      setUsers([])
    }
  }

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase.from("tournaments").select("*").eq("active", true).order("name")
      if (error) throw error
      setTournaments(data || [])
    } catch (error) {
      console.error("Error fetching tournaments:", error)
      throw error
    }
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from("categories").select("*").eq("active", true).order("name")
      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage("")

    try {
      if (editingMatch) {
        const { error } = await supabase
          .from("matches")
          .update({
            tournament_id: Number.parseInt(formData.tournament_id),
            category_id: Number.parseInt(formData.category_id),
            player1_id: formData.player1_id,
            player2_id: formData.player2_id,
            scheduled_date: formData.scheduled_date,
            venue: formData.venue || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingMatch.id)

        if (error) throw error
        setMessage("Partido actualizado exitosamente")
      } else {
        const { error } = await supabase.from("matches").insert({
          tournament_id: Number.parseInt(formData.tournament_id),
          category_id: Number.parseInt(formData.category_id),
          player1_id: formData.player1_id,
          player2_id: formData.player2_id,
          scheduled_date: formData.scheduled_date,
          venue: formData.venue || null,
          status: "scheduled",
          player1_confirmed: false,
          player2_confirmed: false,
          result_player1_sets: 0,
          result_player2_sets: 0,
          result_player1_games: 0,
          result_player2_games: 0,
        })

        if (error) throw error
        setMessage("Partido creado exitosamente")
      }

      await fetchMatches()
      resetForm()
      setIsCreateModalOpen(false)
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      tournament_id: "",
      category_id: "",
      player1_id: "",
      player2_id: "",
      scheduled_date: "",
      venue: "",
    })
    setEditingMatch(null)
  }

  const handleEdit = (match: Match) => {
    setEditingMatch(match)
    setFormData({
      tournament_id: match.tournament_id.toString(),
      category_id: match.category_id.toString(),
      player1_id: match.player1_id,
      player2_id: match.player2_id,
      scheduled_date: match.scheduled_date ? new Date(match.scheduled_date).toISOString().slice(0, 16) : "",
      venue: match.venue || "",
    })
    setIsCreateModalOpen(true)
  }

  const handleLoadResult = (match: Match) => {
    setSelectedMatch(match)
    setIsResultModalOpen(true)
  }

  const handleEditResult = (match: Match) => {
    setSelectedMatch(match)
    setIsEditResultModalOpen(true)
  }

  const handleResultSaved = () => {
    setIsResultModalOpen(false)
    setIsEditResultModalOpen(false)
    setSelectedMatch(null)
    fetchMatches()
    setMessage("Resultado guardado exitosamente")
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: "Programado", variant: "outline" as const, color: "text-blue-600" },
      confirmed: { label: "Confirmado", variant: "default" as const, color: "text-green-600" },
      played: { label: "Jugado", variant: "secondary" as const, color: "text-gray-600" },
      cancelled: { label: "Cancelado", variant: "destructive" as const, color: "text-red-600" },
      walkover: { label: "WO", variant: "destructive" as const, color: "text-red-600" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: "outline" as const,
      color: "text-gray-600",
    }

    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const getTournamentName = (tournamentId: number) => {
    const tournament = tournaments.find((t: any) => t.id === tournamentId)
    return tournament ? tournament.name : "Torneo no encontrado"
  }

  const getCategoryName = (categoryId: number) => {
    const category = categories.find((c: any) => c.id === categoryId)
    return category ? category.name : "Categoría no encontrada"
  }

  const handleDeleteMatch = async (matchId: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este partido?")) {
      return
    }

    try {
      const { error } = await supabase.from("matches").delete().eq("id", matchId)

      if (error) throw error

      await fetchMatches()
      setMessage("Partido eliminado exitosamente")
    } catch (error: any) {
      setMessage(`Error al eliminar partido: ${error.message}`)
    }
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
                    <Trophy className="h-10 w-10 mr-4" />
                    Gestión de Partidos
                  </h1>
                  <p className="text-tennis-white opacity-90 text-lg">Administra los partidos de la liga profesional</p>
                  <div className="flex items-center space-x-6 mt-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5" />
                      <span className="font-semibold">{matches.length} Partidos Total</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span className="font-semibold">Liga Profesional</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    resetForm()
                    setIsCreateModalOpen(true)
                  }}
                  className="tennis-btn-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Partido
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Alert Messages */}
        {message && (
          <div className="tennis-slide-up">
            <Alert
              className={`tennis-alert ${message.includes("Error") ? "tennis-alert-error" : "tennis-alert-success"}`}
            >
              <AlertDescription className="text-base font-medium">{message}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Filters */}
        <div className="tennis-slide-up">
          <Card className="tennis-card">
            <CardHeader className="border-b border-tennis-gray-light">
              <CardTitle className="flex items-center space-x-2 text-tennis-gray-dark">
                <Filter className="h-5 w-5 text-tennis-green" />
                <span>Filtros y Búsqueda</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-tennis-gray-dark">Buscar Jugadores</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-tennis-gray" />
                    <Input
                      placeholder="Nombre del jugador..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-tennis-gray-dark">Estado</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="scheduled">Programados</SelectItem>
                      <SelectItem value="confirmed">Confirmados</SelectItem>
                      <SelectItem value="played">Jugados</SelectItem>
                      <SelectItem value="cancelled">Cancelados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-tennis-gray-dark">Torneo</label>
                  <Select value={tournamentFilter} onValueChange={setTournamentFilter}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los torneos</SelectItem>
                      {tournaments.map((tournament: any) => (
                        <SelectItem key={tournament.id} value={tournament.id.toString()}>
                          {tournament.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-tennis-gray-dark">Resultados</label>
                  <div className="text-sm text-tennis-gray bg-tennis-gray-light px-3 py-2 rounded-lg">
                    {filteredMatches.length} de {matches.length} partidos
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="tennis-spinner"></div>
          </div>
        )}

        {/* Matches List */}
        {!isLoading && (
          <div className="tennis-slide-up">
            <Card className="tennis-card">
              <CardHeader className="border-b border-tennis-gray-light">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <div>
                    <CardTitle className="text-2xl font-bold text-tennis-gray-dark flex items-center space-x-3">
                      <Trophy className="h-6 w-6 text-tennis-green" />
                      <span>Lista de Partidos</span>
                    </CardTitle>
                    <CardDescription className="text-tennis-gray mt-2">
                      {filteredMatches.length} partidos mostrados
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-tennis-green text-white border-tennis-green">
                    Sistema Profesional
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filteredMatches.length === 0 ? (
                  <div className="text-center py-16">
                    <Trophy className="h-16 w-16 text-tennis-gray mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-tennis-gray-dark mb-2">No hay partidos</h3>
                    <p className="text-tennis-gray mb-6">
                      {matches.length === 0
                        ? "No hay partidos registrados en el sistema"
                        : "No se encontraron partidos con los filtros aplicados"}
                    </p>
                    <Button className="tennis-btn-primary" onClick={() => setIsCreateModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Primer Partido
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Jugadores</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Torneo</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                            Resultado
                          </th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                            Confirmación
                          </th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMatches.map((match) => (
                          <tr key={match.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-3 py-2">
                              <div className="text-xs">
                                <div className="font-medium text-gray-900">
                                  {match.scheduled_date
                                    ? new Date(match.scheduled_date).toLocaleDateString("es-ES", {
                                        day: "2-digit",
                                        month: "2-digit",
                                      })
                                    : "-"}
                                </div>
                                <div className="text-gray-500">
                                  {match.scheduled_date
                                    ? new Date(match.scheduled_date).toLocaleTimeString("es-ES", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "-"}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="text-xs">
                                <div className="font-medium text-gray-900 truncate max-w-32">{match.player1?.name}</div>
                                <div className="text-gray-500">vs</div>
                                <div className="font-medium text-gray-900 truncate max-w-32">{match.player2?.name}</div>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <span className="text-xs font-medium text-gray-900 truncate max-w-24 block">
                                {getTournamentName(match.tournament_id)}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <span className="text-xs font-medium text-gray-900 truncate max-w-20 block">
                                {getCategoryName(match.category_id)}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center">{getStatusBadge(match.status)}</td>
                            <td className="px-3 py-2 text-center">
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
                            <td className="px-3 py-2 text-center">
                              <div className="flex justify-center space-x-1">
                                {match.player1_confirmed ? (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-red-500" />
                                )}
                                {match.player2_confirmed ? (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-red-500" />
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <div className="flex justify-center space-x-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => handleEdit(match)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>

                                {match.status === "played" ? (
                                  <Button
                                    size="sm"
                                    className="tennis-btn-primary h-6 px-2 text-xs"
                                    onClick={() => handleEditResult(match)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    className="tennis-btn-primary h-6 px-2 text-xs"
                                    onClick={() => handleLoadResult(match)}
                                  >
                                    <Trophy className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => handleDeleteMatch(match.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Create/Edit Match Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title={editingMatch ? "Editar Partido" : "Crear Nuevo Partido"}
          size="md"
        >
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tournament">Torneo</Label>
              <Select
                value={formData.tournament_id}
                onValueChange={(value) => setFormData({ ...formData, tournament_id: value })}
              >
                <SelectTrigger className="bg-white border-2 border-gray-200">
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
              <Label htmlFor="category">Categoría</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger className="bg-white border-2 border-gray-200">
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
              <Label htmlFor="player1">Jugador 1</Label>
              <Select
                value={formData.player1_id}
                onValueChange={(value) => setFormData({ ...formData, player1_id: value })}
              >
                <SelectTrigger className="bg-white border-2 border-gray-200">
                  <SelectValue placeholder="Seleccionar jugador 1" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter((user: any) => user.role === "player")
                    .map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="player2">Jugador 2</Label>
              <Select
                value={formData.player2_id}
                onValueChange={(value) => setFormData({ ...formData, player2_id: value })}
              >
                <SelectTrigger className="bg-white border-2 border-gray-200">
                  <SelectValue placeholder="Seleccionar jugador 2" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter((user: any) => user.role === "player" && user.id !== formData.player1_id)
                    .map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_date">Fecha y Hora</Label>
              <Input
                id="scheduled_date"
                type="datetime-local"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                required
                className="bg-white border-2 border-gray-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue">Cancha/Lugar</Label>
              <Input
                id="venue"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                placeholder="Ej: Cancha 1, Club Central"
                className="bg-white border-2 border-gray-200"
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="tennis-btn-primary w-full">
              {isSubmitting ? (
                <div className="tennis-loading">
                  <div className="tennis-spinner" />
                  <span>Guardando...</span>
                </div>
              ) : editingMatch ? (
                "Actualizar Partido"
              ) : (
                "Crear Partido"
              )}
            </Button>
          </form>
        </Modal>

        {/* Load Result Modal */}
        {selectedMatch && (
          <Modal
            isOpen={isResultModalOpen}
            onClose={() => setIsResultModalOpen(false)}
            title="Cargar Resultado del Partido"
            size="lg"
          >
            <MatchResultForm
              match={{
                id: selectedMatch.id,
                player1: { id: selectedMatch.player1_id, name: selectedMatch.player1?.name || "" },
                player2: { id: selectedMatch.player2_id, name: selectedMatch.player2?.name || "" },
              }}
              onSave={handleResultSaved}
              onCancel={() => setIsResultModalOpen(false)}
            />
          </Modal>
        )}

        {/* Edit Result Modal */}
        <EditResultModal
          match={
            selectedMatch
              ? {
                  id: selectedMatch.id,
                  player1: { id: selectedMatch.player1_id, name: selectedMatch.player1?.name || "" },
                  player2: { id: selectedMatch.player2_id, name: selectedMatch.player2?.name || "" },
                  result_player1_sets: selectedMatch.result_player1_sets,
                  result_player2_sets: selectedMatch.result_player2_sets,
                  result_player1_games: selectedMatch.result_player1_games,
                  result_player2_games: selectedMatch.result_player2_games,
                  winner_id: selectedMatch.winner_id,
                  notes: selectedMatch.notes,
                }
              : null
          }
          isOpen={isEditResultModalOpen}
          onClose={() => setIsEditResultModalOpen(false)}
          onSave={handleResultSaved}
        />
      </div>
    </div>
  )
}
