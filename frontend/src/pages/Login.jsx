import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Icon from "../components/Icon";
import GoogleButton from "../components/GoogleButton";
import logo from "../assets/logo-importsmart.svg";
import "./Login.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    searchParams.get("googleError") ? "No se pudo completar el inicio de sesion con Google. Intentalo de nuevo." : ""
  );
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

  return (
    <div className="login-fondo">
      <form className="login-card" onSubmit={onSubmit}>
        <Link to="/" className="login-volver">
          <Icon name="chevronLeft" size={18} />
          <span>Volver al inicio</span>
        </Link>

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

        <div className="login-divisor"><span>o</span></div>
        <div className="login-google">
          <GoogleButton texto="Iniciar sesion con Google" />
        </div>

        <p className="login-enlace">
          No tienes cuenta? <Link to="/registro">Registrate aqui</Link>
        </p>
      </form>
    </div>
  );
}
