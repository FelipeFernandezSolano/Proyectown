package com.importsmart.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/** Pregunta que un visitante anonimo del landing le hace al chatbot publico. */
@Data
public class ChatMensajeRequest {

    @NotBlank(message = "Escribi tu pregunta antes de enviar.")
    @Size(max = 500, message = "El mensaje es demasiado largo (maximo 500 caracteres).")
    private String mensaje;

    /** Ultimos turnos de la conversacion, solo para dar contexto (el servidor limita cuantos usa). */
    private List<ChatTurnoDTO> historial;
}
