export interface User {
  id: string
  email: string
  name: string
  phone?: string
  birth_date?: string
  role: "admin" | "player"
  category?: string
  team_id?: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface Team {
  id: number
  name: string
  color: string
  created_at: string
}

export interface Category {
  id: number
  name: string
  description?: string
  active: boolean
  created_at: string
}

export interface Tournament {
  id: number
  name: string
  start_date: string
  end_date?: string
  active: boolean
  created_at: string
}

export interface AvailabilitySurvey {
  id: number
  tournament_id: number
  category_id: number
  week_start_date: string
  week_end_date: string
  survey_date: string
  status: "open" | "closed"
  created_at: string
}

export interface SurveyResponse {
  id: number
  survey_id: number
  user_id: string
  available_dates: string[]
  notes?: string
  created_at: string
}

export interface Match {
  id: number
  tournament_id: number
  category_id: number
  player1_id: string
  player2_id: string
  scheduled_date?: string
  venue?: string
  status: "scheduled" | "confirmed" | "played" | "cancelled" | "walkover"
  player1_confirmed: boolean
  player2_confirmed: boolean
  result_player1_sets: number
  result_player2_sets: number
  result_player1_games: number
  result_player2_games: number
  winner_id?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface MatchSet {
  id: number
  match_id: number
  set_number: number
  player1_games: number
  player2_games: number
  created_at: string
}

export interface Ranking {
  id: number
  tournament_id: number
  category_id: number
  user_id: string
  matches_played: number
  matches_won: number
  matches_lost: number
  sets_won: number
  sets_lost: number
  games_won: number
  games_lost: number
  points: number
  average: number
  position?: number
  last_updated: string
}

export interface TeamRanking {
  id: number
  tournament_id: number
  team_id: number
  total_points: number
  matches_played: number
  matches_won: number
  position?: number
  last_updated: string
}
