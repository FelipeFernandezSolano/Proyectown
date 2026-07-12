import { useEffect, useState } from "react";
import {
  buscarProductos, crearProducto, actualizarProducto, eliminarProducto, getCategorias,
} from "../api/endpoints";
import { formatoUSD, formatoNumero } from "../utils/format";
import ConfirmDialog from "../components/ConfirmDialog";
import Icon from "../components/Icon";

const VACIO = {
  nombre: "", descripcion: "", categoriaId: "", costoUnitario: 0, precioVenta: 0,
  pesoKg: 0, largoCm: 0, anchoCm: 0, altoCm: 0, linkProveedor: "", activo: true,
};

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [texto, setTexto] = useState("");
  const [modal, setModal] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);
  const [error, setError] = useState("");

  const cargar = () => buscarProductos(texto).then(setProductos).catch(() => setProductos([]));
  useEffect(() => {
    cargar();
    getCategorias().then(setCategorias).catch(() => setCategorias([]));
    /* eslint-disable-next-line */
  }, []);

  const pesoVol = (m) => {
    const v = (Number(m.largoCm) * Number(m.anchoCm) * Number(m.altoCm)) / 5000;
    return isFinite(v) ? v : 0;
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const dto = { ...modal, categoriaId: modal.categoriaId || null };
      if (modal.id) await actualizarProducto(modal.id, dto);
      else await crearProducto(dto);
      setModal(null);
      cargar();
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo guardar el producto.");
    }
  };

  const confirmarEliminar = async () => {
    try { await eliminarProducto(aEliminar.id); } catch (_) {}
    setAEliminar(null);
    cargar();
  };

  return (
    <div className="contenido">
      <h2>Productos</h2>
      <p className="subtitulo-pagina">Catalogo con costo, precio, peso y dimensiones (base del calculo volumetrico).</p>

      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <input
          placeholder="Buscar producto…"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && cargar()}
          style={{ flex: 1, minWidth: 240, padding: "10px 12px", borderRadius: 8, border: "1px solid var(--pch-borde)" }}
        />
        <button className="btn btn-secundario" onClick={cargar}><Icon name="search" size={15} />Buscar</button>
        <button className="btn btn-azul" onClick={() => { setError(""); setModal({ ...VACIO }); }}>
          <Icon name="plus" size={15} />Nuevo producto
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="tabla-pch">
          <thead>
            <tr>
              <th>Producto</th><th>Categoria</th><th>Costo</th><th>Venta</th>
              <th>Peso</th><th>Dim (L×A×A)</th><th></th>
            </tr>
          </thead>
          <tbody>
            {productos.length === 0 && (
              <tr><td colSpan={7}><div className="estado-vacio">No hay productos.</div></td></tr>
            )}
            {productos.map((p) => (
              <tr key={p.id} style={{ opacity: p.activo ? 1 : 0.5 }}>
                <td><b>{p.nombre}</b>{!p.activo && <span className="badge badge-gris" style={{ marginLeft: 6 }}>inactivo</span>}</td>
                <td>{p.categoria?.nombre || "-"}</td>
                <td>{formatoUSD(p.costoUnitario)}</td>
                <td>{formatoUSD(p.precioVenta)}</td>
                <td>{formatoNumero(p.pesoKg)} kg</td>
                <td className="texto-tenue">{formatoNumero(p.largoCm, 0)}×{formatoNumero(p.anchoCm, 0)}×{formatoNumero(p.altoCm, 0)} cm</td>
                <td>
                  <div className="tabla-acciones">
                    <button className="btn-icono" title="Editar" onClick={() => { setError(""); setModal({ ...p, categoriaId: p.categoria?.id || "" }); }}><Icon name="edit" size={16} /></button>
                    <button className="btn-icono" title="Desactivar" onClick={() => setAEliminar(p)}><Icon name="trash" size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-fondo" onClick={() => setModal(null)}>
          <form className="modal-caja modal-ancha" onClick={(e) => e.stopPropagation()} onSubmit={guardar}>
            <h3>{modal.id ? "Editar producto" : "Nuevo producto"}</h3>
            <div className="form-grid">
              <div className="campo" style={{ gridColumn: "1 / -1" }}><label>Nombre *</label>
                <input value={modal.nombre} onChange={(e) => setModal({ ...modal, nombre: e.target.value })} required /></div>
              <div className="campo" style={{ gridColumn: "1 / -1" }}><label>Descripcion</label>
                <input value={modal.descripcion || ""} onChange={(e) => setModal({ ...modal, descripcion: e.target.value })} /></div>
              <div className="campo"><label>Categoria</label>
                <select value={modal.categoriaId || ""} onChange={(e) => setModal({ ...modal, categoriaId: e.target.value })}>
                  <option value="">— Sin categoria —</option>
                  {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select></div>
              <div className="campo"><label>Costo unitario (USD)</label>
                <input type="number" step="0.01" min="0" value={modal.costoUnitario} onChange={(e) => setModal({ ...modal, costoUnitario: e.target.value })} /></div>
              <div className="campo"><label>Precio de venta (USD)</label>
                <input type="number" step="0.01" min="0" value={modal.precioVenta} onChange={(e) => setModal({ ...modal, precioVenta: e.target.value })} /></div>
              <div className="campo"><label>Peso real (kg)</label>
                <input type="number" step="0.01" min="0" value={modal.pesoKg} onChange={(e) => setModal({ ...modal, pesoKg: e.target.value })} /></div>
              <div className="campo"><label>Largo (cm)</label>
                <input type="number" step="0.1" min="0" value={modal.largoCm} onChange={(e) => setModal({ ...modal, largoCm: e.target.value })} /></div>
              <div className="campo"><label>Ancho (cm)</label>
                <input type="number" step="0.1" min="0" value={modal.anchoCm} onChange={(e) => setModal({ ...modal, anchoCm: e.target.value })} /></div>
              <div className="campo"><label>Alto (cm)</label>
                <input type="number" step="0.1" min="0" value={modal.altoCm} onChange={(e) => setModal({ ...modal, altoCm: e.target.value })} /></div>
              <div className="campo" style={{ gridColumn: "1 / -1" }}><label>Link del proveedor</label>
                <input value={modal.linkProveedor || ""} onChange={(e) => setModal({ ...modal, linkProveedor: e.target.value })} /></div>
            </div>
            <p className="texto-tenue">Peso volumetrico estimado: <b>{formatoNumero(pesoVol(modal))} kg</b> (L×A×A / 5000)</p>
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
        titulo="Desactivar producto"
        mensaje={aEliminar ? `¿Desactivar "${aEliminar.nombre}"? No se borra para no afectar pedidos previos.` : ""}
        textoConfirmar="Desactivar"
        onConfirmar={confirmarEliminar}
        onCancelar={() => setAEliminar(null)}
      />
    </div>
  );
}
