import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  getPedidos, getPedido, getEstados, cambiarEstadoPedido, eliminarPedido,
  descargarCotizacionCliente, descargarCotizacionInterna, descargarBlob, getTipoCambio,
} from "../api/endpoints";
import { formatoUSD, formatoNumero, formatoFecha, RENTABILIDAD } from "../utils/format";
import { MONEDAS, nombreMoneda, simboloMoneda } from "../utils/monedas";
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";
import Icon from "../components/Icon";
import AutocompleteInput from "../components/AutocompleteInput";

function Semaforo({ valor }) {
  const r = RENTABILIDAD[valor] || RENTABILIDAD.NO_RENTABLE;
  return <span className="semaforo"><span className="punto" style={{ background: r.punto }} />{r.texto}</span>;
}

// Direccion de entrega desglosada: pais/ciudad/canton por separado y las senas exactas
// aparte, visible igual para Cliente, Operador y Administrador.
function DireccionEntrega({ pedido }) {
  const tieneDatos = pedido?.pais || pedido?.ciudad || pedido?.canton || pedido?.direccionEntrega;
  if (!tieneDatos) {
    return (
      <div className="surface-card direccion-entrega">
        <strong>Dirección de entrega</strong>
        <p>Sin dirección de entrega registrada.</p>
      </div>
    );
  }
  return (
    <div className="surface-card direccion-entrega">
      <strong>Dirección de entrega</strong>
      <div className="direccion-entrega-grid">
        <div><span>País</span><b>{pedido.pais || "-"}</b></div>
        <div><span>Ciudad</span><b>{pedido.ciudad || "-"}</b></div>
        <div><span>Cantón</span><b>{pedido.canton || "-"}</b></div>
      </div>
      <span className="direccion-entrega-senas-label">Señas exactas</span>
      <p>{pedido.direccionEntrega || "Sin señas registradas."}</p>
    </div>
  );
}

// 5 etapas visibles en la linea de tiempo. "estadoClick" es el estado real que se aplica
// cuando el Operador/Administrador hace clic en esa bolita (los estados granulares Comprado,
// En bodega, En transito y En aduana se agrupan visualmente en un solo nodo "En transito / Aduana").
const PASOS_TRACKING = [
  { grupo: "en_revision", label: "En Revision", estadoClick: "En revisi\u00f3n" },
  { grupo: "cotizado", label: "Cotizado", estadoClick: "Cotizado" },
  { grupo: "aprobado", label: "Aprobado", estadoClick: "Aprobado" },
  { grupo: "transito_aduana", label: "En transito / Aduana", estadoClick: "En transito" },
  { grupo: "entregado", label: "Entregado", estadoClick: "Entregado" },
];

