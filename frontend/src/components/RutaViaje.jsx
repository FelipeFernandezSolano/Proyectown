import { useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as THREE from "three";
import Icon from "./Icon";
import earthTexture from "../assets/earth-dark.jpg";
import "./RutaViaje.css";

const PATH_ICONO = {
  ship: "M4 10V5h5V3h6v2h5v5l-8 3zM3 13l9 3 9-3v2l-1 5H4l-1-5zm2 5h14l.4-2L12 18l-7.4-2z",
  plane: "M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z",
};

// Dibuja el icono sobre un canvas y lo usa como textura de un sprite 3D (mas confiable
// que una capa HTML superpuesta sobre el globo WebGL).
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

// Rutas con varias escalas. El maritimo va por mar abierto del Pacifico (no cruza paises)
// con transbordo en Panama; el aereo hace sus transbordos aeroportuarios.
const RUTAS = {
  maritimo: {
    tab: "Marítimo",
    icon: "ship",
    resumen: "Ruta marítima",
    duracion: 48,
    duracionTxt: "40 - 55 días",
    distancia: "≈ 16 200 km",
    color: "#16C0CC",
    arcAlt: 0.06,
    objAlt: 0.012,
    waypoints: [
      { lat: 22.57, lng: 114.28, titulo: "Salida: Shenzhen (Yantian)", texto: "Consolidación de carga, contenedor sellado y zarpe hacia América." },
      { lat: 12.5, lng: 118.5, titulo: "Mar de China Meridional", texto: "Salida del sudeste asiático rumbo al Pacífico abierto." },
      { lat: 9.0, lng: 150.0, titulo: "Pacífico occidental", texto: "Travesía oceánica con ETA actualizado por la naviera." },
      { lat: 8.5, lng: -160.0, titulo: "Pacífico central", texto: "Cruce de la línea de cambio de fecha, siempre por mar." },
      { lat: 8.8, lng: -110.0, titulo: "Pacífico oriental", texto: "Aproximación a Centroamérica por aguas internacionales." },
      { lat: 8.95, lng: -79.56, titulo: "Transbordo: Balboa, Panamá", texto: "Escala de transbordo en el hub del Pacífico centroamericano." },
      { lat: 9.91, lng: -84.72, titulo: "Llegada: Puerto Caldera, C.R.", texto: "Desconsolidación, trámite aduanal y despacho a bodega." },
    ],
  },
  aereo: {
    tab: "Aéreo",
    icon: "plane",
    resumen: "Ruta aérea",
    duracion: 6,
    duracionTxt: "3 - 7 días",
    distancia: "≈ 20 400 km",
    color: "#F5A524",
    arcAlt: 0.32,
    objAlt: 0.06,
    waypoints: [
      { lat: 22.64, lng: 113.81, titulo: "Salida: Shenzhen (SZX)", texto: "Recepción en bodega de carga aérea y guía aérea emitida." },
      { lat: 25.25, lng: 55.36, titulo: "Transbordo: Dubái (DXB)", texto: "Primera escala de conexión en el hub del Golfo." },
      { lat: 40.47, lng: -3.56, titulo: "Transbordo: Madrid (MAD)", texto: "Reexpedición hacia América con la misma guía aérea." },
      { lat: 25.79, lng: -80.29, titulo: "Transbordo: Miami (MIA)", texto: "Hub de las Américas: consolidación del vuelo a Centroamérica." },
      { lat: 9.99, lng: -84.2, titulo: "Llegada: San José (SJO)", texto: "Nacionalización express en Costa Rica y entrega final." },
    ],
  },
};

const toRad = (d) => (d * Math.PI) / 180;
const toDeg = (r) => (r * 180) / Math.PI;

// Distancia angular (gran circulo) entre dos puntos.
function distGC(a, b) {
  const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  return 2 * Math.asin(Math.sqrt(
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  ));
}

// Punto intermedio sobre un gran circulo entre dos puntos.
function puntoIntermedio(a, b, f) {
  const d = distGC(a, b);
  if (d === 0) return { lat: a.lat, lng: a.lng };
  const lat1 = toRad(a.lat), lon1 = toRad(a.lng);
  const lat2 = toRad(b.lat), lon2 = toRad(b.lng);
  const A = Math.sin((1 - f) * d) / Math.sin(d);
  const B = Math.sin(f * d) / Math.sin(d);
  const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
  const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
  const z = A * Math.sin(lat1) + B * Math.sin(lat2);
  return { lat: toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))), lng: toDeg(Math.atan2(y, x)) };
}

