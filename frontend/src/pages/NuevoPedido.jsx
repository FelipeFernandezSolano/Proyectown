import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  buscarClientes, getProductosActivos, crearPedido,
} from "../api/endpoints";
import { formatoUSD, formatoNumero, RENTABILIDAD } from "../utils/format";
import Icon from "../components/Icon";

const pesoVol = (l, a, h) => {
  const v = (Number(l) * Number(a) * Number(h)) / 5000;
  return isFinite(v) ? v : 0;
};
const COSTO_KG_REAL = 20;
const COSTO_KG_VOL_EXCEDENTE = 18;
const costoEnvioPeso = (real, vol) => (real * COSTO_KG_REAL) + (Math.max(vol - real, 0) * COSTO_KG_VOL_EXCEDENTE);
const clasificar = (m) => (m >= 25 ? "RENTABLE" : m >= 12 ? "POCO_RENTABLE" : "NO_RENTABLE");

export default function NuevoPedido() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({ clienteId: "", tipoEnvio: "AEREO", descripcion: "", gastosAdicionales: 0 });
  const [items, setItems] = useState([]);
  const [paquetes, setPaquetes] = useState([{ descripcion: "Caja 1", largoCm: 0, anchoCm: 0, altoCm: 0, pesoRealKg: 0 }]);

  useEffect(() => {
    buscarClientes("").then(setClientes).catch(() => {});
    getProductosActivos().then(setProductos).catch(() => {});
  }, []);

  const totales = useMemo(() => {
    let subtotal = 0, totalVenta = 0, real = 0, vol = 0, facturable = 0, costoEnvio = 0;
    items.forEach((it) => {
      const p = productos.find((x) => x.id === Number(it.productoId));
      if (!p) return;
      const cant = Number(it.cantidad) || 0;
      subtotal += Number(it.costoUnitario ?? p.costoUnitario) * cant;
      totalVenta += Number(it.precioVenta ?? p.precioVenta) * cant;
    });
    paquetes.forEach((pk) => {
      const v = pesoVol(pk.largoCm, pk.anchoCm, pk.altoCm);
      const r = Number(pk.pesoRealKg) || 0;
      const f = Math.max(r, v);
      real += r;
      vol += v;
      facturable += f;
      costoEnvio += costoEnvioPeso(r, v);
    });
    const gastos = Number(form.gastosAdicionales) || 0;
    const utilidad = totalVenta - subtotal - costoEnvio - gastos;
    const margen = totalVenta > 0 ? (utilidad / totalVenta) * 100 : 0;
    return { subtotal, totalVenta, real, vol, facturable, costoEnvio, utilidad, margen, rentabilidad: clasificar(margen) };
  }, [items, paquetes, productos, form.gastosAdicionales]);

  const addItem = () => setItems([...items, { productoId: "", cantidad: 1, costoUnitario: null, precioVenta: null }]);
  const setItem = (i, campo, val) => {
    const copia = [...items];
    copia[i] = { ...copia[i], [campo]: val };
    if (campo === "productoId") {
      const p = productos.find((x) => x.id === Number(val));
      if (p) { copia[i].costoUnitario = p.costoUnitario; copia[i].precioVenta = p.precioVenta; }
    }
    setItems(copia);
  };
  const delItem = (i) => setItems(items.filter((_, j) => j !== i));

  const addPaquete = () => setPaquetes([...paquetes, { descripcion: `Caja ${paquetes.length + 1}`, largoCm: 0, anchoCm: 0, altoCm: 0, pesoRealKg: 0 }]);
  const setPaquete = (i, campo, val) => {
    const copia = [...paquetes];
    copia[i] = { ...copia[i], [campo]: val };
    setPaquetes(copia);
  };
  const delPaquete = (i) => setPaquetes(paquetes.filter((_, j) => j !== i));

  const guardar = async () => {
    setError("");
    if (!form.clienteId) { setError("Selecciona una empresa cliente."); return; }
    if (items.length === 0) { setError("Agrega al menos un producto."); return; }
    setGuardando(true);
    try {
      const dto = {
        clienteId: Number(form.clienteId),
        tipoEnvio: form.tipoEnvio,
        descripcion: form.descripcion || items.map((it) => productos.find((p) => p.id === Number(it.productoId))?.nombre).filter(Boolean).join(", "),
        gastosAdicionales: Number(form.gastosAdicionales) || 0,
        items: items.filter((it) => it.productoId).map((it) => ({
          productoId: Number(it.productoId), cantidad: Number(it.cantidad) || 1,
          costoUnitario: Number(it.costoUnitario), precioVenta: Number(it.precioVenta),
        })),
        paquetes: paquetes.map((pk) => ({
          descripcion: pk.descripcion, largoCm: Number(pk.largoCm), anchoCm: Number(pk.anchoCm),
          altoCm: Number(pk.altoCm), pesoRealKg: Number(pk.pesoRealKg),
        })),
      };
      await crearPedido(dto);
      navigate("/pedidos");
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo crear el pedido.");
    } finally {
      setGuardando(false);
    }
  };

  const rent = RENTABILIDAD[totales.rentabilidad];

  return (
    <div className="contenido">
      <div className="page-header">
        <div>
          <span className="page-kicker"><Icon name="plus" size={13} /> Cotizacion operativa</span>
          <h2>Nuevo pedido de importacion</h2>
          <p className="subtitulo-pagina">Calcula peso volumetrico, envio, utilidad y rentabilidad antes de aprobar la compra.</p>
        </div>
      </div>

      <div className="split-workspace">
        <div className="stack">
          <div className="card">
            <h3 className="card-titulo"><span className="icono-titulo"><Icon name="users" size={16} /></span>1. Datos comerciales</h3>
            <div className="form-grid">
              <div className="campo"><label>Empresa cliente *</label>
                <select value={form.clienteId} onChange={(e) => setForm({ ...form, clienteId: e.target.value })}>
                  <option value="">-- Selecciona --</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select></div>
              <div className="campo"><label>Modalidad de envio</label>
                <select value={form.tipoEnvio} onChange={(e) => setForm({ ...form, tipoEnvio: e.target.value })}>
                  <option value="AEREO">Aereo</option>
                  <option value="MARITIMO">Maritimo</option>
                </select></div>
              <div className="campo"><label>Gastos adicionales (USD)</label>
                <input type="number" step="0.01" min="0" value={form.gastosAdicionales} onChange={(e) => setForm({ ...form, gastosAdicionales: e.target.value })} /></div>
              <div className="campo" style={{ gridColumn: "1 / -1" }}><label>Descripcion (opcional)</label>
                <input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Se genera con los productos si se deja vacio" /></div>
            </div>
          </div>

          <div className="card">
            <h3 className="card-titulo"><span className="icono-titulo"><Icon name="tag" size={16} /></span>2. Productos del pedido</h3>
            {items.length === 0 && <div className="estado-vacio">Agrega productos para calcular venta, costos y utilidad.</div>}
            {items.map((it, i) => (
              <div key={i} className="form-row">
                <div className="campo" style={{ flex: 2, minWidth: 220 }}><label>Producto</label>
                  <select value={it.productoId} onChange={(e) => setItem(i, "productoId", e.target.value)}>
                    <option value="">-- Selecciona --</option>
                    {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select></div>
                <div className="campo" style={{ width: 90 }}><label>Cant.</label>
                  <input type="number" min="1" value={it.cantidad} onChange={(e) => setItem(i, "cantidad", e.target.value)} /></div>
                <div className="campo" style={{ width: 130 }}><label>Venta USD</label>
                  <input type="number" step="0.01" value={it.precioVenta ?? ""} onChange={(e) => setItem(i, "precioVenta", e.target.value)} /></div>
                <button className="btn-icono" onClick={() => delItem(i)}><Icon name="trash" size={16} /></button>
              </div>
            ))}
            <button className="btn btn-secundario mini-boton" onClick={addItem}><Icon name="plus" size={14} />Agregar producto</button>
          </div>

          <div className="card">
            <h3 className="card-titulo"><span className="icono-titulo"><Icon name="box" size={16} /></span>3. Paquetes y peso</h3>
            {paquetes.map((pk, i) => (
              <div key={i} className="form-row">
                <div className="campo" style={{ flex: 1, minWidth: 130 }}><label>Descripcion</label>
                  <input value={pk.descripcion} onChange={(e) => setPaquete(i, "descripcion", e.target.value)} /></div>
                <div className="campo" style={{ width: 90 }}><label>Largo</label>
                  <input type="number" step="0.1" min="0" value={pk.largoCm} onChange={(e) => setPaquete(i, "largoCm", e.target.value)} /></div>
                <div className="campo" style={{ width: 90 }}><label>Ancho</label>
                  <input type="number" step="0.1" min="0" value={pk.anchoCm} onChange={(e) => setPaquete(i, "anchoCm", e.target.value)} /></div>
                <div className="campo" style={{ width: 90 }}><label>Alto</label>
                  <input type="number" step="0.1" min="0" value={pk.altoCm} onChange={(e) => setPaquete(i, "altoCm", e.target.value)} /></div>
                <div className="campo" style={{ width: 100 }}><label>Peso real</label>
                  <input type="number" step="0.01" min="0" value={pk.pesoRealKg} onChange={(e) => setPaquete(i, "pesoRealKg", e.target.value)} /></div>
                <span className="metric-box" style={{ padding: "8px 10px" }}><span>Vol.</span><b>{formatoNumero(pesoVol(pk.largoCm, pk.anchoCm, pk.altoCm))} kg</b></span>
                <button className="btn-icono" onClick={() => delPaquete(i)}><Icon name="trash" size={16} /></button>
              </div>
            ))}
            <button className="btn btn-secundario mini-boton" onClick={addPaquete}><Icon name="plus" size={14} />Agregar paquete</button>
            <p className="texto-tenue nota-tarifa">
              Tarifa de envio: $20 por kg real. Si el peso volumetrico supera al real, solo la diferencia se cobra a $18 por kg.
            </p>
          </div>
        </div>

        <aside className="card summary-sidebar">
          <h3 className="card-titulo"><span className="icono-titulo"><Icon name="calculator" size={16} /></span>Resumen de cotización</h3>
          <div className="fila-total-form">
            <div><span>Peso facturable</span><b>{formatoNumero(totales.facturable)} kg</b></div>
            <div><span>Costo envio</span><b>{formatoUSD(totales.costoEnvio)}</b></div>
            <div><span>Subtotal</span><b>{formatoUSD(totales.subtotal)}</b></div>
            <div><span>Total venta</span><b>{formatoUSD(totales.totalVenta)}</b></div>
            <div><span>Utilidad ({formatoNumero(totales.margen)}%)</span>
              <b className={totales.utilidad >= 0 ? "num-positivo" : "num-negativo"}>{formatoUSD(totales.utilidad)}</b></div>
            <div className="metric-rentabilidad"><span>Rentabilidad</span><b><span className="semaforo"><span className="punto" style={{ background: rent.punto }} />{rent.texto}</span></b></div>
          </div>
          <div className="alert-item" style={{ marginTop: 14 }}>
            <span className={`alert-icon ${totales.rentabilidad === "RENTABLE" ? "verde" : totales.rentabilidad === "POCO_RENTABLE" ? "ambar" : "rojo"}`}>
              <Icon name={totales.rentabilidad === "RENTABLE" ? "check" : "clock"} size={15} />
            </span>
            <div>
              <strong>{totales.rentabilidad === "RENTABLE" ? "Pedido defendible" : "Revise el margen"}</strong>
              <p>Use este resumen para decidir precio, modalidad y empaque antes de registrar el pedido.</p>
            </div>
          </div>
          {error && <p className="mensaje-info mensaje-error">{error}</p>}
          <div className="modal-acciones">
            <button className="btn btn-secundario" onClick={() => navigate("/pedidos")}>Cancelar</button>
            <button className="btn btn-azul" onClick={guardar} disabled={guardando}>
              {guardando ? "Guardando..." : "Crear pedido"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
