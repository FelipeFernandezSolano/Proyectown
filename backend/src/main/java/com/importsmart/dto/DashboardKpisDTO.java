package com.importsmart.dto;

import lombok.Data;

import java.math.BigDecimal;

/** Indicadores del panel de resultados (RF-15). */
@Data
public class DashboardKpisDTO {
    private long pedidosActivos;
    private long totalPedidos;
    private BigDecimal utilidadTotal;
    private BigDecimal ventasTotales;
    private BigDecimal costosAcumulados;
    private long rentables;
    private long pocoRentables;
    private long noRentables;
}
