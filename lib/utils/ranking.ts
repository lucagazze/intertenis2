import { supabaseAdmin } from "../supabase/server"
import type { Match } from "../types"

export async function calculateRanking(tournamentId: number, categoryId: number, userId: string) {
  // Obtener todos los partidos del usuario
  const { data: matches, error } = await supabaseAdmin
    .from("matches")
    .select("*")
    .eq("tournament_id", tournamentId)
    .eq("category_id", categoryId)
    .eq("status", "played")
    .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)

  if (error || !matches) {
    throw new Error("Error fetching matches")
  }

  let matchesPlayed = 0
  let matchesWon = 0
  let matchesLost = 0
  let setsWon = 0
  let setsLost = 0
  let gamesWon = 0
  let gamesLost = 0

  matches.forEach((match: Match) => {
    matchesPlayed++

    const isPlayer1 = match.player1_id === userId
    const userSets = isPlayer1 ? match.result_player1_sets : match.result_player2_sets
    const opponentSets = isPlayer1 ? match.result_player2_sets : match.result_player1_sets
    const userGames = isPlayer1 ? match.result_player1_games : match.result_player2_games
    const opponentGames = isPlayer1 ? match.result_player2_games : match.result_player1_games

    setsWon += userSets
    setsLost += opponentSets
    gamesWon += userGames
    gamesLost += opponentGames

    if (match.winner_id === userId) {
      matchesWon++
    } else {
      matchesLost++
    }
  })

  // Calcular puntos según criterios de la liga
  const points = matchesWon * 3 // 3 puntos por partido ganado

  // Calcular promedio (puntos/partidos, mínimo 8 partidos)
  const divisor = Math.max(matchesPlayed, 8)
  const average = points / divisor

  return {
    matches_played: matchesPlayed,
    matches_won: matchesWon,
    matches_lost: matchesLost,
    sets_won: setsWon,
    sets_lost: setsLost,
    games_won: gamesWon,
    games_lost: gamesLost,
    points,
    average,
  }
}

export async function updateAllRankings(tournamentId: number, categoryId: number) {
  // Obtener todos los usuarios de la categoría
  const { data: users, error: usersError } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("category", categoryId)
    .eq("active", true)

  if (usersError || !users) {
    throw new Error("Error fetching users")
  }

  const rankings = []

  for (const user of users) {
    const rankingData = await calculateRanking(tournamentId, categoryId, user.id)
    rankings.push({
      tournament_id: tournamentId,
      category_id: categoryId,
      user_id: user.id,
      ...rankingData,
      last_updated: new Date().toISOString(),
    })
  }

  // Ordenar por criterios de la liga
  rankings.sort((a, b) => {
    // 1. Promedio
    if (a.average !== b.average) return b.average - a.average

    // 2. Diferencial de partidos
    const aDiff = a.matches_won - a.matches_lost
    const bDiff = b.matches_won - b.matches_lost
    if (aDiff !== bDiff) return bDiff - aDiff

    // 3. Diferencial de sets
    const aSetsDiff = a.sets_won - a.sets_lost
    const bSetsDiff = b.sets_won - b.sets_lost
    if (aSetsDiff !== bSetsDiff) return bSetsDiff - aSetsDiff

    // 4. Diferencial de games
    const aGamesDiff = a.games_won - a.games_lost
    const bGamesDiff = b.games_won - b.games_lost
    return bGamesDiff - aGamesDiff
  })

  // Asignar posiciones
  rankings.forEach((ranking, index) => {
    ranking.position = index + 1
  })

  // Actualizar en la base de datos
  for (const ranking of rankings) {
    await supabaseAdmin.from("rankings").upsert(ranking, {
      onConflict: "tournament_id,category_id,user_id",
    })
  }

  return rankings
}
