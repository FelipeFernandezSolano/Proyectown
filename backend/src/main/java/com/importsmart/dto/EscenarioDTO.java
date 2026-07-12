package com.importsmart.dto;

import lombok.Data;

import java.math.BigDecimal;

/** Escenario de empaque para comparar formas de consolidar la carga (RF-10). */
@Data
public class EscenarioDTO {
    private String nombre;
    private String detalle;
    private Integer cantidadPaquetes;
    private BigDecimal pesoRealTotal;
    private BigDecimal pesoVolumetricoTotal;
    private BigDecimal pesoFacturableTotal;
    private BigDecimal costoEnvioAereo;
    private BigDecimal costoEnvioMaritimo;
}
