import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getTipoCambio } from "../api/endpoints";
import { formatoNumero } from "../utils/format";
import Icon from "./Icon";
import logo from "../assets/logo-importsmart.svg";
import "./Navbar.css";

const enlaces = [
  { to: "/", label: "Dashboard", exact: true, icono: "dashboard", soloAdmin: true },
  { to: "/pedidos", label: "Pedidos", icono: "box" },
  { to: "/nuevo-pedido", label: "Nuevo pedido", icono: "plus", soloAdmin: true },
  { to: "/simulador", label: "Simulador", icono: "calculator" },
  { to: "/clientes", label: "Clientes", icono: "users" },
  { to: "/productos", label: "Productos", icono: "tag" },
];

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [tc, setTc] = useState(null);
  const esAdmin = usuario?.rol === "ADMINISTRADOR";

  useEffect(() => {
    getTipoCambio().then(setTc).catch(() => setTc(null));
  }, []);

  const salir = () => {
    logout();
    navigate("/login");
  };

  const visibles = enlaces.filter((e) => !e.soloAdmin || esAdmin);

  return (
    <header className="pch-navbar">
      <div className="pch-navbar-marca">
        <img src={logo} alt="ImportSmart" className="pch-navbar-logo" />
      </div>

      <nav className="pch-navbar-links">
        {visibles.map((enlace) => (
          <NavLink
            key={enlace.to}
            to={enlace.to}
            end={enlace.exact}
            className={({ isActive }) => "pch-navlink" + (isActive ? " activo" : "")}
          >
            <Icon name={enlace.icono} size={16} />
            {enlace.label}
          </NavLink>
        ))}
      </nav>

      <div className="pch-navbar-usuario">
        {tc && (
          <span className="tc-chip" title={"Fuente: " + tc.fuente}>
            <Icon name="exchange" size={14} />
            1&nbsp;USD = {formatoNumero(tc.colonesPorDolar, 2)}&nbsp;CRC
          </span>
        )}
        <span className="pch-navbar-avatar"><Icon name="user" size={18} /></span>
        <span>{usuario?.nombre}</span>
        <span className={"badge " + (esAdmin ? "badge-azul" : "badge-gris")}>{esAdmin ? "Administrador" : "Operador"}</span>
        <button className="btn btn-secundario" onClick={salir}>
          <Icon name="logout" size={14} />
          Salir
        </button>
      </div>
    </header>
  );
}
