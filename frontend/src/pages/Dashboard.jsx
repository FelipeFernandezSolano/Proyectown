import { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { getKpis, getProductosMasRentables } from "../api/endpoints";
import { formatoUSD, formatoNumero } from "../utils/format";
import KpiCard from "../components/KpiCard";
import Icon from "../components/Icon";

const COLORS = ["#12a37a", "#f59e0b", "#dc2626"];

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    getKpis().then(setKpis).catch(() => setKpis(null));
    getProductosMasRentables(8).then(setProductos).catch(() => setProductos([]));
  }, []);

  const semaforo = kpis
    ? [
        { name: "Rentables", value: kpis.rentables },
        { name: "Poco rentables", value: kpis.pocoRentables },
        { name: "No rentables", value: kpis.noRentables },
      ]
    : [];

  const barData = productos.map((p) => ({
    nombre: p.nombre.length > 22 ? p.nombre.slice(0, 22) + "…" : p.nombre,
    utilidad: Number(p.utilidadGenerada) || 0,
  }));

  return (
    <div className="contenido">
      <h2>Panel de resultados</h2>
      <p className="subtitulo-pagina">Resumen de importaciones, utilidad y rentabilidad.</p>

      <div className="grid-kpis">
        <KpiCard etiqueta="Pedidos activos" valor={kpis ? kpis.pedidosActivos : "—"} />
        <KpiCard etiqueta="Utilidad total" valor={kpis ? formatoUSD(kpis.utilidadTotal) : "—"} variante="verde" />
        <KpiCard etiqueta="Ventas totales" valor={kpis ? formatoUSD(kpis.ventasTotales) : "—"} />
        <KpiCard etiqueta="Costos acumulados" valor={kpis ? formatoUSD(kpis.costosAcumulados) : "—"} />
      </div>

      <div className="grid-graficos">
        <div className="card">
          <h3 className="card-titulo"><span className="icono-titulo"><Icon name="chart" size={16} /></span>Productos mas rentables</h3>
          {barData.length === 0 ? (
            <div className="estado-vacio">Sin datos todavia.</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => "$" + v} fontSize={12} />
                <YAxis type="category" dataKey="nombre" width={150} fontSize={11} />
                <Tooltip formatter={(v) => formatoUSD(v)} />
                <Bar dataKey="utilidad" fill="#0c6291" radius={[0, 6, 6, 0]} />
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
                  <Pie data={semaforo} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {semaforo.map((e, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", justifyContent: "space-around", marginTop: 8 }}>
                <span className="semaforo"><span className="punto" style={{ background: COLORS[0] }} />{kpis.rentables} rentables</span>
                <span className="semaforo"><span className="punto" style={{ background: COLORS[1] }} />{kpis.pocoRentables} poco</span>
                <span className="semaforo"><span className="punto" style={{ background: COLORS[2] }} />{kpis.noRentables} no</span>
              </div>
            </>
          ) : (
            <div className="estado-vacio">Sin pedidos todavia.</div>
          )}
        </div>
      </div>

      {kpis && (
        <p className="texto-tenue">
          Total de pedidos registrados: {kpis.totalPedidos}. Utilidad promedio por pedido:{" "}
          {kpis.totalPedidos > 0 ? formatoUSD(Number(kpis.utilidadTotal) / kpis.totalPedidos) : "—"}.
        </p>
      )}
    </div>
  );
}
