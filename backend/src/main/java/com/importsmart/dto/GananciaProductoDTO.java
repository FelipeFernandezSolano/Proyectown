package com.importsmart.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/** Producto mas rentable para el dashboard (RF-15). */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GananciaProductoDTO {
    private String nombre;
    private long cantidadVendida;
    private BigDecimal utilidadGenerada;
}
