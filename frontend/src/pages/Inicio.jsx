import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import Icon from "../components/Icon";
import heroImg from "../assets/hero-importsmart.jpg";
import slideMaritimo from "../assets/slide-maritimo.jpg";
import slideAereo from "../assets/slide-aereo.jpg";
import slideTerrestre from "../assets/slide-terrestre.jpg";
import slideBodega from "../assets/slide-bodega.jpg";
import nosotrosImg from "../assets/nosotros-importsmart.jpg";
import "./Inicio.css";

const WHATSAPP = "50688888888"; // <-- cambia por el numero real de la empresa

const slides = [
  { img: slideMaritimo, etiqueta: "Carga maritima", titulo: "Del puerto de origen hasta tu bodega", texto: "Coordinamos consolidacion, transito maritimo, aduana y entrega en una sola gestion." },
  { img: slideAereo, etiqueta: "Carga aerea", titulo: "Importaciones aereas con tiempos visibles", texto: "Para carga urgente: comparamos modalidad, costo y fecha antes de comprometer la entrega." },
  { img: slideTerrestre, etiqueta: "Entrega terrestre", titulo: "Ultima milla con trazabilidad", texto: "Del puerto a la puerta del cliente, con estados claros y documentacion ordenada." },
  { img: slideBodega, etiqueta: "Bodega y almacenaje", titulo: "Recepcion, control y despacho", texto: "Paquetes, pesos y documentos organizados para evitar improvisaciones en la operacion." },
];

const servicios = [
  { icono: "quote", titulo: "Cotizacion guiada", texto: "Solicitudes ordenadas para comparar modalidad, tiempos y condiciones antes de comprar." },
  { icono: "exchange", titulo: "Comparacion aereo / maritimo", texto: "Evaluamos costo, peso facturable y tiempo de cada modalidad para decidir con datos." },
  { icono: "calculator", titulo: "Peso volumetrico y envio", texto: "Calculo automatico de peso volumetrico, costo de envio y utilidad estimada por pedido." },
  { icono: "timeline", titulo: "Seguimiento y linea de tiempo", texto: "Cada orden avanza por estados visibles: cotizado, comprado, transito, aduana y entrega." },
  { icono: "chart", titulo: "Semaforo de rentabilidad", texto: "Clasificamos cada pedido en rentable, poco rentable o no rentable para decidir mejor." },
  { icono: "user", titulo: "Portal para clientes", texto: "Tus clientes consultan pedidos, documentos y estado de entrega en una experiencia simple." },
];

const proceso = [
  { n: "01", t: "Cotizado", d: "Se registra el producto, cantidades y modalidad para estimar costo y tiempo." },
  { n: "02", t: "Aprobado", d: "El cliente aprueba la cotizacion y se coordina proveedor y transporte." },
  { n: "03", t: "Comprado", d: "Se ejecuta la compra internacional y se consolida la carga." },
  { n: "04", t: "En bodega", d: "Recepcion, verificacion de paquetes, pesos y documentos." },
  { n: "05", t: "En transito", d: "La carga viaja por via aerea o maritima con seguimiento." },
  { n: "06", t: "En aduana", d: "Nacionalizacion, revision y liberacion de la mercaderia." },
  { n: "07", t: "Entregado", d: "Entrega final con documentos y cierre de la orden." },
];

