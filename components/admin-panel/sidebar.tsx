import Link from "next/link";
import { LayoutDashboard, Calendar, Users, BarChart3, Ticket, Settings, Building2, Camera, UserPlus, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    userRole?: 'admin' | 'organizer';
    pendingApprovalCount?: number;
}

export function Sidebar({ className, userRole = 'admin', pendingApprovalCount = 0 }: SidebarProps) {
    // Base links that both admin and organizer can see
    const baseLinks = [
        {
            href: "/admin/dashboard",
            label: "Dashboard",
            icon: LayoutDashboard,
            roles: ['admin', 'organizer'],
        },
        {
            href: "/admin/eventos",
            label: userRole === 'organizer' ? "Meus Eventos" : "Eventos",
            icon: Calendar,
            roles: ['admin', 'organizer'],
        },
    ];

    // Admin-only links
    const adminLinks = [
        {
            href: "/admin/aprovacoes",
            label: "Aprovações",
            icon: ClipboardCheck,
            roles: ['admin'],
            badge: pendingApprovalCount > 0 ? pendingApprovalCount : undefined,
        },
        {
            href: "/admin/organizadores",
            label: "Organizadores",
            icon: UserPlus,
            roles: ['admin'],
        },
        {
            href: "/admin/usuarios",
            label: "Usuários",
            icon: Users,
            roles: ['admin'],
        },
        {
            href: "/admin/relatorios",
            label: "Relatórios",
            icon: BarChart3,
            roles: ['admin', 'organizer'],
        },
        {
            href: "/admin/cupons",
            label: "Cupons",
            icon: Ticket,
            roles: ['admin'],
        },
        {
            href: "/admin/pedidos-fotos",
            label: "Pedidos Fotos",
            icon: Camera,
            roles: ['admin', 'organizer'],
        },
    ];

    // Filter links based on role
    const allLinks = [...baseLinks, ...adminLinks];
    const visibleLinks = allLinks.filter(link => link.roles.includes(userRole));

    return (
        <div className={cn("pb-12 min-h-screen", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <div className="mb-6 px-4 flex items-center">
                        <img
                            src="/assets/symplepass-color.svg"
                            alt="SymplePass"
                            className="h-8 w-auto"
                        />
                    </div>
                    <div className="space-y-1">
                        {visibleLinks.map((link) => (
                            <Button
                                key={link.href}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                                asChild
                            >
                                <Link href={link.href} className="flex items-center">
                                    <link.icon className="mr-2 h-4 w-4" />
                                    {link.label}
                                    {'badge' in link && typeof link.badge === 'number' && link.badge > 0 && (
                                        <Badge
                                            variant="error"
                                            className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs"
                                        >
                                            {link.badge}
                                        </Badge>
                                    )}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-neutral-500 uppercase">
                        Configurações
                    </h2>
                    <div className="space-y-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                            asChild
                        >
                            <Link href="/admin/perfil-organizador">
                                <Building2 className="mr-2 h-4 w-4" />
                                Perfil Organizador
                            </Link>
                        </Button>
                        {userRole === 'admin' && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                                asChild
                            >
                                <Link href="/admin/configuracoes">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Configurações
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
