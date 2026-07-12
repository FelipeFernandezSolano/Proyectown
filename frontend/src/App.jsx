import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Pedidos = lazy(() => import("./pages/Pedidos"));
const NuevoPedido = lazy(() => import("./pages/NuevoPedido"));
const Simulador = lazy(() => import("./pages/Simulador"));
const Clientes = lazy(() => import("./pages/Clientes"));
const Productos = lazy(() => import("./pages/Productos"));

function ShellPrivado({ children, soloAdmin = false }) {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === "ADMINISTRADOR";
  return (
    <ProtectedRoute>
      {soloAdmin && !esAdmin ? (
        <Navigate to="/pedidos" replace />
      ) : (
        <div className="app-shell">
          <Navbar />
          <Suspense fallback={<div className="contenido">Cargando...</div>}>
            {children}
          </Suspense>
        </div>
      )}
    </ProtectedRoute>
  );
}

function RutasApp() {
  useAuth();
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ShellPrivado soloAdmin><Dashboard /></ShellPrivado>} />
      <Route path="/pedidos" element={<ShellPrivado><Pedidos /></ShellPrivado>} />
      <Route path="/nuevo-pedido" element={<ShellPrivado soloAdmin><NuevoPedido /></ShellPrivado>} />
      <Route path="/simulador" element={<ShellPrivado><Simulador /></ShellPrivado>} />
      <Route path="/clientes" element={<ShellPrivado><Clientes /></ShellPrivado>} />
      <Route path="/productos" element={<ShellPrivado><Productos /></ShellPrivado>} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RutasApp />
      </AuthProvider>
    </BrowserRouter>
  );
}
