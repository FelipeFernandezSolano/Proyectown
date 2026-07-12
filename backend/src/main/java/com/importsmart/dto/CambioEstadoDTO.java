package com.importsmart.dto;

import lombok.Data;

/** Peticion para cambiar el estado de un pedido (RF-13). */
@Data
public class CambioEstadoDTO {
    private String estadoNombre;
    private String nota;
}