const stats = [
  { valor: 6, sufijo: "+", label: "Anios de trayectoria" },
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

export default function Inicio() {
  const [slide, setSlide] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  useReveal();

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const s = slides[slide];
  const wa = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hola ImportSmart, quiero cotizar una importacion.")}`;

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
          <Link className="is-btn-ghost" to="/login">Iniciar sesion</Link>
          <a className="is-btn" href={wa} target="_blank" rel="noopener noreferrer">Cotizar ahora <Icon name="arrowRight" size={15} /></a>
        </div>
      </header>

      <div className="is-marquee"><div>
        {Array.from({ length: 2 }).map((_, k) => (
          <span key={k}>Atencion guiada de importaciones &nbsp;·&nbsp; Cotizacion para clientes &nbsp;·&nbsp; Seguimiento en tiempo real &nbsp;·&nbsp; Aereo y maritimo &nbsp;·&nbsp; </span>
        ))}
      </div></div>

      <section className="is-hero" id="top" style={{ backgroundImage: `linear-gradient(90deg, rgba(6,20,33,0.94) 0%, rgba(6,20,33,0.78) 45%, rgba(6,20,33,0.35) 100%), url(${heroImg})` }}>
        <div className="is-hero-inner">
          <div className="is-hero-copy">
            <span className="is-kicker"><Icon name="ship" size={14} /> Importaciones bajo pedido en Costa Rica</span>
            <h1>Tu operacion de importacion<br /><em>en las mejores manos.</em></h1>
            <p>Cotiza, compara modalidades y acompana cada orden desde el proveedor hasta la entrega, con informacion clara para vos y para tu cliente.</p>
            <div className="is-hero-actions">
              <a className="is-btn is-btn-lg" href={wa} target="_blank" rel="noopener noreferrer"><Icon name="quote" size={16} /> Solicita tu cotizacion</a>
              <Link className="is-btn-ghost is-btn-lg" to="/login">Entrar a la plataforma <Icon name="arrowRight" size={15} /></Link>
            </div>
            <ul className="is-checklist">
              <li><Icon name="check" size={16} /> Comparamos aereo y maritimo antes de comprometer una fecha.</li>
              <li><Icon name="check" size={16} /> Seguimiento por etapas: del proveedor a la aduana y la entrega.</li>
              <li><Icon name="check" size={16} /> Cotizaciones y documentos en PDF para cada cliente.</li>
            </ul>
          </div>

          <aside className="is-hero-card reveal">
            <div className="is-card-top">
              <span className="is-mini">Orden en seguimiento</span>
              <span className="is-chip"><Icon name="ship" size={13} /> Maritimo</span>
            </div>
            <h3>IMP-2026-041</h3>
            <div className="is-progress"><span style={{ width: "62%" }} /></div>
            <div className="is-card-rows">
              <div><span>Modalidad</span><b>Maritimo consolidado</b></div>
              <div><span>Etapa actual</span><b>En transito</b></div>
              <div><span>Entrega estimada</span><b>40 - 55 dias</b></div>
            </div>
            <div className="is-card-track">
              <i className="on" /><i className="on" /><i className="on" /><i /><i />
              <span>Proveedor</span><span>Bodega</span><span>Transito</span><span>Aduana</span><span>Entrega</span>
            </div>
          </aside>
        </div>
      </section>

      <Contadores />

      <section className="is-band">
        <div className="is-band-media">
          {slides.map((item, i) => (
            <img key={item.etiqueta} src={item.img} alt={item.etiqueta} className={i === slide ? "on" : ""} />
          ))}
          <div className="is-band-shade" />
          <div className="is-band-copy">
            <span className="is-tag">{s.etiqueta}</span>
            <h2>{s.titulo}</h2>
            <p>{s.texto}</p>
          </div>
          <div className="is-band-thumbs">
            {slides.map((item, i) => (
              <button key={item.titulo} className={i === slide ? "on" : ""} onClick={() => setSlide(i)} aria-label={item.etiqueta}>
                <img src={item.img} alt="" />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="is-section is-servicios" id="servicios">
        <div className="is-head reveal">
          <span className="is-kicker">Que hacemos</span>
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
          <span className="is-kicker">Como trabajamos</span>
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

      <section className="is-section is-nosotros" id="nosotros">
        <div className="is-nos-media reveal"><img src={nosotrosImg} alt="Equipo ImportSmart" /></div>
        <div className="is-nos-copy reveal">
          <span className="is-kicker">Nosotros</span>
          <h2>Ordenamos compras internacionales que ya existian.</h2>
          <p>ImportSmart nacio apoyando comercios que compraban por pedido en Estados Unidos y Asia. El reto no era encontrar productos, sino ordenar solicitudes, tiempos, documentos y entregas para dar un servicio confiable.</p>
          <p>Hoy centralizamos cotizaciones, pedidos, tracking, PDFs y alertas para que cada orden avance con informacion clara para el cliente y para el equipo operativo.</p>
          <div className="is-nos-chips">
            <div><b>Aereo y maritimo</b><span>Dos modalidades comparables</span></div>
            <div><b>100% trazable</b><span>Estados y documentos</span></div>
          </div>
        </div>
      </section>

      <section className="is-cta" id="contacto">
        <div className="is-cta-inner reveal">
          <h2>Listo para importar con claridad?</h2>
          <p>Escribinos y armamos tu primera cotizacion. Atencion guiada por WhatsApp.</p>
          <div className="is-cta-actions">
            <a className="is-btn is-btn-lg" href={wa} target="_blank" rel="noopener noreferrer"><Icon name="quote" size={16} /> Cotizar por WhatsApp</a>
            <Link className="is-btn-ghost is-btn-lg is-ghost-light" to="/login">Iniciar sesion</Link>
          </div>
        </div>
      </section>

      <footer className="is-footer">
        <div className="is-footer-grid">
          <div className="is-footer-brand">
            <a className="is-brand" href="#top"><img src="/favicon.svg" alt="ImportSmart" /><span>Import<b>Smart</b></span></a>
            <p>Plataforma para cotizar, planificar y controlar importaciones. Aereo y maritimo, del proveedor a la entrega.</p>
          </div>
          <div>
            <h5>Empresa</h5>
            <a href="#servicios">Servicios</a><a href="#proceso">Proceso</a><a href="#nosotros">Nosotros</a>
          </div>
          <div>
            <h5>Plataforma</h5>
            <Link to="/login">Iniciar sesion</Link><a href={wa} target="_blank" rel="noopener noreferrer">Cotizar</a>
          </div>
          <div>
            <h5>Contacto</h5>
            <a href={wa} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            <a href="mailto:contacto@importsmart.com">contacto@importsmart.com</a>
            <span>San Jose, Costa Rica</span>
          </div>
        </div>
        <div className="is-footer-base">
          <span>&copy; {new Date().getFullYear()} ImportSmart. Proyecto academico - empresa ficticia.</span>
        </div>
      </footer>

      <a className="is-wa" href={wa} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
        <svg viewBox="0 0 32 32" width="28" height="28" fill="#fff"><path d="M16 3C9 3 3.5 8.5 3.5 15.5c0 2.4.7 4.6 1.9 6.6L3 29l7.1-2.3c1.9 1 4 1.6 6.3 1.6 7 0 12.5-5.5 12.5-12.5S23 3 16 3zm0 22.7c-2 0-3.9-.5-5.5-1.5l-.4-.2-4.2 1.3 1.4-4.1-.3-.4c-1.1-1.7-1.7-3.6-1.7-5.7C5.6 9.7 10.3 5 16 5s10.4 4.7 10.4 10.5S21.7 25.7 16 25.7zm5.9-7.8c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2s-.8 1-1 1.2c-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.3-.2-.3 0-.5.1-.7.1-.1.3-.4.5-.6.1-.2.2-.3.3-.5.1-.2 0-.4 0-.6-.1-.2-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.8s1.2 3.3 1.4 3.5c.2.2 2.4 3.7 5.9 5.1.8.4 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.2-.6-.4z"/></svg>
      </a>
    </div>
  );
}
