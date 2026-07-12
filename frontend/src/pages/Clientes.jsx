import { useEffect, useState } from "react";
import { buscarClientes, crearCliente, actualizarCliente, eliminarCliente } from "../api/endpoints";
import { requerido, validarEmail, validarTelefono } from "../utils/validaciones";
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";
import Icon from "../components/Icon";

const VACIO = { nombre: "", contacto: "", email: "", telefono: "", pais: "Costa Rica", direccion: "" };

export default function Clientes() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === "ADMINISTRADOR";
  const [clientes, setClientes] = useState([]);
  const [texto, setTexto] = useState("");
  const [modal, setModal] = useState(null);
  const [errores, setErrores] = useState({});
  const [aEliminar, setAEliminar] = useState(null);
  const [error, setError] = useState("");

  const cargar = () => buscarClientes(texto).then(setClientes).catch(() => setClientes([]));
  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, []);

  const validar = (m) => {
    const e = {};
    if (!requerido(m.nombre)) e.nombre = "El nombre de la empresa es obligatorio";
    if (!requerido(m.contacto)) e.contacto = "El contacto es obligatorio";
    if (!requerido(m.telefono)) e.telefono = "El telefono es obligatorio";
    else if (!validarTelefono(m.telefono)) e.telefono = "Solo numeros (minimo 8 digitos)";
    if (!requerido(m.email)) e.email = "El email es obligatorio";
    else if (!validarEmail(m.email)) e.email = "Email invalido (debe incluir @ y dominio)";
    if (!requerido(m.pais)) e.pais = "El pais es obligatorio";
    if (!requerido(m.direccion)) e.direccion = "La direccion es obligatoria";
    return e;
  };

  const guardar = async (ev) => {
    ev.preventDefault();
    setError("");
    const errs = validar(modal);
    setErrores(errs);
    if (Object.keys(errs).length > 0) return;
    try {
      const dto = {
        ...modal,
        nombre: modal.nombre.trim(), contacto: modal.contacto.trim(),
        email: modal.email.trim(), telefono: modal.telefono.trim(),
        pais: modal.pais.trim(), direccion: modal.direccion.trim(),
      };
      if (modal.id) await actualizarCliente(modal.id, dto);
      else await crearCliente(dto);
      setModal(null);
      cargar();
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo guardar la empresa.");
    }
  };

  const abrir = (datos) => { setError(""); setErrores({}); setModal(datos); };

  const confirmarEliminar = async () => {
    try { await eliminarCliente(aEliminar.id); } catch (_) {}
    setAEliminar(null);
    cargar();
  };

  return (
    <div className="contenido">
      <h2>Empresas cliente</h2>
      <p className="subtitulo-pagina">
        {esAdmin ? "Registra y administra las empresas que importan contigo." : "Consulta de empresas (solo lectura)."}
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <input
          placeholder="Buscar por nombre, contacto o numero…"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && cargar()}
          style={{ flex: 1, minWidth: 240, padding: "10px 12px", borderRadius: 8, border: "1px solid var(--pch-borde)" }}
        />
        <button className="btn btn-secundario" onClick={cargar}><Icon name="search" size={15} />Buscar</button>
        {esAdmin && (
          <button className="btn btn-azul" onClick={() => abrir({ ...VACIO })}>
            <Icon name="plus" size={15} />Nueva empresa
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="tabla-pch">
          <thead>
            <tr>
              <th>Numero</th><th>Empresa</th><th>Contacto</th><th>Telefono</th><th>Pais</th>{esAdmin && <th></th>}
            </tr>
          </thead>
          <tbody>
            {clientes.length === 0 && (
              <tr><td colSpan={esAdmin ? 6 : 5}><div className="estado-vacio">No hay empresas registradas.</div></td></tr>
            )}
            {clientes.map((c) => (
              <tr key={c.id}>
                <td>{c.numeroCliente}</td>
                <td><b>{c.nombre}</b></td>
                <td>{c.contacto || "-"}</td>
                <td>{c.telefono || "-"}</td>
                <td>{c.pais || "-"}</td>
                {esAdmin && (
                  <td>
                    <div className="tabla-acciones">
                      <button className="btn-icono" title="Editar" onClick={() => abrir({ ...c })}><Icon name="edit" size={16} /></button>
                      <button className="btn-icono" title="Eliminar" onClick={() => setAEliminar(c)}><Icon name="trash" size={16} /></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && esAdmin && (
        <div className="modal-fondo" onClick={() => setModal(null)}>
          <form className="modal-caja modal-ancha" onClick={(e) => e.stopPropagation()} onSubmit={guardar} noValidate>
            <h3>{modal.id ? "Editar empresa" : "Nueva empresa"}</h3>
            <div className="form-grid">
              <div className="campo"><label>Nombre de la empresa *</label>
                <input value={modal.nombre} onChange={(e) => setModal({ ...modal, nombre: e.target.value })} />
                {errores.nombre && <span className="campo-error">{errores.nombre}</span>}</div>
              <div className="campo"><label>Persona de contacto *</label>
                <input value={modal.contacto} onChange={(e) => setModal({ ...modal, contacto: e.target.value })} />
                {errores.contacto && <span className="campo-error">{errores.contacto}</span>}</div>
              <div className="campo"><label>Telefono *</label>
                <input value={modal.telefono} onChange={(e) => setModal({ ...modal, telefono: e.target.value })} placeholder="Solo numeros" />
                {errores.telefono && <span className="campo-error">{errores.telefono}</span>}</div>
              <div className="campo"><label>Email *</label>
                <input value={modal.email} onChange={(e) => setModal({ ...modal, email: e.target.value })} placeholder="empresa@correo.com" />
                {errores.email && <span className="campo-error">{errores.email}</span>}</div>
              <div className="campo"><label>Pais *</label>
                <input value={modal.pais} onChange={(e) => setModal({ ...modal, pais: e.target.value })} />
                {errores.pais && <span className="campo-error">{errores.pais}</span>}</div>
              <div className="campo" style={{ gridColumn: "1 / -1" }}><label>Direccion *</label>
                <input value={modal.direccion} onChange={(e) => setModal({ ...modal, direccion: e.target.value })} />
                {errores.direccion && <span className="campo-error">{errores.direccion}</span>}</div>
            </div>
            {error && <p className="mensaje-info mensaje-error">{error}</p>}
            <div className="modal-acciones">
              <button type="button" className="btn btn-secundario" onClick={() => setModal(null)}>Cancelar</button>
              <button type="submit" className="btn btn-azul">Guardar</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        abierto={!!aEliminar}
        titulo="Eliminar empresa"
        mensaje={aEliminar ? `¿Eliminar a ${aEliminar.nombre}?` : ""}
        onConfirmar={confirmarEliminar}
        onCancelar={() => setAEliminar(null)}
      />
    </div>
  );
}
