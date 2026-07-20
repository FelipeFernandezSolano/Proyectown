import { useEffect, useRef, useState } from "react";
import { preguntarChatbot } from "../api/endpoints";
import Icon from "./Icon";
import "./ChatbotWidget.css";

const SALUDO =
  "Hola! Soy el asistente de ImportSmart. Puedo ayudarte con dudas generales sobre " +
  "cómo cotizar, el proceso de importación o las tarifas de envío. Si preferís hablar " +
  "con una persona, abajo tenés el acceso directo a WhatsApp.";

export default function ChatbotWidget({ whatsappUrl }) {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([{ rol: "bot", texto: SALUDO }]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const finRef = useRef(null);

  useEffect(() => {
    if (abierto) finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, abierto, enviando]);

  const enviar = async () => {
    const mensaje = texto.trim();
    if (!mensaje || enviando) return;
    const historial = mensajes.slice(-6);
    setMensajes((m) => [...m, { rol: "user", texto: mensaje }]);
    setTexto("");
    setEnviando(true);
    try {
      const { respuesta } = await preguntarChatbot(mensaje, historial);
      setMensajes((m) => [...m, { rol: "bot", texto: respuesta }]);
    } catch {
      setMensajes((m) => [
        ...m,
        {
          rol: "bot",
          texto: `No pude conectarme en este momento. Escribinos por WhatsApp y un agente te ayuda: ${whatsappUrl}`,
        },
      ]);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="cb-wrap">
      {abierto && (
        <div className="cb-panel">
          <div className="cb-header">
            <span><Icon name="chat" size={16} /> Asistente ImportSmart</span>
            <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar chat">
              <Icon name="x" size={16} />
            </button>
          </div>
          <div className="cb-mensajes">
            {mensajes.map((m, i) => (
              <div key={i} className={"cb-msg " + (m.rol === "user" ? "cb-msg-user" : "cb-msg-bot")}>
                {m.texto}
              </div>
            ))}
            {enviando && <div className="cb-msg cb-msg-bot cb-typing">Escribiendo…</div>}
            <div ref={finRef} />
          </div>
          <form
            className="cb-input-row"
            onSubmit={(e) => {
              e.preventDefault();
              enviar();
            }}
          >
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escribí tu pregunta..."
              maxLength={500}
              disabled={enviando}
            />
            <button type="submit" disabled={enviando || !texto.trim()} aria-label="Enviar">
              <Icon name="send" size={16} />
            </button>
          </form>
          <a className="cb-whatsapp" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            ¿Preferís hablar con una persona? Escribinos por WhatsApp
          </a>
        </div>
      )}
      <button
        type="button"
        className="cb-boton"
        onClick={() => setAbierto((a) => !a)}
        aria-label={abierto ? "Cerrar asistente" : "Abrir asistente"}
      >
        <Icon name={abierto ? "x" : "chat"} size={22} />
      </button>
    </div>
  );
}
