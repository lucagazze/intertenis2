import { supabaseAdmin } from "../supabase/server"
import type { SurveyResponse, Match } from "../types"

interface MatchCriteria {
  sameDay: boolean
  alreadyPlayed: boolean
  categoryMatch: boolean
  teamBalance: boolean
}

export async function generateMatches(surveyId: number): Promise<Match[]> {
  // Obtener respuestas de la encuesta
  const { data: responses, error } = await supabaseAdmin
    .from("survey_responses")
    .select(`
      *,
      users!inner(*)
    `)
    .eq("survey_id", surveyId)

  if (error || !responses) {
    throw new Error("Error fetching survey responses")
  }

  // Obtener información de la encuesta
  const { data: survey } = await supabaseAdmin.from("availability_surveys").select("*").eq("id", surveyId).single()

  if (!survey) {
    throw new Error("Survey not found")
  }

  const matches: Partial<Match>[] = []
  const usedPlayers = new Set<string>()

  // Agrupar jugadores por días disponibles
  const playersByDay: { [key: string]: SurveyResponse[] } = {}

  responses.forEach((response: any) => {
    response.available_dates.forEach((date: string) => {
      if (!playersByDay[date]) {
        playersByDay[date] = []
      }
      playersByDay[date].push(response)
    })
  })

  // Generar partidos para cada día
  for (const [date, players] of Object.entries(playersByDay)) {
    const availablePlayers = players.filter((p) => !usedPlayers.has(p.user_id))

    // Crear parejas
    for (let i = 0; i < availablePlayers.length - 1; i++) {
      for (let j = i + 1; j < availablePlayers.length; j++) {
        const player1 = availablePlayers[i]
        const player2 = availablePlayers[j]

        // Verificar criterios
        const criteria = await checkMatchCriteria(
          player1.user_id,
          player2.user_id,
          survey.tournament_id,
          survey.category_id,
        )

        if (criteria.categoryMatch && !criteria.alreadyPlayed) {
          matches.push({
            tournament_id: survey.tournament_id,
            category_id: survey.category_id,
            player1_id: player1.user_id,
            player2_id: player2.user_id,
            scheduled_date: new Date(date).toISOString(),
            status: "scheduled",
            player1_confirmed: false,
            player2_confirmed: false,
            result_player1_sets: 0,
            result_player2_sets: 0,
            result_player1_games: 0,
            result_player2_games: 0,
          })

          usedPlayers.add(player1.user_id)
          usedPlayers.add(player2.user_id)
          break
        }
      }
    }
  }

  return matches as Match[]
}

async function checkMatchCriteria(
  player1Id: string,
  player2Id: string,
  tournamentId: number,
  categoryId: number,
): Promise<MatchCriteria> {
  // Verificar si ya jugaron entre ellos
  const { data: previousMatches } = await supabaseAdmin
    .from("matches")
    .select("id")
    .eq("tournament_id", tournamentId)
    .eq("category_id", categoryId)
    .or(
      `and(player1_id.eq.${player1Id},player2_id.eq.${player2Id}),and(player1_id.eq.${player2Id},player2_id.eq.${player1Id})`,
    )

  // Obtener información de los jugadores
  const { data: players } = await supabaseAdmin
    .from("users")
    .select("category, team_id")
    .in("id", [player1Id, player2Id])

  const alreadyPlayed = (previousMatches?.length || 0) > 0
  const categoryMatch = players?.every((p) => p.category === categoryId) || false

  return {
    sameDay: true, // Ya filtrado por día
    alreadyPlayed,
    categoryMatch,
    teamBalance: true, // Implementar lógica de balance de equipos si es necesario
  }
}
