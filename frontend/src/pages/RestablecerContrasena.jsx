import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { restablecerContrasena } from "../api/endpoints";
import { validarPasswordSegura } from "../utils/validaciones";
import logo from "../assets/logo-importsmart.svg";
import "./Login.css";

export default function RestablecerContrasena() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [error, setError] = useState("");
  const [listo, setListo] = useState(false);
  const [cargando, setCargando] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError("El enlace de recuperacion no es valido. Solicita uno nuevo.");
      return;
    }
    if (!validarPasswordSegura(password)) {
      setError("La contraseña debe tener al menos 8 caracteres, una mayuscula y un caracter especial.");
      return;
    }
    if (password !== confirmarPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setError("");
    setCargando(true);
    try {
      await restablecerContrasena({ token, password, confirmarPassword });
      setListo(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo restablecer la contraseña.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-fondo">
      <div className="login-card">
        <img src={logo} alt="ImportSmart" className="login-logo" />
        <h2>Restablecer contraseña</h2>
        <p className="login-subtitulo">Elige tu nueva contraseña</p>

        {!token && (
          <p className="login-error">
            Este enlace no es valido o esta incompleto. Solicita uno nuevo desde{" "}
            <Link to="/olvide-contrasena">esta pagina</Link>.
          </p>
        )}

        {listo ? (
          <p className="login-confirmacion">
            Tu contraseña se actualizo correctamente. Te llevaremos al inicio de sesion...
          </p>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="campo">
              <label>Nueva contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimo 8 caracteres"
                required
              />
              <small className="texto-tenue">Debe incluir al menos 1 mayuscula y 1 caracter especial (ej: Clave2026!).</small>
            </div>
            <div className="campo">
              <label>Confirmar contraseña</label>
              <input
                type="password"
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                required
              />
            </div>

            {error && <p className="login-error">{error}</p>}

            <button className="btn btn-azul login-boton" type="submit" disabled={cargando || !token}>
              {cargando ? "Guardando..." : "Restablecer contraseña"}
            </button>

            <p className="login-enlace">
              <Link to="/login">Volver a iniciar sesion</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
