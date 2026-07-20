package com.importsmart.dto;

import lombok.Data;

/** Un turno del historial de conversacion del chatbot publico. */
@Data
public class ChatTurnoDTO {
    private String rol; // "user" | "bot"
    private String texto;
}
