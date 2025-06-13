"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, CheckCircle, XCircle, Loader2, Eye, Edit3 } from "lucide-react"

interface Player {
  name: string
  avatar_url?: string
}

interface Match {
  id: number
  scheduled_date: string
  venue?: string
  status: "scheduled" | "confirmed" | "played" | "cancelled" | "walkover"
  player1_confirmed: boolean
  player2_confirmed: boolean
  player1_id: string
  player2_id: string
  player1: Player
  player2: Player
  result_player1_sets?: number
  result_player2_sets?: number
  winner_id?: string
}

interface MatchCardProps {
  match: Match
  currentUserId: string
  onUpdate?: () => void
  onShowDetails?: () => void
  onEditResult?: (matchId: number) => void // Para admin
  isAdmin?: boolean
  className?: string
}

export default function MatchCard({
  match,
  currentUserId,
  onUpdate,
  onShowDetails,
  onEditResult,
  isAdmin = false,
  className = "",
}: MatchCardProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  const isPlayer1 = match.player1_id === currentUserId
  const isPlayer2 = match.player2_id === currentUserId
  const isParticipant = isPlayer1 || isPlayer2

  const userConfirmed = isParticipant ? (isPlayer1 ? match.player1_confirmed : match.player2_confirmed) : false
  const opponentConfirmed = isParticipant ? (isPlayer1 ? match.player2_confirmed : match.player1_confirmed) : false

  const getStatusInfo = () => {
    switch (match.status) {
      case "scheduled":
        return {
          label: "Programado",
          variant: "outline" as const,
          color: "border-blue-500 text-blue-600 bg-blue-500/10",
        }
      case "confirmed":
        return {
          label: "Confirmado",
          variant: "default" as const,
          color: "border-green-500 text-green-600 bg-green-500/10",
        }
      case "played":
        return { label: "Jugado", variant: "secondary" as const, color: "border-gray-500 text-gray-600 bg-gray-500/10" }
      case "cancelled":
        return {
          label: "Cancelado",
          variant: "destructive" as const,
          color: "border-red-500 text-red-600 bg-red-500/10",
        }
      case "walkover":
        return {
          label: "Walkover",
          variant: "destructive" as const,
          color: "border-orange-500 text-orange-600 bg-orange-500/10",
        }
      default:
        return {
          label: match.status,
          variant: "outline" as const,
          color: "border-gray-400 text-gray-500 bg-gray-400/10",
        }
    }
  }
  const statusInfo = getStatusInfo()

  const handleConfirm = async () => {
    if (!isParticipant || userConfirmed) return
    setIsConfirming(true)
    try {
      const updateField = isPlayer1 ? "player1_confirmed" : "player2_confirmed"
      const { error } = await supabase
        .from("matches")
        .update({ [updateField]: true })
        .eq("id", match.id)
      if (error) throw error
      onUpdate?.()
    } catch (error) {
      console.error("Error confirming match:", error)
      // Aquí podrías mostrar un toast de error
    } finally {
      setIsConfirming(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }),
      time: date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
    }
  }
  const { date, time } = formatDate(match.scheduled_date)

  const PlayerDisplay = ({ player, confirmed }: { player: Player; confirmed: boolean }) => (
    <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
      <Avatar className="h-10 w-10 border">
        <AvatarImage
          src={player.avatar_url || `https://avatar.vercel.sh/${player.name}.png?size=40`}
          alt={player.name}
        />
        <AvatarFallback>{player.name?.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <span className="flex-1 font-medium text-foreground truncate">{player.name}</span>
      {confirmed ? (
        <CheckCircle className="h-5 w-5 text-green-500" />
      ) : (
        <XCircle className="h-5 w-5 text-red-500 opacity-70" />
      )}
    </div>
  )

  return (
    <Card className={`professional-card overflow-hidden ${className}`}>
      <CardHeader className="p-4 sm:p-5 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg font-semibold text-foreground leading-tight">{date}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {time} {match.venue && `· ${match.venue}`}
              </CardDescription>
            </div>
          </div>
          <Badge variant={statusInfo.variant} className={`px-3 py-1 text-xs font-semibold ${statusInfo.color}`}>
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-around space-x-2 sm:space-x-4">
          <div className="flex flex-col items-center text-center w-[40%]">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 shadow-sm mb-2">
              <AvatarImage
                src={match.player1.avatar_url || `https://avatar.vercel.sh/${match.player1.name}.png?size=80`}
                alt={match.player1.name}
              />
              <AvatarFallback className="text-2xl">{match.player1.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <p className="font-semibold text-foreground truncate w-full">{match.player1.name}</p>
            {match.status === "played" && match.result_player1_sets !== undefined && (
              <p
                className={`text-2xl font-bold ${match.winner_id === match.player1_id ? "text-primary" : "text-muted-foreground"}`}
              >
                {match.result_player1_sets}
              </p>
            )}
          </div>

          <div className="text-muted-foreground font-bold text-xl sm:text-2xl">VS</div>

          <div className="flex flex-col items-center text-center w-[40%]">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 shadow-sm mb-2">
              <AvatarImage
                src={match.player2.avatar_url || `https://avatar.vercel.sh/${match.player2.name}.png?size=80`}
                alt={match.player2.name}
              />
              <AvatarFallback className="text-2xl">{match.player2.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <p className="font-semibold text-foreground truncate w-full">{match.player2.name}</p>
            {match.status === "played" && match.result_player2_sets !== undefined && (
              <p
                className={`text-2xl font-bold ${match.winner_id === match.player2_id ? "text-primary" : "text-muted-foreground"}`}
              >
                {match.result_player2_sets}
              </p>
            )}
          </div>
        </div>

        {match.status === "played" && match.winner_id && (
          <p className="text-center text-sm font-medium text-primary">
            Ganador: {match.winner_id === match.player1_id ? match.player1.name : match.player2.name}
          </p>
        )}

        {(match.status === "scheduled" || match.status === "confirmed") && (
          <div className="space-y-3 pt-3 border-t">
            <h4 className="text-sm font-semibold text-muted-foreground text-center">Estado de Confirmación</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <PlayerDisplay player={match.player1} confirmed={match.player1_confirmed} />
              <PlayerDisplay player={match.player2} confirmed={match.player2_confirmed} />
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 sm:p-5 bg-muted/30 flex flex-col sm:flex-row gap-3">
        {onShowDetails && (
          <Button
            variant="outline"
            size="sm"
            onClick={onShowDetails}
            className="w-full sm:w-auto professional-btn-outline"
          >
            <Eye className="mr-2 h-4 w-4" /> Ver Detalles
          </Button>
        )}
        {isParticipant && match.status === "scheduled" && !userConfirmed && (
          <Button
            onClick={handleConfirm}
            disabled={isConfirming}
            size="sm"
            className="w-full sm:w-auto professional-btn-primary"
          >
            {isConfirming ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            {isConfirming ? "Confirmando..." : "Confirmar Asistencia"}
          </Button>
        )}
        {isParticipant && match.status === "scheduled" && userConfirmed && (
          <Badge
            variant="default"
            className="w-full sm:w-auto justify-center bg-green-500/20 text-green-700 border-green-500 py-2 text-sm"
          >
            <CheckCircle className="mr-2 h-4 w-4" /> Tu asistencia está confirmada
          </Badge>
        )}
        {isAdmin && match.status !== "played" && onEditResult && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEditResult(match.id)}
            className="w-full sm:w-auto professional-btn-secondary"
          >
            <Edit3 className="mr-2 h-4 w-4" /> Cargar Resultado
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
