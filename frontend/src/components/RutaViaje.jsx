import { useEffect, useState } from "react";
import Icon from "./Icon";
import "./RutaViaje.css";

const RUTAS = {
  maritimo: {
    tab: "Marítimo",
    icon: "ship",
    resumen: "Asia hacia Costa Rica",
    duracion: 48,
    duracionTxt: "40 - 55 días",
    distancia: "≈ 14 800 km",
    path: "M50,272 C230,120 620,120 930,242",
    ambiente: "mar",
    puntos: [
      { x: 50, y: 272, titulo: "Shenzhen, China", texto: "Carga consolidada y contenedor sellado, listo para zarpar hacia América." },
      { x: 490, y: 140, titulo: "Tránsito Pacífico", texto: "Cruce oceánico con seguimiento de naviera y ETA actualizado por etapa." },
      { x: 930, y: 242, titulo: "Puerto Caldera, Costa Rica", texto: "Desconsolidación, trámite aduanal y despacho hacia bodega local." },
    ],
  },
  aereo: {
    tab: "Aéreo",
    icon: "plane",
    resumen: "Estados Unidos hacia Costa Rica",
    duracion: 5,
    duracionTxt: "3 - 7 días",
    distancia: "≈ 1 600 km",
    path: "M70,290 C280,90 700,90 940,270",
    ambiente: "cielo",
    puntos: [
      { x: 70, y: 290, titulo: "Miami, Estados Unidos", texto: "Recepción en bodega y documentación lista para el vuelo de carga." },
      { x: 505, y: 108, titulo: "Espacio aéreo", texto: "Vuelo directo con seguimiento del número de guía aérea en cada tramo." },
      { x: 940, y: 270, titulo: "Aeropuerto Juan Santamaría", texto: "Nacionalización express y coordinación de entrega final al cliente." },
    ],
  },
};

export default function RutaViaje() {
  const [modo, setModo] = useState("maritimo");
  const [activo, setActivo] = useState(0);
  const [dia, setDia] = useState(1);
  const ruta = RUTAS[modo];

  useEffect(() => {
    setActivo(0);
    setDia(1);
    const total = ruta.duracion;
    const durMs = 8000;
    const stepMs = Math.max(120, durMs / total);
    let d = 1;
    const id = setInterval(() => {
      d = d >= total ? 1 : d + 1;
      setDia(d);
    }, stepMs);
    return () => clearInterval(id);
  }, [modo, ruta.duracion]);

  const pathId = "rv-path-" + modo;
  const avance = Math.round((dia / ruta.duracion) * 100);
  const origen = ruta.puntos[0].titulo.split(",")[0];
  const destino = ruta.puntos[ruta.puntos.length - 1].titulo.split(",")[0];

  return (
    <section className="rv-wrap" id="ruta">
      <div className="is-head reveal">
        <span className="is-kicker">Seguimiento en vivo</span>
        <h2>Así viaja tu pedido hasta Costa Rica.</h2>
        <p className="rv-sub">Elegí la modalidad y mirá el trayecto: origen, tránsito y llegada, con el mismo nivel de detalle que ve tu cliente en la plataforma.</p>
      </div>

      <div className="rv-tabs" role="tablist">
        {Object.entries(RUTAS).map(([key, r]) => (
          <button
            key={key}
            role="tab"
            aria-selected={modo === key}
            className={modo === key ? "on" : ""}
            onClick={() => setModo(key)}
          >
            <Icon name={r.icon} size={16} />
            <span>{r.tab}</span>
            <em>{r.resumen}</em>
          </button>
        ))}
      </div>

      <div className="rv-body">
        <div className={"rv-stage rv-" + ruta.ambiente} key={modo}>
          <div className="rv-grid" aria-hidden="true" />
          <div className="rv-glow" aria-hidden="true" />

          <div className="rv-live">
            <span className="rv-live-dot" /> En vivo
          </div>
          <div className="rv-stage-meta">
            <span><Icon name="clock" size={12} /> {ruta.duracionTxt}</span>
            <span>{ruta.distancia}</span>
          </div>

          <svg viewBox="0 0 1000 360" className="rv-svg" preserveAspectRatio="xMidYMid meet">
            <path id={pathId} className="rv-line-base" d={ruta.path} fill="none" />
            <path
              className="rv-line-fill"
              d={ruta.path}
              fill="none"
              pathLength="100"
              style={{ strokeDasharray: 100, strokeDashoffset: 100 - avance }}
            />

            {ruta.puntos.map((p, i) => (
              <g
                key={p.titulo}
                className={"rv-point" + (activo === i ? " on" : "")}
                transform={`translate(${p.x},${p.y})`}
                onClick={() => setActivo(i)}
                role="button"
                tabIndex={0}
                aria-label={p.titulo}
              >
                <circle r="13" className="rv-point-ring" />
                <circle r="5" className="rv-point-dot" />
              </g>
            ))}

            <g className="rv-mover">
              <foreignObject x="-17" y="-17" width="34" height="34">
                <div className="rv-mover-icon">
                  <Icon name={ruta.icon} size={17} />
                </div>
              </foreignObject>
              <animateMotion dur="8s" repeatCount="indefinite" rotate={ruta.ambiente === "cielo" ? "auto" : "0"}>
                <mpath href={"#" + pathId} xlinkHref={"#" + pathId} />
              </animateMotion>
            </g>
          </svg>

          <div className="rv-day">
            <div className="rv-day-top">
              <span>Día {dia} de {ruta.duracion}</span>
              <span>{avance}%</span>
            </div>
            <div className="rv-day-bar"><span style={{ width: `${avance}%` }} /></div>
          </div>
        </div>

        <div className="rv-panel reveal">
          <div className="rv-panel-head">
            <div className="rv-route-title">
              <span>{origen}</span>
              <Icon name="arrowRight" size={14} />
              <span>{destino}</span>
            </div>
            <span className="rv-status"><span className="rv-status-dot" /> En tránsito</span>
          </div>

          <ol className="rv-steps">
            {ruta.puntos.map((p, i) => (
              <li key={p.titulo} className={i === activo ? "on" : i < activo ? "done" : ""}>
                <button onClick={() => setActivo(i)}>
                  <span className="rv-step-node">{i < activo ? <Icon name="check" size={12} /> : i + 1}</span>
                  <span className="rv-step-title">{p.titulo}</span>
                </button>
                {i === activo && <p className="rv-step-text">{p.texto}</p>}
              </li>
            ))}
          </ol>

          <div className="rv-panel-foot">
            <div><span>Distancia</span><b>{ruta.distancia}</b></div>
            <div><span>Tiempo estimado</span><b>{ruta.duracionTxt}</b></div>
          </div>
        </div>
      </div>
    </section>
  );
}
