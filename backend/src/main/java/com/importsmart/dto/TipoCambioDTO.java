package com.importsmart.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/** Resultado del tipo de cambio consultado a la API externa (RF-09). */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TipoCambioDTO {
    private String base;               // USD
    private BigDecimal colonesPorDolar; // rates.CRC
    private String fecha;
    private String fuente;             // URL o "fallback"
    private boolean enLinea;           // true si vino de la API, false si se uso el respaldo
}
