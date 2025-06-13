import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculateRanking } from '../ranking'

vi.mock('../../supabase/server', () => {
  const mockMatches = [
    {
      id: 1,
      tournament_id: 1,
      category_id: 1,
      player1_id: 'user1',
      player2_id: 'user2',
      status: 'played',
      player1_confirmed: true,
      player2_confirmed: true,
      result_player1_sets: 2,
      result_player2_sets: 1,
      result_player1_games: 12,
      result_player2_games: 8,
      winner_id: 'user1',
      created_at: '',
      updated_at: ''
    },
    {
      id: 2,
      tournament_id: 1,
      category_id: 1,
      player1_id: 'user3',
      player2_id: 'user1',
      status: 'played',
      player1_confirmed: true,
      player2_confirmed: true,
      result_player1_sets: 2,
      result_player2_sets: 0,
      result_player1_games: 12,
      result_player2_games: 4,
      winner_id: 'user3',
      created_at: '',
      updated_at: ''
    }
  ]

  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockResolvedValue({ data: mockMatches, error: null })
  }
  return {
    supabaseAdmin: {
      from: vi.fn().mockReturnValue(chain)
    }
  }
})

describe('calculateRanking', () => {
  it('computes ranking stats for a user', async () => {
    const ranking = await calculateRanking(1, 1, 'user1')
    expect(ranking).toEqual({
      matches_played: 2,
      matches_won: 1,
      matches_lost: 1,
      sets_won: 2,
      sets_lost: 3,
      games_won: 16,
      games_lost: 20,
      points: 3,
      average: 3 / 8
    })
  })
})
