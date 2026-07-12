import { useEffect, useState } from "react";
import {
  getPedidos, getPedido, getEstados, cambiarEstadoPedido, eliminarPedido,
  descargarCotizacion, descargarBlob,
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
  const esAdmin = usuario?.rol === "ADMINISTRADOR";
  const [pedidos, setPedidos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [nota, setNota] = useState("");
  const [aEliminar, setAEliminar] = useState(null);

  const cargar = () => getPedidos().then(setPedidos).catch(() => setPedidos([]));
  useEffect(() => {
    cargar();
    if (esAdmin) getEstados().then(setEstados).catch(() => setEstados([]));
    /* eslint-disable-next-line */
  }, []);

  const abrir = async (id) => {
    const d = await getPedido(id);
    setDetalle(d);
    setNuevoEstado(d.estado || "");
    setNota("");
  };

  const aplicarEstado = async () => {
    if (!nuevoEstado) return;
    const d = await cambiarEstadoPedido(detalle.id, nuevoEstado, nota || null);
    setDetalle(d);
    setNota("");
    cargar();
  };

  const descargarPdf = async (id) => {
    const blob = await descargarCotizacion(id);
    descargarBlob(blob, `cotizacion-${id}.pdf`);
  };

  const confirmarEliminar = async () => {
    try { await eliminarPedido(aEliminar.id); } catch (_) {}
    setAEliminar(null);
    if (detalle && detalle.id === aEliminar.id) setDetalle(null);
    cargar();
  };

  return (
    <div className="contenido">
      <h2>Pedidos de importacion</h2>
      <p className="subtitulo-pagina">
        {esAdmin ? "Costos, utilidad, rentabilidad y estado de cada pedido." : "Seguimiento y estado de cada pedido (solo lectura)."}
      </p>

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
            {pedidos.length === 0 && (
              <tr><td colSpan={esAdmin ? 9 : 5}><div className="estado-vacio">No hay pedidos registrados.</div></td></tr>
            )}
            {pedidos.map((p) => (
              <tr key={p.id} className="fila-clickeable" onClick={() => abrir(p.id)}>
                <td><b>{p.codigo}</b></td>
                <td>{p.clienteNombre || "-"}</td>
                <td><span className="chip-envio"><Icon name={p.tipoEnvio === "MARITIMO" ? "ship" : "plane"} size={13} />{p.tipoEnvio}</span></td>
                <td><span className="badge badge-azul" style={{ background: (p.estadoColor || "#0c6291") + "22", color: p.estadoColor || "#0c6291" }}>{p.estado}</span></td>
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
                      <button className="btn-icono" title="Cotizacion PDF" onClick={() => descargarPdf(p.id)}><Icon name="quote" size={16} /></button>
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
          <div className="modal-caja modal-ancha" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <h3>{detalle.codigo} — {detalle.clienteNombre}</h3>
            <p className="texto-tenue">
              <span className="chip-envio"><Icon name={detalle.tipoEnvio === "MARITIMO" ? "ship" : "plane"} size={13} />{detalle.tipoEnvio}</span>
              {"  "}~{detalle.diasEstimados} dias · Estado actual: <b>{detalle.estado}</b>
            </p>

            <h4 style={{ margin: "14px 0 6px" }}>Productos</h4>
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

            <h4 style={{ margin: "14px 0 6px" }}>Paquetes y pesos</h4>
            <table className="tabla-pch">
              <thead><tr><th>Paquete</th><th>Dim (cm)</th><th>Real</th><th>Volum.</th><th>Facturable</th></tr></thead>
              <tbody>
                {detalle.paquetes.map((pk, i) => (
                  <tr key={i}>
                    <td>{pk.descripcion}</td>
                    <td className="texto-tenue">{formatoNumero(pk.largoCm, 0)}×{formatoNumero(pk.anchoCm, 0)}×{formatoNumero(pk.altoCm, 0)}</td>
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
                <div><span>Rentabilidad</span><b><Semaforo valor={detalle.rentabilidad} /></b></div>
              </div>
            )}

            <h4 style={{ margin: "18px 0 8px" }}><Icon name="timeline" size={15} /> Linea de tiempo</h4>
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
                <h4 style={{ margin: "14px 0 6px" }}>Actualizar estado</h4>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
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
                <button className="btn btn-secundario" onClick={() => descargarPdf(detalle.id)}><Icon name="quote" size={15} />Descargar cotizacion</button>
              )}
              <button className="btn btn-azul" onClick={() => setDetalle(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        abierto={!!aEliminar}
        titulo="Eliminar pedido"
        mensaje={aEliminar ? `¿Eliminar el pedido ${aEliminar.codigo}?` : ""}
        onConfirmar={confirmarEliminar}
        onCancelar={() => setAEliminar(null)}
      />
    </div>
  );
}
