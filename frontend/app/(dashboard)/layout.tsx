"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Building2,
  FileText,
  LogOut,
  Menu,
  Receipt,
  Settings,
  X,
  Landmark,
  Send,
  Shield,
  BarChart3,
  Scan,
} from "lucide-react";
import { useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    {
      name: "Cabinet",
      href: "/cabinet",
      icon: Briefcase,
      description: "Portail cabinet"
    },
    {
      name: "Documents",
      href: "/documents",
      icon: FileText,
      description: "Gestion documentaire",
      badge: "OCR"
    },
    {
      name: "Banque",
      href: "/bank/accounts",
      icon: Landmark,
      description: "Synchronisation bancaire"
    },
    {
      name: "E-Facturation",
      href: "/einvoicing",
      icon: Send,
      description: "Chorus Pro 2026"
    },
    {
      name: "Notes de frais",
      href: "/expenses",
      icon: Receipt,
      description: "Gestion dépenses"
    },
    {
      name: "Fiscal",
      href: "/fiscal",
      icon: Shield,
      description: "Obligations fiscales"
    },
    {
      name: "Rapports",
      href: "/reports",
      icon: BarChart3,
      description: "Bilan, TVA, FEC"
    },
    {
      name: "Paramètres",
      href: "/settings",
      icon: Settings,
      description: "Import/Export"
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6">
          <Link href="/cabinet" className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-purple-600" />
            <span className="text-xl font-bold text-gray-900">ISEB</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-gray-600 lg:hidden"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* User info */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name || "Utilisateur"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email || user?.login}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto max-h-[calc(100vh-240px)]">
          {navigation.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-purple-50 text-purple-600"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  <div className="flex flex-col">
                    <span>{item.name}</span>
                    {!isActive && (
                      <span className="text-xs text-gray-500 group-hover:text-gray-700">
                        {item.description}
                      </span>
                    )}
                  </div>
                </div>
                {item.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout button */}
        <div className="border-t border-gray-200 p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-700 hover:bg-red-50 hover:text-red-600"
            onClick={logout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Déconnexion
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-sm text-gray-500">
              {pathname === "/cabinet" && "Portail Cabinet"}
              {pathname === "/documents" && "Gestion Documentaire"}
              {pathname?.startsWith("/bank") && "Synchronisation Bancaire"}
              {pathname?.startsWith("/einvoicing") && "E-Facturation"}
              {pathname?.startsWith("/expenses") && "Notes de Frais"}
              {pathname?.startsWith("/fiscal") && "Obligations Fiscales"}
              {pathname?.startsWith("/reports") && "Rapports Comptables"}
              {pathname === "/settings" && "Paramètres"}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
