"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  LogOut,
  Settings,
  Trophy,
  Users,
  Calendar,
  Menu,
  Play,
  ShieldCheck,
  LayoutDashboard,
  FileText,
  ChevronDown,
  BarChart3,
} from "lucide-react"
import Image from "next/image"

interface UserType {
  id: string
  email: string
  name: string
  role: string
  avatar_url?: string
}

export default function MainNav() {
  const [user, setUser] = useState<UserType | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        const { data: userData } = await supabase.from("users").select("*").eq("id", session.user.id).single()
        if (userData) {
          setUser(userData)
        } else {
          await supabase.auth.signOut()
          router.push("/login")
        }
      }
    }
    getUser()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const isActivePath = (path: string) => pathname === path || (path !== "/" && pathname.startsWith(path))

  // Se elimina "Rankings" de los items comunes
  const commonNavItems = [{ href: "/tournament-overview", label: "Torneos", icon: Trophy }]

  const adminNavItems = [
    { href: "/admin", label: "Dashboard Admin", icon: LayoutDashboard },
    { href: "/admin/users", label: "Usuarios", icon: Users },
    { href: "/admin/tournaments", label: "Gestión Torneos", icon: Settings },
    { href: "/admin/tournament-ranking", label: "Ranking Detallado", icon: BarChart3 },
    { href: "/admin/matches", label: "Partidos", icon: Calendar },
    { href: "/admin/reports", label: "Reportes", icon: FileText },
    ...commonNavItems,
  ]

  const playerNavItems = [
    { href: "/dashboard", label: "Mi Dashboard", icon: LayoutDashboard },
    { href: "/my-matches", label: "Mis Partidos", icon: Play },
    ...commonNavItems,
  ]

  const navItems = user?.role === "admin" ? adminNavItems : playerNavItems

  const NavLinks = ({ mobile = false, onItemClick }: { mobile?: boolean; onItemClick?: () => void }) => (
    <nav className={`flex ${mobile ? "flex-col space-y-2 p-4" : "items-center space-x-1 lg:space-x-2"}`}>
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = isActivePath(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              group flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out
              ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
              }
              ${mobile ? "text-base" : ""}
            `}
            onClick={onItemClick}
          >
            <Icon
              className={`mr-2 h-5 w-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground"}`}
            />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )

  const UserAvatar = () => (
    <Avatar className="h-9 w-9">
      <AvatarImage src={user?.avatar_url || `https://avatar.vercel.sh/${user?.email}.png?size=40`} alt={user?.name} />
      <AvatarFallback>{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
    </Avatar>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 items-center py-2">
        <Link href={user?.role === "admin" ? "/admin" : "/dashboard"} className="mr-6 flex items-center space-x-2">
          <Image
            src="/placeholder-9t7h7.png"
            alt="Liga Intertenis Logo"
            width={36}
            height={36}
            className="rounded-full"
          />
          {/* Se quita el gradiente del texto del logo */}
          <span className="hidden font-bold sm:inline-block text-lg text-primary">Liga Intertenis</span>
        </Link>

        <div className="hidden md:flex flex-1">
          <NavLinks />
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative flex items-center space-x-2 px-2 py-1 h-auto">
                  <UserAvatar />
                  <span className="hidden lg:inline-block text-sm font-medium text-foreground">{user.name}</span>
                  <ChevronDown className="hidden lg:inline-block h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile-settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configuración</span>
                  </Link>
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      <span>Panel Admin</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
          )}

          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Abrir menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-xs sm:max-w-sm p-0">
                <SheetHeader className="border-b p-4">
                  <SheetTitle>
                    <Link
                      href={user?.role === "admin" ? "/admin" : "/dashboard"}
                      className="flex items-center space-x-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Image
                        src="/placeholder-9t7h7.png"
                        alt="Liga Intertenis Logo"
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                      <span className="font-bold text-md">Liga Intertenis</span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <NavLinks mobile onItemClick={() => setIsMobileMenuOpen(false)} />
                {user && (
                  <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        handleLogout()
                        setIsMobileMenuOpen(false)
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Cerrar Sesión
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
