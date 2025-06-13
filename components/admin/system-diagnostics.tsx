"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, RefreshCw, Database } from "lucide-react"

export default function SystemDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)

  const runDiagnostics = async () => {
    setIsLoading(true)
    const results: any = {}

    try {
      // Test 1: Verificar conexión a base de datos
      const { data: testConnection } = await supabase.from("users").select("count").limit(1)
      results.connection = testConnection ? "✅ Conectado" : "❌ Error de conexión"

      // Test 2: Verificar tablas principales
      const tables = ["users", "tournaments", "matches", "categories", "rankings"]
      for (const table of tables) {
        try {
          const { count } = await supabase.from(table).select("*", { count: "exact", head: true })
          results[`table_${table}`] = `✅ ${count} registros`
        } catch (error) {
          results[`table_${table}`] = `❌ Error: ${error}`
        }
      }

      // Test 3: Verificar torneo activo
      const { data: activeTournament } = await supabase.from("tournaments").select("*").eq("active", true).maybeSingle()
      results.activeTournament = activeTournament ? `✅ ${activeTournament.name}` : "⚠️ No hay torneo activo"

      // Test 4: Verificar categorías
      const { data: categories } = await supabase.from("categories").select("*").eq("active", true)
      results.categories = `✅ ${categories?.length || 0} categorías activas`

      // Test 5: Verificar usuarios por categoría
      const categoryStats: any = {}
      if (categories) {
        for (const category of categories) {
          const { count } = await supabase
            .from("users")
            .select("*", { count: "exact", head: true })
            .eq("category", category.id.toString())
            .eq("active", true)
          categoryStats[category.name] = count || 0
        }
      }
      results.usersByCategory = categoryStats

      // Test 6: Verificar partidos jugados
      const { count: playedMatches } = await supabase
        .from("matches")
        .select("*", { count: "exact", head: true })
        .eq("status", "played")
      results.playedMatches = `✅ ${playedMatches} partidos jugados`

      setDiagnostics(results)
    } catch (error) {
      console.error("Error running diagnostics:", error)
      results.error = `❌ Error general: ${error}`
      setDiagnostics(results)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  return (
    <Card className="tennis-card">
      <CardHeader className="border-b border-tennis-gray-light">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2 text-tennis-gray-dark">
              <Database className="h-5 w-5 text-tennis-green" />
              <span>Diagnóstico del Sistema</span>
            </CardTitle>
            <CardDescription>Verificación del estado de la base de datos y funcionalidades</CardDescription>
          </div>
          <Button onClick={runDiagnostics} disabled={isLoading} className="tennis-btn-secondary">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {Object.entries(diagnostics).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-tennis-gray-light rounded-lg">
              <span className="font-medium capitalize">{key.replace(/_/g, " ")}:</span>
              <span className="text-sm">
                {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
              </span>
            </div>
          ))}

          {Object.keys(diagnostics).length === 0 && !isLoading && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>No se han ejecutado diagnósticos aún. Haz clic en "Actualizar".</AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-tennis-green mr-2" />
              <span>Ejecutando diagnósticos...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