// Posicion del marcador a lo largo de toda la ruta (varios tramos), avanzando a velocidad
// constante ponderada por la distancia real de cada tramo.
function posEnRuta(wps, t) {
  const dists = [];
  let total = 0;
  for (let i = 0; i < wps.length - 1; i++) {
    const d = distGC(wps[i], wps[i + 1]);
    dists.push(d);
    total += d;
  }
  if (total === 0) return { pos: wps[0], idx: 0 };
  const target = Math.min(1, Math.max(0, t)) * total;
  let acc = 0, i = 0;
  while (i < dists.length && acc + dists[i] < target) { acc += dists[i]; i++; }
  if (i >= dists.length) return { pos: wps[wps.length - 1], idx: wps.length - 1 };
  const f = dists[i] === 0 ? 0 : (target - acc) / dists[i];
  const pos = puntoIntermedio(wps[i], wps[i + 1], f);
  const idx = f >= 0.5 ? i + 1 : i; // hub mas cercano ya alcanzado
  return { pos, idx };
}

export default function RutaViaje() {
  const [modo, setModo] = useState("maritimo");
  const [prog, setProg] = useState(0);
  const [verIndex, setVerIndex] = useState(null);
  const [size, setSize] = useState({ w: 900, h: 460 });
  const globeRef = useRef(null);
  const contenedorRef = useRef(null);
  const ruta = RUTAS[modo];
  const wps = ruta.waypoints;

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
    globeRef.current.pointOfView({ lat: 16, lng: modo === "maritimo" ? 175 : 40, altitude: 2.2 }, 0);
    const controles = globeRef.current.controls();
    controles.autoRotate = true;
    controles.autoRotateSpeed = 0.32;
    controles.enableZoom = true;
  }, [size.w, modo]);

  useEffect(() => {
    setProg(0);
    setVerIndex(null);
    const durMs = 18000;
    const stepMs = 40;
    const inc = stepMs / durMs;
    const id = setInterval(() => {
      setProg((p) => (p + inc >= 1 ? 0 : p + inc));
    }, stepMs);
    return () => clearInterval(id);
  }, [modo]);

  const { pos, idx } = posEnRuta(wps, prog);
  const activo = idx;
  const verActivo = verIndex === null ? activo : verIndex;
  const dia = Math.max(1, Math.round(prog * ruta.duracion));

  // Arcos y puntos son estables por modo (no cambian en cada tick): asi la animacion de la
  // ruta no se reinicia y solo se mueve el marcador.
  const arcos = useMemo(() => wps.slice(0, -1).map((w, i) => ({
    startLat: w.lat, startLng: w.lng, endLat: wps[i + 1].lat, endLng: wps[i + 1].lng, color: ruta.color,
  })), [modo]); // eslint-disable-line react-hooks/exhaustive-deps
  const puntosMapa = useMemo(() => wps.map((w) => ({ lat: w.lat, lng: w.lng, color: "#EAF3F9", label: w.titulo })), [modo]); // eslint-disable-line react-hooks/exhaustive-deps
  const marcador = [{ lat: pos.lat, lng: pos.lng }];
  // El sprite del barco/avion se crea una sola vez por modo y el globo lo reubica solo.
  const markerObj = useMemo(() => crearMarcadorIcono(ruta.icon, ruta.color), [modo]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="rv-wrap" id="ruta">
      <div className="is-head reveal">
        <span className="is-kicker">Seguimiento en vivo</span>
        <h2>Así viaja tu pedido hasta Costa Rica.</h2>
        <p className="rv-sub">Girá el globo y hacé zoom con el mouse. Verás los transbordos que hace ImportSmart: el barquito por la ruta marítima del Pacífico y el avión por sus escalas aéreas, con el tracking avanzando a la derecha.</p>
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
            arcAltitude={ruta.arcAlt}
            arcDashLength={0.4}
            arcDashGap={0.18}
            arcDashAnimateTime={2600}
            pointsData={puntosMapa}
            pointLat="lat"
            pointLng="lng"
            pointColor="color"
            pointAltitude={0.008}
            pointRadius={0.42}
            pointLabel="label"
            objectsData={marcador}
            objectLat="lat"
            objectLng="lng"
            objectAltitude={ruta.objAlt}
            objectThreeObject={() => markerObj}
          />

          <div className="rv-day">
            <div className="rv-day-top">
              <span>Día {dia} de {ruta.duracion}</span>
              <span>{Math.round(prog * 100)}%</span>
            </div>
            <div className="rv-day-bar"><span style={{ width: `${prog * 100}%` }} /></div>
          </div>
        </div>

        <div className="rv-panel reveal">
          <div className="rv-panel-head">
            <div className="rv-route-title">
              <span>China</span>
              <Icon name="arrowRight" size={14} />
              <span>Costa Rica</span>
            </div>
            <span className="rv-status"><span className="rv-status-dot" /> {activo >= wps.length - 1 ? "Entregado" : "En tránsito"}</span>
          </div>

          <ol className="rv-steps">
            {wps.map((p, i) => (
              <li key={p.titulo} className={i === activo ? "on" : i < activo ? "done" : ""}>
                <button onClick={() => setVerIndex(i)}>
                  <span className="rv-step-node">{i < activo ? <Icon name="check" size={12} /> : i + 1}</span>
                  <span className="rv-step-title">{p.titulo}</span>
                </button>
                {i === verActivo && <p className="rv-step-text">{p.texto}</p>}
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
