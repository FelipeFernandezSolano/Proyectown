package com.importsmart.dto;

import lombok.Data;

import java.math.BigDecimal;

/** Linea de producto de un pedido. Sirve para peticion y respuesta. */
@Data
public class PedidoItemDTO {
    private Long productoId;
    private String productoNombre;
    private Integer cantidad;
    private BigDecimal costoUnitario;
    private BigDecimal precioVenta;
    private BigDecimal subtotalCosto;
    private BigDecimal subtotalVenta;
}
