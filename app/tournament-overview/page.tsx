"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import MainNav from "@/components/layout/main-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Users, Calendar, BarChart3 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function TournamentOverviewPage() {
  const [tournaments, setTournaments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTournaments = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from("tournaments")
        .select("*, categories(name)")
        .order("start_date", { ascending: false })

      if (error) {
        console.error("Error fetching tournaments", error)
      } else {
        setTournaments(data)
      }
      setLoading(false)
    }
    fetchTournaments()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <div className="tennis-container py-8 space-y-8">
        <header className="page-header-background">
          <div className="decorative-circle-1"></div>
          <div className="decorative-circle-2"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-2 flex items-center">
              <Trophy className="mr-4 h-10 w-10" /> Vista de Torneos
            </h1>
            <p className="text-lg opacity-90">Explora los torneos activos y pasados de la liga.</p>
          </div>
        </header>

        {loading ? (
          <p>Cargando torneos...</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((tournament) => (
              <Card key={tournament.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <span>{tournament.name}</span>
                    <Badge variant={tournament.active ? "default" : "secondary"}>
                      {tournament.active ? "Activo" : "Finalizado"}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{tournament.categories?.name || "Varias categorías"}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground mb-4">{tournament.description}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>
                        {new Date(tournament.start_date).toLocaleDateString()} -{" "}
                        {new Date(tournament.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      <span>{tournament.max_participants || "Sin límite"} participantes</span>
                    </div>
                  </div>
                </CardContent>
                <div className="p-6 pt-0">
                  <Button asChild className="w-full">
                    <Link href={`/rankings?tournament=${tournament.id}`}>
                      <BarChart3 className="mr-2 h-4 w-4" /> Ver Rankings
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
