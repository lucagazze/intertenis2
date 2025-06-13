"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CalendarDays, CheckSquare, Edit } from "lucide-react" // Reemplazado Calendar con CalendarDays para más especificidad

interface AvailabilitySurveyInfo {
  id: number
  week_start_date: string // Todavía útil para el contexto del período de la encuesta
  week_end_date: string
  status: string
}

interface AvailabilitySurveyProps {
  categoryId: number
  tournamentId: number
  onComplete?: () => void
}

const daysOfWeek = [
  { id: "lunes", label: "Lunes" },
  { id: "martes", label: "Martes" },
  { id: "miercoles", label: "Miércoles" },
  { id: "jueves", label: "Jueves" },
  { id: "viernes", label: "Viernes" },
  { id: "sabado", label: "Sábado" },
  { id: "domingo", label: "Domingo" },
]

export default function AvailabilitySurvey({ categoryId, tournamentId, onComplete }: AvailabilitySurveyProps) {
  const [survey, setSurvey] = useState<AvailabilitySurveyInfo | null>(null)
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasResponded, setHasResponded] = useState(false)
  const [canEdit, setCanEdit] = useState(false)
  const [existingResponseId, setExistingResponseId] = useState<number | null>(null)
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchActiveSurvey()
  }, [categoryId, tournamentId])

  const fetchActiveSurvey = async () => {
    setIsLoading(true)
    try {
      const { data: surveyData, error: surveyError } = await supabase
        .from("availability_surveys")
        .select("*")
        .eq("category_id", categoryId)
        .eq("tournament_id", tournamentId)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (surveyError) {
        console.error("Error fetching survey:", surveyError)
        setMessage("Error al cargar la encuesta.")
        setSurvey(null)
        return
      }

      if (surveyData) {
        setSurvey(surveyData)
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const { data: response, error: responseError } = await supabase
            .from("survey_responses")
            .select("*")
            .eq("survey_id", surveyData.id)
            .eq("user_id", user.id)
            .maybeSingle()

          if (responseError) {
            console.error("Error checking survey response:", responseError)
          } else if (response) {
            setHasResponded(true)
            setCanEdit(false) // Por defecto no se puede editar una vez respondido
            setExistingResponseId(response.id)
            setSelectedDays(response.available_dates || [])
            setNotes(response.notes || "")
          }
        }
      } else {
        setSurvey(null)
        setMessage("No hay encuestas de disponibilidad activas para este torneo/categoría.")
      }
    } catch (error) {
      console.error("Error in fetchActiveSurvey:", error)
      setMessage("Ocurrió un error inesperado al cargar la encuesta.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDayToggle = (dayId: string) => {
    setSelectedDays((prev) => (prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]))
  }

  const handleSubmit = async () => {
    if (!survey) return
    setIsSubmitting(true)
    setMessage("")

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuario no autenticado")

      const responsePayload = {
        survey_id: survey.id,
        user_id: user.id,
        available_dates: selectedDays,
        notes: notes.trim() || null,
      }

      let error
      if (existingResponseId && canEdit) {
        // Solo actualiza si se permite editar
        const { error: updateError } = await supabase
          .from("survey_responses")
          .update(responsePayload)
          .eq("id", existingResponseId)
        error = updateError
      } else if (!existingResponseId) {
        const { error: insertError } = await supabase
          .from("survey_responses")
          .insert([{ ...responsePayload, created_at: new Date().toISOString() }])
        error = insertError
      } else {
        // Si ya respondió y no está en modo edición, no hacer nada o mostrar mensaje
        setMessage("Ya has respondido esta encuesta.")
        setIsSubmitting(false)
        return
      }

      if (error) throw error

      setHasResponded(true)
      setCanEdit(false) // Deshabilitar edición después de guardar
      setMessage(existingResponseId ? "Respuesta actualizada exitosamente." : "Respuesta guardada exitosamente.")

      // Refetch survey to get potentially new existingResponseId if it was a new submission
      const { data: latestResponse } = await supabase
        .from("survey_responses")
        .select("id")
        .eq("survey_id", survey.id)
        .eq("user_id", user.id)
        .single()
      if (latestResponse) {
        setExistingResponseId(latestResponse.id)
      }

      if (onComplete) {
        setTimeout(() => onComplete(), 500)
      }
    } catch (error: any) {
      console.error("Error saving survey response:", error)
      setMessage(`Error al guardar la respuesta: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditResponse = () => {
    setCanEdit(true)
    setHasResponded(false) // Permitir cambios en la UI
    setMessage("Puedes editar tu respuesta ahora.")
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          Cargando encuesta...
        </CardContent>
      </Card>
    )
  }

  if (!survey) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">{message || "No hay encuestas activas en este momento."}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-3 text-primary">
          <CalendarDays className="h-6 w-6" />
          <span>Disponibilidad Semanal</span>
        </CardTitle>
        <CardDescription>
          Indica tus días preferidos para jugar durante la semana del torneo.
          {survey.week_start_date &&
            ` (Referencia: ${new Date(survey.week_start_date).toLocaleDateString()} - ${new Date(survey.week_end_date).toLocaleDateString()})`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {message && (
          <Alert variant={message.startsWith("Error") ? "destructive" : "default"}>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <h4 className="font-semibold text-foreground">Días de la semana preferidos:</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {daysOfWeek.map((day) => (
              <div
                key={day.id}
                className="flex items-center space-x-2 p-2 border rounded-md hover:bg-muted transition-colors"
              >
                <Checkbox
                  id={day.id}
                  checked={selectedDays.includes(day.id)}
                  onCheckedChange={() => handleDayToggle(day.id)}
                  disabled={hasResponded && !canEdit}
                  className="form-checkbox h-5 w-5 text-primary rounded focus:ring-primary-dark"
                />
                <label
                  htmlFor={day.id}
                  className={`text-sm font-medium capitalize cursor-pointer ${hasResponded && !canEdit ? "text-muted-foreground" : "text-foreground"}`}
                >
                  {day.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="notes" className="text-sm font-medium text-foreground">
            Notas adicionales (opcional):
          </label>
          <Textarea
            id="notes"
            placeholder="Ej: 'Prefiero jugar por la tarde', 'No puedo antes de las 18hs los lunes', etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={hasResponded && !canEdit}
            className="min-h-[80px] focus:border-primary focus:ring-primary-dark"
          />
        </div>

        {(!hasResponded || canEdit) && (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedDays.length === 0}
            className="w-full bg-primary hover:bg-primary-dark text-primary-foreground"
          >
            {isSubmitting ? "Guardando..." : canEdit ? "Actualizar Disponibilidad" : "Confirmar Disponibilidad"}
          </Button>
        )}

        {hasResponded && !canEdit && (
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-center text-green-700">
              <CheckSquare className="h-5 w-5 mr-2" />
              <p className="font-medium">¡Gracias! Tu disponibilidad ha sido registrada.</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleEditResponse} className="mt-3">
              <Edit className="h-4 w-4 mr-2" /> Editar mi respuesta
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
