package com.importsmart.service;

import com.importsmart.dto.ChatMensajeRequest;
import com.importsmart.dto.ChatTurnoDTO;
import com.importsmart.model.TarifaEnvio;
import com.importsmart.repository.TarifaEnvioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Chatbot publico del landing (sin login). Responde solo con informacion general del
 * negocio (como funciona el proceso, tarifas publicas, preguntas frecuentes) y jamas con
 * datos de un pedido o cliente especifico: para eso el propio prompt le exige remitir al
 * usuario a iniciar sesion o a contactar por WhatsApp.
 */
@Service
public class ChatbotService {

    private static final int MAX_TURNOS_HISTORIAL = 6;

    private final TarifaEnvioRepository tarifaRepository;
    private final CalculoService calculo;
    private final RestClient restClient = RestClient.create();

    @Value("${app.gemini.api-key:}")
    private String apiKey;

    @Value("${app.gemini.modelo:gemini-2.0-flash}")
    private String modelo;

    @Value("${app.whatsapp.numero:50670103860}")
    private String whatsappNumero;

    public ChatbotService(TarifaEnvioRepository tarifaRepository, CalculoService calculo) {
        this.tarifaRepository = tarifaRepository;
        this.calculo = calculo;
    }

    public String responder(ChatMensajeRequest request) {
        String enlaceWhatsapp = "https://wa.me/" + whatsappNumero;

        if (apiKey == null || apiKey.isBlank()) {
            return "El asistente no esta disponible en este momento. Escribinos por WhatsApp y un agente te ayuda: "
                    + enlaceWhatsapp;
        }

        try {
            Map<String, Object> body = Map.of(
                    "system_instruction", Map.of("parts", List.of(Map.of("text", construirContexto(enlaceWhatsapp)))),
                    "contents", construirContenidos(request),
                    "generationConfig", Map.of("temperature", 0.4, "maxOutputTokens", 400)
            );

            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + modelo
                    + ":generateContent?key=" + apiKey;

            Map<?, ?> respuesta = restClient.post()
                    .uri(url)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            String texto = extraerTexto(respuesta);
            if (texto == null || texto.isBlank()) {
                return "No pude procesar tu consulta. Escribinos por WhatsApp y un agente te ayuda: " + enlaceWhatsapp;
            }
            return texto.trim();
        } catch (Exception ex) {
            return "El asistente no pudo responder en este momento. Escribinos por WhatsApp y un agente te ayuda: "
                    + enlaceWhatsapp;
        }
    }

    private List<Map<String, Object>> construirContenidos(ChatMensajeRequest request) {
        List<Map<String, Object>> contenidos = new ArrayList<>();
        List<ChatTurnoDTO> historial = request.getHistorial();
        if (historial != null) {
            int desde = Math.max(0, historial.size() - MAX_TURNOS_HISTORIAL);
            for (ChatTurnoDTO turno : historial.subList(desde, historial.size())) {
                if (turno.getTexto() == null || turno.getTexto().isBlank()) continue;
                String rolGemini = "bot".equalsIgnoreCase(turno.getRol()) ? "model" : "user";
                contenidos.add(Map.of("role", rolGemini, "parts", List.of(Map.of("text", turno.getTexto()))));
            }
        }
        contenidos.add(Map.of("role", "user", "parts", List.of(Map.of("text", request.getMensaje()))));
        return contenidos;
    }

    @SuppressWarnings("unchecked")
    private String extraerTexto(Map<?, ?> respuesta) {
        if (respuesta == null) return null;
        List<Object> candidatos = (List<Object>) respuesta.get("candidates");
        if (candidatos == null || candidatos.isEmpty()) return null;
        Map<String, Object> primero = (Map<String, Object>) candidatos.get(0);
        Map<String, Object> content = (Map<String, Object>) primero.get("content");
        if (content == null) return null;
        List<Object> parts = (List<Object>) content.get("parts");
        if (parts == null || parts.isEmpty()) return null;
        Map<String, Object> parte = (Map<String, Object>) parts.get(0);
        Object texto = parte.get("text");
        return texto != null ? texto.toString() : null;
    }

