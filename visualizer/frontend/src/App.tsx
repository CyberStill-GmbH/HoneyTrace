import { lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Layout } from "./components/Layout";
import { SplashScreen } from "./components/SplashScreen";
import { LoadingState } from "./components/States";
import { api } from "./lib/api";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Analyses } from "./pages/Analyses";
import { Devices } from "./pages/Devices";
import { SettingsPage } from "./pages/Settings";

const Explorer = lazy(() => import("./pages/Explorer").then((module) => ({ default: module.Explorer })));

function Protected() {
  const location = useLocation(); const { data, isLoading, isError } = useQuery({ queryKey: ["me"], queryFn: api.me, retry: false, staleTime: 5 * 60_000 });
  if (isLoading) return <LoadingState label="Verificando sesión…" />;
  if (isError || !data) return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  return <Layout />;
}

export default function App() { return <SplashScreen><Routes><Route path="/login" element={<Login />} /><Route element={<Protected />}>
  <Route path="/" element={<Dashboard />} /><Route path="/analyses" element={<Analyses />} /><Route path="/analyses/:id" element={<Suspense fallback={<LoadingState label="Cargando reconstrucción…" />}><Explorer /></Suspense>} /><Route path="/devices" element={<Devices />} /><Route path="/settings" element={<SettingsPage />} /></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes></SplashScreen>; }
