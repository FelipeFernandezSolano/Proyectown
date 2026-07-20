package com.importsmart.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/** Version completa de un pedido con items, paquetes y linea de tiempo. */
@Data
public class PedidoDetalleDTO {
    private Long id;
    private String codigo;
    private Long clienteId;
    private String clienteNombre;
    private String clienteContacto;
    private String clienteTelefono;
    private String descripcion;
    private String pais;
    private String ciudad;
    private String canton;
    private String direccionEntrega;
    private String tipoEnvio;
    private String estado;
    private String estadoColor;
    private Integer diasEstimados;
    private BigDecimal tipoCambio;
    private BigDecimal subtotalProductos;
    private BigDecimal costoEnvio;
    private BigDecimal gastosAdicionales;
    private BigDecimal totalVenta;
    private BigDecimal montoPagado;
    private BigDecimal saldoPendiente;
    private BigDecimal utilidad;
    private BigDecimal margenPct;
    private String rentabilidad;
    private BigDecimal pesoRealTotal;
    private BigDecimal pesoVolumetricoTotal;
    private BigDecimal pesoFacturableTotal;
    private LocalDate fechaPedido;
    private List<PedidoItemDTO> items = new ArrayList<>();
    private List<PaqueteDTO> paquetes = new ArrayList<>();
    private List<HistorialItemDTO> historial = new ArrayList<>();
}
