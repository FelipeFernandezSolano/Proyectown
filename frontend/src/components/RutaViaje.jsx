import { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as THREE from "three";
import Icon from "./Icon";
import earthTexture from "../assets/earth-dark.jpg";
import "./RutaViaje.css";

const ORIGEN = { lat: 22.5431, lng: 114.0579, nombre: "Shenzhen, China" };
const DESTINO = { lat: 9.9981, lng: -84.2041, nombre: "Costa Rica" };

const PATH_ICONO = {
  ship: "M4 10V5h5V3h6v2h5v5l-8 3zM3 13l9 3 9-3v2l-1 5H4l-1-5zm2 5h14l.4-2L12 18l-7.4-2z",
  plane: "M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z",
};

// Dibuja el icono (mismo trazado que components/Icon.jsx) sobre un canvas y lo usa como
// textura de un sprite 3D: mas confiable que una capa HTML superpuesta sobre el globo WebGL.
function crearMarcadorIcono(nombreIcono, colorFondo) {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = colorFondo;
  ctx.stroke();
  ctx.fillStyle = colorFondo;
  ctx.translate(size / 2 - 12, size / 2 - 12);
  ctx.fill(new Path2D(PATH_ICONO[nombreIcono]));
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, depthWrite: false, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(7, 7, 1);
  return sprite;
}

const RUTAS = {
  maritimo: {
    tab: "Marítimo",
    icon: "ship",
    resumen: "Ruta marítima",
    duracion: 48,
    duracionTxt: "40 - 55 días",
    distancia: "≈ 14 800 km",
    color: "#16C0CC",
    puntos: [
      { titulo: "Shenzhen, China", texto: "Carga consolidada y contenedor sellado, listo para zarpar hacia América." },
      { titulo: "Tránsito Pacífico", texto: "Cruce oceánico con seguimiento de naviera y ETA actualizado por etapa." },
      { titulo: "Costa Rica", texto: "Desconsolidación en Puerto Caldera, trámite aduanal y despacho hacia bodega." },
    ],
  },
  aereo: {
    tab: "Aéreo",
    icon: "plane",
    resumen: "Ruta aérea",
    duracion: 5,
    duracionTxt: "3 - 7 días",
    distancia: "≈ 14 800 km",
    color: "#F5A524",
    puntos: [
      { titulo: "Shenzhen, China", texto: "Recepción en bodega de carga aérea y documentación lista para el vuelo." },
      { titulo: "Espacio aéreo", texto: "Vuelo de carga con seguimiento del número de guía aérea en cada tramo." },
      { titulo: "Costa Rica", texto: "Llegada al Aeropuerto Juan Santamaría, nacionalización express y entrega." },
    ],
  },
};

// Punto intermedio sobre un gran circulo (formula estandar de navegacion esferica).
function puntoIntermedio(origen, destino, f) {
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;
  const lat1 = toRad(origen.lat), lon1 = toRad(origen.lng);
  const lat2 = toRad(destino.lat), lon2 = toRad(destino.lng);
  const d = 2 * Math.asin(Math.sqrt(
    Math.sin((lat2 - lat1) / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2
  ));
  if (d === 0) return { lat: origen.lat, lng: origen.lng };
  const A = Math.sin((1 - f) * d) / Math.sin(d);
  const B = Math.sin(f * d) / Math.sin(d);
  const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
  const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
  const z = A * Math.sin(lat1) + B * Math.sin(lat2);
  return { lat: toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))), lng: toDeg(Math.atan2(y, x)) };
}

export default function RutaViaje() {
  const [modo, setModo] = useState("maritimo");
  const [activo, setActivo] = useState(0);
  const [dia, setDia] = useState(1);
  const [size, setSize] = useState({ w: 900, h: 460 });
  const globeRef = useRef(null);
  const contenedorRef = useRef(null);
  const ruta = RUTAS[modo];

  useEffect(() => {
    const el = contenedorRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!globeRef.current) return;
    globeRef.current.pointOfView({ lat: 16, lng: 10, altitude: 2.1 }, 0);
    const controles = globeRef.current.controls();
    controles.autoRotate = true;
    controles.autoRotateSpeed = 0.35;
    controles.enableZoom = true;
  }, [size.w]);

  useEffect(() => {
    setActivo(0);
    setDia(1);
    const total = ruta.duracion;
    const durMs = 9000;
    const stepMs = Math.max(120, durMs / total);
    let d = 1;
    const id = setInterval(() => {
      d = d >= total ? 1 : d + 1;
      setDia(d);
    }, stepMs);
    return () => clearInterval(id);
  }, [modo, ruta.duracion]);

  const avance = dia / ruta.duracion;
  const posicionActual = puntoIntermedio(ORIGEN, DESTINO, avance);

  const arcos = [{ startLat: ORIGEN.lat, startLng: ORIGEN.lng, endLat: DESTINO.lat, endLng: DESTINO.lng, color: ruta.color }];
  const puntosMapa = [
    { lat: ORIGEN.lat, lng: ORIGEN.lng, color: "#EAF3F9", label: ORIGEN.nombre },
    { lat: DESTINO.lat, lng: DESTINO.lng, color: "#EAF3F9", label: DESTINO.nombre },
  ];
  const marcador = [{ lat: posicionActual.lat, lng: posicionActual.lng }];

  return (
    <section className="rv-wrap" id="ruta">
      <div className="is-head reveal">
        <span className="is-kicker">Seguimiento en vivo</span>
        <h2>Así viaja tu pedido hasta Costa Rica.</h2>
        <p className="rv-sub">Girá el globo y hacé zoom con el mouse: la ruta China → Costa Rica es siempre la misma, solo cambia el medio de transporte.</p>
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
        <div className="rv-globe-stage" ref={contenedorRef}>
          <div className="rv-live">
            <span className="rv-live-dot" /> En vivo · arrastrá para rotar
          </div>
          <div className="rv-stage-meta">
            <span><Icon name="clock" size={12} /> {ruta.duracionTxt}</span>
            <span>{ruta.distancia}</span>
          </div>

          <Globe
            ref={globeRef}
            width={size.w}
            height={size.h}
            globeImageUrl={earthTexture}
            backgroundColor="rgba(0,0,0,0)"
            atmosphereColor={ruta.color}
            atmosphereAltitude={0.2}
            arcsData={arcos}
            arcColor="color"
            arcStroke={0.6}
            arcAltitude={0.28}
            arcDashLength={0.4}
            arcDashGap={0.18}
            arcDashAnimateTime={2600}
            pointsData={puntosMapa}
            pointLat="lat"
            pointLng="lng"
            pointColor="color"
            pointAltitude={0.008}
            pointRadius={0.45}
            pointLabel="label"
            objectsData={marcador}
            objectLat="lat"
            objectLng="lng"
            objectAltitude={0.035}
            objectThreeObject={() => crearMarcadorIcono(ruta.icon, ruta.color)}
          />

          <div className="rv-day">
            <div className="rv-day-top">
              <span>Día {dia} de {ruta.duracion}</span>
              <span>{Math.round(avance * 100)}%</span>
            </div>
            <div className="rv-day-bar"><span style={{ width: `${avance * 100}%` }} /></div>
          </div>
        </div>

        <div className="rv-panel reveal">
          <div className="rv-panel-head">
            <div className="rv-route-title">
              <span>China</span>
              <Icon name="arrowRight" size={14} />
              <span>Costa Rica</span>
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