    private String construirContexto(String enlaceWhatsapp) {
        Integer diasAereo = null;
        Integer diasMaritimo = null;
        java.math.BigDecimal tarifaAereoKg = null;
        java.math.BigDecimal tarifaMaritimoKg = null;
        for (TarifaEnvio t : tarifaRepository.findAll()) {
            if ("AEREO".equalsIgnoreCase(t.getTipo())) { diasAereo = t.getDiasEstimados(); tarifaAereoKg = t.getCostoPorKgUsd(); }
            if ("MARITIMO".equalsIgnoreCase(t.getTipo())) { diasMaritimo = t.getDiasEstimados(); tarifaMaritimoKg = t.getCostoPorKgUsd(); }
        }

        String tarifas = """
                Peso facturable = el mayor entre el peso real y el peso volumetrico (largo x ancho x alto
                en cm, dividido entre %s). El costo de envio = peso facturable x tarifa por kg de la
                modalidad elegida:
                - AEREO: $%s por kg. Tiempo estimado: ~%s dias.
                - MARITIMO: $%s por kg. Tiempo estimado: ~%s dias.
                (Estas son las tarifas configuradas actualmente; el costo final de cada pedido depende de
                las medidas y el peso real de sus paquetes, calculado automaticamente en la plataforma.)
                """.formatted(
                calculo.getDivisorVolumetrico(),
                tarifaAereoKg != null ? tarifaAereoKg : "N/D",
                diasAereo != null ? diasAereo : "15-22",
                tarifaMaritimoKg != null ? tarifaMaritimoKg : "N/D",
                diasMaritimo != null ? diasMaritimo : "40-55"
        );

        return """
                Sos el asistente virtual del sitio publico de ImportSmart, una empresa costarricense que
                funciona como AGENTE DE COMPRAS: no es una tienda, no vende productos propios. El cliente
                describe que producto quiere importar (de Estados Unidos, Asia, etc.) y el equipo de
                ImportSmart cotiza, compra, transporta y entrega en Costa Rica.

                Como funciona el proceso para un cliente nuevo:
                1. Se registra o inicia sesion en la plataforma (con correo y contraseña, o con el boton
                   "Continuar con Google" para entrar mas rapido).
                2. Crea una "cotizacion": describe el producto que quiere importar (aunque no sepa medidas
                   de la caja todavia, puede marcar "no tengo las medidas" y el equipo investiga).
                3. El equipo de ImportSmart revisa, mide y cotiza precio, envio y tiempos.
                4. El pedido avanza por estados visibles: En revision, Cotizado, Aprobado, Comprado, En
                   bodega, En transito, En aduana, Entregado.
                5. El cliente sigue el estado de su pedido desde su cuenta.

                Formula real de costo de envio (asi se calcula en la plataforma):
                %s

                Sobre impuestos de aduana y otros cargos: se agregan como "gastos adicionales" dentro de la
                cotizacion final que arma el equipo caso por caso (no hay una formula automatica publica para
                esto). Si preguntan por impuestos de aduana, aclara que se incluyen en el total de la
                cotizacion pero que el monto exacto lo define el equipo al revisar cada producto, y que no
                hay costos escondidos fuera de esa cotizacion.

                Sobre metodos de pago: la plataforma registra el pago y el saldo pendiente de cada pedido en
                dolares, con equivalencia en colones segun el tipo de cambio del dia. Si preguntan la forma
                concreta de pagar (transferencia, Sinpe, tarjeta, etc.), no inventes una lista: decí que el
                equipo coordina el metodo de pago al aprobar la cotizacion, u ofrece el contacto por WhatsApp.

                Reglas MUY IMPORTANTES que debes seguir siempre:
                - NUNCA inventes datos de pedidos, precios finales, clientes o utilidades especificas. No
                  tenes acceso a esa informacion y no debes fingir que la tenes.
                - Tanto aereo como maritimo se cobran igual: peso facturable x tarifa por kg de esa
                  modalidad (la unica diferencia es el valor de la tarifa y el tiempo estimado). Si no
                  tenes las medidas del paquete, no des un precio final: explica la formula y ofrece que
                  el equipo lo calcule con las medidas exactas.
                - NUNCA escribas placeholders como "[sitio web]", "[enlace]" o URLs inventadas. El usuario
                  ya esta en la pagina de ImportSmart: referite a "esta plataforma", "el boton de arriba" o
                  "tu cuenta", sin inventar direcciones web.
                - Si preguntan por politicas que no estan descritas arriba (producto dañado, garantias,
                  devoluciones, retrasos, restricciones de aduana muy especificas, etc.), NO inventes un
                  procedimiento ni prometas plazos o acciones concretas: decí que el equipo resuelve esos
                  casos de forma personalizada y ofrece el contacto por WhatsApp.
                - Si alguien pregunta por SU pedido especifico, su cuenta, su cotizacion o cualquier dato
                  privado, respondé que para eso necesita iniciar sesion en su cuenta, y ofrece el contacto
                  por WhatsApp como alternativa.
                - Si no podes resolver la duda con la informacion de arriba, o el usuario pide hablar con
                  una persona, invitalo a escribir por WhatsApp aqui: %s
                - Respondé siempre en español, de forma breve, amable y visual (esto es un chat, no un
                  documento): maximo 2-3 oraciones cortas por respuesta.
                - Usa 1 o 2 emojis relevantes por respuesta para que se sienta amigable (✈️ aereo, 🚢
                  maritimo, 📦 pedido, ✅ confirmacion, 💬 whatsapp), sin exagerar.
                - Si tenes que comparar 2 o 3 opciones (ej. aereo vs maritimo, o pasos de un proceso), usa
                  una lista con lineas que empiecen con "- " en vez de un parrafo corrido; usa **negrita**
                  solo para la palabra clave de cada punto. Evita parrafos largos siempre que se pueda
                  resumir en una lista corta.
                - No hables de temas que no sean sobre ImportSmart, importaciones, cotizaciones o el uso de
                  la plataforma.
                """.formatted(tarifas, enlaceWhatsapp);
    }
}
