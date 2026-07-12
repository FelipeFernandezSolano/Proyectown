export default function KpiCard({ etiqueta, valor, variante = "azul" }) {
  return (
    <div className={`kpi-card ${variante === "verde" ? "verde" : ""}`}>
      <div className="kpi-label">{etiqueta}</div>
      <div className="kpi-valor">{valor}</div>
    </div>
  );
}
