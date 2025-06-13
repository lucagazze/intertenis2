"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import MainNav from "@/components/layout/main-nav"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  UserPlus,
  Users,
  Mail,
  Phone,
  Shield,
  Search,
  Filter,
  Calendar,
} from "lucide-react"

interface User {
  id: string
  email: string
  name: string
  /** Optional URL to the user's avatar image */
  avatar_url?: string
  phone?: string
  birth_date?: string
  role: string
  category?: string
  team_id?: number
  active: boolean
  team?: { name: string; color: string }
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [teams, setTeams] = useState([])
  const [categories, setCategories] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phone: "",
    birth_date: "",
    role: "player",
    category: "",
    team_id: "",
    password: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchUsers()
    fetchTeams()
    fetchCategories()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, roleFilter, categoryFilter])

  const filterUsers = () => {
    let filtered = users

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((user) => user.category === categoryFilter)
    }

    setFilteredUsers(filtered)
  }

  const fetchUsers = async () => {
    try {
      const { data: usersData, error: usersError } = await supabase.from("users").select("*").order("name")

      if (usersError) {
        console.error("Error fetching users:", usersError)
        return
      }

      const { data: teamsData, error: teamsError } = await supabase.from("teams").select("*")

      if (teamsError) {
        console.error("Error fetching teams:", teamsError)
        setUsers(usersData || [])
        return
      }

      const usersWithTeams = (usersData || []).map((user: any) => {
        const team = teamsData?.find((t: any) => t.id === user.team_id)
        return {
          ...user,
          team: team || null,
        }
      })

      setUsers(usersWithTeams)
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const fetchTeams = async () => {
    const { data } = await supabase.from("teams").select("*").order("name")
    setTeams(data || [])
  }

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").eq("active", true).order("name")
    setCategories(data || [])
  }

  const createUserWithSimpleAuth = async (userData: any) => {
    try {
      const userId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const { data, error: userError } = await supabase
        .from("users")
        .insert({
          id: userId,
          email: userData.email,
          name: userData.name,
          phone: userData.phone || null,
          birth_date: userData.birth_date || null,
          role: userData.role,
          category: userData.category || null,
          team_id: userData.team_id ? Number.parseInt(userData.team_id) : null,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (userError) throw userError

      return { success: true, userId, data }
    } catch (error) {
      console.error("Error creating user:", error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage("")

    try {
      if (editingUser) {
        const { error } = await supabase
          .from("users")
          .update({
            name: formData.name,
            phone: formData.phone || null,
            birth_date: formData.birth_date || null,
            role: formData.role,
            category: formData.category || null,
            team_id: formData.team_id ? Number.parseInt(formData.team_id) : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingUser.id)

        if (error) throw error
        setMessage("Usuario actualizado exitosamente")
      } else {
        await createUserWithSimpleAuth({
          email: formData.email,
          name: formData.name,
          phone: formData.phone,
          birth_date: formData.birth_date,
          role: formData.role,
          category: formData.category,
          team_id: formData.team_id,
        })

        setMessage(`Usuario creado exitosamente. Email: ${formData.email}`)
      }

      fetchUsers()
      resetForm()
      setIsModalOpen(false)
    } catch (error: any) {
      console.error("Error in handleSubmit:", error)
      setMessage(`Error: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      email: "",
      name: "",
      phone: "",
      birth_date: "",
      role: "player",
      category: "",
      team_id: "",
      password: "",
    })
    setEditingUser(null)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      name: user.name,
      phone: user.phone || "",
      birth_date: user.birth_date || "",
      role: user.role,
      category: user.category || "",
      team_id: user.team_id?.toString() || "",
      password: "",
    })
    setIsModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return

    setIsDeleting(true)
    try {
      // Eliminar en orden correcto para evitar errores de foreign key
      await supabase.from("survey_responses").delete().eq("user_id", deletingUser.id)
      await supabase.from("rankings").delete().eq("user_id", deletingUser.id)

      // Actualizar matches en lugar de eliminar para mantener integridad
      await supabase.from("matches").update({ player1_id: null }).eq("player1_id", deletingUser.id)
      await supabase.from("matches").update({ player2_id: null }).eq("player2_id", deletingUser.id)
      await supabase.from("matches").update({ winner_id: null }).eq("winner_id", deletingUser.id)

      // Eliminar el usuario
      const { error: userError } = await supabase.from("users").delete().eq("id", deletingUser.id)

      if (userError) throw userError

      fetchUsers()
      setMessage(`Usuario "${deletingUser.name}" eliminado exitosamente`)
      setDeletingUser(null)
    } catch (error: any) {
      console.error("Error deleting user:", error)
      setMessage(`Error al eliminar usuario: ${error.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const getTeamName = (teamId: number | null) => {
    if (!teamId) return "-"
    const team = teams.find((t: any) => t.id === teamId)
    return team ? team.name : "-"
  }

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "-"
    const category = categories.find((c: any) => c.id.toString() === categoryId)
    return category ? category.name : "-"
  }

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return "-"
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-tennis-cream to-tennis-white">
      <MainNav />

      <div className="tennis-container py-8 space-y-8">
        {/* Enhanced Header */}
        <div className="tennis-fade-in">
          <div className="tennis-gradient rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold mb-3 flex items-center">
                    <Users className="h-10 w-10 mr-4" />
                    Gestión de Usuarios
                  </h1>
                  <p className="text-tennis-white opacity-90 text-lg">
                    Administra los jugadores y usuarios de la liga profesional
                  </p>
                  <div className="flex items-center space-x-6 mt-4">
                    <div className="flex items-center space-x-2">
                      <UserPlus className="h-5 w-5" />
                      <span className="font-semibold">{users.length} Usuarios Registrados</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span className="font-semibold">Sistema Seguro</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    resetForm()
                    setIsModalOpen(true)
                  }}
                  className="tennis-btn-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Usuario
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Alert Messages */}
        {message && (
          <div className="tennis-slide-up">
            <Alert
              className={`tennis-alert ${message.includes("Error") ? "tennis-alert-error" : "tennis-alert-success"}`}
            >
              <AlertDescription className="text-base font-medium">{message}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Enhanced Filters */}
        <div className="tennis-slide-up">
          <Card className="tennis-card">
            <CardHeader className="border-b border-tennis-gray-light">
              <CardTitle className="flex items-center space-x-2 text-tennis-gray-dark">
                <Filter className="h-5 w-5 text-tennis-green" />
                <span>Filtros y Búsqueda</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-tennis-gray-dark">Buscar Usuario</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-tennis-gray" />
                    <Input
                      placeholder="Nombre o email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-tennis-gray-dark">Rol</label>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los roles</SelectItem>
                      <SelectItem value="admin">Administradores</SelectItem>
                      <SelectItem value="player">Jugadores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-tennis-gray-dark">Categoría</label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-tennis-gray-dark">Resultados</label>
                  <div className="text-sm text-tennis-gray bg-tennis-gray-light px-3 py-2 rounded-lg">
                    {filteredUsers.length} de {users.length} usuarios
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Users Table */}
        <div className="tennis-slide-up">
          <Card className="tennis-card">
            <CardHeader className="border-b border-tennis-gray-light">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div>
                  <CardTitle className="text-2xl font-bold text-tennis-gray-dark flex items-center space-x-3">
                    <Users className="h-6 w-6 text-tennis-green" />
                    <span>Lista de Usuarios</span>
                  </CardTitle>
                  <CardDescription className="text-tennis-gray mt-2">
                    {filteredUsers.length} usuarios mostrados
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-tennis-green text-white border-tennis-green">
                  Sistema Profesional
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="tennis-table-wrapper">
                <table className="tennis-table">
                  <thead>
                    <tr>
                      <th className="tennis-table-header text-left">Usuario</th>
                      <th className="tennis-table-header text-left">Contacto</th>
                      <th className="tennis-table-header">Edad</th>
                      <th className="tennis-table-header">Rol</th>
                      <th className="tennis-table-header">Categoría</th>
                      <th className="tennis-table-header">Equipo</th>
                      <th className="tennis-table-header">Estado</th>
                      <th className="tennis-table-header">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="tennis-ranking-row">
                        <td className="tennis-table-cell text-left">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-tennis-gradient rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">{user.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <div className="font-semibold text-tennis-gray-dark">{user.name}</div>
                              <div className="text-sm text-tennis-gray">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="tennis-table-cell text-left">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-sm">
                              <Mail className="h-3 w-3 text-tennis-gray" />
                              <span className="truncate max-w-[150px]">{user.email}</span>
                            </div>
                            {user.phone && (
                              <div className="flex items-center space-x-2 text-sm text-tennis-gray">
                                <Phone className="h-3 w-3" />
                                <span>{user.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="tennis-table-cell text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <Calendar className="h-3 w-3 text-tennis-gray" />
                            <span className="font-medium">{calculateAge(user.birth_date || "")}</span>
                          </div>
                        </td>
                        <td className="tennis-table-cell">
                          <Badge variant={user.role === "admin" ? "default" : "secondary"} className="font-medium">
                            {user.role === "admin" ? "Admin" : "Jugador"}
                          </Badge>
                        </td>
                        <td className="tennis-table-cell">
                          <span className="font-medium text-tennis-gray-dark">{getCategoryName(user.category)}</span>
                        </td>
                        <td className="tennis-table-cell">
                          {user.team ? (
                            <Badge style={{ backgroundColor: user.team.color }} className="text-white font-medium">
                              {user.team.name}
                            </Badge>
                          ) : (
                            <span className="text-tennis-gray">Sin equipo</span>
                          )}
                        </td>
                        <td className="tennis-table-cell">
                          <Badge variant={user.active ? "default" : "destructive"} className="font-medium">
                            {user.active ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        <td className="tennis-table-cell">
                          <div className="flex justify-center space-x-2">
                            <Button size="sm" className="tennis-btn-outline p-2" onClick={() => handleEdit(user)}>
                              <Edit className="h-4 w-4" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setDeletingUser(user)}
                                  className="p-2 hover:bg-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-white z-modal max-w-md">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="flex items-center space-x-2 text-red-600">
                                    <AlertTriangle className="h-5 w-5" />
                                    <span>¿Eliminar usuario permanentemente?</span>
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-base leading-relaxed">
                                    Esta acción eliminará permanentemente al usuario <strong>"{user.name}"</strong> y
                                    todos sus datos asociados.
                                    <br />
                                    <br />
                                    <strong className="text-red-600">⚠️ Esta acción no se puede deshacer.</strong>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="space-x-2">
                                  <AlertDialogCancel
                                    onClick={() => setDeletingUser(null)}
                                    className="tennis-btn-outline"
                                  >
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={handleDeleteConfirm}
                                    disabled={isDeleting}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    {isDeleting ? "Eliminando..." : "Sí, eliminar permanentemente"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-16">
                  <Users className="h-16 w-16 text-tennis-gray mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-tennis-gray-dark mb-2">No hay usuarios</h3>
                  <p className="text-tennis-gray mb-6">
                    {users.length === 0
                      ? "No hay usuarios registrados en el sistema"
                      : "No se encontraron usuarios con los filtros aplicados"}
                  </p>
                  <Button className="tennis-btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Usuario
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* User Form Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"}
          size="md"
        >
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-tennis-green" />
                <span>Email</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={!!editingUser}
                className="tennis-input"
                placeholder="usuario@email.com"
              />
            </div>

            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-tennis-green" />
                  <span>Contraseña</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  className="tennis-input"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-tennis-green" />
                <span>Nombre Completo</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="tennis-input"
                placeholder="Nombre y apellido"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-tennis-green" />
                <span>Teléfono (opcional)</span>
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="tennis-input"
                placeholder="+54 11 1234-5678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_date" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-tennis-green" />
                <span>Fecha de Nacimiento (opcional)</span>
              </Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                className="tennis-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger className="tennis-input bg-white border border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-dropdown bg-white">
                  <SelectItem value="player">Jugador</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="tennis-input bg-white border border-gray-300">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent className="z-dropdown bg-white">
                  {categories.map((category: any) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="team">Equipo</Label>
              <Select value={formData.team_id} onValueChange={(value) => setFormData({ ...formData, team_id: value })}>
                <SelectTrigger className="tennis-input bg-white border border-gray-300">
                  <SelectValue placeholder="Seleccionar equipo" />
                </SelectTrigger>
                <SelectContent className="z-dropdown bg-white">
                  {teams.map((team: any) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="tennis-btn-primary w-full">
                {isSubmitting ? (
                  <div className="tennis-loading">
                    <div className="tennis-spinner" />
                    <span>Guardando...</span>
                  </div>
                ) : editingUser ? (
                  "Actualizar Usuario"
                ) : (
                  "Crear Usuario"
                )}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  )
}
