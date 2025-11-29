import Link from "next/link";
import { LayoutDashboard, Calendar, Users, BarChart3, Ticket, Settings, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

export function Sidebar({ className }: SidebarProps) {
    const links = [
        {
            href: "/admin/dashboard",
            label: "Dashboard",
            icon: LayoutDashboard,
        },
        {
            href: "/admin/eventos",
            label: "Eventos",
            icon: Calendar,
        },
        {
            href: "/admin/usuarios",
            label: "Usuários",
            icon: Users,
        },
        {
            href: "/admin/relatorios",
            label: "Relatórios",
            icon: BarChart3,
        },
        {
            href: "/admin/cupons",
            label: "Cupons",
            icon: Ticket,
        },
    ];

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
                        {links.map((link) => (
                            <Button
                                key={link.href}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                                asChild
                            >
                                <Link href={link.href}>
                                    <link.icon className="mr-2 h-4 w-4" />
                                    {link.label}
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
                    </div>
                </div>
            </div>
        </div>
    );
}
