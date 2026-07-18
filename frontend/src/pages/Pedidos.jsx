import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getPedidos, getPedido, getEstados, cambiarEstadoPedido, eliminarPedido,
  descargarCotizacionCliente, descargarCotizacionInterna, descargarBlob,
} from "../api/endpoints";
import { formatoUSD, formatoNumero, formatoFecha, RENTABILIDAD } from "../utils/format";
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";
import Icon from "../components/Icon";
import AutocompleteInput from "../components/AutocompleteInput";

function Semaforo({ valor }) {
  const r = RENTABILIDAD[valor] || RENTABILIDAD.NO_RENTABLE;
  return <span className="semaforo"><span className="punto" style={{ background: r.punto }} />{r.texto}</span>;
}

const PASOS_TRACKING = ["Cotizado", "Aprobado", "Comprado", "En bodega", "En transito", "En aduana", "Entregado"];

function normalizarEstado(estado) {
  return String(estado || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function estadoLogistico(estado) {
  const valor = normalizarEstado(estado);
  if (valor.includes("entregado")) return "Entregado";
  if (valor.includes("aduana")) return "En aduana";
  if (valor.includes("transito")) return "En transito";
  if (valor.includes("bodega")) return "En bodega";
  if (valor.includes("comprado")) return "Comprado";
  if (valor.includes("aprobado")) return "Aprobado";
  return "Cotizado";
}

function diasFaltantes(pedido) {
  if (!pedido?.fechaPedido) return null;
  const base = new Date(pedido.fechaPedido);
  if (Number.isNaN(base.getTime())) return null;
  const dias = pedido.tipoEnvio === "MARITIMO" ? 22 : 5;
  const estimada = new Date(base);
  estimada.setDate(estimada.getDate() + dias);
  return Math.max(0, Math.ceil((estimada.getTime() - Date.now()) / 86400000));
}

function textoTiempoEstimado(pedido) {
  const faltan = diasFaltantes(pedido);
  const faltanTexto = faltan === null ? "" : ` (Faltan ${faltan} dias)`;
  return pedido?.tipoEnvio === "MARITIMO"
    ? `Tiempo estimado de llegada: 15 a 22 dias calendario${faltanTexto}.`
    : `Tiempo estimado de llegada: 3 a 5 dias habiles${faltanTexto}.`;
}

function TrackingStepper({ pedido }) {
  const historialPorEstado = new Map(
    (pedido?.historial || []).map((h) => [estadoLogistico(h.estado), h])
  );
  const indexEstadoActual = PASOS_TRACKING.indexOf(estadoLogistico(pedido?.estado));
  const indexHistorial = PASOS_TRACKING.reduce((max, paso, index) => (
    historialPorEstado.has(paso) ? Math.max(max, index) : max
  ), -1);
  const activoIndex = Math.max(indexEstadoActual, indexHistorial, 0);
  return (
    <div className="tracking-box">
      <div className="tracking-stepper">
        {PASOS_TRACKING.map((paso, index) => {
          const historial = historialPorEstado.get(paso);
          return (
            <div key={paso} className={"tracking-step" + (index <= activoIndex ? " activo" : "")}>
              <span>{index + 1}</span>
              <b>{paso}</b>
              <small>{historial?.fecha ? formatoFecha(historial.fecha) : "Pendiente"}</small>
            </div>
          );
        })}
      </div>
      <p>{textoTiempoEstimado(pedido)}</p>
    </div>
  );
}

export default function Pedidos() {
  const { usuario } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const esAdmin = usuario?.rol === "ADMINISTRADOR";
  const esCliente = usuario?.rol === "CLIENTE";
  const [pedidos, setPedidos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [trackingDetalle, setTrackingDetalle] = useState(null);
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [nota, setNota] = useState("");
  const [aEliminar, setAEliminar] = useState(null);
  const [busqueda, setBusqueda] = useState({ codigo: "", cliente: "", estado: "", envio: "" });
  const tablaRef = useRef(null);
  const rentabilidadObjetivo = searchParams.get("rentabilidad");

  const abrir = async (id) => {
    const d = await getPedido(id);
    setDetalle(d);
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
      if (esAdmin) getEstados().then(setEstados).catch(() => setEstados([]));
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
  const opcionesEstado = Array.from(new Set(pedidos.map((p) => p.estado).filter(Boolean)));
  const opcionesEnvio = Array.from(new Set(pedidos.map((p) => p.tipoEnvio).filter(Boolean)));
  const setFiltro = (campo, valor) => setBusqueda((actual) => ({ ...actual, [campo]: valor }));

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
            {esAdmin ? "Control comercial, utilidad, rentabilidad y estado de cada pedido." : "Seguimiento logistico, pagos y estado de tus importaciones."}
          </p>
        </div>
        <div className="page-actions">
          <span className="badge badge-azul">{pedidos.length} pedidos</span>
          {esAdmin && <span className="badge badge-verde">{rentables} rentables</span>}
          {esAdmin && noRentables > 0 && <span className="badge badge-rojo">{noRentables} no rentables</span>}
        </div>
      </div>

      {esAdmin && (
        <div className="toolbar-pedidos">
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

      {esCliente && (
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

      {esCliente && trackingDetalle && (
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
            <div className="metric-box"><span>Total pedido</span><b>{formatoUSD(trackingDetalle.totalVenta)}</b></div>
            <div className="metric-box"><span>Monto pagado</span><b>{formatoUSD(trackingDetalle.montoPagado)}</b></div>
            <div className="metric-box"><span>Saldo</span><b className={Number(trackingDetalle.saldoPendiente) > 0 ? "num-negativo" : "num-positivo"}>{Number(trackingDetalle.saldoPendiente) > 0 ? `Monto adeudado: ${formatoUSD(trackingDetalle.saldoPendiente)}` : "Pagado"}</b></div>
            <div className="metric-box"><span>Fecha pedido</span><b>{formatoFecha(trackingDetalle.fechaPedido)}</b></div>
          </div>
          <div className="surface-card direccion-entrega">
            <strong>Direccion de entrega</strong>
            <p>{trackingDetalle.direccionEntrega || "Sin direccion de entrega registrada."}</p>
          </div>
        </div>
      )}

      <div className="card" ref={tablaRef} style={{ padding: 0, overflow: "hidden" }}>
        <table className="tabla-pch">
          <thead>
            <tr>
              <th>Codigo</th>
              {esAdmin && <th>Cliente</th>}
              <th>Envio</th><th>Estado</th>
              {esAdmin && <><th>Venta</th><th>Utilidad</th><th>Rentabilidad</th></>}
              {!esAdmin && <><th>Total</th><th>Pagado</th><th>Saldo</th></>}
              <th>Fecha</th>{esAdmin && <th></th>}
            </tr>
          </thead>
          <tbody>
            {pedidosFiltrados.length === 0 && (
              <tr><td colSpan={esAdmin ? 9 : 7}><div className="estado-vacio">No hay pedidos para este filtro.</div></td></tr>
            )}
            {pedidosFiltrados.map((p) => (
              <tr
                key={p.id}
                className="fila-clickeable"
                onDoubleClick={() => (esAdmin ? abrir(p.id) : abrirTracking(p.id))}
                title={esAdmin ? "Doble clic para ver el detalle" : "Doble clic para rastrear"}
              >
                <td>
                  <b>{p.codigo}</b>
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
                {esAdmin && <td>{p.clienteNombre || "-"}</td>}
                <td><span className="chip-envio"><Icon name={p.tipoEnvio === "MARITIMO" ? "ship" : "plane"} size={13} />{p.tipoEnvio}</span></td>
                <td><span className="badge badge-azul" style={{ background: `${p.estadoColor || "#0c6291"}22`, color: p.estadoColor || "#0c6291" }}>{p.estado}</span></td>
                {esAdmin && (
                  <>
                    <td>{formatoUSD(p.totalVenta)}</td>
                    <td className={Number(p.utilidad) >= 0 ? "num-positivo" : "num-negativo"}>{formatoUSD(p.utilidad)}</td>
                    <td><Semaforo valor={p.rentabilidad} /></td>
                  </>
                )}
                {!esAdmin && (
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
            <h3>{detalle.codigo} - {detalle.clienteNombre}</h3>
            <p className="texto-tenue">
              <span className="chip-envio"><Icon name={detalle.tipoEnvio === "MARITIMO" ? "ship" : "plane"} size={13} />{detalle.tipoEnvio}</span>
              {"  "}~{detalle.diasEstimados} dias - Estado actual: <b>{detalle.estado}</b>
            </p>

            <TrackingStepper pedido={detalle} />

            <div className="metric-strip" style={{ margin: "14px 0" }}>
              <div className="metric-box"><span>Estado</span><b>{detalle.estado}</b></div>
              <div className="metric-box"><span>Peso facturable</span><b>{formatoNumero(detalle.pesoFacturableTotal)} kg</b></div>
              <div className="metric-box"><span>Total pedido</span><b>{formatoUSD(detalle.totalVenta)}</b></div>
              <div className="metric-box"><span>Monto pagado</span><b>{formatoUSD(detalle.montoPagado)}</b></div>
              <div className="metric-box"><span>Saldo pendiente</span><b className={Number(detalle.saldoPendiente) > 0 ? "num-negativo" : "num-positivo"}>{formatoUSD(detalle.saldoPendiente)}</b></div>
              {esAdmin && <div className="metric-box"><span>Utilidad</span><b className={Number(detalle.utilidad) >= 0 ? "num-positivo" : "num-negativo"}>{formatoUSD(detalle.utilidad)}</b></div>}
            </div>

            <div className="surface-card direccion-entrega">
              <strong>Direccion de entrega</strong>
              <p>{detalle.direccionEntrega || "Sin direccion de entrega registrada."}</p>
            </div>

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

            {esAdmin && (
              <div className="fila-total-form" style={{ marginTop: 14 }}>
                <div><span>Subtotal productos</span><b>{formatoUSD(detalle.subtotalProductos)}</b></div>
                <div><span>Costo de envio</span><b>{formatoUSD(detalle.costoEnvio)}</b></div>
                <div><span>Gastos</span><b>{formatoUSD(detalle.gastosAdicionales)}</b></div>
                <div><span>Total venta</span><b>{formatoUSD(detalle.totalVenta)}</b></div>
                <div><span>Utilidad ({formatoNumero(detalle.margenPct)}%)</span>
                  <b className={Number(detalle.utilidad) >= 0 ? "num-positivo" : "num-negativo"}>{formatoUSD(detalle.utilidad)}</b></div>
                <div className="metric-rentabilidad"><span>Rentabilidad</span><b><Semaforo valor={detalle.rentabilidad} /></b></div>
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

            {esAdmin && (
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
