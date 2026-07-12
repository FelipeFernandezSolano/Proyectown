package com.importsmart.dto;

import lombok.Data;

import java.math.BigDecimal;

/** Resultado de un calculo de costos/utilidad para una modalidad de envio. */
@Data
public class CalculoResumenDTO {
    private String tipoEnvio;
    private BigDecimal costoPorKg;
    private Integer diasEstimados;
    private BigDecimal pesoRealTotal;
    private BigDecimal pesoVolumetricoTotal;
    private BigDecimal pesoFacturableTotal;
    private BigDecimal subtotalProductos;
    private BigDecimal costoEnvio;
    private BigDecimal gastosAdicionales;
    private BigDecimal totalVenta;
    private BigDecimal utilidad;
    private BigDecimal margenPct;
    private String rentabilidad;
}
