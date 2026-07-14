import Icon from "./Icon";

export default function KpiCard({ etiqueta, valor, variante = "azul", icono = "chart", ayuda }) {
  return (
    <div className={`kpi-card kpi-${variante}`}>
      <div className="kpi-cabecera">
        <span className="kpi-icono"><Icon name={icono} size={18} /></span>
        <span className="kpi-label">{etiqueta}</span>
      </div>
      <div className="kpi-valor">{valor}</div>
      {ayuda && <div className="kpi-ayuda">{ayuda}</div>}
    </div>
  );
}
