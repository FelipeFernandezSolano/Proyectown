import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import Icon from "../components/Icon";
import RutaViaje from "../components/RutaViaje";
import heroImg from "../assets/hero-importsmart.jpg";
import slidePuerto from "../assets/slide-puerto-importsmart.png";
import slideAereo from "../assets/slide-aereo-importsmart.png";
import slideCamion from "../assets/slide-camion-importsmart.png";
import slideBodega from "../assets/slide-bodega-importsmart.png";
import nosotrosImg from "../assets/slide-oficina-importsmart.png";
import "./Inicio.css";

const slides = [
  { img: slidePuerto, etiqueta: "Carga marítima", titulo: "Del puerto de origen hasta tu bodega", texto: "Coordinamos consolidación, tránsito marítimo, aduana y entrega en una sola gestión." },
  { img: slideAereo, etiqueta: "Carga aérea", titulo: "Importaciones aéreas con tiempos visibles", texto: "Para carga urgente: comparamos modalidad, costo y fecha antes de comprometer la entrega." },
  { img: slideCamion, etiqueta: "Entrega terrestre", titulo: "Última milla con trazabilidad", texto: "Del puerto a la puerta del cliente, con estados claros y documentación ordenada." },
  { img: slideBodega, etiqueta: "Bodega y almacenaje", titulo: "Recepción, control y despacho", texto: "Paquetes, pesos y documentos organizados para evitar improvisaciones en la operación." },
];

const servicios = [
  { icono: "quote", titulo: "Cotización guiada", texto: "Solicitudes ordenadas para comparar modalidad, tiempos y condiciones antes de comprar." },
  { icono: "exchange", titulo: "Comparación aéreo / marítimo", texto: "Evaluamos costo, peso facturable y tiempo de cada modalidad para decidir con datos." },
  { icono: "calculator", titulo: "Peso volumétrico y envío", texto: "Cálculo automático de peso volumétrico, costo de envío y utilidad estimada por pedido." },
  { icono: "timeline", titulo: "Seguimiento y línea de tiempo", texto: "Cada orden avanza por estados visibles: cotizado, comprado, tránsito, aduana y entrega." },
  { icono: "chart", titulo: "Semáforo de rentabilidad", texto: "Clasificamos cada pedido en rentable, poco rentable o no rentable para decidir mejor." },
  { icono: "user", titulo: "Portal para clientes", texto: "Tus clientes consultan pedidos, documentos y estado de entrega en una experiencia simple." },
];

const proceso = [
  { n: "01", t: "Cotizado", d: "Se registra el producto, cantidades y modalidad para estimar costo y tiempo." },
  { n: "02", t: "Aprobado", d: "El cliente aprueba la cotización y se coordina proveedor y transporte." },
  { n: "03", t: "Comprado", d: "Se ejecuta la compra internacional y se consolida la carga." },
  { n: "04", t: "En bodega", d: "Recepción, verificación de paquetes, pesos y documentos." },
  { n: "05", t: "En tránsito", d: "La carga viaja por vía aérea o marítima con seguimiento." },
  { n: "06", t: "En aduana", d: "Nacionalización, revisión y liberación de la mercadería." },
  { n: "07", t: "Entregado", d: "Entrega final con documentos y cierre de la orden." },
];

