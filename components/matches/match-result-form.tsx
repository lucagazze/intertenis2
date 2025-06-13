"use client"

import type React from "react"
import { useState } from "react"

interface MatchResultFormProps {
  match: any // Replace 'any' with a more specific type if possible
  onSave: () => void
  onCancel: () => void
}

const MatchResultForm: React.FC<MatchResultFormProps> = ({ match, onSave, onCancel }) => {
  const [team1Score, setTeam1Score] = useState<number>(0)
  const [team2Score, setTeam2Score] = useState<number>(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (team1Score < 0 || team2Score < 0) {
      alert("Scores cannot be negative.")
      return
    }

    // Simulate saving the match result (replace with actual API call)
    console.log("Saving match result:", {
      matchId: match.id,
      team1Score,
      team2Score,
    })

    // Call the onSave callback to notify the parent component
    onSave()

    // Actualizar rankings automáticamente después de cargar resultado
    try {
      await updateTournamentRankings(match.tournament_id, match.category_id)
    } catch (error) {
      console.error("Error updating rankings:", error)
    }
  }

  const updateTournamentRankings = async (tournamentId: number, categoryId: number) => {
    try {
      // Trigger ranking recalculation by calling the ranking update endpoint
      const response = await fetch("/api/update-rankings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tournamentId,
          categoryId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update rankings")
      }

      console.log("Rankings updated successfully")
    } catch (error) {
      console.error("Error updating rankings:", error)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="team1Score">Team 1 Score:</label>
        <input
          type="number"
          id="team1Score"
          value={team1Score}
          onChange={(e) => setTeam1Score(Number.parseInt(e.target.value))}
        />
      </div>
      <div>
        <label htmlFor="team2Score">Team 2 Score:</label>
        <input
          type="number"
          id="team2Score"
          value={team2Score}
          onChange={(e) => setTeam2Score(Number.parseInt(e.target.value))}
        />
      </div>
      <button type="submit">Save Result</button>
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </form>
  )
}

export default MatchResultForm
