import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo-importsmart.svg";
import "./Login.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [perfil, setPerfil] = useState("ADMINISTRADOR");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const seleccionarPerfil = (valor) => {
    setPerfil(valor);
    if (valor === "CLIENTE") {
      setEmail("cliente@importsmart.com");
      setPassword("cliente123");
    } else {
      setEmail("admin@importsmart.com");
      setPassword("admin123");
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const usuario = await login(email, password);
      navigate(usuario.rol === "ADMINISTRADOR" ? "/" : "/pedidos");
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo iniciar sesion. Revisa tus datos.");
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

        <div className="login-perfiles" aria-label="Tipo de acceso">
          <button
            type="button"
            className={perfil === "ADMINISTRADOR" ? "activo" : ""}
            onClick={() => seleccionarPerfil("ADMINISTRADOR")}
          >
            Administrador
          </button>
          <button
            type="button"
            className={perfil === "CLIENTE" ? "activo" : ""}
            onClick={() => seleccionarPerfil("CLIENTE")}
          >
            Cliente
          </button>
        </div>

        <div className="campo">
          <label>Correo</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@importsmart.com" required />
        </div>
        <div className="campo">
          <label>Contrasena</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="admin123" required />
        </div>

        {error && <p className="login-error">{error}</p>}

        <button className="btn btn-azul login-boton" type="submit" disabled={cargando}>
          {cargando ? "Ingresando..." : "Ingresar"}
        </button>

      </form>
    </div>
  );
}
