import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import { validarEmail, validarTelefono, validarPasswordSegura } from "../utils/validaciones";
import logo from "../assets/logo-importsmart.svg";
import "./Login.css";

const GOOGLE_HABILITADO = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

export default function Registro() {
  const { registrar, loginConGoogle } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", password: "", confirmarPassword: "" });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const irAlPanel = (usuario) => navigate(usuario.rol === "ADMINISTRADOR" ? "/dashboard" : "/pedidos");

  const validar = () => {
    if (!form.nombre.trim()) return "El nombre completo es obligatorio.";
    if (!validarEmail(form.email)) return "Ingresa un correo electronico valido.";
    if (!validarTelefono(form.telefono)) return "Ingresa un telefono valido (minimo 8 digitos).";
    if (!validarPasswordSegura(form.password)) {
      return "La contraseña debe tener al menos 8 caracteres, una mayuscula y un caracter especial.";
    }
    if (form.password !== form.confirmarPassword) return "Las contraseñas no coinciden.";
    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const msg = validar();
    if (msg) { setError(msg); return; }

    setError("");
    setCargando(true);
    try {
      const usuario = await registrar({
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        telefono: form.telefono.trim(),
        password: form.password,
        confirmarPassword: form.confirmarPassword,
      });
      irAlPanel(usuario);
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo completar el registro.");
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
      setError(err.response?.data?.mensaje || "No se pudo completar el registro con Google.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-fondo">
      <form className="login-card" onSubmit={onSubmit}>
        <img src={logo} alt="ImportSmart" className="login-logo" />
        <h2>Crear cuenta</h2>
        <p className="login-subtitulo">Registrate para cotizar y seguir tus importaciones</p>

        <div className="campo">
          <label>Nombre completo</label>
          <input type="text" value={form.nombre} onChange={set("nombre")} placeholder="Tu nombre completo" required />
        </div>
        <div className="campo">
          <label>Correo</label>
          <input type="email" value={form.email} onChange={set("email")} placeholder="correo@empresa.com" required />
        </div>
        <div className="campo">
          <label>Telefono</label>
          <input type="tel" value={form.telefono} onChange={set("telefono")} placeholder="8888-8888" required />
        </div>
        <div className="campo">
          <label>Contraseña</label>
          <input type="password" value={form.password} onChange={set("password")} placeholder="Minimo 8 caracteres" required />
          <small className="texto-tenue">Debe incluir al menos 1 mayuscula y 1 caracter especial (ej: Clave2026!).</small>
        </div>
        <div className="campo">
          <label>Confirmar contraseña</label>
          <input type="password" value={form.confirmarPassword} onChange={set("confirmarPassword")} placeholder="Repite tu contraseña" required />
        </div>

        {error && <p className="login-error">{error}</p>}

        <button className="btn btn-azul login-boton" type="submit" disabled={cargando}>
          {cargando ? "Creando cuenta..." : "Crear cuenta"}
        </button>

        {GOOGLE_HABILITADO && (
          <>
            <div className="login-divisor"><span>o</span></div>
            <div className="login-google">
              <GoogleLogin
                onSuccess={onGoogleExito}
                onError={() => setError("No se pudo completar el registro con Google.")}
                text="signup_with"
                shape="pill"
                width="100%"
              />
            </div>
          </>
        )}

        <p className="login-enlace">
          Ya tienes cuenta? <Link to="/login">Inicia sesion aqui</Link>
        </p>
      </form>
    </div>
  );
}
