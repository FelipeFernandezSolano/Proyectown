import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  buscarClientes, getProductosActivos, crearPedido, actualizarPedido, getPedido,
  crearCliente, crearProducto, getCategorias,
} from "../api/endpoints";
import { formatoUSD, formatoNumero, RENTABILIDAD } from "../utils/format";
import Icon from "../components/Icon";
import AutocompleteInput from "../components/AutocompleteInput";
import { useAuth } from "../context/AuthContext";

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
  const { id } = useParams();
  const modoEdicion = !!id;
  const { usuario } = useAuth();
  const esCliente = usuario?.rol === "CLIENTE";
  const esAdmin = usuario?.rol === "ADMINISTRADOR";
  const esOperador = usuario?.rol === "OPERADOR";
  // En edicion, el Operador solo completa medidas/logistica (nunca precio ni utilidad,
  // igual que en el resto de la app); el Administrador si tiene el formulario completo.
  const soloMedidas = modoEdicion && esOperador;
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [clienteTexto, setClienteTexto] = useState("");
  const [clienteNombreFijo, setClienteNombreFijo] = useState("");
  const [codigoPedido, setCodigoPedido] = useState("");
  const [modalCliente, setModalCliente] = useState(null);
  const [modalProducto, setModalProducto] = useState(null);
  const [productoIndex, setProductoIndex] = useState(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [cargandoPedido, setCargandoPedido] = useState(modoEdicion);
  // Solo aplica al Cliente creando un pedido nuevo: si no conoce las medidas de la caja
  // (ej. compra unos audifonos por internet), puede enviar la solicitud sin ellas y que
  // el equipo de ImportSmart las investigue como si fuera su agente de compras.
  const [sinMedidas, setSinMedidas] = useState(false);
  // ImportSmart no es una tienda: no tiene catálogo propio de cara al cliente. El Cliente
  // siempre describe qué necesita importar y nosotros lo cotizamos (el catálogo interno de
  // productos solo lo usa el Administrador para armar pedidos ya conocidos/recurrentes).
  const cotizandoProductoNuevo = esCliente && !modoEdicion;

  const [form, setForm] = useState({
    clienteId: esCliente ? usuario.clienteId : "",
    tipoEnvio: "AEREO",
    descripcion: "",
    pais: "Costa Rica",
    ciudad: "",
    canton: "",
    direccionEntrega: "",
    gastosAdicionales: 0,
  });
  const [items, setItems] = useState([]);
  const [paquetes, setPaquetes] = useState([{ descripcion: "Caja 1", largoCm: 0, anchoCm: 0, altoCm: 0, pesoRealKg: 0 }]);

  useEffect(() => {
    if (!esCliente) buscarClientes("").then(setClientes).catch(() => {});
    getProductosActivos().then(setProductos).catch(() => {});
    getCategorias().then(setCategorias).catch(() => {});
  }, [esCliente]);

  useEffect(() => {
    if (!modoEdicion) return;
    setCargandoPedido(true);
    getPedido(id)
      .then((p) => {
        setCodigoPedido(p.codigo || "");
        setClienteNombreFijo(p.clienteNombre || "");
        setForm({
          clienteId: p.clienteId || "",
          tipoEnvio: p.tipoEnvio || "AEREO",
          descripcion: p.descripcion || "",
          pais: p.pais || "",
          ciudad: p.ciudad || "",
          canton: p.canton || "",
          direccionEntrega: p.direccionEntrega || "",
          gastosAdicionales: p.gastosAdicionales || 0,
        });
        setItems((p.items || []).map((it) => ({
          productoId: it.productoId, productoTexto: it.productoNombre,
          cantidad: it.cantidad, costoUnitario: it.costoUnitario, precioVenta: it.precioVenta,
        })));
        setPaquetes((p.paquetes || []).length > 0 ? p.paquetes.map((pk) => ({
          descripcion: pk.descripcion, largoCm: pk.largoCm, anchoCm: pk.anchoCm,
          altoCm: pk.altoCm, pesoRealKg: pk.pesoRealKg,
        })) : [{ descripcion: "Caja 1", largoCm: 0, anchoCm: 0, altoCm: 0, pesoRealKg: 0 }]);
      })
      .catch(() => setError("No se pudo cargar el pedido."))
      .finally(() => setCargandoPedido(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
    if (!form.pais.trim() || !form.ciudad.trim() || !form.canton.trim()) {
      setError("Completa país, ciudad y cantón de entrega.");
      return;
    }
    if (!form.direccionEntrega.trim()) { setError("Ingresa las señas exactas de entrega."); return; }
    const itemsValidos = items.filter((it) => it.productoId);
    if (cotizandoProductoNuevo) {
      if (!form.descripcion.trim()) { setError("Describe el producto que querés importar."); return; }
    } else if (!soloMedidas && itemsValidos.length === 0) {
      setError("Agrega al menos un producto registrado.");
      return;
    } else if (!soloMedidas && itemsValidos.some((it) => !(Number(it.cantidad) > 0) || !(Number(it.precioVenta) > 0))) {
      setError("Completa cantidad y precio de venta en todos los productos.");
      return;
    }
    const omitirMedidas = esCliente && !modoEdicion && sinMedidas;
    if (!omitirMedidas && (paquetes.length === 0 || paquetes.some((pk) =>
      !pk.descripcion?.trim() || !(Number(pk.largoCm) > 0) || !(Number(pk.anchoCm) > 0)
      || !(Number(pk.altoCm) > 0) || !(Number(pk.pesoRealKg) > 0)))) {
      setError("Completa descripción, dimensiones y peso real de todos los paquetes.");
      return;
    }
    setGuardando(true);
    try {
      const dto = {
        clienteId: Number(form.clienteId),
        tipoEnvio: form.tipoEnvio,
        descripcion: form.descripcion || items.map((it) => productos.find((p) => p.id === Number(it.productoId))?.nombre).filter(Boolean).join(", "),
        pais: form.pais.trim(),
        ciudad: form.ciudad.trim(),
        canton: form.canton.trim(),
        direccionEntrega: form.direccionEntrega.trim(),
        gastosAdicionales: Number(form.gastosAdicionales) || 0,
        // Inmutabilidad del estado inicial: el cliente siempre crea en "En revisión"
        // (el backend también lo fuerza, esto es defensa en profundidad desde el front).
        ...(esCliente && !modoEdicion ? { estadoNombre: "En revisión" } : {}),
        items: cotizandoProductoNuevo ? [] : itemsValidos.map((it) => ({
          productoId: Number(it.productoId), cantidad: Number(it.cantidad) || 1,
          costoUnitario: Number(it.costoUnitario), precioVenta: Number(it.precioVenta),
        })),
        paquetes: omitirMedidas ? [] : paquetes.map((pk) => ({
          descripcion: pk.descripcion, largoCm: Number(pk.largoCm), anchoCm: Number(pk.anchoCm),
          altoCm: Number(pk.altoCm), pesoRealKg: Number(pk.pesoRealKg),
        })),
      };
      if (modoEdicion) {
        await actualizarPedido(id, dto);
      } else {
        await crearPedido(dto);
      }
      navigate("/pedidos");
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo guardar el pedido.");
    } finally {
      setGuardando(false);
    }
  };

  const rent = RENTABILIDAD[totales.rentabilidad];

  if (cargandoPedido) {
    return <div className="contenido"><div className="estado-vacio">Cargando pedido...</div></div>;
  }

  return (
    <div className="contenido">
      <div className="page-header">
        <div>
          <span className="page-kicker"><Icon name="plus" size={13} /> {
            modoEdicion ? `Completando ${codigoPedido}` : esCliente ? "Solicitud de cotización" : "Cotización operativa"
          }</span>
          <h2>{
            modoEdicion
              ? (soloMedidas ? "Completar medidas del pedido" : "Completar cotización del pedido")
              : esCliente ? "Solicitar cotización de importación" : "Nuevo pedido de importación"
          }</h2>
          <p className="subtitulo-pagina">{
            modoEdicion
              ? (soloMedidas
                ? "Investigá y cargá las medidas y el peso real de la caja para que se pueda calcular el envío."
                : "Completá los datos que falten (producto, precio, medidas) para poder cotizarle al cliente.")
              : esCliente
                ? "Completa los datos de tu carga desde China hasta Costa Rica para recibir una pre-cotización estimada."
                : "Calcula peso volumétrico, envío, utilidad y rentabilidad antes de aprobar la compra."
          }</p>
        </div>
      </div>

      {esCliente && !modoEdicion && (
        <div className="card" style={{ marginBottom: 18 }}>
          <p className="texto-tenue" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="quote" size={15} /> ImportSmart no vende productos propios: contanos qué necesitás importar y nosotros te armamos la cotización de envío.
          </p>
        </div>
      )}

      <div className="split-workspace">
        <div className="stack">
          <div className="card">
            <h3 className="card-titulo"><span className="icono-titulo"><Icon name="users" size={16} /></span>1. Datos comerciales</h3>
            <div className="form-grid">
              <div className="campo"><label>Empresa cliente *</label>
                {esCliente ? (
                  <input value={usuario.nombre} disabled />
                ) : modoEdicion ? (
                  <input value={clienteNombreFijo} disabled />
                ) : (
                  <>
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
                  </>
                )}
              </div>
              <div className="campo"><label>Modalidad de envío</label>
                <select value={form.tipoEnvio} onChange={(e) => setForm({ ...form, tipoEnvio: e.target.value })}>
                  <option value="AEREO">Aéreo</option>
                  <option value="MARITIMO">Marítimo</option>
                </select></div>
              {!esCliente && !soloMedidas && (
                <div className="campo"><label>Gastos adicionales (USD)</label>
                  <input type="number" step="0.01" min="0" value={form.gastosAdicionales} onChange={(e) => setForm({ ...form, gastosAdicionales: e.target.value })} /></div>
              )}
              <div className="campo" style={{ gridColumn: "1 / -1" }}>
                <label>{modoEdicion ? "Qué pidió el cliente" : cotizandoProductoNuevo ? "¿Qué producto necesitás importar? *" : "Descripción (opcional)"}</label>
                {modoEdicion ? (
                  <textarea rows={3} value={form.descripcion} disabled />
                ) : cotizandoProductoNuevo ? (
                  <>
                    <p className="texto-tenue" style={{ margin: "0 0 8px" }}>
                      Contanos qué es, para qué lo vas a usar y cualquier detalle que ayude a identificarlo (marca,
                      modelo, material, enlace de referencia, etc). Mientras más detalle, más precisa la cotización.
                    </p>
                    <textarea
                      rows={3}
                      required
                      value={form.descripcion}
                      onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                      placeholder="Ej: 20 lámparas LED de escritorio, regulables, para reventa..."
                    />
                  </>
                ) : (
                  <input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Se genera con los productos si se deja vacío" />
                )}
              </div>
              <div className="campo" style={{ gridColumn: "1 / -1" }}>
                <label>Dirección de entrega *</label>
                {esCliente && (
                  <p className="texto-tenue" style={{ margin: "0 0 8px" }}>
                    Necesitamos la dirección completa para calcular la entrega final en Costa Rica.
                  </p>
                )}
                <div className="form-grid" style={{ marginTop: 0 }}>
                  <div className="campo"><label>País</label>
                    <input required value={form.pais} onChange={(e) => setForm({ ...form, pais: e.target.value })} placeholder="Costa Rica" /></div>
                  <div className="campo"><label>Ciudad</label>
                    <input required value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} placeholder="San José" /></div>
                  <div className="campo"><label>Cantón</label>
                    <input required value={form.canton} onChange={(e) => setForm({ ...form, canton: e.target.value })} placeholder="Escazú" /></div>
                </div>
                <div className="campo" style={{ marginTop: 12 }}>
                  <label>Señas exactas</label>
                  <textarea
                    rows={3}
                    required
                    value={form.direccionEntrega}
                    onChange={(e) => setForm({ ...form, direccionEntrega: e.target.value })}
                    placeholder="Distrito, punto de referencia, color de casa, número de local, etc."
                  />
                </div>
              </div>
            </div>
          </div>

          {!cotizandoProductoNuevo && !soloMedidas && (
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
                  {!esCliente && (it.productoTexto || "").trim() && !it.productoId && (
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
                  <input type="number" min="1" required value={it.cantidad} onChange={(e) => setItem(i, "cantidad", e.target.value)} /></div>
                <div className="campo" style={{ width: 130 }}><label>{esCliente ? "Precio" : "Venta USD"}</label>
                  {esCliente ? (
                    <input value={it.precioVenta != null ? formatoUSD(it.precioVenta) : "-"} disabled />
                  ) : (
                    <input type="number" step="0.01" min="0.01" required value={it.precioVenta ?? ""} onChange={(e) => setItem(i, "precioVenta", e.target.value)} />
                  )}</div>
                <button className="btn-icono" onClick={() => delItem(i)}><Icon name="trash" size={16} /></button>
              </div>
            ))}
            <button className="btn btn-secundario mini-boton" onClick={addItem}><Icon name="plus" size={14} />Agregar producto</button>
          </div>
          )}

          <div className="card">
            <h3 className="card-titulo"><span className="icono-titulo"><Icon name="box" size={16} /></span>{(cotizandoProductoNuevo || soloMedidas) ? "2" : "3"}. Paquetes y peso</h3>
            {esCliente && !modoEdicion && (
              <>
                <p className="texto-tenue" style={{ marginBottom: 12 }}>
                  Medí el producto o la caja tal como se va a enviar (largo, ancho y alto en centímetros) y pesalo en una
                  báscula. Con esos datos calculamos el peso que se cobra en el envío: si el paquete es grande pero
                  liviano, a veces se cobra más por el espacio que ocupa que por su peso real — por eso pedimos ambos.
                </p>
                <label className="checkbox-linea" style={{ marginBottom: 12 }}>
                  <input
                    type="checkbox"
                    checked={sinMedidas}
                    onChange={(e) => setSinMedidas(e.target.checked)}
                  />
                  No tengo las medidas todavía (ej. lo voy a comprar en una tienda en línea) — que ImportSmart las investigue
                </label>
              </>
            )}
            {soloMedidas && (
              <p className="texto-tenue" style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="clock" size={13} /> El cliente no tenía las medidas de la caja. Investigá el producto (ficha técnica, tienda en línea, etc.) y cargá las medidas reales acá.
              </p>
            )}
            {(!esCliente || modoEdicion || !sinMedidas) && (
              <>
                {paquetes.map((pk, i) => (
                  <div key={i} className="form-row">
                    <div className="campo" style={{ flex: 1, minWidth: 130 }}><label>Descripción</label>
                      <input required value={pk.descripcion} onChange={(e) => setPaquete(i, "descripcion", e.target.value)} /></div>
                    <div className="campo" style={{ width: 90 }}><label>Largo</label>
                      <input type="number" step="0.1" min="0.1" required value={pk.largoCm} onChange={(e) => setPaquete(i, "largoCm", e.target.value)} /></div>
                    <div className="campo" style={{ width: 90 }}><label>Ancho</label>
                      <input type="number" step="0.1" min="0.1" required value={pk.anchoCm} onChange={(e) => setPaquete(i, "anchoCm", e.target.value)} /></div>
                    <div className="campo" style={{ width: 90 }}><label>Alto</label>
                      <input type="number" step="0.1" min="0.1" required value={pk.altoCm} onChange={(e) => setPaquete(i, "altoCm", e.target.value)} /></div>
                    <div className="campo" style={{ width: 100 }}><label>Peso real</label>
                      <input type="number" step="0.01" min="0.01" required value={pk.pesoRealKg} onChange={(e) => setPaquete(i, "pesoRealKg", e.target.value)} /></div>
                    <span className="metric-box" style={{ padding: "8px 10px" }}><span>Vol.</span><b>{formatoNumero(pesoVol(pk.largoCm, pk.anchoCm, pk.altoCm))} kg</b></span>
                    <button className="btn-icono" onClick={() => delPaquete(i)}><Icon name="trash" size={16} /></button>
                  </div>
                ))}
                <button className="btn btn-secundario mini-boton" onClick={addPaquete}><Icon name="plus" size={14} />Agregar paquete</button>
              </>
            )}
            {!esCliente && (
              <p className="texto-tenue nota-tarifa">
                Aéreo: peso volumétrico = m3 x 168; kg real a $20 y excedente volumétrico a $18.
                Marítimo: m3 x $850.
              </p>
            )}
          </div>
        </div>

        <aside className="card summary-sidebar">
          <h3 className="card-titulo"><span className="icono-titulo"><Icon name="calculator" size={16} /></span>Resumen de cotización</h3>
          {soloMedidas ? (
            <>
              <div className="fila-total-form">
                <div><span>Peso facturable</span><b>{formatoNumero(totales.facturable)} kg</b></div>
                <div><span>Costo de envío estimado</span><b>{formatoUSD(totales.costoEnvio)}</b></div>
              </div>
              <p className="texto-tenue" style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="clock" size={13} /> El precio de venta lo define el Administrador; tu parte es dejar las medidas correctas.
              </p>
            </>
          ) : !esCliente ? (
            <>
              <div className="fila-total-form">
                <div><span>Peso facturable</span><b>{formatoNumero(totales.facturable)} kg</b></div>
                <div><span>Costo envío</span><b>{formatoUSD(totales.costoEnvio)}</b></div>
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
                  <p>Use este resumen para decidir precio, modalidad y empaque antes de {modoEdicion ? "guardar" : "registrar"} el pedido.</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="fila-total-form">
                <div><span>Peso facturable</span><b>{sinMedidas ? "Por medir" : `${formatoNumero(totales.facturable)} kg`}</b></div>
                <div><span>Costo de envío estimado</span><b>{sinMedidas ? "Por cotizar" : formatoUSD(totales.costoEnvio)}</b></div>
                <div><span>Precio del producto</span><b>Por cotizar</b></div>
                <div><span>Total estimado</span><b>Por cotizar</b></div>
              </div>
              <p className="texto-tenue" style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="clock" size={13} /> Como el producto no está en catálogo, nuestro equipo te va a confirmar {sinMedidas ? "las medidas y " : ""}el precio total tras revisar la solicitud.
              </p>
            </>
          )}
          {error && <p className="mensaje-info mensaje-error">{error}</p>}
          <div className="modal-acciones">
            <button className="btn btn-secundario" onClick={() => navigate("/pedidos")}>Cancelar</button>
            <button className="btn btn-azul" onClick={guardar} disabled={guardando}>
              {guardando ? "Guardando..." : modoEdicion ? "Guardar cambios" : (esCliente ? "Enviar solicitud" : "Crear pedido")}
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
              <div className="campo"><label>Teléfono *</label>
                <input value={modalCliente.telefono} onChange={(e) => setModalCliente({ ...modalCliente, telefono: e.target.value })} required /></div>
              <div className="campo"><label>País *</label>
                <input value={modalCliente.pais} onChange={(e) => setModalCliente({ ...modalCliente, pais: e.target.value })} required /></div>
              <div className="campo" style={{ gridColumn: "1 / -1" }}><label>Dirección *</label>
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
              <div className="campo" style={{ gridColumn: "1 / -1" }}><label>Descripción *</label>
                <input value={modalProducto.descripcion} onChange={(e) => setModalProducto({ ...modalProducto, descripcion: e.target.value })} required /></div>
              <div className="campo"><label>Categoría *</label>
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
