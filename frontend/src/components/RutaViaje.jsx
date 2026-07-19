import { useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";
import * as THREE from "three";
import Icon from "./Icon";
import earthTexture from "../assets/earth-day.jpg";
import "./RutaViaje.css";

// Textura realista de la Tierra: tierra en verde/marron y oceano en azul (three-globe),
// empaquetada localmente para que no dependa de una CDN externa.
const EARTH_TEXTURE = earthTexture;

// Convierte lat/lng a un vector 3D unitario, con la misma convencion que usa three-globe
// para ubicar objetos sobre la esfera (sirve para calcular direccion y "arriba" local).
function polarToVec(lat, lng, r = 1) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((90 - lng) * Math.PI) / 180;
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

// Orienta el vehiculo para que su "nariz" (eje +Z local) apunte en la direccion de avance,
// incluyendo el cabeceo (pitch) real: si sube de altitud entre "p0" y "p1" el morro se
// inclina hacia arriba, si baja se inclina hacia abajo (en vez de moverse siempre "plano").
// p0/p1 ya incluyen la altitud (ver vectorConAltitud). maxPitch limita el cabeceo maximo
// para que la interpolacion no se vea exagerada en tramos muy cortos.
function orientarVehiculo(obj, p0, p1, maxPitch) {
  const arriba = p0.clone().normalize();
  const delta = p1.clone().sub(p0);
  if (delta.lengthSq() < 1e-10) return;

  const componenteRadial = delta.dot(arriba);
  const tangencial = delta.clone().sub(arriba.clone().multiplyScalar(componenteRadial));
  const tangMag = tangencial.length();

  let adelante;
  if (tangMag < 1e-8) {
    // Caso limite (casi sin desplazamiento horizontal): usamos cualquier tangente valida
    // perpendicular a "arriba" en vez de duplicar "arriba" (eso producia un vector nulo al
    // cruzarlo consigo mismo, y por lo tanto una rotacion invalida/NaN).
    const referencia = Math.abs(arriba.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    adelante = new THREE.Vector3().crossVectors(arriba, referencia).normalize();
  } else {
    tangencial.normalize();
    const angulo = Math.max(-maxPitch, Math.min(maxPitch, Math.atan2(componenteRadial, tangMag)));
    adelante = tangencial.multiplyScalar(Math.cos(angulo)).add(arriba.clone().multiplyScalar(Math.sin(angulo)));
  }

  const derecha = new THREE.Vector3().crossVectors(arriba, adelante).normalize();
  const arribaReal = new THREE.Vector3().crossVectors(adelante, derecha).normalize();
  const m = new THREE.Matrix4().makeBasis(derecha, arribaReal, adelante);
  obj.quaternion.setFromRotationMatrix(m);
}

// Vector 3D del punto sobre la ruta, incluyendo la altitud como radio (r = 1 + alt),
// para que la orientacion "sienta" cuando el vehiculo esta subiendo o bajando.
function vectorConAltitud(ruta, pos, f) {
  const alt = ruta.objAlt + ruta.vehiculoHump * Math.sin(Math.PI * f);
  return polarToVec(pos.lat, pos.lng, 1 + alt);
}

// Construye la silueta 3D limpia del vehiculo (sin circulo ni burbuja de fondo), con
// geometria basica de Three.js. La nariz/proa queda sobre el eje +Z local.
function crearVehiculo3D(tipo, color) {
  const grupo = new THREE.Group();

  if (tipo === "plane") {
    // El avion siempre blanco (contrasta con cualquier color de ruta) y de mayor tamano.
    const materialAvion = new THREE.MeshBasicMaterial({ color: "#ffffff" });

    const fuselaje = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 2.6, 4, 8), materialAvion);
    fuselaje.rotation.x = Math.PI / 2;
    grupo.add(fuselaje);

    const alas = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.09, 1.0), materialAvion);
    alas.position.z = 0.15;
    grupo.add(alas);

    const estabilizador = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.09, 0.6), materialAvion);
    estabilizador.position.z = -1.55;
    grupo.add(estabilizador);

    const timon = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.0, 0.65), materialAvion);
    timon.position.set(0, 0.45, -1.55);
    grupo.add(timon);

    grupo.scale.setScalar(2.2);
  } else {
    // Barco de carga: casco centrado en z=0 (proa en +Z, popa en -Z). La proa y la popa
    // se calculan desde el borde real del casco para que sobresalgan de verdad, en vez de
    // quedar enterradas dentro del bloque (ese era el bug: se veia como un cubo).
    const materialCasco = new THREE.MeshBasicMaterial({ color: "#0b1620" });
    const materialContenedor = new THREE.MeshBasicMaterial({ color });
    const ancho = 0.9;
    const alturaCasco = 0.42;
    const largoCasco = 3.0;
    const alturaProa = 1.3;
    const borde = largoCasco / 2;

    const casco = new THREE.Mesh(new THREE.BoxGeometry(ancho, alturaCasco, largoCasco), materialCasco);
    casco.position.set(0, alturaCasco / 2, 0);
    grupo.add(casco);

    // Proa: el cono arranca justo en el borde delantero del casco y se proyecta hacia adelante.
    const proa = new THREE.Mesh(new THREE.ConeGeometry(ancho / 2, alturaProa, 4), materialCasco);
    proa.rotation.x = Math.PI / 2;
    proa.rotation.y = Math.PI / 4;
    proa.position.set(0, alturaCasco / 2, borde + alturaProa / 2);
    grupo.add(proa);

    // Popa: tapa achatada justo en el borde trasero del casco.
    const popa = new THREE.Mesh(new THREE.BoxGeometry(ancho * 0.92, alturaCasco * 0.85, 0.35), materialCasco);
    popa.position.set(0, alturaCasco * 0.42, -borde - 0.175);
    grupo.add(popa);

    // Contenedores en cubierta: varias filas separadas entre la proa y el puente.
    [-0.9, -0.15, 0.6, 1.25].forEach((z) => {
      const contenedor = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.42, 0.5), materialContenedor);
      contenedor.position.set(0, alturaCasco + 0.21, z);
      grupo.add(contenedor);
    });

    // Puente de mando, cerca de la popa (como en un buque portacontenedores real).
    const puente = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.75, 0.5), materialCasco);
    puente.position.set(0, alturaCasco + 0.375, -borde + 0.55);
    grupo.add(puente);

    grupo.scale.setScalar(1.7);
  }

  grupo.traverse((obj) => { obj.frustumCulled = false; });
  return grupo;
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
    objAlt: 0.002,
    vehiculoHump: 0.01,
    maxPitch: 0.1,
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
    objAlt: 0.1,
    vehiculoHump: 0.22,
    maxPitch: 0.5,
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
  if (total === 0) return { pos: wps[0], idx: 0, f: 0 };
  const target = Math.min(1, Math.max(0, t)) * total;
  let acc = 0, i = 0;
  while (i < dists.length && acc + dists[i] < target) { acc += dists[i]; i++; }
  if (i >= dists.length) return { pos: wps[wps.length - 1], idx: wps.length - 1, f: 1 };
  const f = dists[i] === 0 ? 0 : (target - acc) / dists[i];
  const pos = puntoIntermedio(wps[i], wps[i + 1], f);
  const idx = f >= 0.5 ? i + 1 : i; // hub mas cercano ya alcanzado
  return { pos, idx, f };
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

  const { pos, idx, f } = posEnRuta(wps, prog);
  const activo = idx;
  const verActivo = verIndex === null ? activo : verIndex;
  const dia = Math.max(1, Math.round(prog * ruta.duracion));
  // Altitud tipo "joroba" dentro de cada tramo: sube y baja igual que el arco dibujado,
  // en vez de desplazarse a una altura constante y "recta" entre puntos.
  const altActual = ruta.objAlt + ruta.vehiculoHump * Math.sin(Math.PI * f);

  // Arcos y puntos son estables por modo (no cambian en cada tick): asi la animacion de la
  // ruta no se reinicia y solo se mueve el marcador.
  const arcos = useMemo(() => wps.slice(0, -1).map((w, i) => ({
    startLat: w.lat, startLng: w.lng, endLat: wps[i + 1].lat, endLng: wps[i + 1].lng, color: ruta.color,
  })), [modo]); // eslint-disable-line react-hooks/exhaustive-deps
  const puntosMapa = useMemo(() => wps.map((w) => ({ lat: w.lat, lng: w.lng, color: "#EAF3F9", label: w.titulo })), [modo]); // eslint-disable-line react-hooks/exhaustive-deps
  const marcador = [{ lat: pos.lat, lng: pos.lng, alt: altActual }];
  // El vehiculo 3D se crea una sola vez por modo; el globo solo lo reubica en cada tick.
  const markerObj = useMemo(() => crearVehiculo3D(ruta.icon, ruta.color), [modo]); // eslint-disable-line react-hooks/exhaustive-deps
  // Orienta la nariz/proa en la direccion de avance, incluyendo cabeceo real cuando sube o
  // baja de altitud (asi el avion "vuela" siguiendo el arco en vez de moverse plano y tieso).
  const EPS_DIR = 0.004;
  const antes = posEnRuta(wps, Math.max(0, prog - EPS_DIR));
  const despues = posEnRuta(wps, Math.min(1, prog + EPS_DIR));
  const vecAntes = vectorConAltitud(ruta, antes.pos, antes.f);
  const vecDespues = vectorConAltitud(ruta, despues.pos, despues.f);
  orientarVehiculo(markerObj, vecAntes, vecDespues, ruta.maxPitch);

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
            globeImageUrl={EARTH_TEXTURE}
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
            objectAltitude="alt"
            objectFacesSurface={false}
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
