package com.importsmart.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/** Resultado de conversion entre monedas usando la API externa de tipo de cambio. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConversionMonedaDTO {
    private BigDecimal monto;
    private String monedaOrigen;
    private String monedaDestino;
    private BigDecimal tasa;
    private BigDecimal resultado;
    private String fecha;
    private String fuente;
    private boolean enLinea;
}
