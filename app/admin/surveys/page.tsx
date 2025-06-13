"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import MainNav from "@/components/layout/main-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, Users, CheckCircle, XCircle, CalendarIcon } from "lucide-react"
import { generateMatches } from "@/lib/utils/match-maker"

interface AvailabilitySurvey {
  id: number
  tournament_id: number
  category_id: number
  week_start_date: string
  week_end_date: string
  survey_date: string
  status: "open" | "closed"
  created_at: string
  tournament?: { name: string }
  category?: { name: string }
  _responses_count?: number
}

export default function SurveysManagement() {
  const [surveys, setSurveys] = useState<AvailabilitySurvey[]>([])
  const [tournaments, setTournaments] = useState([])
  const [categories, setCategories] = useState([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isGeneratingMatches, setIsGeneratingMatches] = useState(false)
  const [formData, setFormData] = useState({
    tournament_id: "",
    category_id: "",
    week_start_date: "",
    week_end_date: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchSurveys()
    fetchTournaments()
    fetchCategories()
  }, [])

  const fetchSurveys = async () => {
    try {
      const { data, error } = await supabase
        .from("availability_surveys")
        .select(
          `
          *,
          tournament:tournaments(name),
          category:categories(name)
        `,
        )
        .order("created_at", { ascending: false })

      if (error) throw error

      // Obtener conteo de respuestas para cada encuesta
      const surveysWithResponses = await Promise.all(
        (data || []).map(async (survey) => {
          const { count } = await supabase
            .from("survey_responses")
            .select("*", { count: "exact", head: true })
            .eq("survey_id", survey.id)

          return {
            ...survey,
            _responses_count: count || 0,
          }
        }),
      )

      setSurveys(surveysWithResponses)
    } catch (error) {
      console.error("Error fetching surveys:", error)
    }
  }

  const fetchTournaments = async () => {
    const { data } = await supabase.from("tournaments").select("*").eq("active", true).order("name")
    setTournaments(data || [])
  }

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").eq("active", true).order("name")
    setCategories(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage("")

    try {
      const { error } = await supabase.from("availability_surveys").insert({
        tournament_id: Number.parseInt(formData.tournament_id),
        category_id: Number.parseInt(formData.category_id),
        week_start_date: formData.week_start_date,
        week_end_date: formData.week_end_date,
        survey_date: new Date().toISOString(),
        status: "open",
      })

      if (error) throw error
      setMessage("Encuesta creada exitosamente")

      fetchSurveys()
      resetForm()
      setIsDialogOpen(false)
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
      week_start_date: "",
      week_end_date: "",
    })
  }

  const handleCloseSurvey = async (surveyId: number) => {
    try {
      const { error } = await supabase.from("availability_surveys").update({ status: "closed" }).eq("id", surveyId)

      if (error) throw error
      setMessage("Encuesta cerrada exitosamente")
      fetchSurveys()
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    }
  }

  const handleGenerateMatches = async (surveyId: number) => {
    setIsGeneratingMatches(true)
    setMessage("")

    try {
      // Generar partidos usando la función del match-maker
      const matches = await generateMatches(surveyId)

      // Guardar los partidos generados
      if (matches.length > 0) {
        const { error } = await supabase.from("matches").insert(matches)
        if (error) throw error

        setMessage(`Se generaron ${matches.length} partidos exitosamente`)
      } else {
        setMessage("No se pudieron generar partidos con las disponibilidades actuales")
      }
    } catch (error: any) {
      console.error("Error generating matches:", error)
      setMessage(`Error: ${error.message}`)
    } finally {
      setIsGeneratingMatches(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNav />

      <div className="max-w-7xl mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Encuestas de Disponibilidad</h1>
            <p className="text-gray-600">Gestiona las encuestas semanales para programar partidos</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Nueva Encuesta</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Crear Nueva Encuesta</DialogTitle>
                <DialogDescription>Configura la encuesta de disponibilidad semanal</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tournament">Torneo</Label>
                  <Select
                    value={formData.tournament_id}
                    onValueChange={(value) => setFormData({ ...formData, tournament_id: value })}
                  >
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
                  <Label htmlFor="category">Categoría</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
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
                  <Label htmlFor="week_start_date">Fecha de inicio de semana</Label>
                  <Input
                    id="week_start_date"
                    type="date"
                    value={formData.week_start_date}
                    onChange={(e) => setFormData({ ...formData, week_start_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="week_end_date">Fecha de fin de semana</Label>
                  <Input
                    id="week_end_date"
                    type="date"
                    value={formData.week_end_date}
                    onChange={(e) => setFormData({ ...formData, week_end_date: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "Creando..." : "Crear Encuesta"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {message && (
          <Alert className="mb-6">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {surveys.map((survey) => (
            <Card key={survey.id} className={survey.status === "open" ? "border-green-500" : ""}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
                    {survey.tournament?.name} - {survey.category?.name}
                  </CardTitle>
                  <Badge variant={survey.status === "open" ? "default" : "secondary"}>
                    {survey.status === "open" ? "Abierta" : "Cerrada"}
                  </Badge>
                </div>
                <CardDescription>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDate(survey.week_start_date)} - {formatDate(survey.week_end_date)}
                    </span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                    <span>Creada: {formatDate(survey.created_at)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>{survey._responses_count} respuestas</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  {survey.status === "open" ? (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleCloseSurvey(survey.id)}
                      disabled={survey._responses_count === 0}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cerrar Encuesta
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      className="flex-1"
                      onClick={() => handleGenerateMatches(survey.id)}
                      disabled={isGeneratingMatches || survey._responses_count === 0}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isGeneratingMatches ? "Generando..." : "Generar Partidos"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
