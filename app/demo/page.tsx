"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Trophy,
  Users,
  Calendar,
  Target,
  Star,
  Award,
  Crown,
  TrendingUp,
  CheckCircle,
  XCircle,
  Play,
  Edit,
  Plus,
  Filter,
  Search,
  Medal,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"

export default function DemoPage() {
  const [activeDemo, setActiveDemo] = useState("player")

  // Demo data
  const demoMatches = [
    {
      id: 1,
      opponent: "Carlos López",
      date: "2024-01-15",
      time: "10:00",
      venue: "Cancha 1",
      status: "pending_confirmation",
      confirmed: false,
    },
    {
      id: 2,
      opponent: "María García",
      date: "2024-01-17",
      time: "14:00",
      venue: "Cancha 2",
      status: "confirmed",
      confirmed: true,
    },
    {
      id: 3,
      opponent: "Juan Martín",
      date: "2024-01-12",
      time: "16:00",
      venue: "Cancha 3",
      status: "completed",
      result: "6-4, 3-6, 6-2",
      winner: true,
    },
  ]

  const demoRankings = [
    {
      position: 1,
      name: "Ana Rodríguez",
      matches: 12,
      wins: 10,
      losses: 2,
      points: 30,
      average: 2.5,
      team: "Equipo Rojo",
      teamColor: "#ef4444",
    },
    {
      position: 2,
      name: "Pedro Sánchez",
      matches: 11,
      wins: 9,
      losses: 2,
      points: 27,
      average: 2.45,
      team: "Equipo Azul",
      teamColor: "#3b82f6",
    },
    {
      position: 3,
      name: "Laura Fernández",
      matches: 10,
      wins: 8,
      losses: 2,
      points: 24,
      average: 2.4,
      team: "Equipo Verde",
      teamColor: "#22c55e",
    },
    {
      position: 4,
      name: "Miguel Torres",
      matches: 9,
      wins: 6,
      losses: 3,
      points: 18,
      average: 2.0,
      team: "Equipo Rojo",
      teamColor: "#ef4444",
    },
    {
      position: 5,
      name: "Carmen Ruiz",
      matches: 8,
      wins: 5,
      losses: 3,
      points: 15,
      average: 1.875,
      team: "Equipo Azul",
      teamColor: "#3b82f6",
    },
  ]

  const demoUsers = [
    {
      id: 1,
      name: "Ana Rodríguez",
      email: "ana@email.com",
      role: "player",
      category: "Primera",
      team: "Equipo Rojo",
      active: true,
    },
    {
      id: 2,
      name: "Pedro Sánchez",
      email: "pedro@email.com",
      role: "player",
      category: "Primera",
      team: "Equipo Azul",
      active: true,
    },
    {
      id: 3,
      name: "Laura Fernández",
      email: "laura@email.com",
      role: "admin",
      category: "Primera",
      team: "Equipo Verde",
      active: true,
    },
  ]

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return (
          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="font-bold text-gray-600 text-sm">{position}</span>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-tennis-cream to-tennis-white">
      {/* Navigation */}
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-3">
                <ArrowLeft className="h-5 w-5 text-tennis-gray" />
                <Trophy className="h-8 w-8 text-tennis-green" />
                <span className="text-xl font-bold text-tennis-gray-dark">Liga Intertenis - Demo</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-tennis-yellow text-tennis-gray-dark border-tennis-yellow">
                Modo Demo
              </Badge>
              <Link href="/login">
                <Button className="tennis-btn-primary">Acceder al Sistema</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-tennis-gray-dark mb-4">
            Demo Interactivo - Liga de Intertenis
          </h1>
          <p className="text-xl text-tennis-gray mb-6">
            Explora todas las funcionalidades desde la perspectiva de jugadores y administradores
          </p>

          {/* Demo Mode Selector */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-xl p-2 shadow-lg border border-gray-200">
              <Button
                variant={activeDemo === "player" ? "default" : "ghost"}
                onClick={() => setActiveDemo("player")}
                className={activeDemo === "player" ? "bg-tennis-green text-white" : ""}
              >
                <Users className="mr-2 h-4 w-4" />
                Vista de Jugador
              </Button>
              <Button
                variant={activeDemo === "admin" ? "default" : "ghost"}
                onClick={() => setActiveDemo("admin")}
                className={activeDemo === "admin" ? "bg-tennis-green text-white" : ""}
              >
                <Crown className="mr-2 h-4 w-4" />
                Vista de Administrador
              </Button>
            </div>
          </div>
        </div>

        {/* Player Demo */}
        {activeDemo === "player" && (
          <div className="space-y-8">
            {/* Player Header */}
            <div className="tennis-gradient rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-3 flex items-center">
                      <Users className="h-8 w-8 mr-4" />
                      ¡Hola, Ana Rodríguez!
                    </h2>
                    <p className="text-tennis-white opacity-90 text-lg">Bienvenida a tu dashboard personal</p>
                    <div className="flex items-center space-x-6 mt-4">
                      <div className="flex items-center space-x-2">
                        <Trophy className="h-5 w-5" />
                        <span className="font-semibold">Posición #1</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Target className="h-5 w-5" />
                        <span className="font-semibold">Categoría Primera</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Star className="h-5 w-5 text-tennis-yellow" />
                        <span className="font-semibold">10 victorias consecutivas</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Player Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="tennis-stats-card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-tennis-gray text-sm font-medium">Partidos Jugados</p>
                    <p className="text-3xl font-bold text-tennis-gray-dark">12</p>
                  </div>
                  <div className="w-12 h-12 bg-tennis-gradient rounded-xl flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex items-center text-sm text-tennis-gray">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>En esta temporada</span>
                </div>
              </div>

              <div className="tennis-stats-card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-tennis-gray text-sm font-medium">Efectividad</p>
                    <p className="text-3xl font-bold text-tennis-gray-dark">83%</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex items-center text-sm text-tennis-gray">
                  <Star className="h-4 w-4 mr-1" />
                  <span>10 victorias de 12</span>
                </div>
              </div>

              <div className="tennis-stats-card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-tennis-gray text-sm font-medium">Próximos Partidos</p>
                    <p className="text-3xl font-bold text-tennis-gray-dark">2</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex items-center text-sm text-tennis-gray">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Esta semana</span>
                </div>
              </div>

              <div className="tennis-stats-card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-tennis-gray text-sm font-medium">Racha Actual</p>
                    <p className="text-3xl font-bold text-tennis-gray-dark">5</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex items-center text-sm text-tennis-gray">
                  <Award className="h-4 w-4 mr-1" />
                  <span>Victorias consecutivas</span>
                </div>
              </div>
            </div>

            {/* Player Content */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Matches */}
              <div className="xl:col-span-2 space-y-6">
                <div className="flex items-center space-x-3">
                  <Trophy className="h-6 w-6 text-tennis-green" />
                  <h3 className="text-2xl font-bold text-tennis-gray-dark">Mis Partidos</h3>
                  <Badge variant="outline" className="bg-tennis-green text-white border-tennis-green">
                    {demoMatches.length} partidos
                  </Badge>
                </div>

                <div className="space-y-4">
                  {demoMatches.map((match) => (
                    <Card key={match.id} className="tennis-card">
                      <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-4 sm:space-y-0">
                          <div className="flex-1">
                            <div className="font-semibold text-lg text-tennis-gray-dark mb-2">vs {match.opponent}</div>
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm text-tennis-gray">
                              <span className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {new Date(match.date).toLocaleDateString("es-ES")}
                              </span>
                              <span className="flex items-center">
                                <Target className="h-4 w-4 mr-1" />
                                {match.time}
                              </span>
                              <span className="flex items-center">
                                <Trophy className="h-4 w-4 mr-1" />
                                {match.venue}
                              </span>
                            </div>
                            {match.result && (
                              <div className="mt-2">
                                <Badge
                                  variant={match.winner ? "default" : "destructive"}
                                  className={match.winner ? "bg-green-600" : ""}
                                >
                                  {match.winner ? "Victoria" : "Derrota"}: {match.result}
                                </Badge>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col space-y-2">
                            {match.status === "pending_confirmation" && (
                              <>
                                <Badge variant="outline" className="text-orange-600 border-orange-600">
                                  Pendiente Confirmación
                                </Badge>
                                <div className="flex space-x-2">
                                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Confirmar
                                  </Button>
                                  <Button size="sm" variant="outline" className="text-red-600 border-red-600">
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Declinar
                                  </Button>
                                </div>
                              </>
                            )}
                            {match.status === "confirmed" && (
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Confirmado
                              </Badge>
                            )}
                            {match.status === "completed" && (
                              <Badge variant="secondary">
                                <Trophy className="h-4 w-4 mr-1" />
                                Finalizado
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Mini Rankings */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <Award className="h-6 w-6 text-tennis-green" />
                  <h3 className="text-xl font-bold text-tennis-gray-dark">Mi Ranking</h3>
                </div>
                <Card className="tennis-card">
                  <CardHeader>
                    <CardTitle className="text-lg">Categoría Primera</CardTitle>
                    <CardDescription>Tu posición actual en la liga</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {demoRankings.slice(0, 3).map((player, index) => (
                        <div
                          key={player.position}
                          className={`flex items-center space-x-3 p-3 rounded-lg ${
                            player.name === "Ana Rodríguez"
                              ? "bg-tennis-green bg-opacity-10 border border-tennis-green"
                              : "bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            {getPositionIcon(player.position)}
                            <span className="font-semibold">#{player.position}</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-tennis-gray-dark">{player.name}</div>
                            <div className="text-sm text-tennis-gray">{player.points} pts</div>
                          </div>
                          {player.name === "Ana Rodríguez" && <Badge className="bg-tennis-green text-white">Tú</Badge>}
                        </div>
                      ))}
                      <Button variant="outline" className="w-full">
                        Ver Ranking Completo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Admin Demo */}
        {activeDemo === "admin" && (
          <div className="space-y-8">
            {/* Admin Header */}
            <div className="tennis-gradient rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-3 flex items-center">
                      <Crown className="h-8 w-8 mr-4 text-tennis-yellow" />
                      Panel de Administración
                    </h2>
                    <p className="text-tennis-white opacity-90 text-lg">Control total sobre la liga profesional</p>
                    <div className="flex items-center space-x-6 mt-4">
                      <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5" />
                        <span className="font-semibold">25 Usuarios Activos</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5" />
                        <span className="font-semibold">8 Partidos Esta Semana</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Trophy className="h-5 w-5" />
                        <span className="font-semibold">3 Torneos Activos</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="tennis-stats-card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-tennis-gray text-sm font-medium">Usuarios Activos</p>
                    <p className="text-3xl font-bold text-tennis-gray-dark">25</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex items-center text-sm text-tennis-gray">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>Registrados en el sistema</span>
                </div>
              </div>

              <div className="tennis-stats-card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-tennis-gray text-sm font-medium">Partidos Activos</p>
                    <p className="text-3xl font-bold text-tennis-gray-dark">8</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex items-center text-sm text-tennis-gray">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Programados/Confirmados</span>
                </div>
              </div>

              <div className="tennis-stats-card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-tennis-gray text-sm font-medium">Torneos Activos</p>
                    <p className="text-3xl font-bold text-tennis-gray-dark">3</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex items-center text-sm text-tennis-gray">
                  <Trophy className="h-4 w-4 mr-1" />
                  <span>En curso</span>
                </div>
              </div>

              <div className="tennis-stats-card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-tennis-gray text-sm font-medium">Encuestas Abiertas</p>
                    <p className="text-3xl font-bold text-tennis-gray-dark">2</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex items-center text-sm text-tennis-gray">
                  <Target className="h-4 w-4 mr-1" />
                  <span>Pendientes de respuesta</span>
                </div>
              </div>
            </div>

            {/* Admin Tabs */}
            <Tabs defaultValue="users" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 bg-white shadow-lg rounded-xl p-2 border border-tennis-gray-light">
                <TabsTrigger
                  value="users"
                  className="data-[state=active]:bg-tennis-gradient data-[state=active]:text-white rounded-lg transition-all font-semibold"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Usuarios
                </TabsTrigger>
                <TabsTrigger
                  value="matches"
                  className="data-[state=active]:bg-tennis-gradient data-[state=active]:text-white rounded-lg transition-all font-semibold"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Partidos
                </TabsTrigger>
                <TabsTrigger
                  value="rankings"
                  className="data-[state=active]:bg-tennis-gradient data-[state=active]:text-white rounded-lg transition-all font-semibold"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Rankings
                </TabsTrigger>
              </TabsList>

              {/* Users Tab */}
              <TabsContent value="users">
                <Card className="tennis-card">
                  <CardHeader className="border-b border-tennis-gray-light">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                      <div>
                        <CardTitle className="text-2xl font-bold text-tennis-gray-dark flex items-center space-x-3">
                          <Users className="h-6 w-6 text-tennis-green" />
                          <span>Gestión de Usuarios</span>
                        </CardTitle>
                        <CardDescription className="text-tennis-gray">
                          {demoUsers.length} usuarios registrados en el sistema
                        </CardDescription>
                      </div>
                      <Button className="tennis-btn-primary">
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Usuario
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Usuario
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Rol
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Categoría
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Equipo
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Estado
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {demoUsers.map((user) => (
                            <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-tennis-gradient rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">
                                      {user.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="font-semibold text-tennis-gray-dark">{user.name}</div>
                                    <div className="text-sm text-tennis-gray">{user.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                                  {user.role === "admin" ? "Admin" : "Jugador"}
                                </Badge>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className="font-medium text-tennis-gray-dark">{user.category}</span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <Badge className="bg-tennis-green text-white">{user.team}</Badge>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-center">
                                <Badge variant={user.active ? "default" : "destructive"}>
                                  {user.active ? "Activo" : "Inactivo"}
                                </Badge>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-center">
                                <div className="flex justify-center space-x-2">
                                  <Button size="sm" variant="outline" className="h-8 px-2">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-8 px-2 text-red-600">
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Matches Tab */}
              <TabsContent value="matches">
                <Card className="tennis-card">
                  <CardHeader className="border-b border-tennis-gray-light">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                      <div>
                        <CardTitle className="text-2xl font-bold text-tennis-gray-dark flex items-center space-x-3">
                          <Calendar className="h-6 w-6 text-tennis-green" />
                          <span>Gestión de Partidos</span>
                        </CardTitle>
                        <CardDescription className="text-tennis-gray">
                          Administra los partidos de la liga
                        </CardDescription>
                      </div>
                      <Button className="tennis-btn-primary">
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Partido
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {demoMatches.map((match) => (
                        <div key={match.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                            <div className="flex-1">
                              <div className="font-semibold text-lg text-tennis-gray-dark mb-2">
                                Ana Rodríguez vs {match.opponent}
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm text-tennis-gray">
                                <span className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {new Date(match.date).toLocaleDateString("es-ES")}
                                </span>
                                <span className="flex items-center">
                                  <Target className="h-4 w-4 mr-1" />
                                  {match.time}
                                </span>
                                <span className="flex items-center">
                                  <Trophy className="h-4 w-4 mr-1" />
                                  {match.venue}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {match.status === "pending_confirmation" && (
                                <Badge variant="outline" className="text-orange-600 border-orange-600">
                                  Pendiente
                                </Badge>
                              )}
                              {match.status === "confirmed" && (
                                <Badge variant="default" className="bg-green-600">
                                  Confirmado
                                </Badge>
                              )}
                              {match.status === "completed" && <Badge variant="secondary">Finalizado</Badge>}
                              <Button size="sm" variant="outline" className="h-8 px-2">
                                <Edit className="h-4 w-4" />
                              </Button>
                              {match.status !== "completed" && (
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8 px-2">
                                  <Play className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Rankings Tab */}
              <TabsContent value="rankings">
                <Card className="tennis-card">
                  <CardHeader className="border-b border-tennis-gray-light">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                      <div>
                        <CardTitle className="text-2xl font-bold text-tennis-gray-dark flex items-center space-x-3">
                          <Trophy className="h-6 w-6 text-tennis-green" />
                          <span>Rankings Oficiales</span>
                        </CardTitle>
                        <CardDescription className="text-tennis-gray">
                          Clasificación actualizada de la liga
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Filter className="h-4 w-4 mr-2" />
                          Filtros
                        </Button>
                        <Button variant="outline" size="sm">
                          <Search className="h-4 w-4 mr-2" />
                          Buscar
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Pos
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Jugador
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Equipo
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              PJ
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              PG
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              PP
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Pts
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Prom
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {demoRankings.map((player, index) => (
                            <tr
                              key={player.position}
                              className={`border-b border-gray-200 hover:bg-gray-50 ${index < 3 ? "bg-yellow-50" : ""}`}
                            >
                              <td className="px-4 py-4 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center space-x-2">
                                  {getPositionIcon(player.position)}
                                  {player.position <= 3 && (
                                    <Badge className="tennis-badge-gold text-xs">#{player.position}</Badge>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-tennis-gradient rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-xs">
                                      {player.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-tennis-gray-dark text-sm truncate">
                                      {player.name}
                                    </div>
                                    {player.position <= 3 && (
                                      <div className="flex items-center space-x-1 mt-1">
                                        <Star className="h-3 w-3 text-tennis-yellow" />
                                        <span className="text-xs text-tennis-gray">Top Performer</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <Badge
                                  style={{ backgroundColor: player.teamColor }}
                                  className="text-white font-medium text-xs"
                                >
                                  {player.team}
                                </Badge>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-center font-semibold text-sm">
                                {player.matches}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-center">
                                <span className="font-bold text-green-600 text-sm">{player.wins}</span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-center">
                                <span className="font-bold text-red-600 text-sm">{player.losses}</span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-center">
                                <span className="font-bold text-tennis-green text-lg">{player.points}</span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center space-x-1">
                                  <Target className="h-4 w-4 text-tennis-green" />
                                  <span className="font-bold text-tennis-green text-lg">
                                    {player.average.toFixed(2)}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Demo Footer */}
        <div className="mt-16 text-center">
          <Card className="tennis-card bg-gradient-to-r from-tennis-green to-tennis-court text-white">
            <CardContent className="p-8">
              <Crown className="h-12 w-12 mx-auto mb-4 text-tennis-yellow" />
              <h3 className="text-2xl font-bold mb-4">¿Te gusta lo que ves?</h3>
              <p className="text-lg mb-6 opacity-90">
                Esta es solo una muestra de las capacidades de Liga de Intertenis. Accede al sistema completo para
                explorar todas las funcionalidades.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/login">
                  <Button size="lg" className="bg-white text-tennis-green hover:bg-gray-100 font-semibold px-8 py-4">
                    <Trophy className="mr-2 h-5 w-5" />
                    Acceder al Sistema
                  </Button>
                </Link>
                <Link href="/">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-tennis-green px-8 py-4"
                  >
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Volver al Inicio
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
