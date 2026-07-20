import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { guardarSesion } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    const nombre = searchParams.get("nombre");
    const rol = searchParams.get("rol");
    const clienteId = searchParams.get("clienteId");

    if (!token || !rol) {
      navigate("/login?googleError=1", { replace: true });
      return;
    }

    const usuario = guardarSesion({
      token,
      nombre: nombre || "",
      rol,
      clienteId: clienteId ? Number(clienteId) : null,
    });
    navigate(usuario.rol === "ADMINISTRADOR" ? "/dashboard" : "/pedidos", { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="login-fondo">
      <p className="login-subtitulo">Iniciando sesion con Google...</p>
    </div>
  );
}
