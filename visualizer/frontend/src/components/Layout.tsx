import { useState } from "react";
import { Activity, Boxes, Cpu, LayoutDashboard, LogOut, Menu, Settings, X } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/analyses", label: "Análisis", icon: Activity },
  { to: "/devices", label: "Dispositivos", icon: Cpu },
  { to: "/settings", label: "Configuración", icon: Settings },
];

export function Layout() {
  const [open, setOpen] = useState(false); const location = useLocation(); const navigate = useNavigate(); const queryClient = useQueryClient();
  const { data: user } = useQuery({ queryKey: ["me"], queryFn: api.me, staleTime: 5 * 60_000 });
  const logout = async () => { await api.logout().catch(() => undefined); queryClient.clear(); navigate("/login", { replace: true }); };
  const title = nav.find((item) => item.end ? location.pathname === item.to : location.pathname.startsWith(item.to))?.label ?? "Attack Explorer";
  return <div className="app-shell">
    <aside className="sidebar" data-open={open} aria-label="Navegación principal">
      <div className="brand-block"><img className="sidebar-logo" src="/honeytrace-logo.svg" alt="HoneyTrace" /><button className="button-ghost ml-auto md:hidden" aria-label="Cerrar navegación" onClick={() => setOpen(false)}><X size={18} /></button></div>
      <nav className="nav-list">{nav.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)} className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}><Icon size={17} aria-hidden="true" />{label}</NavLink>)}</nav>
      <div className="sidebar-status"><div className="status-line"><span className="status-dot" />API local</div><div className="mt-2 flex items-center gap-2 text-[var(--text-xs)] text-[var(--text-muted)]"><Boxes size={13} />Datos privados por cuenta</div></div>
    </aside>
    {open && <button className="fixed inset-0 z-20 bg-black/50 md:hidden" aria-label="Cerrar navegación" onClick={() => setOpen(false)} />}
    <div className="app-body">
      <header className="header"><div className="flex items-center gap-3"><button className="button-ghost mobile-nav-button" aria-label="Abrir navegación" onClick={() => setOpen(true)}><Menu size={18} /></button><span className="text-sm text-[var(--text-tertiary)]">{title}</span></div><div className="header-user"><span>{user?.username}</span>{user?.avatar_url ? <img className="avatar" src={user.avatar_url} alt="" /> : <span className="avatar" aria-hidden="true">{user?.username?.slice(0, 1).toUpperCase()}</span>}<button className="button-ghost" onClick={logout} title="Cerrar sesión" aria-label="Cerrar sesión"><LogOut size={17} /></button></div></header>
      <main><Outlet /></main>
    </div>
  </div>;
}
