import { useState } from "react";
import { Link } from "react-router-dom";
import { olvideContrasena } from "../api/endpoints";
import { validarEmail } from "../utils/validaciones";
import logo from "../assets/logo-importsmart.svg";
import "./Login.css";

export default function OlvideContrasena() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validarEmail(email)) {
      setError("Ingresa un correo electronico valido.");
      return;
    }

    setError("");
    setCargando(true);
    try {
      await olvideContrasena(email.trim());
      setEnviado(true);
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo procesar la solicitud.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-fondo">
      <div className="login-card">
        <img src={logo} alt="ImportSmart" className="login-logo" />
        <h2>Recuperar contraseña</h2>
        <p className="login-subtitulo">Te enviaremos un enlace para restablecerla</p>

        {enviado ? (
          <>
            <p className="login-confirmacion">
              Si el correo esta registrado, hemos enviado las instrucciones de restablecimiento a tu buzon.
              Revisa tu bandeja de entrada (y la carpeta de spam).
            </p>
            <p className="login-enlace">
              <Link to="/login">Volver a iniciar sesion</Link>
            </p>
          </>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="campo">
              <label>Correo</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@empresa.com"
                required
              />
            </div>

            {error && <p className="login-error">{error}</p>}

            <button className="btn btn-azul login-boton" type="submit" disabled={cargando}>
              {cargando ? "Enviando..." : "Enviar enlace de recuperacion"}
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
