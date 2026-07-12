package com.importsmart.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/** Entrada del simulador de escenarios de envio (RF-10, RF-11). */
@Data
public class SimulacionRequest {
    private List<PaqueteDTO> paquetes = new ArrayList<>();
    private BigDecimal subtotalProductos;
    private BigDecimal totalVenta;
    private BigDecimal gastosAdicionales;
}
