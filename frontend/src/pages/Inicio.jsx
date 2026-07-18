import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import logo from "../assets/logo-importsmart.svg";
import slideAereo from "../assets/slide-aereo-importsmart.png";
import slideBodega from "../assets/slide-bodega-importsmart.png";
import slideCamion from "../assets/slide-camion-importsmart.png";
import slideOficina from "../assets/slide-oficina-importsmart.png";
import slidePuerto from "../assets/slide-puerto-importsmart.png";
import Icon from "../components/Icon";
import "./Inicio.css";

const servicios = [
  { titulo: "Cotizacion guiada", texto: "Solicitudes ordenadas para comparar modalidad, tiempos y condiciones del servicio.", icono: "quote" },
  { titulo: "Operacion logistica", texto: "Estados claros desde la solicitud hasta aduana, entrega y cierre del pedido.", icono: "timeline" },
  { titulo: "Portal para clientes", texto: "Seguimiento, documentos y direccion de entrega en una experiencia sencilla.", icono: "user" },
];

const pasos = [
  { titulo: "Solicitud", texto: "El cliente envia producto, cantidades y direccion de entrega." },
  { titulo: "Revision", texto: "El equipo valida modalidad, condiciones, disponibilidad y tiempo estimado." },
  { titulo: "Coordinacion", texto: "La orden queda aprobada y se coordina proveedor, transporte y documentacion." },
  { titulo: "Aduana", texto: "La carga se monitorea durante transito, nacionalizacion y revision." },
  { titulo: "Entrega", texto: "Se cierra la orden con documentos, confirmacion y seguimiento final." },
];

const modalidades = {
  AEREO: { label: "Aereo", tiempo: "15-22 dias", avance: "72%", estado: "Prioridad alta", icono: "plane" },
  MARITIMO: { label: "Maritimo", tiempo: "40-55 dias", avance: "54%", estado: "Carga consolidada", icono: "ship" },
};

const slidesHero = [
  {
    imagen: slidePuerto,
    etiqueta: "Operacion portuaria",
    titulo: "Importaciones bajo pedido con seguimiento claro.",
    texto: "Cotiza, compara modalidades y acompana cada orden desde proveedor hasta entrega con informacion ordenada.",
    panel: "Carga maritima consolidada",
  },
  {
    imagen: slideCamion,
    etiqueta: "Transporte y entrega",
    titulo: "Del puerto a tu cliente sin perder trazabilidad.",
    texto: "Visualiza pedidos, estados y tiempos para que cada despacho avance con informacion confiable.",
    panel: "Ruta nacional coordinada",
  },
  {
    imagen: slideBodega,
    etiqueta: "Control logistico",
    titulo: "Recepcion, almacenaje y despacho en un solo flujo.",
    texto: "Organiza paquetes, pesos, documentos y alertas para evitar improvisaciones en la operacion.",
    panel: "Inventario operativo",
  },
  {
    imagen: slideOficina,
    etiqueta: "Gestion comercial",
    titulo: "Cotizaciones profesionales para importar con confianza.",
    texto: "Convierte solicitudes, documentos y seguimiento en una experiencia seria para cada cliente.",
    panel: "Panel ejecutivo",
  },
  {
    imagen: slideAereo,
    etiqueta: "Carga urgente",
    titulo: "Importaciones aereas con tiempos visibles.",
    texto: "Compara modalidad aerea y maritima antes de aprobar una solicitud o comprometer una fecha de entrega.",
    panel: "Operacion aerea prioritaria",
  },
];

