'use client'

import { Button } from "@/components/ui/button";
import { Menu, User, LogOut, Settings, LayoutDashboard, Ticket } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface NavbarProps {
    title?: string;
    user?: any; // We'll refine this type
    profile?: any;
    onMenuClick?: () => void;
}

export function Navbar({ title, user, profile, onMenuClick }: NavbarProps) {
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
    const userMenuRef = useRef<HTMLDivElement>(null)

    // Close user menu on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false)
            }
        }

        if (isUserMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isUserMenuOpen])

    const handleLogout = () => {
        window.location.href = '/api/auth/signout'
    }

    const handleProfileClick = (destination: string) => {
        window.location.href = destination
    }

    const userName = profile?.full_name || user?.email || 'User'
    const userEmail = user?.email || profile?.email
    const userRole = profile?.role || 'user'

    return (
        <header className="w-full bg-white/50 backdrop-blur-xl border-b border-neutral-200">
            <div className="flex h-14 items-center px-4 sm:px-6 lg:px-8">
                <Button
                    variant="ghost"
                    iconOnly
                    className="mr-2 md:hidden text-neutral-600 hover:text-neutral-900"
                    onClick={onMenuClick}
                >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>

                <div className="flex flex-1 items-center justify-between">
                    <h1 className="text-sm font-medium text-neutral-900">
                        {title || "Painel Administrativo"}
                    </h1>

                    <div className="flex items-center gap-4">
                        {/* User Menu with Dropdown */}
                        <div className="relative" ref={userMenuRef}>
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-200 hover:bg-neutral-100"
                                aria-label="User menu"
                                aria-expanded={isUserMenuOpen}
                                aria-haspopup="true"
                            >
                                <div className="hidden md:block text-right">
                                    <p className="text-sm font-medium text-neutral-900 leading-none">{userName}</p>
                                    <p className="text-xs text-neutral-500 mt-1">
                                        {userRole === 'admin' ? 'Administrador' : 'Organizador'}
                                    </p>
                                </div>
                                <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-700">
                                    <span className="text-xs font-medium">
                                        {getInitials(userName)}
                                    </span>
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {isUserMenuOpen && (
                                <div
                                    className="absolute right-0 mt-2 w-64 rounded-xl shadow-custom-lg border bg-white border-neutral-200 animate-fade-in-up"
                                    role="menu"
                                >
                                    {/* User Info */}
                                    <div className="px-4 py-3 border-b border-neutral-200">
                                        <p className="text-sm font-semibold font-geist text-neutral-900">
                                            {userName}
                                        </p>
                                        <p className="text-xs font-inter truncate text-neutral-600">
                                            {userEmail}
                                        </p>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="py-2">
                                        <button
                                            onClick={() => {
                                                handleProfileClick('/admin/dashboard')
                                                setIsUserMenuOpen(false)
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-inter transition-colors text-neutral-700 hover:bg-neutral-50"
                                            role="menuitem"
                                        >
                                            <LayoutDashboard className="w-4 h-4" />
                                            <span>Dashboard</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleProfileClick('/conta')
                                                setIsUserMenuOpen(false)
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-inter transition-colors text-neutral-700 hover:bg-neutral-50"
                                            role="menuitem"
                                        >
                                            <User className="w-4 h-4" />
                                            <span>Meu Perfil</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleProfileClick('/conta/eventos')
                                                setIsUserMenuOpen(false)
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-inter transition-colors text-neutral-700 hover:bg-neutral-50"
                                            role="menuitem"
                                        >
                                            <Ticket className="w-4 h-4" />
                                            <span>Meus Ingressos</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleProfileClick('/conta/configuracoes')
                                                setIsUserMenuOpen(false)
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-inter transition-colors text-neutral-700 hover:bg-neutral-50"
                                            role="menuitem"
                                        >
                                            <Settings className="w-4 h-4" />
                                            <span>Configurações</span>
                                        </button>
                                    </div>

                                    {/* Logout */}
                                    <div className="border-t border-neutral-200">
                                        <button
                                            onClick={() => {
                                                handleLogout()
                                                setIsUserMenuOpen(false)
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-inter transition-colors text-error hover:bg-error/10"
                                            role="menuitem"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>Sair</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