const stats = [
  { valor: 6, sufijo: "+", label: "Años de trayectoria" },
  { valor: 50, sufijo: "+", label: "Clientes activos" },
  { valor: 300, sufijo: "+", label: "Pedidos gestionados" },
  { valor: 5, sufijo: "", label: "Etapas de seguimiento" },
];

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); } }),
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function Contadores() {
  const ref = useRef(null);
  const [vals, setVals] = useState(stats.map(() => 0));
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        const t0 = performance.now();
        const dur = 1400;
        const tick = (now) => {
          const p = Math.min(1, (now - t0) / dur);
          const e = 1 - Math.pow(1 - p, 3);
          setVals(stats.map((s) => Math.round(s.valor * e)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.disconnect();
      }
    }, { threshold: 0.4 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <div className="is-stats" ref={ref}>
      {stats.map((s, i) => (
        <div key={s.label} className="is-stat reveal">
          <b>{s.sufijo}{vals[i]}</b>
          <span>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

const SLIDE_MS = 6000;

export default function Inicio() {
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useReveal();

  const goTo = (i) => setSlide((i + slides.length) % slides.length);

  useEffect(() => {
    if (paused) return undefined;
    const t = setTimeout(() => setSlide((s) => (s + 1) % slides.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [slide, paused]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const s = slides[slide];

  return (
    <div className="is-landing">
      <header className={"is-nav" + (scrolled ? " sticky" : "")}>
        <a className="is-brand" href="#top">
          <img src="/favicon.svg" alt="ImportSmart" />
          <span>Import<b>Smart</b></span>
        </a>
        <nav className="is-links">
          <a href="#top">Inicio</a>
          <a href="#servicios">Servicios</a>
          <a href="#proceso">Proceso</a>
          <a href="#nosotros">Nosotros</a>
          <a href="#contacto">Contacto</a>
        </nav>
        <div className="is-nav-cta">
          <Link className="is-btn" to="/login">Iniciar sesión <Icon name="arrowRight" size={15} /></Link>
        </div>
      </header>

      <div className="is-marquee"><div>
        {Array.from({ length: 2 }).map((_, k) => (
          <span key={k}>Atención guiada de importaciones &nbsp;·&nbsp; Cotización para clientes &nbsp;·&nbsp; Seguimiento en tiempo real &nbsp;·&nbsp; Aéreo y marítimo &nbsp;·&nbsp; </span>
        ))}
      </div></div>

      <section className="is-hero" id="top" style={{ backgroundImage: `linear-gradient(90deg, rgba(6,20,33,0.94) 0%, rgba(6,20,33,0.78) 45%, rgba(6,20,33,0.35) 100%), url(${heroImg})` }}>
        <div className="is-hero-inner">
          <div className="is-hero-copy">
            <span className="is-kicker"><Icon name="ship" size={14} /> Importaciones bajo pedido en Costa Rica</span>
            <h1>Tu operación de importación<br /><em>en las mejores manos.</em></h1>
            <p>Cotiza, compara modalidades y acompaña cada orden desde el proveedor hasta la entrega, con información clara para vos y para tu cliente.</p>
            <div className="is-hero-actions">
              <Link className="is-btn is-btn-lg" to="/login">Entrar a la plataforma <Icon name="arrowRight" size={15} /></Link>
            </div>
            <ul className="is-checklist">
              <li><Icon name="check" size={16} /> Comparamos aéreo y marítimo antes de comprometer una fecha.</li>
              <li><Icon name="check" size={16} /> Seguimiento por etapas: del proveedor a la aduana y la entrega.</li>
              <li><Icon name="check" size={16} /> Cotizaciones y documentos en PDF para cada cliente.</li>
            </ul>
          </div>
        </div>
      </section>

      <Contadores />

      <section className="is-band">
        <div
          className="is-band-media"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="is-band-progress">
            {slides.map((item, i) => (
              <button key={item.titulo} className="is-band-seg" onClick={() => goTo(i)} aria-label={`Ir a ${item.etiqueta}`}>
                <span
                  key={i === slide ? `active-${slide}` : `idle-${i}`}
                  className={i < slide ? "done" : i === slide ? "active" : ""}
                  style={i === slide ? { animationDuration: `${SLIDE_MS}ms`, animationPlayState: paused ? "paused" : "running" } : undefined}
                />
              </button>
            ))}
          </div>

          {slides.map((item, i) => (
            <img key={item.etiqueta} src={item.img} alt={item.etiqueta} className={i === slide ? "on" : ""} />
          ))}
          <div className="is-band-shade" />

          <button className="is-band-arrow left" onClick={() => goTo(slide - 1)} aria-label="Slide anterior">
            <Icon name="chevronLeft" size={20} />
          </button>
          <button className="is-band-arrow right" onClick={() => goTo(slide + 1)} aria-label="Siguiente slide">
            <Icon name="chevronRight" size={20} />
          </button>

          <div className="is-band-copy">
            <span className="is-tag">{s.etiqueta}</span>
            <h2>{s.titulo}</h2>
            <p>{s.texto}</p>
          </div>
          <div className="is-band-thumbs">
            {slides.map((item, i) => (
              <button key={item.titulo} className={i === slide ? "on" : ""} onClick={() => goTo(i)} aria-label={item.etiqueta}>
                <img src={item.img} alt="" />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="is-section is-servicios" id="servicios">
        <div className="is-head reveal">
          <span className="is-kicker">Qué hacemos</span>
          <h2>Una herramienta comercial para vender importaciones con una experiencia profesional.</h2>
        </div>
        <div className="is-grid">
          {servicios.map((sv) => (
            <article key={sv.titulo} className="is-serv reveal">
              <div className="is-serv-icon"><Icon name={sv.icono} size={22} /></div>
              <h3>{sv.titulo}</h3>
              <p>{sv.texto}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="is-section is-proceso" id="proceso">
        <div className="is-head reveal">
          <span className="is-kicker">Cómo trabajamos</span>
          <h2>Del proveedor al cliente con trazabilidad en cada etapa.</h2>
        </div>
        <div className="is-timeline">
          {proceso.map((p) => (
            <div key={p.n} className="is-step reveal">
              <div className="is-step-node">{p.n}</div>
              <h4>{p.t}</h4>
              <p>{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      <RutaViaje />

      <section className="is-section is-nosotros" id="nosotros">
        <div className="is-nos-media reveal"><img src={nosotrosImg} alt="Equipo ImportSmart" /></div>
        <div className="is-nos-copy reveal">
          <span className="is-kicker">Nosotros</span>
          <h2>Ordenamos compras internacionales que ya existían.</h2>
          <p>ImportSmart nació apoyando comercios que compraban por pedido en Estados Unidos y Asia. El reto no era encontrar productos, sino ordenar solicitudes, tiempos, documentos y entregas para dar un servicio confiable.</p>
          <p>Hoy centralizamos cotizaciones, pedidos, tracking, PDFs y alertas para que cada orden avance con información clara para el cliente y para el equipo operativo.</p>
          <div className="is-nos-chips">
            <div><b>Aéreo y marítimo</b><span>Dos modalidades comparables</span></div>
            <div><b>100% trazable</b><span>Estados y documentos</span></div>
          </div>
        </div>
      </section>

      <section className="is-cta" id="contacto">
        <div className="is-cta-inner reveal">
          <h2>¿Listo para importar con claridad?</h2>
          <p>Ingresá a la plataforma para cotizar tu importación y dar seguimiento a cada pedido.</p>
          <div className="is-cta-actions">
            <Link className="is-btn is-btn-lg" to="/login"><Icon name="quote" size={16} /> Iniciar sesión</Link>
          </div>
        </div>
      </section>

      <footer className="is-footer">
        <div className="is-footer-grid">
          <div className="is-footer-brand">
            <a className="is-brand" href="#top"><img src="/favicon.svg" alt="ImportSmart" /><span>Import<b>Smart</b></span></a>
            <p>Plataforma para cotizar, planificar y controlar importaciones. Aéreo y marítimo, del proveedor a la entrega.</p>
          </div>
          <div>
            <h5>Empresa</h5>
            <a href="#servicios">Servicios</a><a href="#proceso">Proceso</a><a href="#nosotros">Nosotros</a>
          </div>
          <div>
            <h5>Plataforma</h5>
            <Link to="/login">Iniciar sesión</Link>
          </div>
          <div>
            <h5>Contacto</h5>
            <a href="mailto:contacto@importsmart.com">contacto@importsmart.com</a>
            <span>San José, Costa Rica</span>
          </div>
        </div>
        <div className="is-footer-base">
          <span>&copy; {new Date().getFullYear()} ImportSmart. Proyecto académico - empresa ficticia.</span>
        </div>
      </footer>
    </div>
  );
}
