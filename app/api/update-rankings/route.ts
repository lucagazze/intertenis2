import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server" // Asegúrate que este use SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: NextRequest) {
  try {
    const { tournamentId, categoryId } = await request.json()

    if (!tournamentId || !categoryId) {
      return NextResponse.json({ error: "Tournament ID and Category ID are required" }, { status: 400 })
    }

    let usersForRanking: any[] = []
    try {
      // Intenta obtener participantes de la vista 'tournament_participants'
      const { data: participantsData, error: participantsError } = await supabaseAdmin
        .from("tournament_participants")
        .select(`user_id, users!inner(id, name, team_id, active, category)`)
        .eq("tournament_id", tournamentId)
        .eq("category_id", categoryId)
        .eq("users.active", true)

      if (participantsError) {
        console.warn("Error fetching from tournament_participants view, trying fallback:", participantsError.message)
      }

      if (participantsData && participantsData.length > 0) {
        usersForRanking = participantsData.map((p: any) => p.users)
      } else {
        // Fallback: obtener usuarios directamente de la tabla 'users' por categoría
        const { data: categoryUsersData, error: usersError } = await supabaseAdmin
          .from("users")
          .select("id, name, team_id, active, category")
          .eq("category", categoryId.toString()) // Asumiendo que category_id en users es string
          .eq("active", true)

        if (usersError) {
          console.error("Error fetching category users (fallback):", usersError)
          throw usersError
        }
        usersForRanking = categoryUsersData || []
      }
    } catch (error) {
      console.error("Error fetching users for ranking calculation:", error)
      return NextResponse.json({ error: "Error fetching tournament participants" }, { status: 500 })
    }

    if (usersForRanking.length === 0) {
      await supabaseAdmin.from("rankings").delete().eq("tournament_id", tournamentId).eq("category_id", categoryId)
      return NextResponse.json({
        success: true,
        message: "No active users found for this tournament/category to rank.",
        rankingsCount: 0,
      })
    }

    const { data: matchesData, error: matchesError } = await supabaseAdmin
      .from("matches")
      .select("*")
      .eq("tournament_id", tournamentId)
      .eq("category_id", categoryId)
      .eq("status", "played")

    if (matchesError) {
      console.error("Error fetching matches:", matchesError)
      return NextResponse.json({ error: "Error fetching matches" }, { status: 500 })
    }

    const userStats: Record<string, any> = {}
    usersForRanking.forEach((user: any) => {
      userStats[user.id] = {
        tournament_id: tournamentId,
        category_id: categoryId,
        user_id: user.id,
        position: 0,
        matches_played: 0,
        matches_won: 0,
        matches_lost: 0,
        sets_won: 0,
        sets_lost: 0,
        games_won: 0,
        games_lost: 0,
        points: 0,
        average: 0.0,
        last_updated: new Date().toISOString(),
      }
    })

    if (matchesData) {
      matchesData.forEach((match: any) => {
        const p1Id = match.player1_id
        const p2Id = match.player2_id
        const winnerId = match.winner_id

        if (!userStats[p1Id] || !userStats[p2Id]) {
          console.warn(`Skipping match ID ${match.id} (player not in ranking list)`)
          return
        }

        const p1Stats = userStats[p1Id]
        const p2Stats = userStats[p2Id]

        p1Stats.matches_played++
        p2Stats.matches_played++

        p1Stats.sets_won += match.result_player1_sets || 0
        p1Stats.sets_lost += match.result_player2_sets || 0
        p1Stats.games_won += match.result_player1_games || 0
        p1Stats.games_lost += match.result_player2_games || 0

        p2Stats.sets_won += match.result_player2_sets || 0
        p2Stats.sets_lost += match.result_player1_sets || 0
        p2Stats.games_won += match.result_player2_games || 0
        p2Stats.games_lost += match.result_player1_games || 0

        if (winnerId === p1Id) {
          p1Stats.matches_won++
          p2Stats.matches_lost++
        } else if (winnerId === p2Id) {
          p2Stats.matches_won++
          p1Stats.matches_lost++
        }
      })
    }

    Object.values(userStats).forEach((stats: any) => {
      stats.points = stats.matches_won * 3
      stats.average =
        stats.matches_played > 0 ? Number.parseFloat((stats.points / stats.matches_played).toFixed(3)) : 0.0
    })

    const rankingsArray = Object.values(userStats)
    rankingsArray.sort((a: any, b: any) => {
      if (a.points !== b.points) return b.points - a.points
      if (a.average !== b.average) return b.average - a.average
      const aMatchDiff = a.matches_won - a.matches_lost
      const bMatchDiff = b.matches_won - b.matches_lost
      if (aMatchDiff !== bMatchDiff) return bMatchDiff - aMatchDiff
      const aSetsDiff = a.sets_won - a.sets_lost
      const bSetsDiff = b.sets_won - b.sets_lost
      if (aSetsDiff !== bSetsDiff) return bSetsDiff - aSetsDiff
      const aGamesDiff = a.games_won - a.games_lost
      const bGamesDiff = b.games_won - b.games_lost
      if (aGamesDiff !== bGamesDiff) return bGamesDiff - aGamesDiff
      return (a.user_id || "").localeCompare(b.user_id || "")
    })

    rankingsArray.forEach((ranking: any, index) => {
      ranking.position = index + 1
    })

    const { error: deleteError } = await supabaseAdmin
      .from("rankings")
      .delete()
      .eq("tournament_id", tournamentId)
      .eq("category_id", categoryId)

    if (deleteError) {
      console.error("Error deleting old rankings:", deleteError)
      return NextResponse.json({ error: "Clearing old rankings failed" }, { status: 500 })
    }

    if (rankingsArray.length > 0) {
      const dataToInsert = rankingsArray.map((r) => ({
        tournament_id: r.tournament_id,
        category_id: r.category_id,
        user_id: r.user_id,
        position: r.position,
        matches_played: r.matches_played,
        matches_won: r.matches_won,
        matches_lost: r.matches_lost,
        sets_won: r.sets_won,
        sets_lost: r.sets_lost,
        games_won: r.games_won,
        games_lost: r.games_lost,
        points: r.points,
        average: r.average,
        last_updated: r.last_updated,
      }))
      const { error: insertError } = await supabaseAdmin.from("rankings").insert(dataToInsert)
      if (insertError) {
        console.error("Error inserting new rankings:", insertError)
        return NextResponse.json({ error: `Updating rankings failed: ${insertError.message}` }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Rankings updated (simple logic)",
      rankingsCount: rankingsArray.length,
    })
  } catch (error: any) {
    console.error("Critical error in update-rankings API:", error)
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 })
  }
}
