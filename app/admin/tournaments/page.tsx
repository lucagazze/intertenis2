"use client"

import { AlertDialogTrigger } from "@/components/ui/alert-dialog"

import type React from "react"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import MainNav from "@/components/layout/main-nav"
import AuthGuard from "@/components/auth/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Calendar, Trophy, Users, Trash2, Loader2, Info } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Tournament {
  id: number
  name: string
  start_date: string
  end_date?: string | null // Allow null for end_date
  active: boolean
  created_at: string
  category_id?: number | null // Allow null for category_id
}

interface Category {
  id: number
  name: string
}

function TournamentsManagement() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    start_date: "",
    end_date: "",
    active: false,
    category_id: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [tournamentStats, setTournamentStats] = useState<Record<number, any>>({})
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await Promise.all([fetchTournaments(), fetchCategories()])
    } catch (err) {
      // Error is handled within individual fetch functions
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (tournaments.length > 0 && !isLoading) {
      // Fetch stats only after tournaments are loaded
      fetchTournamentStats()
    }
  }, [tournaments, isLoading])

  const fetchCategories = async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("id, name")
        .eq("active", true)
        .order("name")

      if (categoriesError) throw categoriesError
      setCategories(categoriesData || [])
    } catch (err: any) {
      console.error("Error fetching categories:", err)
      setError("Error al cargar categorías. Por favor, intente nuevamente.")
    }
  }

  const fetchTournaments = async () => {
    try {
      // setIsLoading(true); // isLoading is handled by fetchInitialData
      const { data, error: tournamentsError } = await supabase
        .from("tournaments")
        .select("id, name, start_date, end_date, active, created_at, category_id")
        .order("start_date", { ascending: false })

      if (tournamentsError) throw tournamentsError
      setTournaments(data || [])
    } catch (err: any) {
      console.error("Error fetching tournaments:", err)
      setError("Error al cargar torneos. Por favor, intente nuevamente.")
    }
    // finally { setIsLoading(false); } // isLoading is handled by fetchInitialData
  }

  const fetchTournamentStats = async () => {
    const statsPromises = tournaments.map(async (tournament) => {
      try {
        const { count: matchesCount, error: matchesError } = await supabase
          .from("matches")
          .select("*", { count: "exact", head: true })
          .eq("tournament_id", tournament.id)
        if (matchesError) console.warn(`Error fetching matches count for tournament ${tournament.id}:`, matchesError)

        const { data: matchesData, error: playersError } = await supabase
          .from("matches")
          .select("player1_id, player2_id")
          .eq("tournament_id", tournament.id)
        if (playersError) console.warn(`Error fetching players for tournament ${tournament.id}:`, playersError)

        const uniquePlayers = new Set<string>()
        matchesData?.forEach((match) => {
          if (match.player1_id) uniquePlayers.add(match.player1_id)
          if (match.player2_id) uniquePlayers.add(match.player2_id)
        })

        return {
          id: tournament.id,
          matches: matchesCount || 0,
          players: uniquePlayers.size,
          // Categories stats can be complex if matches have their own category_id
          // For now, we use the tournament's category_id if present
          categories: tournament.category_id ? 1 : 0,
        }
      } catch (error) {
        console.error(`Error fetching stats for tournament ${tournament.id}:`, error)
        return { id: tournament.id, matches: 0, players: 0, categories: 0 }
      }
    })

    const resolvedStats = await Promise.all(statsPromises)
    const newTournamentStats = resolvedStats.reduce(
      (acc, stat) => {
        acc[stat.id] = stat
        return acc
      },
      {} as Record<number, any>,
    )

    setTournamentStats(newTournamentStats)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    const payload = {
      name: formData.name,
      start_date: formData.start_date,
      end_date: formData.end_date || null,
      active: formData.active,
      category_id: formData.category_id ? Number.parseInt(formData.category_id) : null,
    }

    try {
      let error
      if (editingTournament) {
        ;({ error } = await supabase.from("tournaments").update(payload).eq("id", editingTournament.id))
      } else {
        ;({ error } = await supabase.from("tournaments").insert(payload))
      }

      if (error) throw error

      setMessage({
        type: "success",
        text: editingTournament ? "Torneo actualizado exitosamente" : "Torneo creado exitosamente",
      })
      await fetchTournaments() // Refetch to get updated list including new/edited one
      resetForm()
      setIsDialogOpen(false)
    } catch (err: any) {
      setMessage({ type: "error", text: `Error: ${err.message}` })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: "", start_date: "", end_date: "", active: false, category_id: "" })
    setEditingTournament(null)
  }

  const handleEdit = (tournament: Tournament) => {
    setEditingTournament(tournament)
    setFormData({
      name: tournament.name,
      start_date: tournament.start_date ? new Date(tournament.start_date).toISOString().split("T")[0] : "",
      end_date: tournament.end_date ? new Date(tournament.end_date).toISOString().split("T")[0] : "",
      active: tournament.active,
      category_id: tournament.category_id?.toString() || "",
    })
    setMessage(null)
    setIsDialogOpen(true)
  }

  const handleToggleActive = async (tournament: Tournament) => {
    setIsSubmitting(true)
    setMessage(null)
    try {
      if (!tournament.active) {
        // If activating this tournament
        // Deactivate all other tournaments
        const { error: deactivateError } = await supabase
          .from("tournaments")
          .update({ active: false })
          .neq("id", tournament.id)
          .eq("active", true) // Only deactivate those that are currently active
        if (deactivateError) throw deactivateError
      }

      const { error } = await supabase
        .from("tournaments")
        .update({ active: !tournament.active })
        .eq("id", tournament.id)
      if (error) throw error

      await fetchTournaments()
      setMessage({
        type: "success",
        text: tournament.active
          ? `Torneo "${tournament.name}" desactivado.`
          : `Torneo "${tournament.name}" activado (otros torneos activos fueron desactivados).`,
      })
    } catch (err: any) {
      setMessage({ type: "error", text: `Error: ${err.message}` })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTournament = async (tournamentId: number) => {
    setIsDeleting(tournamentId)
    setMessage(null)
    try {
      // Order of deletion matters to respect foreign key constraints
      // Assuming 'matches' references 'tournaments', 'rankings' references 'tournaments' and 'users', etc.
      // 'survey_responses' references 'availability_surveys' and 'users'
      // 'availability_surveys' references 'tournaments' and 'categories'
      // 'tournament_registrations' references 'tournaments', 'categories', 'users'

      // 1. Delete survey responses related to surveys of this tournament
      const { data: surveysForTournament, error: surveysError } = await supabase
        .from("availability_surveys")
        .select("id")
        .eq("tournament_id", tournamentId)
      if (surveysError) throw surveysError
      if (surveysForTournament && surveysForTournament.length > 0) {
        const surveyIds = surveysForTournament.map((s) => s.id)
        await supabase.from("survey_responses").delete().in("survey_id", surveyIds)
      }

      // 2. Delete availability surveys
      await supabase.from("availability_surveys").delete().eq("tournament_id", tournamentId)

      // 3. Delete tournament registrations (replaces tournament_participants)
      await supabase.from("tournament_registrations").delete().eq("tournament_id", tournamentId)

      // 4. Delete rankings
      await supabase.from("rankings").delete().eq("tournament_id", tournamentId)

      // 5. Delete matches
      await supabase.from("matches").delete().eq("tournament_id", tournamentId)

      // 6. Finally delete the tournament
      const { error: tournamentDeleteError } = await supabase.from("tournaments").delete().eq("id", tournamentId)
      if (tournamentDeleteError) throw tournamentDeleteError

      await fetchTournaments()
      setMessage({ type: "success", text: "Torneo y todos sus datos asociados eliminados exitosamente." })
    } catch (err: any) {
      console.error("Error deleting tournament:", err)
      setMessage({ type: "error", text: `Error al eliminar torneo: ${err.message}` })
    } finally {
      setIsDeleting(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainNav />
        <div className="max-w-7xl mx-auto py-6 px-4 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto my-10" />
          <p className="text-xl font-semibold text-tennis-gray-dark">Cargando datos de torneos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainNav />
        <div className="max-w-7xl mx-auto py-6 px-4">
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchInitialData}>Reintentar Carga</Button>
        </div>
      </div>
    )
  }

  const activeTournaments = tournaments.filter((t) => t.active)
  const inactiveTournaments = tournaments.filter((t) => !t.active)

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNav />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Gestión de Torneos</h1>
              <p className="text-sm text-gray-500">Crea, edita y administra los torneos de la liga.</p>
            </div>
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open)
                if (!open) resetForm()
              }}
            >
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary-dark text-primary-foreground">
                  <Plus className="mr-2 h-5 w-5" />
                  Nuevo Torneo
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white rounded-lg shadow-xl sm:max-w-lg border-gray-200">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-gray-800">
                    {editingTournament ? "Editar Torneo" : "Crear Nuevo Torneo"}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-gray-500">
                    {editingTournament
                      ? "Modifica los detalles del torneo."
                      : "Completa la información para el nuevo torneo."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                  <div>
                    <Label htmlFor="name" className="font-medium text-gray-700">
                      Nombre del Torneo
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="mt-1 bg-white border-gray-300 focus:border-primary focus:ring-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category" className="font-medium text-gray-700">
                      Categoría del Torneo
                    </Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    >
                      <SelectTrigger className="mt-1 bg-white border-gray-300 focus:border-primary focus:ring-primary">
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin categoría específica</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date" className="font-medium text-gray-700">
                        Fecha de Inicio
                      </Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        required
                        className="mt-1 bg-white border-gray-300 focus:border-primary focus:ring-primary"
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_date" className="font-medium text-gray-700">
                        Fecha de Finalización (Opcional)
                      </Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        className="mt-1 bg-white border-gray-300 focus:border-primary focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 pt-2">
                    <Switch
                      id="active"
                      checked={formData.active}
                      onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                    />
                    <Label htmlFor="active" className="font-medium text-gray-700">
                      Torneo Activo
                    </Label>
                    <Info
                      className="h-4 w-4 text-gray-400 cursor-help"
                      title="Solo un torneo puede estar activo a la vez. Activar este desactivará otros."
                    />
                  </div>
                  <DialogFooter className="pt-4">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancelar
                      </Button>
                    </DialogClose>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-primary hover:bg-primary-dark text-primary-foreground"
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {isSubmitting ? "Guardando..." : editingTournament ? "Actualizar Torneo" : "Crear Torneo"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {message && (
          <Alert
            variant={message.type === "error" ? "destructive" : "default"}
            className="mb-6 transition-all duration-300"
          >
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-flex">
            <TabsTrigger value="all">Todos ({tournaments.length})</TabsTrigger>
            <TabsTrigger value="active">Activos ({activeTournaments.length})</TabsTrigger>
            <TabsTrigger value="inactive">Inactivos ({inactiveTournaments.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {tournaments.length === 0 && <p className="text-center text-gray-500 py-8">No hay torneos creados.</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments.map((tournament) => (
                <TournamentCardItem
                  key={tournament.id}
                  tournament={tournament}
                  stats={tournamentStats[tournament.id]}
                  onEdit={handleEdit}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDeleteTournament}
                  isDeleting={isDeleting === tournament.id}
                  categories={categories}
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="active">
            {activeTournaments.length === 0 && (
              <p className="text-center text-gray-500 py-8">No hay torneos activos.</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTournaments.map((tournament) => (
                <TournamentCardItem
                  key={tournament.id}
                  tournament={tournament}
                  stats={tournamentStats[tournament.id]}
                  onEdit={handleEdit}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDeleteTournament}
                  isDeleting={isDeleting === tournament.id}
                  categories={categories}
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="inactive">
            {inactiveTournaments.length === 0 && (
              <p className="text-center text-gray-500 py-8">No hay torneos inactivos.</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inactiveTournaments.map((tournament) => (
                <TournamentCardItem
                  key={tournament.id}
                  tournament={tournament}
                  stats={tournamentStats[tournament.id]}
                  onEdit={handleEdit}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDeleteTournament}
                  isDeleting={isDeleting === tournament.id}
                  categories={categories}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

interface TournamentCardItemProps {
  tournament: Tournament
  stats: any
  onEdit: (tournament: Tournament) => void
  onToggleActive: (tournament: Tournament) => void
  onDelete: (tournamentId: number) => void
  isDeleting: boolean
  categories: Category[]
}

function TournamentCardItem({
  tournament,
  stats,
  onEdit,
  onToggleActive,
  onDelete,
  isDeleting,
  categories,
}: TournamentCardItemProps) {
  const categoryName = categories.find((c) => c.id === tournament.category_id)?.name || "N/A"
  return (
    <Card
      className={`shadow-lg hover:shadow-xl transition-shadow duration-300 ${tournament.active ? "border-2 border-green-500 bg-green-50" : "bg-white"}`}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold text-gray-800 leading-tight">{tournament.name}</CardTitle>
          <Badge
            variant={tournament.active ? "default" : "outline"}
            className={tournament.active ? "bg-green-600 text-white" : ""}
          >
            {tournament.active ? "Activo" : "Inactivo"}
          </Badge>
        </div>
        <CardDescription className="text-xs text-gray-500 space-y-1 mt-1">
          <div className="flex items-center">
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            {new Date(tournament.start_date).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}{" "}
            -
            {tournament.end_date
              ? new Date(tournament.end_date).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "Abierto"}
          </div>
          <div className="flex items-center">
            <Trophy className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
            Categoría: {categoryName}
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-2 pb-4">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <StatDisplay
            icon={<Trophy className="h-4 w-4 text-amber-500" />}
            value={stats?.matches || 0}
            label="Partidos"
          />
          <StatDisplay
            icon={<Users className="h-4 w-4 text-blue-500" />}
            value={stats?.players || 0}
            label="Jugadores"
          />
          <StatDisplay
            icon={<Calendar className="h-4 w-4 text-purple-500" />}
            value={stats?.categories || 0}
            label="Categorías"
          />
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full professional-btn-outline"
            onClick={() => onEdit(tournament)}
          >
            <Edit className="h-4 w-4 mr-1.5" /> Editar
          </Button>
          <Button
            variant={tournament.active ? "secondary" : "default"}
            size="sm"
            className={`w-full ${tournament.active ? "professional-btn-secondary" : "professional-btn-primary"}`}
            onClick={() => onToggleActive(tournament)}
          >
            {tournament.active ? "Desactivar" : "Activar"}
          </Button>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              className="w-full professional-btn-destructive"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-white z-modal">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-600">¿Confirmar eliminación?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción es irreversible. Se eliminará el torneo "{tournament.name}" y todos sus datos asociados
                (partidos, inscripciones, rankings, etc.).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(tournament.id)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Sí, eliminar torneo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}

const StatDisplay = ({ icon, value, label }: { icon: React.ReactNode; value: number | string; label: string }) => (
  <div className="flex flex-col items-center p-2 bg-gray-100 rounded-md">
    <div className="mb-0.5">{icon}</div>
    <span className="font-bold text-sm text-gray-700">{value}</span>
    <span className="text-xs text-gray-500">{label}</span>
  </div>
)

export default function TournamentsAdminPage() {
  return (
    <AuthGuard adminOnly>
      <TournamentsManagement />
    </AuthGuard>
  )
}
