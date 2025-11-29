"use client";

import { Sidebar } from "@/components/admin-panel/sidebar";
import { Navbar } from "@/components/admin-panel/navbar";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
    children: React.ReactNode;
    user: any;
    profile: any;
}

export function AdminLayout({ children, user, profile }: AdminLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-neutral-50 flex">
            {/* Sidebar for Desktop */}
            <aside className="hidden md:block w-64 border-r border-neutral-200 bg-white fixed inset-y-0 left-0 z-20">
                <Sidebar />
            </aside>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-neutral-200 transition-transform duration-300 md:hidden",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <Sidebar />
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col md:pl-64 transition-all duration-300">
                <Navbar
                    user={user}
                    profile={profile}
                    onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                />
                <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-neutral-50">
                    {children}
                </main>
            </div>
        </div>
    );
}
