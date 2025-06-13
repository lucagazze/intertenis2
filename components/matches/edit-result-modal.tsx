"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trophy, Save, RotateCcw } from "lucide-react"

interface Match {
  id: number
  player1: { id: string; name: string }
  player2: { id: string; name: string }
  result_player1_sets: number
  result_player2_sets: number
  result_player1_games: number
  result_player2_games: number
  winner_id?: string
  notes?: string
}

interface EditResultModalProps {
  match: Match | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export default function EditResultModal({ match, isOpen, onClose, onSave }: EditResultModalProps) {
  const [sets, setSets] = useState([
    { player1: 0, player2: 0 },
    { player1: 0, player2: 0 },
    { player1: 0, player2: 0 },
  ])
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (match && isOpen) {
      // Load existing match sets
      loadMatchSets()
      setNotes(match.notes || "")
    }
  }, [match, isOpen])

  const loadMatchSets = async () => {
    if (!match) return

    try {
      const { data: matchSets, error } = await supabase
        .from("match_sets")
        .select("*")
        .eq("match_id", match.id)
        .order("set_number")

      if (error) throw error

      if (matchSets && matchSets.length > 0) {
        const loadedSets = matchSets.map((set: any) => ({
          player1: set.player1_games,
          player2: set.player2_games,
        }))

        // Fill remaining sets with zeros
        while (loadedSets.length < 3) {
          loadedSets.push({ player1: 0, player2: 0 })
        }

        setSets(loadedSets)
      } else {
        // If no sets data, try to reconstruct from match totals
        const totalSets1 = match.result_player1_sets
        const totalSets2 = match.result_player2_sets

        if (totalSets1 > 0 || totalSets2 > 0) {
          // Simple reconstruction - distribute games evenly
          const avgGames1 = Math.floor(match.result_player1_games / Math.max(totalSets1 + totalSets2, 1))
          const avgGames2 = Math.floor(match.result_player2_games / Math.max(totalSets1 + totalSets2, 1))

          const reconstructedSets = []
          for (let i = 0; i < Math.max(totalSets1 + totalSets2, 2); i++) {
            if (i < totalSets1) {
              reconstructedSets.push({ player1: Math.max(avgGames1, 6), player2: Math.min(avgGames2, 5) })
            } else if (i < totalSets1 + totalSets2) {
              reconstructedSets.push({ player1: Math.min(avgGames1, 5), player2: Math.max(avgGames2, 6) })
            }
          }

          while (reconstructedSets.length < 3) {
            reconstructedSets.push({ player1: 0, player2: 0 })
          }

          setSets(reconstructedSets)
        }
      }
    } catch (error) {
      console.error("Error loading match sets:", error)
    }
  }

  const handleSetChange = (setIndex: number, player: "player1" | "player2", value: string) => {
    const numValue = Number.parseInt(value) || 0
    setSets((prev) => prev.map((set, index) => (index === setIndex ? { ...set, [player]: numValue } : set)))
  }

  const calculateWinner = () => {
    let player1Sets = 0
    let player2Sets = 0

    sets.forEach((set) => {
      if (set.player1 > 0 || set.player2 > 0) {
        if (set.player1 > set.player2) player1Sets++
        else if (set.player2 > set.player1) player2Sets++
      }
    })

    if (player1Sets > player2Sets) return match?.player1.id
    if (player2Sets > player1Sets) return match?.player2.id
    return null
  }

  const calculateTotals = () => {
    let player1Sets = 0
    let player2Sets = 0
    let player1Games = 0
    let player2Games = 0

    sets.forEach((set) => {
      if (set.player1 > 0 || set.player2 > 0) {
        player1Games += set.player1
        player2Games += set.player2

        if (set.player1 > set.player2) player1Sets++
        else if (set.player2 > set.player1) player2Sets++
      }
    })

    return { player1Sets, player2Sets, player1Games, player2Games }
  }

  const handleSubmit = async () => {
    if (!match) return

    setIsSubmitting(true)
    setError("")

    try {
      const totals = calculateTotals()
      const winnerId = calculateWinner()

      if (!winnerId) {
        setError("Debe haber un ganador claro")
        return
      }

      // Update the match
      const { error: matchError } = await supabase
        .from("matches")
        .update({
          result_player1_sets: totals.player1Sets,
          result_player2_sets: totals.player2Sets,
          result_player1_games: totals.player1Games,
          result_player2_games: totals.player2Games,
          winner_id: winnerId,
          notes: notes.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", match.id)

      if (matchError) throw matchError

      // Delete existing sets
      await supabase.from("match_sets").delete().eq("match_id", match.id)

      // Save new sets
      const setsToSave = sets
        .filter((set) => set.player1 > 0 || set.player2 > 0)
        .map((set, index) => ({
          match_id: match.id,
          set_number: index + 1,
          player1_games: set.player1,
          player2_games: set.player2,
        }))

      if (setsToSave.length > 0) {
        const { error: setsError } = await supabase.from("match_sets").insert(setsToSave)
        if (setsError) throw setsError
      }

      onSave()
      onClose()
    } catch (err: any) {
      setError(`Error al guardar el resultado: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setSets([
      { player1: 0, player2: 0 },
      { player1: 0, player2: 0 },
      { player1: 0, player2: 0 },
    ])
    setNotes("")
    setError("")
  }

  if (!match) return null

  const totals = calculateTotals()
  const winner = calculateWinner()

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Resultado del Partido" size="lg">
      <div className="p-6 space-y-6">
        {/* Match Info */}
        <div className="text-center p-4 bg-tennis-gray-light rounded-lg">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <Trophy className="h-6 w-6 text-tennis-green" />
            <h3 className="text-xl font-bold text-tennis-gray-dark">
              {match.player1.name} vs {match.player2.name}
            </h3>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Sets Input */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Resultado por sets:</Label>

          {sets.map((set, index) => (
            <div key={index} className="grid grid-cols-5 gap-4 items-center">
              <Label className="text-sm font-medium">Set {index + 1}:</Label>

              <div className="space-y-1">
                <Label className="text-xs text-tennis-gray">{match.player1.name}</Label>
                <Input
                  type="number"
                  min="0"
                  max="7"
                  value={set.player1}
                  onChange={(e) => handleSetChange(index, "player1", e.target.value)}
                  className="text-center bg-white border-2 border-gray-200 focus:border-tennis-green"
                />
              </div>

              <div className="text-center text-sm text-tennis-gray font-medium">vs</div>

              <div className="space-y-1">
                <Label className="text-xs text-tennis-gray">{match.player2.name}</Label>
                <Input
                  type="number"
                  min="0"
                  max="7"
                  value={set.player2}
                  onChange={(e) => handleSetChange(index, "player2", e.target.value)}
                  className="text-center bg-white border-2 border-gray-200 focus:border-tennis-green"
                />
              </div>

              <div className="text-sm font-medium text-tennis-gray-dark">
                {set.player1 > set.player2
                  ? match.player1.name.split(" ")[0]
                  : set.player2 > set.player1
                    ? match.player2.name.split(" ")[0]
                    : "-"}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-tennis-gray-light p-4 rounded-lg">
          <h4 className="font-medium mb-3 text-tennis-gray-dark">Resumen del Partido:</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="font-semibold text-tennis-gray-dark">{match.player1.name}:</p>
              <p>Sets ganados: {totals.player1Sets}</p>
              <p>Games totales: {totals.player1Games}</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-tennis-gray-dark">{match.player2.name}:</p>
              <p>Sets ganados: {totals.player2Sets}</p>
              <p>Games totales: {totals.player2Games}</p>
            </div>
          </div>
          {winner && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="font-medium text-green-700">
                🏆 Ganador: {winner === match.player1.id ? match.player1.name : match.player2.name}
              </p>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-base font-medium">
            Notas adicionales (opcional):
          </Label>
          <Textarea
            id="notes"
            placeholder="Comentarios sobre el partido, incidencias, etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="bg-white border-2 border-gray-200 focus:border-tennis-green"
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-4 border-t border-gray-200">
          <Button onClick={handleSubmit} disabled={isSubmitting || !winner} className="flex-1 tennis-btn-primary">
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="tennis-spinner mr-2" />
                <span>Guardando...</span>
              </div>
            ) : (
              <div className="flex items-center">
                <Save className="h-4 w-4 mr-2" />
                <span>Guardar Resultado</span>
              </div>
            )}
          </Button>
          <Button onClick={resetForm} variant="outline" className="tennis-btn-outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reiniciar
          </Button>
          <Button onClick={onClose} variant="outline" className="tennis-btn-outline">
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
