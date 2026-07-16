import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  buscarClientes, getProductosActivos, crearPedido, crearCliente, crearProducto, getCategorias,
} from "../api/endpoints";
import { formatoUSD, formatoNumero, RENTABILIDAD } from "../utils/format";
import Icon from "../components/Icon";
import AutocompleteInput from "../components/AutocompleteInput";

const pesoVol = (l, a, h) => {
  const v = ((Number(l) * Number(a) * Number(h)) / 1000000) * 168;
  return isFinite(v) ? v : 0;
};
const COSTO_KG_REAL = 20;
const COSTO_KG_VOL_EXCEDENTE = 18;
const volumenM3 = (l, a, h) => {
  const v = (Number(l) * Number(a) * Number(h)) / 1000000;
  return isFinite(v) ? v : 0;
};
const costoEnvioPeso = (real, vol, tipoEnvio, pk) => {
  if (tipoEnvio === "MARITIMO") return volumenM3(pk.largoCm, pk.anchoCm, pk.altoCm) * 850;
  return (real * COSTO_KG_REAL) + (Math.max(vol - real, 0) * COSTO_KG_VOL_EXCEDENTE);
};
const clasificar = (m) => (m >= 25 ? "RENTABLE" : m >= 12 ? "POCO_RENTABLE" : "NO_RENTABLE");

