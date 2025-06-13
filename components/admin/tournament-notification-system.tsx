"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Send, Users, Mail, CheckCircle, Clock } from "lucide-react"

interface NotificationSystemProps {
  tournamentId: number
  categoryId: number
  onNotificationSent?: () => void
}

export default function TournamentNotificationSystem({
  tournamentId,
  categoryId,
  onNotificationSent,
}: NotificationSystemProps) {
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [notificationsSent, setNotificationsSent] = useState(false)

  useEffect(() => {
    fetchCategoryUsers()
  }, [categoryId])

  const fetchCategoryUsers = async () => {
    try {
      const { data: usersData } = await supabase
        .from("users")
        .select("id, name, email, category")
        .eq("category", categoryId.toString())
        .eq("role", "player")
        .eq("active", true)
        .order("name")

      setUsers(usersData || [])
    } catch (error) {
      console.error("Error fetching category users:", error)
    }
  }

  const sendNotifications = async () => {
    setIsLoading(true)
    setMessage("")

    try {
      // En una implementación real, aquí enviarías emails
      // Por ahora, simularemos el envío y mostraremos un mensaje

      // Simular delay de envío
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setNotificationsSent(true)
      setMessage(`Encuestas enviadas exitosamente a ${users.length} jugadores de la categoría`)

      if (onNotificationSent) {
        onNotificationSent()
      }
    } catch (error: any) {
      setMessage(`Error al enviar notificaciones: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="tennis-card">
      <CardHeader className="border-b border-tennis-gray-light">
        <CardTitle className="flex items-center space-x-2 text-tennis-gray-dark">
          <Mail className="h-5 w-5 text-tennis-green" />
          <span>Sistema de Notificaciones</span>
        </CardTitle>
        <CardDescription>Envía la encuesta de inscripción a todos los jugadores de la categoría</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {message && (
          <Alert className={`mb-4 ${message.includes("Error") ? "border-red-500" : "border-green-500"}`}>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-tennis-green" />
              <span className="font-medium">Jugadores objetivo:</span>
            </div>
            <Badge variant="outline">{users.length} jugadores</Badge>
          </div>

          <div className="bg-tennis-gray-light p-4 rounded-lg">
            <h4 className="font-medium mb-2">Vista previa de destinatarios:</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {users.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center space-x-2 text-sm">
                  <div className="w-6 h-6 bg-tennis-gradient rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">{user.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <span>{user.name}</span>
                  <span className="text-tennis-gray">({user.email})</span>
                </div>
              ))}
              {users.length > 5 && <div className="text-sm text-tennis-gray">... y {users.length - 5} más</div>}
            </div>
          </div>

          <div className="pt-4">
            {notificationsSent ? (
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Notificaciones enviadas</span>
              </div>
            ) : (
              <Button
                onClick={sendNotifications}
                disabled={isLoading || users.length === 0}
                className="tennis-btn-primary w-full"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 animate-spin" />
                    <span>Enviando notificaciones...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Send className="h-4 w-4" />
                    <span>Enviar Encuestas a {users.length} Jugadores</span>
                  </div>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