function normalizarEstado(estado) {
  return String(estado || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function grupoLogistico(estado) {
  const valor = normalizarEstado(estado);
  if (valor.includes("entregado") || valor.includes("entregar")) return "entregado";
  if (valor.includes("aduana") || valor.includes("transito") || valor.includes("bodega") || valor.includes("comprado")) return "transito_aduana";
  if (valor.includes("aprobado")) return "aprobado";
  if (valor.includes("revision")) return "en_revision";
  return "cotizado";
}

/** true cuando el pedido ya esta en el pais y listo para coordinar entrega/retiro con el cliente. */
function esListoParaEntregar(estado) {
  return normalizarEstado(estado) === "por entregar";
}

/** Numero en formato internacional para wa.me (asume Costa Rica si vienen solo 8 digitos). */
function numeroWhatsapp(telefono) {
  const digitos = String(telefono || "").replace(/\D/g, "");
  if (!digitos) return null;
  return digitos.length <= 8 ? `506${digitos}` : digitos;
}

function mensajeListoParaEntregar(pedido) {
  const zona = [pedido.pais, pedido.ciudad, pedido.canton].filter(Boolean).join(", ");
  const direccion = [zona, pedido.direccionEntrega].filter(Boolean).join(" - ");
  return (
    `Hola! Te escribimos de ImportSmart: tu pedido ${pedido.codigo || ""} ya esta listo para entregar. ` +
    `¿Como preferis recibirlo? 1) Retiralo sin costo en nuestra sede central, o 2) Te lo enviamos a tu ` +
    `direccion registrada${direccion ? ` (${direccion})` : ""} con un costo adicional de envio local. ` +
    `Contanos cual opcion preferis.`
  );
}

function linkWhatsappEntrega(pedido) {
  const numero = numeroWhatsapp(pedido.clienteTelefono);
  if (!numero) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensajeListoParaEntregar(pedido))}`;
}

function diasFaltantes(pedido) {
  if (!pedido?.fechaPedido) return null;
  const base = new Date(pedido.fechaPedido);
  if (Number.isNaN(base.getTime())) return null;
  const dias = pedido.tipoEnvio === "MARITIMO" ? 55 : 22;
  const estimada = new Date(base);
  estimada.setDate(estimada.getDate() + dias);
  return Math.max(0, Math.ceil((estimada.getTime() - Date.now()) / 86400000));
}

function textoTiempoEstimado(pedido) {
  const faltan = diasFaltantes(pedido);
  const faltanTexto = faltan === null ? "" : ` (Faltan ${faltan} dias)`;
  return pedido?.tipoEnvio === "MARITIMO"
    ? `Tiempo estimado de llegada: 40 a 55 dias calendario${faltanTexto}.`
    : `Tiempo estimado de llegada: 15 a 22 dias calendario${faltanTexto}.`;
}

function TrackingStepper({ pedido, editable, onCambiarEstado }) {
  const historialPorGrupo = new Map(
    (pedido?.historial || []).map((h) => [grupoLogistico(h.estado), h])
  );
  const grupoActual = grupoLogistico(pedido?.estado);
  const indexEstadoActual = PASOS_TRACKING.findIndex((paso) => paso.grupo === grupoActual);
  const indexHistorial = PASOS_TRACKING.reduce((max, paso, index) => (
    historialPorGrupo.has(paso.grupo) ? Math.max(max, index) : max
  ), -1);
  const activoIndex = Math.max(indexEstadoActual, indexHistorial, 0);

  const manejarClick = (paso) => {
    if (!editable || !onCambiarEstado) return;
    const confirmado = window.confirm(
      `¿Estás seguro de que deseas cambiar el estado de este pedido a "${paso.label}"?`
    );
    if (confirmado) onCambiarEstado(paso.estadoClick);
  };

  return (
    <div className="tracking-box">
      <div className="tracking-stepper">
        {PASOS_TRACKING.map((paso, index) => {
          const historial = historialPorGrupo.get(paso.grupo);
          return (
            <div
              key={paso.grupo}
              className={"tracking-step" + (index <= activoIndex ? " activo" : "") + (editable ? " tracking-step-editable" : "")}
              onClick={() => manejarClick(paso)}
              role={editable ? "button" : undefined}
              tabIndex={editable ? 0 : undefined}
            >
              <span>{index + 1}</span>
              <b>{paso.label}</b>
              <small>{historial?.fecha ? formatoFecha(historial.fecha) : "Pendiente"}</small>
            </div>
          );
        })}
      </div>
      <p>{textoTiempoEstimado(pedido)}</p>
    </div>
  );
}

function AvisoEntrega({ pedido }) {
  const link = linkWhatsappEntrega(pedido);
  return (
    <div className="aviso-entrega">
      <div className="aviso-entrega-icono"><Icon name="box" size={26} /></div>
      <div className="aviso-entrega-texto">
        <strong>¡Pedido listo para entregar!</strong>
        <p>Coordiná con el cliente si retira en la sede central o si prefiere envío a domicilio (con costo adicional).</p>
      </div>
      {link ? (
        <a className="btn-whatsapp-grande" href={link} target="_blank" rel="noopener noreferrer">
          <Icon name="chat" size={18} /> Avisar por WhatsApp
        </a>
      ) : (
        <span className="aviso-entrega-sin-telefono">Sin teléfono registrado para WhatsApp</span>
      )}
    </div>
  );
}

export default function Pedidos() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const esAdmin = usuario?.rol === "ADMINISTRADOR";
  const esCliente = usuario?.rol === "CLIENTE";
  const esOperador = usuario?.rol === "OPERADOR";
  const puedeGestionar = esAdmin || esOperador;
  const [pedidos, setPedidos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [trackingDetalle, setTrackingDetalle] = useState(null);
  const [mostrarRescateFinanciero, setMostrarRescateFinanciero] = useState(false);
  const [tipoCambio, setTipoCambio] = useState(null);
  const [monedaRescate, setMonedaRescate] = useState("USD");
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [nota, setNota] = useState("");
  const [aEliminar, setAEliminar] = useState(null);
  const [busqueda, setBusqueda] = useState({ codigo: "", cliente: "", estado: "", envio: "" });
  // Orden de la tabla: campo actual ("totalVenta" | "utilidad") y direccion (1 asc, -1 desc).
  const [orden, setOrden] = useState({ campo: null, dir: 1 });
  const alternarOrden = (campo) => setOrden((actual) => (
    actual.campo === campo ? { campo, dir: -actual.dir } : { campo, dir: 1 }
  ));
  const tablaRef = useRef(null);
  const rentabilidadObjetivo = searchParams.get("rentabilidad");

  const abrir = async (id) => {
    const d = await getPedido(id);
    setDetalle(d);
    setMostrarRescateFinanciero(false);
    setMonedaRescate("USD");
    setNuevoEstado(d.estado || "");
    setNota("");
  };

  const abrirTracking = async (id) => {
    const d = await getPedido(id);
    setTrackingDetalle(d);
  };

  const cargar = async () => {
    try {
      const data = await getPedidos();
      setPedidos(data);
      return data;
    } catch (_) {
      setPedidos([]);
      return [];
    }
  };

  useEffect(() => {
    const inicializar = async () => {
      await cargar();
      if (puedeGestionar) {
        getEstados().then(setEstados).catch(() => setEstados([]));
      }
      if (esAdmin) {
        getTipoCambio().then(setTipoCambio).catch(() => setTipoCambio(null));
      }
    };
    inicializar();
    /* eslint-disable-next-line */
  }, [rentabilidadObjetivo]);

  const aplicarEstado = async () => {
    if (!nuevoEstado) return;
    const d = await cambiarEstadoPedido(detalle.id, nuevoEstado, nota || null);
    setDetalle(d);
    setNota("");
    cargar();
  };

  const cambiarEstadoDesdeStepper = async (estadoNombre) => {
    const d = await cambiarEstadoPedido(detalle.id, estadoNombre, "Cambio de estado desde la linea de tiempo");
    setDetalle(d);
    setNuevoEstado(d.estado || "");
    cargar();
  };

  const descargarPdfInterno = async (id) => {
    const blob = await descargarCotizacionInterna(id);
    descargarBlob(blob, `cotizacion-interna-${id}.pdf`);
  };

  const descargarPdfCliente = async (id) => {
    const blob = await descargarCotizacionCliente(id);
    descargarBlob(blob, `cotizacion-cliente-${id}.pdf`);
  };

  const confirmarEliminar = async () => {
    try { await eliminarPedido(aEliminar.id); } catch (_) {}
    setAEliminar(null);
    if (detalle && detalle.id === aEliminar.id) setDetalle(null);
    cargar();
  };

  const copiarIDAlPortapapeles = async (idPedido) => {
    try {
      await navigator.clipboard.writeText(String(idPedido));
      alert("ID copiado al portapapeles.");
    } catch (_) {
      alert("No se pudo copiar el ID al portapapeles.");
    }
  };

  const requiereRescateFinanciero = (pedido) =>
    esAdmin && (pedido?.rentabilidad === "NO_RENTABLE" || pedido?.rentabilidad === "POCO_RENTABLE");

  const tasaUsdCrc = (pedido) => {
    const tasa = Number(tipoCambio?.rates?.CRC || tipoCambio?.colonesPorDolar || pedido?.tipoCambio);
    return Number.isFinite(tasa) && tasa > 0 ? tasa : 0;
  };

  const precioVentaRentableCrc = (pedido) => {
    const subtotal = Number(pedido?.subtotalProductos) || 0;
    const envio = Number(pedido?.costoEnvio) || 0;
    const gastos = Number(pedido?.gastosAdicionales) || 0;
    return (subtotal + envio + gastos) * tasaUsdCrc(pedido) * 1.2;
  };

  const convertirDesdeCrc = (montoCrc, codigo) => {
    if (codigo === "CRC") return montoCrc;
    const crcPorUsd = tasaUsdCrc(detalle);
    const tasaDestino = codigo === "USD" ? 1 : Number(tipoCambio?.rates?.[codigo]);
    if (!Number.isFinite(crcPorUsd) || crcPorUsd <= 0 || !Number.isFinite(tasaDestino) || tasaDestino <= 0) return null;
    return (montoCrc / crcPorUsd) * tasaDestino;
  };

  const formatoMoneda = (monto, codigo) => `${simboloMoneda(codigo)}${formatoNumero(monto, 2)} ${codigo}`;

  const monedasDisponiblesRescate = () => {
    const tasas = tipoCambio?.rates || {};
    const codigosApi = Object.keys(tasas).filter((codigo) => /^[A-Z]{3}$/.test(codigo));
    const codigos = Array.from(new Set(["USD", "CRC", ...MONEDAS.map((m) => m.codigo), ...codigosApi]));
    return codigos
      .filter((codigo) => codigo === "CRC" || codigo === "USD" || Number(tasas[codigo]) > 0)
      .sort((a, b) => {
        const ordenA = MONEDAS.findIndex((m) => m.codigo === a);
        const ordenB = MONEDAS.findIndex((m) => m.codigo === b);
        if (ordenA !== -1 || ordenB !== -1) return (ordenA === -1 ? 999 : ordenA) - (ordenB === -1 ? 999 : ordenB);
        return a.localeCompare(b);
      });
  };

  const rastrearPorCodigo = async () => {
    const codigo = busqueda.codigo.trim().toLowerCase();
    if (!codigo) {
      alert("Ingresa el ID de tracking del pedido.");
      return;
    }
    const pedido = pedidos.find((p) => String(p.codigo || "").toLowerCase() === codigo);
    if (!pedido) {
      alert("No se encontro un pedido con ese ID de tracking.");
      return;
    }
    await abrirTracking(pedido.id);
  };

  const verPedidosAnteriores = () => {
    setTrackingDetalle(null);
    setFiltro("codigo", "");
    window.setTimeout(() => tablaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const rentables = pedidos.filter((p) => p.rentabilidad === "RENTABLE").length;
  const pocoRentables = pedidos.filter((p) => p.rentabilidad === "POCO_RENTABLE").length;
  const noRentables = pedidos.filter((p) => p.rentabilidad === "NO_RENTABLE").length;
  const pedidosPorRentabilidad = esAdmin && rentabilidadObjetivo
    ? pedidos.filter((p) => p.rentabilidad === rentabilidadObjetivo)
    : pedidos;
  const filtrosTexto = {
    codigo: busqueda.codigo.trim().toLowerCase(),
    cliente: busqueda.cliente.trim().toLowerCase(),
    estado: busqueda.estado.trim().toLowerCase(),
    envio: busqueda.envio.trim().toLowerCase(),
  };
  const pedidosFiltrados = pedidosPorRentabilidad.filter((p) => (
    (!filtrosTexto.codigo || String(p.codigo || "").toLowerCase().includes(filtrosTexto.codigo))
    && (!filtrosTexto.cliente || String(p.clienteNombre || "").toLowerCase().includes(filtrosTexto.cliente))
    && (!filtrosTexto.estado || String(p.estado || "").toLowerCase().includes(filtrosTexto.estado))
    && (!filtrosTexto.envio || String(p.tipoEnvio || "").toLowerCase().includes(filtrosTexto.envio))
  ));
  const opcionesCodigo = Array.from(new Set(pedidos.map((p) => p.codigo).filter(Boolean)));
  const opcionesCliente = Array.from(new Set(pedidos.map((p) => p.clienteNombre).filter(Boolean)));
  const opcionesEstado = Array.from(new Set(["En revisión", ...pedidos.map((p) => p.estado).filter(Boolean)]));
  const opcionesEnvio = Array.from(new Set(pedidos.map((p) => p.tipoEnvio).filter(Boolean)));
  const setFiltro = (campo, valor) => setBusqueda((actual) => ({ ...actual, [campo]: valor }));

  const pedidosOrdenados = orden.campo
    ? [...pedidosFiltrados].sort((a, b) => ((Number(a[orden.campo]) || 0) - (Number(b[orden.campo]) || 0)) * orden.dir)
    : pedidosFiltrados;

  const cambiarFiltro = (rentabilidad) => {
    if (rentabilidad) setSearchParams({ rentabilidad });
    else setSearchParams({});
    setDetalle(null);
  };

  const filtros = [
    { valor: null, label: "Todos", conteo: pedidos.length, icono: "box" },
    { valor: "RENTABLE", label: "Rentables", conteo: rentables, icono: "check" },
    { valor: "POCO_RENTABLE", label: "Margen bajo", conteo: pocoRentables, icono: "clock" },
    { valor: "NO_RENTABLE", label: "No rentables", conteo: noRentables, icono: "x" },
  ];

  return (
    <div className="contenido">
      <div className="page-header">
        <div>
          <span className="page-kicker"><Icon name="box" size={13} /> Operacion logistica</span>
          <h2>{esCliente ? "Mis pedidos y rastreo" : "Pedidos de importacion"}</h2>
          <p className="subtitulo-pagina">
            {esAdmin
              ? "Control comercial, utilidad, rentabilidad y estado de cada pedido."
              : esOperador
                ? "Gestion logistica: actualiza estados y consulta costos operativos de cada pedido."
                : "Seguimiento logistico, pagos y estado de tus importaciones."}
          </p>
        </div>
        <div className="page-actions">
          <span className="badge badge-azul">{pedidos.length} pedidos</span>
          {esAdmin && <span className="badge badge-verde">{rentables} rentables</span>}
          {esAdmin && noRentables > 0 && <span className="badge badge-rojo">{noRentables} no rentables</span>}
        </div>
      </div>

      {esCliente && (
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "#e4f6f0", border: "1px solid #b8e6d5", borderRadius: 12, padding: "14px 18px", marginBottom: 16 }}>
          <span style={{ color: "#0c7a5b", marginTop: 2 }}><Icon name="check" size={18} /></span>
          <div>
            <strong style={{ display: "block", color: "#0c7a5b" }}>Tu pedido ha sido recibido con exito.</strong>
            <span style={{ color: "#33635a", fontSize: 14 }}>Nuestro equipo se encuentra verificando las tarifas aduaneras y de flete para emitir tu cotizacion final definitiva.</span>
          </div>
        </div>
      )}

      {puedeGestionar && (
        <div className="toolbar-pedidos">
          {esAdmin && (
            <div className="tabs-pch">
              {filtros.map((f) => (
                <button
                  key={f.valor || "TODOS"}
                  type="button"
                  className={"tab-pch" + ((rentabilidadObjetivo || null) === f.valor ? " activo" : "")}
                  onClick={() => cambiarFiltro(f.valor)}
                >
                  <Icon name={f.icono} size={14} />
                  {f.label}
                  <span className="conteo-tab">{f.conteo}</span>
                </button>
              ))}
            </div>
          )}
          <div className="filtros-pedidos">
            <div className="buscador-tabla">
              <Icon name="search" size={15} />
              <AutocompleteInput value={busqueda.codigo} onChange={(valor) => setFiltro("codigo", valor)} options={opcionesCodigo} placeholder="Codigo" />
            </div>
            <div className="buscador-tabla">
              <Icon name="users" size={15} />
              <AutocompleteInput value={busqueda.cliente} onChange={(valor) => setFiltro("cliente", valor)} options={opcionesCliente} placeholder="Cliente" />
            </div>
            <div className="buscador-tabla">
              <Icon name="clock" size={15} />
              <AutocompleteInput value={busqueda.estado} onChange={(valor) => setFiltro("estado", valor)} options={opcionesEstado} placeholder="Estado" showAllOnFocus />
            </div>
            <div className="buscador-tabla">
              <Icon name="ship" size={15} />
              <AutocompleteInput value={busqueda.envio} onChange={(valor) => setFiltro("envio", valor)} options={opcionesEnvio} placeholder="Envio" showAllOnFocus />
            </div>
          </div>
        </div>
      )}

      {(esCliente || esOperador) && (
        <div className="toolbar-pedidos">
          <div className="buscador-tabla buscador-rastreo">
            <Icon name="search" size={15} />
            <AutocompleteInput
              value={busqueda.codigo}
              onChange={(valor) => setFiltro("codigo", valor)}
              options={opcionesCodigo}
              placeholder="Buscar por ID de pedido"
            />
          </div>
          <button className="btn btn-azul" type="button" onClick={rastrearPorCodigo}>
            <Icon name="timeline" size={15} />
            Rastrear
          </button>
        </div>
      )}

      {(esCliente || esOperador) && trackingDetalle && (
        <div className="card tracking-panel-cliente">
          <div className="page-header tracking-panel-header">
            <div>
              <span className="page-kicker"><Icon name="timeline" size={13} /> Tracking de pedido</span>
              <h3>{trackingDetalle.codigo}</h3>
              <p className="subtitulo-pagina">{textoTiempoEstimado(trackingDetalle)}</p>
            </div>
            <div className="tracking-panel-actions">
              <span className="badge badge-azul">{trackingDetalle.estado}</span>
              <button className="btn btn-secundario" type="button" onClick={verPedidosAnteriores}>
                <Icon name="box" size={15} />
                Ver pedidos anteriores
              </button>
            </div>
          </div>
          <TrackingStepper pedido={trackingDetalle} />
          <div className="metric-strip" style={{ marginTop: 14 }}>
            {esOperador ? (
              <div className="metric-box"><span>Peso facturable</span><b>{formatoNumero(trackingDetalle.pesoFacturableTotal)} kg</b></div>
            ) : (
              <>
                <div className="metric-box"><span>Total pedido</span><b>{formatoUSD(trackingDetalle.totalVenta)}</b></div>
                <div className="metric-box"><span>Monto pagado</span><b>{formatoUSD(trackingDetalle.montoPagado)}</b></div>
                <div className="metric-box"><span>Saldo</span><b className={Number(trackingDetalle.saldoPendiente) > 0 ? "num-negativo" : "num-positivo"}>{Number(trackingDetalle.saldoPendiente) > 0 ? `Monto adeudado: ${formatoUSD(trackingDetalle.saldoPendiente)}` : "Pagado"}</b></div>
              </>
            )}
            <div className="metric-box"><span>Fecha pedido</span><b>{formatoFecha(trackingDetalle.fechaPedido)}</b></div>
          </div>
          <DireccionEntrega pedido={trackingDetalle} />
          {trackingDetalle.items && trackingDetalle.items.length > 0 && (
            <div className="surface-card" style={{ marginTop: 12 }}>
              <strong>Productos solicitados</strong>
              <table className="tabla-pch" style={{ marginTop: 8 }}>
                <thead><tr><th>Producto</th><th>Cantidad</th></tr></thead>
                <tbody>
                  {trackingDetalle.items.map((it, i) => (
                    <tr key={i}><td>{it.productoNombre}</td><td>{it.cantidad}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p style={{ marginTop: 12, fontSize: 13, color: "var(--pch-gris-medio)", display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="clock" size={13} /> Los montos mostrados son estimaciones iniciales sujetas a revisión logística.
          </p>
        </div>
      )}

      <div className="card" ref={tablaRef} style={{ padding: 0, overflow: "hidden" }}>
        <table className="tabla-pch">
          <thead>
            <tr>
              <th>Codigo</th>
              {puedeGestionar && <th>Cliente</th>}
              <th>Envio</th><th>Estado</th>
              {esAdmin && (
                <>
                  <th className="th-ordenable" onClick={() => alternarOrden("totalVenta")} title="Ordenar por venta">
                    Venta <span className="th-ordenable-icono">{orden.campo === "totalVenta" ? (orden.dir === 1 ? "▲" : "▼") : "⇅"}</span>
                  </th>
                  <th className="th-ordenable" onClick={() => alternarOrden("utilidad")} title="Ordenar por utilidad">
                    Utilidad <span className="th-ordenable-icono">{orden.campo === "utilidad" ? (orden.dir === 1 ? "▲" : "▼") : "⇅"}</span>
                  </th>
                  <th>Rentabilidad</th>
                </>
              )}
              {esOperador && <th>Peso facturable</th>}
              {esCliente && <><th>Total</th><th>Pagado</th><th>Saldo</th></>}
              <th>Fecha</th>{esAdmin && <th></th>}
            </tr>
          </thead>
          <tbody>
            {pedidosOrdenados.length === 0 && (
              <tr><td colSpan={esAdmin ? 9 : esOperador ? 6 : 7}><div className="estado-vacio">No hay pedidos para este filtro.</div></td></tr>
            )}
            {pedidosOrdenados.map((p) => (
              <tr
                key={p.id}
                className="fila-clickeable"
                onDoubleClick={() => (puedeGestionar ? abrir(p.id) : abrirTracking(p.id))}
                title={puedeGestionar ? "Doble clic para ver el detalle" : "Doble clic para rastrear"}
              >
                <td>
                  <b>{p.codigo}</b>
                  {puedeGestionar && p.pendienteInvestigacion && (
                    <span
                      className="badge-pendiente-investigacion"
                      title="Falta investigar medidas de la caja o precio de importacion"
                    >
                      <Icon name="search" size={11} /> Por investigar
                    </span>
                  )}
                  <button
                    type="button"
                    className="btn-copiar-id"
                    title="Copiar ID de seguimiento"
                    onClick={(e) => {
                      e.stopPropagation();
                      copiarIDAlPortapapeles(p.codigo);
                    }}
                  >
                    {"\uD83D\uDCCB"}
                  </button>
                </td>
                {puedeGestionar && <td>{p.clienteNombre || "-"}</td>}
                <td><span className="chip-envio"><Icon name={p.tipoEnvio === "MARITIMO" ? "ship" : "plane"} size={13} />{p.tipoEnvio}</span></td>
                <td>
                  <span className="badge badge-azul" style={{ background: `${p.estadoColor || "#0c6291"}22`, color: p.estadoColor || "#0c6291" }}>{p.estado}</span>
                  {puedeGestionar && esListoParaEntregar(p.estado) && (
                    linkWhatsappEntrega(p) ? (
                      <a
                        className="chip-wa-entrega"
                        href={linkWhatsappEntrega(p)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Avisar al cliente por WhatsApp que su pedido esta listo"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Icon name="chat" size={13} /> Avisar
                      </a>
                    ) : (
                      <span className="chip-wa-entrega chip-wa-entrega-inactivo" title="Este cliente no tiene telefono registrado">
                        <Icon name="chat" size={13} /> Sin tel.
                      </span>
                    )
                  )}
                </td>
                {esAdmin && (
                  <>
                    <td>{formatoUSD(p.totalVenta)}</td>
                    <td className={Number(p.utilidad) >= 0 ? "num-positivo" : "num-negativo"}>{formatoUSD(p.utilidad)}</td>
                    <td><Semaforo valor={p.rentabilidad} /></td>
                  </>
                )}
                {esOperador && <td>{formatoNumero(p.pesoFacturableTotal)} kg</td>}
                {esCliente && (
                  <>
                    <td><b>{formatoUSD(p.totalVenta)}</b></td>
                    <td>{formatoUSD(p.montoPagado)}</td>
                    <td className={Number(p.saldoPendiente) > 0 ? "num-negativo" : "num-positivo"}>{Number(p.saldoPendiente) > 0 ? formatoUSD(p.saldoPendiente) : "Pagado"}</td>
                  </>
                )}
                <td className="texto-tenue">{formatoFecha(p.fechaPedido)}</td>
                {esAdmin && (
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="tabla-acciones">
                      <button className="btn btn-secundario mini-boton btn-pdf-cliente" title="PDF cliente" onClick={() => descargarPdfCliente(p.id)}><Icon name="quote" size={14} />Cliente</button>
                      <button className="btn btn-azul mini-boton btn-pdf-interno" title="PDF interno" onClick={() => descargarPdfInterno(p.id)}><Icon name="calculator" size={14} />Interno</button>
                      <button className="btn-icono" title="Eliminar" onClick={() => setAEliminar(p)}><Icon name="trash" size={16} /></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detalle && (
        <div className="modal-fondo" onClick={() => setDetalle(null)}>
          <div className="modal-caja modal-ancha" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 820 }}>
            <h3>
              {detalle.codigo} - {detalle.clienteNombre}
              {puedeGestionar && ((detalle.paquetes || []).length === 0 || (detalle.items || []).length === 0) && (
                <span className="badge-pendiente-investigacion" title="Falta investigar medidas de la caja o precio de importacion">
                  <Icon name="search" size={11} /> Por investigar
                </span>
              )}
            </h3>
            <p className="texto-tenue">
              <span className="chip-envio"><Icon name={detalle.tipoEnvio === "MARITIMO" ? "ship" : "plane"} size={13} />{detalle.tipoEnvio}</span>
              {"  "}~{detalle.diasEstimados} dias - Estado actual: <b>{detalle.estado}</b>
            </p>

            <TrackingStepper
              pedido={detalle}
              editable={puedeGestionar}
              onCambiarEstado={cambiarEstadoDesdeStepper}
            />

            {puedeGestionar && esListoParaEntregar(detalle.estado) && <AvisoEntrega pedido={detalle} />}

            <div className="metric-strip" style={{ margin: "14px 0" }}>
              <div className="metric-box"><span>Estado</span><b>{detalle.estado}</b></div>
              <div className="metric-box"><span>Peso facturable</span><b>{formatoNumero(detalle.pesoFacturableTotal)} kg</b></div>
              {!esOperador && <div className="metric-box"><span>Total pedido</span><b>{formatoUSD(detalle.totalVenta)}</b></div>}
              {!esOperador && <div className="metric-box"><span>Monto pagado</span><b>{formatoUSD(detalle.montoPagado)}</b></div>}
              {!esOperador && <div className="metric-box"><span>Saldo pendiente</span><b className={Number(detalle.saldoPendiente) > 0 ? "num-negativo" : "num-positivo"}>{formatoUSD(detalle.saldoPendiente)}</b></div>}
              {esAdmin && <div className="metric-box"><span>Utilidad</span><b className={Number(detalle.utilidad) >= 0 ? "num-positivo" : "num-negativo"}>{formatoUSD(detalle.utilidad)}</b></div>}
            </div>

            <DireccionEntrega pedido={detalle} />

            <h4 className="modal-section-title"><Icon name="tag" size={15} />Productos</h4>
            <table className="tabla-pch">
              <thead><tr><th>Producto</th><th>Cant.</th>{esAdmin && <><th>Precio</th><th>Subtotal</th></>}</tr></thead>
              <tbody>
                {detalle.items.map((it, i) => (
                  <tr key={i}>
                    <td>{it.productoNombre}</td><td>{it.cantidad}</td>
                    {esAdmin && <><td>{formatoUSD(it.precioVenta)}</td><td>{formatoUSD(it.subtotalVenta)}</td></>}
                  </tr>
                ))}
              </tbody>
            </table>

            <h4 className="modal-section-title"><Icon name="box" size={15} />Paquetes y pesos</h4>
            <table className="tabla-pch">
              <thead><tr><th>Paquete</th><th>Dim (cm)</th><th>Real</th><th>Volum.</th><th>Facturable</th></tr></thead>
              <tbody>
                {detalle.paquetes.map((pk, i) => (
                  <tr key={i}>
                    <td>{pk.descripcion}</td>
                    <td className="texto-tenue">{formatoNumero(pk.largoCm, 0)}x{formatoNumero(pk.anchoCm, 0)}x{formatoNumero(pk.altoCm, 0)}</td>
                    <td>{formatoNumero(pk.pesoRealKg)}</td>
                    <td>{formatoNumero(pk.pesoVolumetricoKg)}</td>
                    <td><b>{formatoNumero(pk.pesoFacturableKg)} kg</b></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {(esAdmin || esOperador) && (
              <div className="fila-total-form" style={{ marginTop: 14 }}>
                <div><span>Subtotal productos</span><b>{formatoUSD(detalle.subtotalProductos)}</b></div>
                <div><span>Costo de envio</span><b>{formatoUSD(detalle.costoEnvio)}</b></div>
                <div><span>Gastos</span><b>{formatoUSD(detalle.gastosAdicionales)}</b></div>
                {esAdmin && <div><span>Total venta</span><b>{formatoUSD(detalle.totalVenta)}</b></div>}
                {esAdmin && (
                  <div><span>Utilidad ({formatoNumero(detalle.margenPct)}%)</span>
                    <b className={Number(detalle.utilidad) >= 0 ? "num-positivo" : "num-negativo"}>{formatoUSD(detalle.utilidad)}</b></div>
                )}
                {esAdmin && requiereRescateFinanciero(detalle) && (
                  <div className="rescate-financiero">
                    <button
                      type="button"
                      className="btn btn-rescate"
                      onClick={() => setMostrarRescateFinanciero((actual) => !actual)}
                    >
                      Calcular Precio de Venta Rentable
                    </button>
                    {mostrarRescateFinanciero && (
                      <div className="rescate-financiero-mensaje">
                        <p>
                          Para cubrir costos con un margen del 20%, la venta minima sugerida es de:{" "}
                          <b>{formatoMoneda(precioVentaRentableCrc(detalle), "CRC")}</b>.
                        </p>
                        <p>Se recomienda ajustar el precio final de la orden antes de aprobarla para evitar perdidas.</p>
                        <div className="rescate-conversor">
                          <label>
                            Convertir a otra divisa
                            <select value={monedaRescate} onChange={(e) => setMonedaRescate(e.target.value)}>
                              {monedasDisponiblesRescate().map((codigo) => (
                                <option key={codigo} value={codigo}>{nombreMoneda(codigo)}</option>
                              ))}
                            </select>
                          </label>
                          <div className="rescate-conversion-result">
                            {convertirDesdeCrc(precioVentaRentableCrc(detalle), monedaRescate) !== null ? (
                              <>
                                <span>Equivalente a</span>
                                <b>{formatoMoneda(convertirDesdeCrc(precioVentaRentableCrc(detalle), monedaRescate), monedaRescate)}</b>
                              </>
                            ) : (
                              <span>No hay tasa disponible para esta divisa.</span>
                            )}
                          </div>
                        </div>
                        <div className="rescate-equivalencias">
                          <small>
                            Tasas actuales de {tipoCambio?.fuente || "la API externa"}.
                            {tipoCambio?.fecha ? ` Ultima actualizacion: ${tipoCambio.fecha}.` : ""}
                          </small>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {esAdmin && <div className="metric-rentabilidad"><span>Rentabilidad</span><b><Semaforo valor={detalle.rentabilidad} /></b></div>}
              </div>
            )}

            <h4 className="modal-section-title"><Icon name="timeline" size={15} />Linea de tiempo</h4>
            <ul className="timeline">
              {detalle.historial.map((h, i) => (
                <li key={i}>
                  <span className="hito" />
                  <div className="hito-estado">{h.estado}</div>
                  <div className="hito-fecha">{formatoFecha(h.fecha)}</div>
                  {h.nota && <div className="hito-nota">{h.nota}</div>}
                </li>
              ))}
            </ul>

            {puedeGestionar && (
              <>
                <h4 className="modal-section-title"><Icon name="edit" size={15} />Actualizar estado</h4>
                <div className="form-row">
                  <div className="campo" style={{ minWidth: 160 }}>
                    <label>Nuevo estado</label>
                    <select value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)}>
                      {estados.map((e) => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
                    </select>
                  </div>
                  <div className="campo" style={{ flex: 1, minWidth: 180 }}>
                    <label>Nota (opcional)</label>
                    <input value={nota} onChange={(e) => setNota(e.target.value)} />
                  </div>
                  <button className="btn btn-azul" onClick={aplicarEstado}>Guardar estado</button>
                </div>
              </>
            )}

            <div className="modal-acciones">
              {puedeGestionar && (
                <button className="btn btn-secundario" onClick={() => navigate(`/nuevo-pedido/${detalle.id}`)}>
                  <Icon name="edit" size={15} />{esOperador ? "Completar medidas" : "Completar cotización"}
                </button>
              )}
              {esAdmin && (
                <>
                  <button className="btn btn-secundario" onClick={() => descargarPdfCliente(detalle.id)}><Icon name="quote" size={15} />PDF cliente</button>
                  <button className="btn btn-azul" onClick={() => descargarPdfInterno(detalle.id)}><Icon name="calculator" size={15} />PDF interno</button>
                </>
              )}
              <button className="btn btn-azul" onClick={() => setDetalle(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        abierto={!!aEliminar}
        titulo="Eliminar pedido"
        mensaje={aEliminar ? `Eliminar el pedido ${aEliminar.codigo}?` : ""}
        onConfirmar={confirmarEliminar}
        onCancelar={() => setAEliminar(null)}
      />
    </div>
  );
}
