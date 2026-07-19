import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { convertirMoneda, getKpis, getProductosMasRentables, getTipoCambio } from "../api/endpoints";
import { formatoUSD, formatoNumero } from "../utils/format";
import { MONEDAS, nombreMoneda } from "../utils/monedas";
import KpiCard from "../components/KpiCard";
import Icon from "../components/Icon";
import "./Dashboard.css";

const COLORS = ["#12a37a", "#f59e0b", "#dc2626"];

const TOOLTIP_OSCURO = {
  contentStyle: { background: "#0e2a3e", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 8 },
  itemStyle: { color: "#eaf3f9" },
  labelStyle: { color: "#95afc1" },
};

function CurrencySelect({ value, onChange }) {
  const [abierto, setAbierto] = useState(false);
  const seleccionar = (codigo) => {
    onChange(codigo);
    setAbierto(false);
  };

  return (
    <div className="currency-select" onBlur={() => window.setTimeout(() => setAbierto(false), 120)}>
      <button type="button" className="currency-select-trigger" onClick={() => setAbierto((actual) => !actual)}>
        <span>{value}</span>
        <Icon name="arrowRight" size={14} />
      </button>
      {abierto && (
        <div className="currency-select-menu">
          {MONEDAS.map((moneda) => (
            <button
              type="button"
              key={moneda.codigo}
              className={moneda.codigo === value ? "activo" : ""}
              onMouseDown={() => seleccionar(moneda.codigo)}
            >
              <b>{moneda.codigo}</b>
              <span>{moneda.nombre}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const formatoFechaCambio = (valor) => {
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor || "No disponible";
  return fecha.toLocaleString("es-CR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [productos, setProductos] = useState([]);
  const [tc, setTc] = useState(null);
  const [conversion, setConversion] = useState({ monto: 100, origen: "USD", destino: "CRC" });
  const [resultadoConversion, setResultadoConversion] = useState(null);
  const [errorConversion, setErrorConversion] = useState("");

  useEffect(() => {
    getKpis().then(setKpis).catch(() => setKpis(null));
    getProductosMasRentables(8).then(setProductos).catch(() => setProductos([]));
    getTipoCambio().then(setTc).catch(() => setTc(null));
  }, []);

  const semaforo = kpis
    ? [
        { name: "Rentables", value: kpis.rentables },
        { name: "Poco rentables", value: kpis.pocoRentables },
        { name: "No rentables", value: kpis.noRentables },
      ]
    : [];

  const barData = productos.map((p) => ({
    nombre: p.nombre,
    utilidad: Number(p.utilidadGenerada) || 0,
  }));

  const utilidadPromedio = kpis && kpis.totalPedidos > 0
    ? Number(kpis.utilidadTotal) / kpis.totalPedidos
    : 0;

  const ejecutarConversion = async () => {
    try {
      setErrorConversion("");
      const data = await convertirMoneda(conversion);
      setResultadoConversion(data);
    } catch (_) {
      setResultadoConversion(null);
      setErrorConversion("No se pudo consultar la conversion en este momento.");
    }
  };

  const alertas = kpis
    ? [
        {
          tipo: kpis.noRentables > 0 ? "rojo" : "verde",
          titulo: kpis.noRentables > 0 ? `${kpis.noRentables} pedido(s) no rentable(s)` : "Sin pedidos en perdida",
          texto: kpis.noRentables > 0
            ? "Revise precios, peso facturable o modalidad antes de aprobar nuevas compras."
            : "La cartera actual no muestra pedidos clasificados como no rentables.",
          icono: kpis.noRentables > 0 ? "x" : "check",
          destino: kpis.noRentables > 0 ? "/pedidos?rentabilidad=NO_RENTABLE" : null,
        },
        {
          tipo: kpis.pocoRentables > 0 ? "ambar" : "verde",
          titulo: kpis.pocoRentables > 0 ? `${kpis.pocoRentables} pedido(s) con margen bajo` : "Margen operativo saludable",
          texto: kpis.pocoRentables > 0
            ? "Son candidatos para renegociar precio de venta o consolidar empaque."
            : "No hay pedidos en zona de poca rentabilidad.",
          icono: kpis.pocoRentables > 0 ? "clock" : "check",
          destino: kpis.pocoRentables > 0 ? "/pedidos?rentabilidad=POCO_RENTABLE" : null,
        },
      ]
    : [];

  return (
    <div className="contenido">
      <div className="page-header">
        <div>
          <span className="page-kicker"><Icon name="dashboard" size={13} /> Operacion comercial</span>
          <h2>Panel de resultados</h2>
          <p className="subtitulo-pagina">Resumen ejecutivo de importaciones, utilidad y rentabilidad.</p>
        </div>
        {kpis && (
          <div className="page-actions">
            <span className="badge badge-azul">{kpis.totalPedidos} pedidos registrados</span>
          </div>
        )}
      </div>

      <div className="grid-kpis">
        <KpiCard etiqueta="Pedidos activos" valor={kpis ? kpis.pedidosActivos : "-"} icono="box" ayuda="Carga en seguimiento" />
        <KpiCard etiqueta="Utilidad total" valor={kpis ? formatoUSD(kpis.utilidadTotal) : "-"} variante="verde" icono="chart" ayuda="Resultado neto estimado" />
        <KpiCard etiqueta="Ventas totales" valor={kpis ? formatoUSD(kpis.ventasTotales) : "-"} icono="quote" ayuda="Valor comercial cotizado" />
        <KpiCard etiqueta="Costos acumulados" valor={kpis ? formatoUSD(kpis.costosAcumulados) : "-"} variante="ambar" icono="calculator" ayuda="Producto + envio + gastos" />
      </div>

      <div className="grid-graficos">
        <div className="card">
          <h3 className="card-titulo"><span className="icono-titulo"><Icon name="chart" size={16} /></span>Productos mas rentables</h3>
          {barData.length === 0 ? (
            <div className="estado-vacio">Sin datos todavia.</div>
          ) : (
            <ResponsiveContainer width="100%" height={310}>
              <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.12)" />
                <XAxis type="number" tickFormatter={(v) => `$${v}`} fontSize={12} stroke="rgba(255,255,255,0.12)" tick={{ fill: "#95afc1" }} />
                <YAxis type="category" dataKey="nombre" width={220} fontSize={11} interval={0} stroke="rgba(255,255,255,0.12)" tick={{ fill: "#95afc1" }} />
                <Tooltip formatter={(v) => formatoUSD(v)} {...TOOLTIP_OSCURO} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="utilidad" fill="#16c0cc" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 className="card-titulo"><span className="icono-titulo"><Icon name="box" size={16} /></span>Semaforo de rentabilidad</h3>
          {kpis && kpis.totalPedidos > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie data={semaforo} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3}>
                    {semaforo.map((e, i) => <Cell key={e.name} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip {...TOOLTIP_OSCURO} />
                </PieChart>
              </ResponsiveContainer>
              <div className="metric-strip">
                <div className="metric-box"><span>Rentables</span><b className="num-positivo">{kpis.rentables}</b></div>
                <div className="metric-box"><span>Margen bajo</span><b>{kpis.pocoRentables}</b></div>
                <div className="metric-box"><span>No rentables</span><b className="num-negativo">{kpis.noRentables}</b></div>
              </div>
            </>
          ) : (
            <div className="estado-vacio">Sin pedidos todavia.</div>
          )}
        </div>
      </div>

      <div className="grid-operacion">
        <div className="card">
          <h3 className="card-titulo"><span className="icono-titulo"><Icon name="exchange" size={16} /></span>Conversor de moneda</h3>
          {tc ? (
            <>
              <div className="metric-strip metric-strip-compacta">
                <div className="metric-box"><span>Referencia diaria</span><b>USD / CRC: {formatoNumero(tc.colonesPorDolar, 2)}</b></div>
                <div className="metric-box"><span>Ultima actualizacion</span><b>{formatoFechaCambio(tc.fecha)}</b></div>
              </div>
              <div className="converter-panel">
                <div className="campo">
                  <label>Monto</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={conversion.monto}
                    onChange={(e) => setConversion({ ...conversion, monto: e.target.value })}
                  />
                </div>
                <div className="campo">
                  <label>Origen</label>
                  <CurrencySelect value={conversion.origen} onChange={(origen) => setConversion({ ...conversion, origen })} />
                </div>
                <div className="campo">
                  <label>Destino</label>
                  <CurrencySelect value={conversion.destino} onChange={(destino) => setConversion({ ...conversion, destino })} />
                </div>
                <button type="button" className="btn btn-primario" onClick={ejecutarConversion}>
                  <Icon name="exchange" size={15} />
                  Convertir
                </button>
              </div>
              {resultadoConversion && (
                <div className="conversion-result">
                  <strong>{formatoNumero(resultadoConversion.resultado, 2)} {nombreMoneda(resultadoConversion.monedaDestino)}</strong>
                  <span>
                    {formatoNumero(resultadoConversion.monto, 2)} {nombreMoneda(resultadoConversion.monedaOrigen)}
                    {" "}con tasa diaria de {resultadoConversion.fuente}.
                  </span>
                </div>
              )}
              {errorConversion && <div className="mensaje-error">{errorConversion}</div>}
            </>
          ) : (
            <div className="estado-vacio">No se pudo consultar el tipo de cambio.</div>
          )}
        </div>

        <div className="card">
          <h3 className="card-titulo"><span className="icono-titulo"><Icon name="timeline" size={16} /></span>Alertas comerciales</h3>
          {kpis ? (
            <div className="alert-list">
              {alertas.map((a) => (
                a.destino ? (
                  <Link className="alert-item alert-click" key={a.titulo} to={a.destino}>
                    <span className={`alert-icon ${a.tipo}`}><Icon name={a.icono} size={15} /></span>
                    <div><strong>{a.titulo}</strong><p>{a.texto}</p></div>
                    <span className="alert-ir"><Icon name="arrowRight" size={15} /></span>
                  </Link>
                ) : (
                  <div className="alert-item" key={a.titulo}>
                    <span className={`alert-icon ${a.tipo}`}><Icon name={a.icono} size={15} /></span>
                    <div><strong>{a.titulo}</strong><p>{a.texto}</p></div>
                  </div>
                )
              ))}
              <div className="alert-item">
                <span className="alert-icon verde"><Icon name="chart" size={15} /></span>
                <div><strong>Utilidad promedio: {formatoUSD(utilidadPromedio)}</strong><p>Indicador rapido para defender el valor comercial del sistema.</p></div>
              </div>
            </div>
          ) : (
            <div className="estado-vacio">Sin datos para generar alertas.</div>
          )}
        </div>
      </div>
    </div>
  );
}