export default function Inicio() {
  const [modalidad, setModalidad] = useState("AEREO");
  const [slideActivo, setSlideActivo] = useState(0);
  const [servicioActivo, setServicioActivo] = useState(0);
  const [pasoActivo, setPasoActivo] = useState(1);
  const modo = modalidades[modalidad];
  const slide = slidesHero[slideActivo];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSlideActivo((actual) => (actual + 1) % slidesHero.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, []);

  const cambiarSlide = (direccion) => {
    setSlideActivo((actual) => (actual + direccion + slidesHero.length) % slidesHero.length);
  };

  return (
    <main className="inicio-publico">
      <header className="inicio-header">
        <Link className="inicio-marca" to="/">
          <img src={logo} alt="ImportSmart" className="inicio-logo" />
        </Link>
        <nav className="inicio-nav" aria-label="Navegacion principal">
          <a href="#servicios">Servicios</a>
          <a href="#proceso">Proceso</a>
          <a href="#historia">Historia</a>
        </nav>
        <Link className="btn btn-azul inicio-login" to="/login">
          Iniciar sesion
          <Icon name="arrowRight" size={15} />
        </Link>
      </header>

      <section className="inicio-hero">
        <div className="inicio-copy">
          <span className="inicio-etiqueta"><Icon name="ship" size={13} /> {slide.etiqueta}</span>
          <h1>{slide.titulo}</h1>
          <p>{slide.texto}</p>
          <div className="inicio-actions">
            <Link className="btn btn-azul" to="/login">
              Entrar a la plataforma
              <Icon name="arrowRight" size={15} />
            </Link>
            <a className="inicio-link-secundario" href="#historia">Conocer la empresa</a>
          </div>
          <div className="inicio-selector-modo" aria-label="Comparar modalidad de envio">
            {Object.entries(modalidades).map(([codigo, item]) => (
              <button
                key={codigo}
                type="button"
                className={modalidad === codigo ? "activo" : ""}
                onClick={() => setModalidad(codigo)}
              >
                <Icon name={item.icono} size={15} />
                <span>{item.label}</span>
                <b>{item.tiempo}</b>
              </button>
            ))}
          </div>
        </div>

        <aside className={`inicio-hero-media modo-${modalidad.toLowerCase()}`} aria-label="Operacion comercial de ImportSmart">
          {slidesHero.map((item, index) => (
            <img
              key={item.panel}
              src={item.imagen}
              alt={item.panel}
              className={slideActivo === index ? "activo" : ""}
            />
          ))}
          <div className="inicio-media-sombra" />
          <div className="inicio-media-ruta">
            <span>Proveedor</span>
            <i />
            <span>Aduana</span>
            <i />
            <span>Cliente</span>
          </div>
          <div className="inicio-media-panel">
            <span className="inicio-mini-label">{slide.panel}</span>
            <h3>IMP-2026-041</h3>
            <div className="inicio-media-barra"><span style={{ width: modo.avance }} /></div>
            <div className="inicio-media-datos">
              <div>
                <Icon name={modo.icono} size={15} />
                <span>Modalidad</span>
                <b>{modo.label}</b>
              </div>
              <div>
                <Icon name="check" size={15} />
                <span>Seguimiento</span>
                <b>{modo.estado}</b>
              </div>
              <div>
                <Icon name="timeline" size={15} />
                <span>Entrega estimada</span>
                <b>{modo.tiempo}</b>
              </div>
            </div>
          </div>
          <div className="inicio-slide-controles" aria-label="Controles del slider">
            <button type="button" onClick={() => cambiarSlide(-1)} aria-label="Imagen anterior">
              <Icon name="chevronLeft" size={18} />
            </button>
            <div className="inicio-slide-dots">
              {slidesHero.map((item, index) => (
                <button
                  key={item.etiqueta}
                  type="button"
                  className={slideActivo === index ? "activo" : ""}
                  onClick={() => setSlideActivo(index)}
                  aria-label={`Ver ${item.etiqueta}`}
                />
              ))}
            </div>
            <button type="button" onClick={() => cambiarSlide(1)} aria-label="Imagen siguiente">
              <Icon name="chevronRight" size={18} />
            </button>
          </div>
        </aside>
      </section>

      <section className="inicio-indicadores" aria-label="Indicadores realistas">
        <div><b>15-22 dias</b><span>referencia aerea</span></div>
        <div><b>40-55 dias</b><span>referencia maritima</span></div>
        <div><b>5 etapas</b><span>seguimiento visible</span></div>
        <div><b>PDF</b><span>cotizacion para cliente</span></div>
      </section>

      <section className="inicio-servicios" id="servicios">
        <div className="inicio-section-copy">
          <span className="inicio-etiqueta">Que resolvemos</span>
          <h2>Una herramienta comercial para vender importaciones con una experiencia mas profesional.</h2>
        </div>
        <div className="inicio-servicios-grid">
          {servicios.map((servicio, index) => (
            <article
              key={servicio.titulo}
              className={servicioActivo === index ? "activo" : ""}
              onMouseEnter={() => setServicioActivo(index)}
              onFocus={() => setServicioActivo(index)}
              tabIndex={0}
            >
              <Icon name={servicio.icono} size={18} />
              <h3>{servicio.titulo}</h3>
              <p>{servicio.texto}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="inicio-proceso" id="proceso">
        <div className="inicio-section-copy">
          <span className="inicio-etiqueta">Como trabajamos</span>
          <h2>Del proveedor al cliente con trazabilidad comercial.</h2>
        </div>
        <div className="inicio-proceso-linea">
          {pasos.map((paso, index) => (
            <button
              key={paso.titulo}
              type="button"
              className={pasoActivo === index ? "activo" : ""}
              onClick={() => setPasoActivo(index)}
            >
              <span>{index + 1}</span>
              <b>{paso.titulo}</b>
            </button>
          ))}
        </div>
        <div className="inicio-proceso-detalle">
          <span>Paso {pasoActivo + 1}</span>
          <p>{pasos[pasoActivo].texto}</p>
        </div>
      </section>

      <section className="inicio-historia" id="historia">
        <article>
          <span className="inicio-etiqueta">Nuestra historia</span>
          <h2>ImportSmart nacio para ordenar compras internacionales que ya existian.</h2>
          <p>
            La empresa empezo en 2019 apoyando comercios locales que compraban por pedido en Estados Unidos
            y Asia. El reto no era encontrar productos, sino ordenar solicitudes, tiempos, documentos y entregas
            para dar un servicio mas confiable.
          </p>
          <p>
            Hoy la plataforma centraliza cotizaciones, pedidos, tracking, PDFs y alertas para que cada orden
            avance con informacion clara para el cliente y para el equipo operativo.
          </p>
        </article>
      </section>
    </main>
  );
}
