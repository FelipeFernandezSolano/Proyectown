import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getPedidos, getPedido, getEstados, cambiarEstadoPedido, eliminarPedido,
  descargarCotizacionCliente, descargarCotizacionInterna, descargarBlob,
} from "../api/endpoints";
import { formatoUSD, formatoNumero, formatoFecha, RENTABILIDAD } from "../utils/format";
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";
import Icon from "../components/Icon";

function Semaforo({ valor }) {
  const r = RENTABILIDAD[valor] || RENTABILIDAD.NO_RENTABLE;
  return <span className="semaforo"><span className="punto" style={{ background: r.punto }} />{r.texto}</span>;
}

export default function Pedidos() {
  const { usuario } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const esAdmin = usuario?.rol === "ADMINISTRADOR";
  const [pedidos, setPedidos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [nota, setNota] = useState("");
  const [aEliminar, setAEliminar] = useState(null);
  const rentabilidadObjetivo = searchParams.get("rentabilidad");

  const abrir = async (id) => {
    const d = await getPedido(id);
    setDetalle(d);
    setNuevoEstado(d.estado || "");
    setNota("");
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

  const rentables = pedidos.filter((p) => p.rentabilidad === "RENTABLE").length;
  const pocoRentables = pedidos.filter((p) => p.rentabilidad === "POCO_RENTABLE").length;
  const noRentables = pedidos.filter((p) => p.rentabilidad === "NO_RENTABLE").length;
  const pedidosFiltrados = esAdmin && rentabilidadObjetivo
    ? pedidos.filter((p) => p.rentabilidad === rentabilidadObjetivo)
    : pedidos;

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
          <h2>Pedidos de importacion</h2>
          <p className="subtitulo-pagina">
            {esAdmin ? "Control comercial, utilidad, rentabilidad y estado de cada pedido." : "Seguimiento logistico y estado de cada pedido (solo lectura)."}
          </p>
        </div>
        <div className="page-actions">
          <span className="badge badge-azul">{pedidos.length} pedidos</span>
          {esAdmin && <span className="badge badge-verde">{rentables} rentables</span>}
          {esAdmin && noRentables > 0 && <span className="badge badge-rojo">{noRentables} no rentables</span>}
        </div>
      </div>

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

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="tabla-pch">
          <thead>
            <tr>
              <th>Codigo</th><th>Cliente</th><th>Envio</th><th>Estado</th>
              {esAdmin && <><th>Venta</th><th>Utilidad</th><th>Rentabilidad</th></>}
              <th>Fecha</th>{esAdmin && <th></th>}
            </tr>
          </thead>
          <tbody>
            {pedidosFiltrados.length === 0 && (
              <tr><td colSpan={esAdmin ? 9 : 5}><div className="estado-vacio">No hay pedidos para este filtro.</div></td></tr>
            )}
            {pedidosFiltrados.map((p) => (
              <tr key={p.id} className="fila-clickeable" onDoubleClick={() => abrir(p.id)} title="Doble clic para ver el detalle">
                <td><b>{p.codigo}</b></td>
                <td>{p.clienteNombre || "-"}</td>
                <td><span className="chip-envio"><Icon name={p.tipoEnvio === "MARITIMO" ? "ship" : "plane"} size={13} />{p.tipoEnvio}</span></td>
                <td><span className="badge badge-azul" style={{ background: `${p.estadoColor || "#0c6291"}22`, color: p.estadoColor || "#0c6291" }}>{p.estado}</span></td>
                {esAdmin && (
                  <>
                    <td>{formatoUSD(p.totalVenta)}</td>
                    <td className={Number(p.utilidad) >= 0 ? "num-positivo" : "num-negativo"}>{formatoUSD(p.utilidad)}</td>
                    <td><Semaforo valor={p.rentabilidad} /></td>
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
          <div className="modal-caja modal-ancha" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 780 }}>
            <h3>{detalle.codigo} - {detalle.clienteNombre}</h3>
            <p className="texto-tenue">
              <span className="chip-envio"><Icon name={detalle.tipoEnvio === "MARITIMO" ? "ship" : "plane"} size={13} />{detalle.tipoEnvio}</span>
              {"  "}~{detalle.diasEstimados} dias · Estado actual: <b>{detalle.estado}</b>
            </p>

            <div className="metric-strip" style={{ margin: "14px 0" }}>
              <div className="metric-box"><span>Estado</span><b>{detalle.estado}</b></div>
              <div className="metric-box"><span>Peso facturable</span><b>{formatoNumero(detalle.pesoFacturableTotal)} kg</b></div>
              {esAdmin && <div className="metric-box"><span>Total venta</span><b>{formatoUSD(detalle.totalVenta)}</b></div>}
              {esAdmin && <div className="metric-box"><span>Utilidad</span><b className={Number(detalle.utilidad) >= 0 ? "num-positivo" : "num-negativo"}>{formatoUSD(detalle.utilidad)}</b></div>}
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
