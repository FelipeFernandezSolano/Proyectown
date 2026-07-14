import { useEffect, useState } from "react";
import {
  buscarProductos, crearProducto, actualizarProducto, eliminarProducto, getCategorias,
} from "../api/endpoints";
import { formatoUSD, formatoNumero } from "../utils/format";
import { requerido, mayorQueCero } from "../utils/validaciones";
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";
import Icon from "../components/Icon";

const VACIO = {
  nombre: "", descripcion: "", categoriaId: "", costoUnitario: "", precioVenta: "",
  pesoKg: "", largoCm: "", anchoCm: "", altoCm: "", linkProveedor: "", activo: true,
};

const COSTO_KG_REAL = 20;
const COSTO_KG_VOL_EXCEDENTE = 18;

export default function Productos() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === "ADMINISTRADOR";
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [texto, setTexto] = useState("");
  const [modal, setModal] = useState(null);
  const [errores, setErrores] = useState({});
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

  const costoEnvioProducto = (m) => {
    const real = Number(m.pesoKg) || 0;
    const vol = pesoVol(m);
    return (real * COSTO_KG_REAL) + (Math.max(vol - real, 0) * COSTO_KG_VOL_EXCEDENTE);
  };

  const proveedorHref = (url) => {
    if (!url) return "";
    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
  };

  const validar = (m) => {
    const e = {};
    if (!requerido(m.nombre)) e.nombre = "El nombre es obligatorio";
    if (!requerido(m.descripcion)) e.descripcion = "La descripcion es obligatoria";
    if (!m.categoriaId) e.categoriaId = "Selecciona una categoria";
    if (!mayorQueCero(m.costoUnitario)) e.costoUnitario = "Debe ser mayor a 0";
    if (!mayorQueCero(m.precioVenta)) e.precioVenta = "Debe ser mayor a 0";
    if (!mayorQueCero(m.pesoKg)) e.pesoKg = "Debe ser mayor a 0";
    if (!mayorQueCero(m.largoCm)) e.largoCm = "Debe ser mayor a 0";
    if (!mayorQueCero(m.anchoCm)) e.anchoCm = "Debe ser mayor a 0";
    if (!mayorQueCero(m.altoCm)) e.altoCm = "Debe ser mayor a 0";
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
        nombre: modal.nombre.trim(),
        descripcion: modal.descripcion.trim(),
        categoriaId: Number(modal.categoriaId),
        costoUnitario: Number(modal.costoUnitario),
        precioVenta: Number(modal.precioVenta),
        pesoKg: Number(modal.pesoKg),
        largoCm: Number(modal.largoCm),
        anchoCm: Number(modal.anchoCm),
        altoCm: Number(modal.altoCm),
      };
      if (modal.id) await actualizarProducto(modal.id, dto);
      else await crearProducto(dto);
      setModal(null);
      cargar();
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo guardar el producto.");
    }
  };

  const abrir = (datos) => {
    setError("");
    setErrores({});
    setModal(datos);
  };

  const confirmarEliminar = async () => {
    try { await eliminarProducto(aEliminar.id); } catch (_) {}
    setAEliminar(null);
    cargar();
  };

  return (
    <div className="contenido">
      <h2>Productos</h2>
      <p className="subtitulo-pagina">
        {esAdmin
          ? "Catalogo con costo, precio, peso y dimensiones."
          : "Catalogo de productos con peso y dimensiones."}
      </p>
      <p className="texto-tenue nota-tarifa">
        Tarifa de envio: $20 por kg real. Si el peso volumetrico supera al real, solo la diferencia se cobra a $18 por kg.
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <input
          placeholder="Buscar producto..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && cargar()}
          style={{ flex: 1, minWidth: 240, padding: "10px 12px", borderRadius: 8, border: "1px solid var(--pch-borde)" }}
        />
        <button className="btn btn-secundario" onClick={cargar}><Icon name="search" size={15} />Buscar</button>
        {esAdmin && (
          <button className="btn btn-azul" onClick={() => abrir({ ...VACIO })}>
            <Icon name="plus" size={15} />Nuevo producto
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="tabla-pch">
          <thead>
            <tr>
              <th>Producto</th><th>Categoria</th>
              {esAdmin && <><th>Costo</th><th>Venta</th></>}
              <th>Peso</th><th>Volum.</th><th>Dim (LxAxA)</th><th>Envio est.</th><th>Proveedor</th>
              {esAdmin && <th></th>}
            </tr>
          </thead>
          <tbody>
            {productos.length === 0 && (
              <tr><td colSpan={esAdmin ? 10 : 7}><div className="estado-vacio">No hay productos.</div></td></tr>
            )}
            {productos.map((p) => (
              <tr key={p.id} style={{ opacity: p.activo ? 1 : 0.5 }}>
                <td><b>{p.nombre}</b>{!p.activo && <span className="badge badge-gris" style={{ marginLeft: 6 }}>inactivo</span>}</td>
                <td>{p.categoria?.nombre || "-"}</td>
                {esAdmin && <><td>{formatoUSD(p.costoUnitario)}</td><td>{formatoUSD(p.precioVenta)}</td></>}
                <td>{formatoNumero(p.pesoKg)} kg</td>
                <td>{formatoNumero(pesoVol(p))} kg</td>
                <td className="texto-tenue">{formatoNumero(p.largoCm, 0)}x{formatoNumero(p.anchoCm, 0)}x{formatoNumero(p.altoCm, 0)} cm</td>
                <td><b>{formatoUSD(costoEnvioProducto(p))}</b></td>
                <td>
                  {p.linkProveedor ? (
                    <a className="proveedor-link" href={proveedorHref(p.linkProveedor)} target="_blank" rel="noreferrer">
                      Ver proveedor <Icon name="arrowRight" size={13} />
                    </a>
                  ) : "-"}
                </td>
                {esAdmin && (
                  <td>
                    <div className="tabla-acciones">
                      <button className="btn-icono" title="Editar" onClick={() => abrir({ ...p, categoriaId: p.categoria?.id || "" })}><Icon name="edit" size={16} /></button>
                      <button className="btn-icono" title="Desactivar" onClick={() => setAEliminar(p)}><Icon name="trash" size={16} /></button>
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
            <h3>{modal.id ? "Editar producto" : "Nuevo producto"}</h3>
            <div className="form-grid">
              <div className="campo" style={{ gridColumn: "1 / -1" }}><label>Nombre *</label>
                <input value={modal.nombre} onChange={(e) => setModal({ ...modal, nombre: e.target.value })} />
                {errores.nombre && <span className="campo-error">{errores.nombre}</span>}</div>
              <div className="campo" style={{ gridColumn: "1 / -1" }}><label>Descripcion *</label>
                <input value={modal.descripcion} onChange={(e) => setModal({ ...modal, descripcion: e.target.value })} />
                {errores.descripcion && <span className="campo-error">{errores.descripcion}</span>}</div>
              <div className="campo"><label>Categoria *</label>
                <select value={modal.categoriaId || ""} onChange={(e) => setModal({ ...modal, categoriaId: e.target.value })}>
                  <option value="">-- Selecciona --</option>
                  {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                {errores.categoriaId && <span className="campo-error">{errores.categoriaId}</span>}</div>
              <div className="campo"><label>Costo unitario (USD) *</label>
                <input type="number" step="0.01" min="0" value={modal.costoUnitario} onChange={(e) => setModal({ ...modal, costoUnitario: e.target.value })} />
                {errores.costoUnitario && <span className="campo-error">{errores.costoUnitario}</span>}</div>
              <div className="campo"><label>Precio de venta (USD) *</label>
                <input type="number" step="0.01" min="0" value={modal.precioVenta} onChange={(e) => setModal({ ...modal, precioVenta: e.target.value })} />
                {errores.precioVenta && <span className="campo-error">{errores.precioVenta}</span>}</div>
              <div className="campo"><label>Peso real (kg) *</label>
                <input type="number" step="0.01" min="0" value={modal.pesoKg} onChange={(e) => setModal({ ...modal, pesoKg: e.target.value })} />
                {errores.pesoKg && <span className="campo-error">{errores.pesoKg}</span>}</div>
              <div className="campo"><label>Largo (cm) *</label>
                <input type="number" step="0.1" min="0" value={modal.largoCm} onChange={(e) => setModal({ ...modal, largoCm: e.target.value })} />
                {errores.largoCm && <span className="campo-error">{errores.largoCm}</span>}</div>
              <div className="campo"><label>Ancho (cm) *</label>
                <input type="number" step="0.1" min="0" value={modal.anchoCm} onChange={(e) => setModal({ ...modal, anchoCm: e.target.value })} />
                {errores.anchoCm && <span className="campo-error">{errores.anchoCm}</span>}</div>
              <div className="campo"><label>Alto (cm) *</label>
                <input type="number" step="0.1" min="0" value={modal.altoCm} onChange={(e) => setModal({ ...modal, altoCm: e.target.value })} />
                {errores.altoCm && <span className="campo-error">{errores.altoCm}</span>}</div>
              <div className="campo" style={{ gridColumn: "1 / -1" }}><label>Link del proveedor (opcional)</label>
                <input value={modal.linkProveedor || ""} onChange={(e) => setModal({ ...modal, linkProveedor: e.target.value })} /></div>
            </div>
            <p className="texto-tenue">
              Peso volumetrico estimado: <b>{formatoNumero(pesoVol(modal))} kg</b> (LxAxA / 5000).
              {" "}Envio estimado: <b>{formatoUSD(costoEnvioProducto(modal))}</b>.
            </p>
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
        mensaje={aEliminar ? `Desactivar "${aEliminar.nombre}"? No se borra para no afectar pedidos previos.` : ""}
        textoConfirmar="Desactivar"
        onConfirmar={confirmarEliminar}
        onCancelar={() => setAEliminar(null)}
      />
    </div>
  );
}
