"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import MainNav from "@/components/layout/main-nav"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Users, Send, UserPlus, Calendar, Trophy, Mail, Filter, Search } from "lucide-react"

export default function TournamentRegistrationsPage() {
  const [tournaments, setTournaments] = useState([])
  const [categories, setCategories] = useState([])
  const [users, setUsers] = useState([])
  const [surveys, setSurveys] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [selectedTournament, setSelectedTournament] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateSurveyModalOpen, setIsCreateSurveyModalOpen] = useState(false)
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")

  const [surveyForm, setSurveyForm] = useState({
    title: "",
    description: "",
    registration_deadline: "",
  })

  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (selectedTournament && selectedCategory) {
      fetchSurveyAndRegistrations()
    }
  }, [selectedTournament, selectedCategory])

  const fetchInitialData = async () => {
    try {
      // Fetch tournaments
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

      // Fetch users
      const { data: usersData } = await supabase
        .from("users")
        .select("*")
        .eq("role", "player")
        .eq("active", true)
        .order("name")

      setUsers(usersData || [])
    } catch (error) {
      console.error("Error fetching initial data:", error)
    }
  }

  const fetchSurveyAndRegistrations = async () => {
    try {
      // Fetch survey for this tournament/category
      const { data: surveyData } = await supabase
        .from("tournament_registration_surveys")
        .select("*")
        .eq("tournament_id", Number.parseInt(selectedTournament))
        .eq("category_id", Number.parseInt(selectedCategory))
        .maybeSingle()

      setSurveys(surveyData ? [surveyData] : [])

      // Fetch registrations
      const { data: registrationsData } = await supabase
        .from("tournament_registrations")
        .select(`
          *,
          users!inner(id, name, email)
        `)
        .eq("tournament_id", Number.parseInt(selectedTournament))
        .eq("category_id", Number.parseInt(selectedCategory))
        .order("registered_at", { ascending: false })

      setRegistrations(registrationsData || [])
    } catch (error) {
      console.error("Error fetching survey and registrations:", error)
    }
  }

  const createSurvey = async () => {
    setIsSubmitting(true)
    try {
      const { error } = await supabase.from("tournament_registration_surveys").insert({
        tournament_id: Number.parseInt(selectedTournament),
        category_id: Number.parseInt(selectedCategory),
        title: surveyForm.title,
        description: surveyForm.description,
        registration_deadline: surveyForm.registration_deadline,
        questions: [
          {
            id: "available_days",
            type: "checkbox",
            question: "¿Qué días de la semana tienes disponible para jugar?",
            options: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
            required: true,
          },
          {
            id: "preferred_times",
            type: "checkbox",
            question: "¿En qué horarios prefieres jugar?",
            options: ["Mañana (8:00-12:00)", "Tarde (12:00-18:00)", "Noche (18:00-22:00)"],
            required: true,
          },
          {
            id: "experience_level",
            type: "select",
            question: "¿Cuál es tu nivel de experiencia?",
            options: ["Principiante", "Intermedio", "Avanzado", "Profesional"],
            required: true,
          },
          {
            id: "additional_info",
            type: "textarea",
            question: "Información adicional o comentarios",
            required: false,
          },
        ],
        status: "open",
      })

      if (error) throw error

      setMessage("Encuesta de inscripción creada exitosamente")
      setIsCreateSurveyModalOpen(false)
      setSurveyForm({ title: "", description: "", registration_deadline: "" })
      fetchSurveyAndRegistrations()
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addPlayersDirectly = async () => {
    setIsSubmitting(true)
    try {
      const survey = surveys[0]
      if (!survey) {
        throw new Error("Primero debes crear una encuesta de inscripción")
      }

      const registrationsToInsert = selectedUsers.map((userId) => ({
        survey_id: survey.id,
        tournament_id: Number.parseInt(selectedTournament),
        category_id: Number.parseInt(selectedCategory),
        user_id: userId,
        registration_type: "admin",
        available_days: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
        preferred_times: ["Tarde (12:00-18:00)", "Noche (18:00-22:00)"],
        status: "confirmed",
        registered_by: "",
      }))

      const { data: authData } = await supabase.auth.getUser()
      const userId = authData?.user?.id

      const registrationsToInsertWithUserId = registrationsToInsert.map((reg) => ({
        ...reg,
        registered_by: userId,
      }))

      const { error } = await supabase.from("tournament_registrations").insert(registrationsToInsertWithUserId)

      if (error) throw error

      setMessage(`${selectedUsers.length} jugadores agregados exitosamente`)
      setIsAddPlayerModalOpen(false)
      setSelectedUsers([])
      fetchSurveyAndRegistrations()
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const sendSurveyNotification = async () => {
    // En una implementación real, aquí enviarías emails o notificaciones
    setMessage("Notificaciones de encuesta enviadas a todos los jugadores de la categoría")
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const getAvailableUsers = () => {
    const registeredUserIds = registrations.map((r: any) => r.user_id)
    return users.filter(
      (user: any) =>
        user.category === selectedCategory &&
        !registeredUserIds.includes(user.id) &&
        user.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
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
                    <Trophy className="h-10 w-10 mr-4" />
                    Inscripciones al Torneo
                  </h1>
                  <p className="text-tennis-white opacity-90 text-lg">
                    Gestiona las inscripciones y encuestas para los torneos profesionales
                  </p>
                  <div className="flex items-center space-x-6 mt-4">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span className="font-semibold">Sistema Profesional</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5" />
                      <span className="font-semibold">Gestión Completa</span>
                    </div>
                  </div>
                </div>
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

        {/* Tournament and Category Selection */}
        <div className="tennis-slide-up">
          <Card className="tennis-card">
            <CardHeader className="border-b border-tennis-gray-light">
              <CardTitle className="flex items-center space-x-2 text-tennis-gray-dark">
                <Filter className="h-5 w-5 text-tennis-green" />
                <span>Selección de Torneo y Categoría</span>
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
            {/* Survey Management */}
            <div className="tennis-slide-up">
              <Card className="tennis-card">
                <CardHeader className="border-b border-tennis-gray-light">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div>
                      <CardTitle className="text-2xl font-bold text-tennis-gray-dark flex items-center space-x-3">
                        <Mail className="h-6 w-6 text-tennis-green" />
                        <span>Encuesta de Inscripción</span>
                      </CardTitle>
                      <CardDescription className="text-tennis-gray mt-2">
                        {getTournamentName()} - {getCategoryName()}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      {surveys.length === 0 ? (
                        <Button onClick={() => setIsCreateSurveyModalOpen(true)} className="tennis-btn-primary">
                          <Plus className="h-4 w-4 mr-2" />
                          Crear Encuesta
                        </Button>
                      ) : (
                        <>
                          <Button onClick={sendSurveyNotification} className="tennis-btn-secondary">
                            <Send className="h-4 w-4 mr-2" />
                            Enviar Notificaciones
                          </Button>
                          <Button onClick={() => setIsAddPlayerModalOpen(true)} className="tennis-btn-primary">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Agregar Jugadores
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {surveys.length > 0 ? (
                    <div className="space-y-4">
                      <div className="bg-tennis-gray-light p-4 rounded-lg">
                        <h3 className="font-bold text-tennis-gray-dark mb-2">{surveys[0].title}</h3>
                        <p className="text-tennis-gray mb-3">{surveys[0].description}</p>
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-tennis-green" />
                            <span>
                              Fecha límite: {new Date(surveys[0].registration_deadline).toLocaleDateString("es-ES")}
                            </span>
                          </div>
                          <Badge variant={surveys[0].status === "open" ? "default" : "secondary"}>
                            {surveys[0].status === "open" ? "Abierta" : "Cerrada"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Mail className="h-16 w-16 text-tennis-gray mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-tennis-gray-dark mb-2">
                        No hay encuesta de inscripción
                      </h3>
                      <p className="text-tennis-gray mb-6">
                        Crea una encuesta para que los jugadores se puedan inscribir al torneo
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Registrations List */}
            <div className="tennis-slide-up">
              <Card className="tennis-card">
                <CardHeader className="border-b border-tennis-gray-light">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div>
                      <CardTitle className="text-2xl font-bold text-tennis-gray-dark flex items-center space-x-3">
                        <Users className="h-6 w-6 text-tennis-green" />
                        <span>Jugadores Inscritos</span>
                      </CardTitle>
                      <CardDescription className="text-tennis-gray mt-2">
                        {registrations.length} jugadores registrados
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {registrations.length === 0 ? (
                    <div className="text-center py-16">
                      <Users className="h-16 w-16 text-tennis-gray mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-tennis-gray-dark mb-2">No hay inscripciones</h3>
                      <p className="text-tennis-gray">Los jugadores aparecerán aquí cuando se inscriban al torneo</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jugador</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tipo</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                              Estado
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Días Disponibles
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Horarios
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Fecha</th>
                          </tr>
                        </thead>
                        <tbody>
                          {registrations.map((registration: any) => (
                            <tr key={registration.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-tennis-gradient rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-xs">
                                      {registration.users.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900">{registration.users.name}</div>
                                    <div className="text-xs text-gray-500">{registration.users.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Badge variant={registration.registration_type === "admin" ? "default" : "outline"}>
                                  {registration.registration_type === "admin" ? "Admin" : "Encuesta"}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Badge
                                  variant={
                                    registration.status === "confirmed"
                                      ? "default"
                                      : registration.status === "registered"
                                        ? "secondary"
                                        : "destructive"
                                  }
                                >
                                  {registration.status === "confirmed"
                                    ? "Confirmado"
                                    : registration.status === "registered"
                                      ? "Registrado"
                                      : "Cancelado"}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-xs">
                                  {registration.available_days?.slice(0, 3).join(", ")}
                                  {registration.available_days?.length > 3 && "..."}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-xs">{registration.preferred_times?.slice(0, 2).join(", ")}</div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="text-xs text-gray-500">
                                  {new Date(registration.registered_at).toLocaleDateString("es-ES")}
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
          </>
        )}

        {/* Create Survey Modal */}
        <Modal
          isOpen={isCreateSurveyModalOpen}
          onClose={() => setIsCreateSurveyModalOpen(false)}
          title="Crear Encuesta de Inscripción"
          size="md"
        >
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título de la Encuesta</Label>
              <Input
                id="title"
                value={surveyForm.title}
                onChange={(e) => setSurveyForm({ ...surveyForm, title: e.target.value })}
                placeholder={`Inscripción al ${getTournamentName()}`}
                className="tennis-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={surveyForm.description}
                onChange={(e) => setSurveyForm({ ...surveyForm, description: e.target.value })}
                placeholder="Describe el proceso de inscripción y lo que necesitas saber de los jugadores"
                className="tennis-input"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Fecha Límite de Inscripción</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={surveyForm.registration_deadline}
                onChange={(e) => setSurveyForm({ ...surveyForm, registration_deadline: e.target.value })}
                className="tennis-input"
              />
            </div>

            <div className="pt-4">
              <Button onClick={createSurvey} disabled={isSubmitting} className="tennis-btn-primary w-full">
                {isSubmitting ? (
                  <div className="tennis-loading">
                    <div className="tennis-spinner" />
                    <span>Creando...</span>
                  </div>
                ) : (
                  "Crear Encuesta"
                )}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Add Players Modal */}
        <Modal
          isOpen={isAddPlayerModalOpen}
          onClose={() => setIsAddPlayerModalOpen(false)}
          title="Agregar Jugadores Directamente"
          size="lg"
        >
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar Jugadores</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-tennis-gray" />
                <Input
                  id="search"
                  placeholder="Buscar por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 tennis-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Jugadores Disponibles ({getCategoryName()})</Label>
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                {getAvailableUsers().map((user: any) => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-3 p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => toggleUserSelection(user.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedUsers.length > 0 && (
              <div className="bg-tennis-gray-light p-3 rounded-lg">
                <p className="text-sm font-medium text-tennis-gray-dark">
                  {selectedUsers.length} jugadores seleccionados
                </p>
              </div>
            )}

            <div className="pt-4">
              <Button
                onClick={addPlayersDirectly}
                disabled={isSubmitting || selectedUsers.length === 0}
                className="tennis-btn-primary w-full"
              >
                {isSubmitting ? (
                  <div className="tennis-loading">
                    <div className="tennis-spinner" />
                    <span>Agregando...</span>
                  </div>
                ) : (
                  `Agregar ${selectedUsers.length} Jugadores`
                )}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}
