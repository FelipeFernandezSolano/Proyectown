import { useState } from "react";
import { simular } from "../api/endpoints";
import { formatoUSD, formatoNumero, RENTABILIDAD } from "../utils/format";
import Icon from "../components/Icon";

export default function Simulador() {
  const [paquetes, setPaquetes] = useState([{ descripcion: "Caja 1", largoCm: 40, anchoCm: 30, altoCm: 25, pesoRealKg: 5 }]);
  const [datos, setDatos] = useState({ subtotalProductos: 200, totalVenta: 320, gastosAdicionales: 20 });
  const [res, setRes] = useState(null);
  const [cargando, setCargando] = useState(false);

  const setPaquete = (i, campo, val) => {
    const c = [...paquetes];
    c[i] = { ...c[i], [campo]: val };
    setPaquetes(c);
  };
  const addPaquete = () => setPaquetes([...paquetes, { descripcion: `Caja ${paquetes.length + 1}`, largoCm: 0, anchoCm: 0, altoCm: 0, pesoRealKg: 0 }]);
  const delPaquete = (i) => setPaquetes(paquetes.filter((_, j) => j !== i));

  const correr = async () => {
    setCargando(true);
    try {
      const r = await simular({
        paquetes: paquetes.map((p) => ({
          largoCm: Number(p.largoCm), anchoCm: Number(p.anchoCm), altoCm: Number(p.altoCm), pesoRealKg: Number(p.pesoRealKg),
        })),
        subtotalProductos: Number(datos.subtotalProductos),
        totalVenta: Number(datos.totalVenta),
        gastosAdicionales: Number(datos.gastosAdicionales),
      });
      setRes(r);
    } finally {
      setCargando(false);
    }
  };

  const mejorUtilidad = res ? Math.max(...res.comparacionModalidad.map((m) => Number(m.utilidad))) : null;
  const peorCosto = res ? Math.max(...res.comparacionModalidad.map((m) => Number(m.costoEnvio))) : 0;
  const mejorCosto = res ? Math.min(...res.comparacionModalidad.map((m) => Number(m.costoEnvio))) : 0;
  const ahorro = peorCosto - mejorCosto;

  return (
    <div className="contenido">
      <div className="page-header">
        <div>
          <span className="page-kicker"><Icon name="calculator" size={13} /> Decision antes de comprar</span>
          <h2>Simulador de escenarios de envio</h2>
          <p className="subtitulo-pagina">Compara aereo vs. maritimo y empaque consolidado vs. separado antes de comprometer la compra.</p>
        </div>
        {res && <div className="page-actions"><span className="badge badge-verde">Ahorro potencial: {formatoUSD(ahorro)}</span></div>}
      </div>

      <div className="split-workspace">
        <div className="stack">
          <div className="card">
            <h3 className="card-titulo"><span className="icono-titulo"><Icon name="box" size={16} /></span>Paquetes a evaluar</h3>
            {paquetes.map((pk, i) => (
              <div key={i} className="form-row">
                <div className="campo" style={{ flex: 1, minWidth: 130 }}><label>Descripcion</label>
                  <input value={pk.descripcion} onChange={(e) => setPaquete(i, "descripcion", e.target.value)} /></div>
                <div className="campo" style={{ width: 90 }}><label>Largo</label>
                  <input type="number" min="0" value={pk.largoCm} onChange={(e) => setPaquete(i, "largoCm", e.target.value)} /></div>
                <div className="campo" style={{ width: 90 }}><label>Ancho</label>
                  <input type="number" min="0" value={pk.anchoCm} onChange={(e) => setPaquete(i, "anchoCm", e.target.value)} /></div>
                <div className="campo" style={{ width: 90 }}><label>Alto</label>
                  <input type="number" min="0" value={pk.altoCm} onChange={(e) => setPaquete(i, "altoCm", e.target.value)} /></div>
                <div className="campo" style={{ width: 100 }}><label>Peso real</label>
                  <input type="number" min="0" value={pk.pesoRealKg} onChange={(e) => setPaquete(i, "pesoRealKg", e.target.value)} /></div>
                <button className="btn-icono" onClick={() => delPaquete(i)}><Icon name="trash" size={16} /></button>
              </div>
            ))}
            <button className="btn btn-secundario mini-boton" onClick={addPaquete}><Icon name="plus" size={14} />Agregar paquete</button>
          </div>

          <div className="card">
            <h3 className="card-titulo"><span className="icono-titulo"><Icon name="quote" size={16} /></span>Valores comerciales</h3>
            <div className="form-grid">
              <div className="campo"><label>Costo de productos (USD)</label>
                <input type="number" value={datos.subtotalProductos} onChange={(e) => setDatos({ ...datos, subtotalProductos: e.target.value })} /></div>
              <div className="campo"><label>Precio de venta total (USD)</label>
                <input type="number" value={datos.totalVenta} onChange={(e) => setDatos({ ...datos, totalVenta: e.target.value })} /></div>
              <div className="campo"><label>Gastos adicionales (USD)</label>
                <input type="number" value={datos.gastosAdicionales} onChange={(e) => setDatos({ ...datos, gastosAdicionales: e.target.value })} /></div>
            </div>
            <div style={{ marginTop: 14 }}>
              <button className="btn btn-azul" onClick={correr} disabled={cargando}>
                <Icon name="exchange" size={15} />{cargando ? "Calculando..." : "Simular decision"}
              </button>
            </div>
          </div>
        </div>

        <aside className="card summary-sidebar">
          <h3 className="card-titulo"><span className="icono-titulo"><Icon name="timeline" size={16} /></span>Lectura comercial</h3>
          {res ? (
            <div className="alert-list">
              <div className="alert-item">
                <span className="alert-icon verde"><Icon name="check" size={15} /></span>
                <div><strong>Recomendacion</strong><p>{res.recomendadoModalidad}</p></div>
              </div>
              <div className="alert-item">
                <span className="alert-icon ambar"><Icon name="box" size={15} /></span>
                <div><strong>Empaque</strong><p>{res.recomendadoEmpaque}</p></div>
              </div>
              <div className="metric-box"><span>Ahorro entre modalidades</span><b>{formatoUSD(ahorro)}</b></div>
            </div>
          ) : (
            <div className="estado-vacio">Ejecute una simulacion para recibir recomendacion, ahorro y riesgo de margen.</div>
          )}
        </aside>
      </div>

      {res && (
        <>
          <div className="card" style={{ marginTop: 16, marginBottom: 16 }}>
            <h3 className="card-titulo"><span className="icono-titulo"><Icon name="plane" size={16} /></span>Comparacion aereo vs. maritimo</h3>
            <div className="grid-comparacion">
              {res.comparacionModalidad.map((m) => {
                const rent = RENTABILIDAD[m.rentabilidad];
                const esMejor = Number(m.utilidad) === mejorUtilidad;
                return (
                  <div key={m.tipoEnvio} className={`panel-envio${esMejor ? " recomendado" : ""}`}>
                    <h4><Icon name={m.tipoEnvio === "MARITIMO" ? "ship" : "plane"} size={18} />{m.tipoEnvio}{esMejor && <span className="badge badge-verde">Recomendado</span>}</h4>
                    <div className="linea">
                      <span>Formula</span>
                      <b>{m.tipoEnvio === "MARITIMO" ? "m3 x $850" : "$20/kg real + $18/kg exced."}</b>
                    </div>
                    <div className="linea"><span>Tiempo estimado</span><b>~{m.diasEstimados} dias</b></div>
                    <div className="linea"><span>Peso facturable</span><b>{formatoNumero(m.pesoFacturableTotal)} kg</b></div>
                    <div className="linea"><span>Costo de envio</span><b>{formatoUSD(m.costoEnvio)}</b></div>
                    <div className="linea"><span>Utilidad</span><b className={Number(m.utilidad) >= 0 ? "num-positivo" : "num-negativo"}>{formatoUSD(m.utilidad)}</b></div>
                    <div className="linea"><span>Rentabilidad</span><b><span className="semaforo"><span className="punto" style={{ background: rent.punto }} />{rent.texto}</span></b></div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <h3 className="card-titulo"><span className="icono-titulo"><Icon name="box" size={16} /></span>Escenarios de empaque</h3>
            <div className="grid-comparacion">
              {res.escenariosEmpaque.map((e) => (
                <div key={e.nombre} className="panel-envio">
                  <h4><Icon name="box" size={16} />{e.nombre}</h4>
                  <p className="texto-tenue">{e.detalle}</p>
                  <div className="linea"><span>Paquetes</span><b>{e.cantidadPaquetes}</b></div>
                  <div className="linea"><span>Peso real</span><b>{formatoNumero(e.pesoRealTotal)} kg</b></div>
                  <div className="linea"><span>Peso volumetrico</span><b>{formatoNumero(e.pesoVolumetricoTotal)} kg</b></div>
                  <div className="linea"><span>Peso facturable</span><b>{formatoNumero(e.pesoFacturableTotal)} kg</b></div>
                  <div className="linea"><span>Envio aereo</span><b>{formatoUSD(e.costoEnvioAereo)}</b></div>
                  <div className="linea"><span>Envio maritimo</span><b>{formatoUSD(e.costoEnvioMaritimo)}</b></div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
