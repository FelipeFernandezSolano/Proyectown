import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo-importsmart.svg";
import "./Login.css";

const GOOGLE_HABILITADO = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

export default function Login() {
  const { login, loginConGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const irAlPanel = (usuario) => navigate(usuario.rol === "ADMINISTRADOR" ? "/dashboard" : "/pedidos");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const usuario = await login(email, password);
      irAlPanel(usuario);
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo iniciar sesion. Revisa tus datos.");
    } finally {
      setCargando(false);
    }
  };

  const onGoogleExito = async (credentialResponse) => {
    setError("");
    setCargando(true);
    try {
      const usuario = await loginConGoogle(credentialResponse.credential);
      irAlPanel(usuario);
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo iniciar sesion con Google.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-fondo">
      <form className="login-card" onSubmit={onSubmit}>
        <img src={logo} alt="ImportSmart" className="login-logo" />
        <h2>Iniciar sesion</h2>
        <p className="login-subtitulo">Acceso al sistema de importaciones</p>

        <div className="campo">
          <label>Correo</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@empresa.com" required />
        </div>
        <div className="campo">
          <label>Contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ingresa tu contraseña" required />
          <Link to="/olvide-contrasena" className="login-olvide">Olvidaste tu contraseña?</Link>
        </div>

        {error && <p className="login-error">{error}</p>}

        <button className="btn btn-azul login-boton" type="submit" disabled={cargando}>
          {cargando ? "Ingresando..." : "Ingresar"}
        </button>

        {GOOGLE_HABILITADO && (
          <>
            <div className="login-divisor"><span>o</span></div>
            <div className="login-google">
              <GoogleLogin
                onSuccess={onGoogleExito}
                onError={() => setError("No se pudo iniciar sesion con Google.")}
                shape="pill"
                width="100%"
              />
            </div>
          </>
        )}

        <p className="login-enlace">
          No tienes cuenta? <Link to="/registro">Registrate aqui</Link>
        </p>
      </form>
    </div>
  );
}
