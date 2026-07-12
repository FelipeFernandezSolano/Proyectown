package com.importsmart.dto;

import lombok.Data;

import java.math.BigDecimal;

/** Paquete de un pedido. Sirve para peticion (dims + peso real) y respuesta (pesos calculados). */
@Data
public class PaqueteDTO {
    private Long id;
    private String descripcion;
    private BigDecimal largoCm;
    private BigDecimal anchoCm;
    private BigDecimal altoCm;
    private BigDecimal pesoRealKg;
    private BigDecimal pesoVolumetricoKg;
    private BigDecimal pesoFacturableKg;
}
