"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import MainNav from "@/components/layout/main-nav"
import RankingTable from "@/components/rankings/ranking-table"
import { Loader2, Trophy, ShieldAlert } from "lucide-react"
import type { Tournament as TournamentType, Category as CategoryType } from "@/lib/types"

interface EnrichedTournament extends TournamentType {
  categories: CategoryType // Asumiendo que la consulta anidada funciona
}

export default function TournamentsPage() {
  const [activeTournaments, setActiveTournaments] = useState<EnrichedTournament[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActiveTournamentsWithCategories = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data: tournamentsData, error: tournamentsError } = await supabase
        .from("tournaments")
        .select(`
          id,
          name,
          start_date,
          end_date,
          active,
          category_id,
          categories (id, name) 
        `) // El join anidado categories (id, name) es crucial
        .eq("active", true)
        .order("start_date", { ascending: false })

      if (tournamentsError) {
        console.error("Error fetching active tournaments:", tournamentsError)
        throw new Error(
          `Error al cargar torneos: ${tournamentsError.message}. Verifica la relación 'tournaments.category_id -> categories.id'.`,
        )
      }

      // Filtrar torneos que no tengan una categoría asociada (si categories es null)
      const validTournaments = (tournamentsData?.filter((t) => t.categories) as EnrichedTournament[]) || []
      setActiveTournaments(validTournaments)
    } catch (err: any) {
      console.error("Error in fetchActiveTournamentsWithCategories:", err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchActiveTournamentsWithCategories()
  }, [fetchActiveTournamentsWithCategories])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-tennis-cream to-tennis-white">
        <MainNav />
        <div className="tennis-container py-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-semibold text-tennis-gray-dark">Cargando Torneos Activos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-tennis-cream to-tennis-white">
        <MainNav />
        <div className="tennis-container py-8">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md" role="alert">
            <div className="flex">
              {" "}
              <div className="py-1">
                {" "}
                <ShieldAlert className="h-6 w-6 text-red-500 mr-3" />{" "}
              </div>{" "}
              <div>
                {" "}
                <p className="font-bold">Error al Cargar Torneos</p> <p className="text-sm">{error}</p>{" "}
              </div>{" "}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const pageTitle = "Clasificaciones de Torneos Activos"

  return (
    <div className="min-h-screen bg-gradient-to-br from-tennis-cream to-tennis-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
      <MainNav />
      <div className="tennis-container py-8 space-y-10">
        <header className="page-header-background rounded-lg shadow-xl">
          <div className="decorative-circle-1"></div> <div className="decorative-circle-2"></div>
          <div className="relative z-10 text-center sm:text-left">
            <h1 className="text-2xl lg:text-3xl font-bold mb-2 text-primary-foreground">{pageTitle}</h1>
            <p className="text-sm lg:text-base text-primary-foreground opacity-90">
              Visualiza las tablas de posiciones actualizadas de todos los torneos en curso.
            </p>
          </div>
        </header>

        {activeTournaments.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <Trophy className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-3">
              No hay torneos activos actualmente.
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Cuando haya torneos activos, sus clasificaciones aparecerán aquí.
            </p>
          </div>
        ) : (
          activeTournaments.map((tournament) => (
            <RankingTable
              key={`${tournament.id}-${tournament.categories.id}`}
              tournamentId={tournament.id}
              categoryId={tournament.categories.id} // Usar el ID de la categoría del torneo
              tournamentName={tournament.name}
              categoryName={tournament.categories.name}
              showTitle={false} // El título ya está en la tarjeta de RankingTable
            />
          ))
        )}
      </div>
    </div>
  )
}