export default function NuevoPedido() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [clienteTexto, setClienteTexto] = useState("");
  const [modalCliente, setModalCliente] = useState(null);
  const [modalProducto, setModalProducto] = useState(null);
  const [productoIndex, setProductoIndex] = useState(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({ clienteId: "", tipoEnvio: "AEREO", descripcion: "", gastosAdicionales: 0 });
  const [items, setItems] = useState([]);
  const [paquetes, setPaquetes] = useState([{ descripcion: "Caja 1", largoCm: 0, anchoCm: 0, altoCm: 0, pesoRealKg: 0 }]);

  useEffect(() => {
    buscarClientes("").then(setClientes).catch(() => {});
    getProductosActivos().then(setProductos).catch(() => {});
    getCategorias().then(setCategorias).catch(() => {});
  }, []);

  const normalizar = (v) => String(v || "").trim().toLowerCase();
  const clienteExacto = clientes.find((c) => normalizar(c.nombre) === normalizar(clienteTexto));
  const debeRegistrarCliente = clienteTexto.trim() && !clienteExacto && !form.clienteId;

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
      costoEnvio += costoEnvioPeso(r, v, form.tipoEnvio, pk);
    });
    const gastos = Number(form.gastosAdicionales) || 0;
    const utilidad = totalVenta - subtotal - costoEnvio - gastos;
    const margen = totalVenta > 0 ? (utilidad / totalVenta) * 100 : 0;
    return { subtotal, totalVenta, real, vol, facturable, costoEnvio, utilidad, margen, rentabilidad: clasificar(margen) };
  }, [items, paquetes, productos, form.gastosAdicionales, form.tipoEnvio]);

  const addItem = () => setItems([...items, { productoId: "", productoTexto: "", cantidad: 1, costoUnitario: null, precioVenta: null }]);
  const setItem = (i, campo, val) => {
    const copia = [...items];
    copia[i] = { ...copia[i], [campo]: val };
    if (campo === "productoTexto") {
      const p = productos.find((x) => normalizar(x.nombre) === normalizar(val));
      if (p) {
        copia[i].productoId = p.id;
        copia[i].costoUnitario = p.costoUnitario;
        copia[i].precioVenta = p.precioVenta;
      } else {
        copia[i].productoId = "";
        copia[i].costoUnitario = null;
        copia[i].precioVenta = null;
      }
    }
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

  const seleccionarClienteTexto = (valor) => {
    setClienteTexto(valor);
    const c = clientes.find((x) => normalizar(x.nombre) === normalizar(valor));
    setForm({ ...form, clienteId: c ? c.id : "" });
  };

  const guardarClienteRapido = async (ev) => {
    ev.preventDefault();
    setError("");
    try {
      const nuevo = await crearCliente(modalCliente);
      setClientes([...clientes, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setForm({ ...form, clienteId: nuevo.id });
      setClienteTexto(nuevo.nombre);
      setModalCliente(null);
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo registrar la empresa.");
    }
  };

  const guardarProductoRapido = async (ev) => {
    ev.preventDefault();
    setError("");
    try {
      const dto = {
        ...modalProducto,
        categoriaId: Number(modalProducto.categoriaId),
        costoUnitario: Number(modalProducto.costoUnitario),
        precioVenta: Number(modalProducto.precioVenta),
        pesoKg: Number(modalProducto.pesoKg),
        largoCm: Number(modalProducto.largoCm),
        anchoCm: Number(modalProducto.anchoCm),
        altoCm: Number(modalProducto.altoCm),
        activo: true,
      };
      const nuevo = await crearProducto(dto);
      setProductos([...productos, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      if (productoIndex !== null) {
        const copia = [...items];
        copia[productoIndex] = {
          ...copia[productoIndex],
          productoId: nuevo.id,
          productoTexto: nuevo.nombre,
          costoUnitario: nuevo.costoUnitario,
          precioVenta: nuevo.precioVenta,
        };
        setItems(copia);
      }
      setModalProducto(null);
      setProductoIndex(null);
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo registrar el producto.");
    }
  };

  const guardar = async () => {
    setError("");
    if (!form.clienteId) { setError("Selecciona una empresa cliente."); return; }
    const itemsValidos = items.filter((it) => it.productoId);
    if (itemsValidos.length === 0) { setError("Agrega al menos un producto registrado."); return; }
    setGuardando(true);
    try {
      const dto = {
        clienteId: Number(form.clienteId),
        tipoEnvio: form.tipoEnvio,
        descripcion: form.descripcion || items.map((it) => productos.find((p) => p.id === Number(it.productoId))?.nombre).filter(Boolean).join(", "),
        gastosAdicionales: Number(form.gastosAdicionales) || 0,
        items: itemsValidos.map((it) => ({
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
                <AutocompleteInput
                  value={clienteTexto}
                  onChange={seleccionarClienteTexto}
                  options={clientes.map((c) => c.nombre)}
                  placeholder="Escriba el nombre de la empresa"
                />
                {debeRegistrarCliente && (
                  <button
                    type="button"
                    className="btn btn-secundario mini-boton btn-inline-form"
                    onClick={() => setModalCliente({
                      nombre: clienteTexto,
                      contacto: "",
                      email: "",
                      telefono: "",
                      pais: "Costa Rica",
                      direccion: "",
                    })}
                  >
                    <Icon name="plus" size={14} />Registrar empresa
                  </button>
                )}
              </div>
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
                  <AutocompleteInput
                    value={it.productoTexto || ""}
                    onChange={(valor) => setItem(i, "productoTexto", valor)}
                    options={productos.map((p) => p.nombre)}
                    placeholder="Escriba el producto"
                  />
                  {(it.productoTexto || "").trim() && !it.productoId && (
                    <button
                      type="button"
                      className="btn btn-secundario mini-boton btn-inline-form"
                      onClick={() => {
                        setProductoIndex(i);
                        setModalProducto({
                          nombre: it.productoTexto,
                          descripcion: it.productoTexto,
                          categoriaId: categorias[0]?.id || "",
                          costoUnitario: "",
                          precioVenta: it.precioVenta || "",
                          pesoKg: "",
                          largoCm: "",
                          anchoCm: "",
                          altoCm: "",
                          linkProveedor: "",
                        });
                      }}
                    >
                      <Icon name="plus" size={14} />Registrar producto
                    </button>
                  )}
                </div>
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
              Aereo: peso volumetrico = m3 x 168; kg real a $20 y excedente volumetrico a $18.
              Maritimo: m3 x $850.
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

      {modalCliente && (
        <div className="modal-fondo" onClick={() => setModalCliente(null)}>
          <form className="modal-caja modal-ancha" onClick={(e) => e.stopPropagation()} onSubmit={guardarClienteRapido}>
            <h3>Registrar empresa cliente</h3>
            <div className="form-grid">
              <div className="campo"><label>Nombre *</label>
                <input value={modalCliente.nombre} onChange={(e) => setModalCliente({ ...modalCliente, nombre: e.target.value })} required /></div>
              <div className="campo"><label>Contacto *</label>
                <input value={modalCliente.contacto} onChange={(e) => setModalCliente({ ...modalCliente, contacto: e.target.value })} required /></div>
              <div className="campo"><label>Email *</label>
                <input type="email" value={modalCliente.email} onChange={(e) => setModalCliente({ ...modalCliente, email: e.target.value })} required /></div>
              <div className="campo"><label>Telefono *</label>
                <input value={modalCliente.telefono} onChange={(e) => setModalCliente({ ...modalCliente, telefono: e.target.value })} required /></div>
              <div className="campo"><label>Pais *</label>
                <input value={modalCliente.pais} onChange={(e) => setModalCliente({ ...modalCliente, pais: e.target.value })} required /></div>
              <div className="campo" style={{ gridColumn: "1 / -1" }}><label>Direccion *</label>
                <input value={modalCliente.direccion} onChange={(e) => setModalCliente({ ...modalCliente, direccion: e.target.value })} required /></div>
            </div>
            <div className="modal-acciones">
              <button type="button" className="btn btn-secundario" onClick={() => setModalCliente(null)}>Cancelar</button>
              <button type="submit" className="btn btn-azul">Guardar empresa</button>
            </div>
          </form>
        </div>
      )}

      {modalProducto && (
        <div className="modal-fondo" onClick={() => setModalProducto(null)}>
          <form className="modal-caja modal-ancha" onClick={(e) => e.stopPropagation()} onSubmit={guardarProductoRapido}>
            <h3>Registrar producto</h3>
            <div className="form-grid">
              <div className="campo" style={{ gridColumn: "1 / -1" }}><label>Nombre *</label>
                <input value={modalProducto.nombre} onChange={(e) => setModalProducto({ ...modalProducto, nombre: e.target.value })} required /></div>
              <div className="campo" style={{ gridColumn: "1 / -1" }}><label>Descripcion *</label>
                <input value={modalProducto.descripcion} onChange={(e) => setModalProducto({ ...modalProducto, descripcion: e.target.value })} required /></div>
              <div className="campo"><label>Categoria *</label>
                <select value={modalProducto.categoriaId} onChange={(e) => setModalProducto({ ...modalProducto, categoriaId: e.target.value })} required>
                  <option value="">-- Selecciona --</option>
                  {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select></div>
              <div className="campo"><label>Costo unitario *</label>
                <input type="number" min="0" step="0.01" value={modalProducto.costoUnitario} onChange={(e) => setModalProducto({ ...modalProducto, costoUnitario: e.target.value })} required /></div>
              <div className="campo"><label>Precio venta *</label>
                <input type="number" min="0" step="0.01" value={modalProducto.precioVenta} onChange={(e) => setModalProducto({ ...modalProducto, precioVenta: e.target.value })} required /></div>
              <div className="campo"><label>Peso real *</label>
                <input type="number" min="0" step="0.01" value={modalProducto.pesoKg} onChange={(e) => setModalProducto({ ...modalProducto, pesoKg: e.target.value })} required /></div>
              <div className="campo"><label>Largo *</label>
                <input type="number" min="0" step="0.1" value={modalProducto.largoCm} onChange={(e) => setModalProducto({ ...modalProducto, largoCm: e.target.value })} required /></div>
              <div className="campo"><label>Ancho *</label>
                <input type="number" min="0" step="0.1" value={modalProducto.anchoCm} onChange={(e) => setModalProducto({ ...modalProducto, anchoCm: e.target.value })} required /></div>
              <div className="campo"><label>Alto *</label>
                <input type="number" min="0" step="0.1" value={modalProducto.altoCm} onChange={(e) => setModalProducto({ ...modalProducto, altoCm: e.target.value })} required /></div>
              <div className="campo" style={{ gridColumn: "1 / -1" }}><label>Link proveedor</label>
                <input value={modalProducto.linkProveedor} onChange={(e) => setModalProducto({ ...modalProducto, linkProveedor: e.target.value })} /></div>
            </div>
            <div className="modal-acciones">
              <button type="button" className="btn btn-secundario" onClick={() => setModalProducto(null)}>Cancelar</button>
              <button type="submit" className="btn btn-azul">Guardar producto</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
