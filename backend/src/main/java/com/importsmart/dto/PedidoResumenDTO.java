package com.importsmart.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Version compacta de un pedido para listados. */
@Data
public class PedidoResumenDTO {
    private Long id;
    private String codigo;
    private Long clienteId;
    private String clienteNombre;
    private String descripcion;
    private String direccionEntrega;
    private String tipoEnvio;
    private String estado;
    private String estadoColor;
    private Integer estadoOrden;
    private BigDecimal totalVenta;
    private BigDecimal montoPagado;
    private BigDecimal saldoPendiente;
    private BigDecimal utilidad;
    private BigDecimal margenPct;
    private String rentabilidad;
    private BigDecimal pesoFacturableTotal;
    private Integer diasEstimados;
    private LocalDate fechaPedido;
}
