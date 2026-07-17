package com.importsmart.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/** Datos que envia el frontend para crear o actualizar un pedido. */
@Data
public class PedidoRequest {
    private Long clienteId;
    private String descripcion;
    private String direccionEntrega;
    private String tipoEnvio;       // AEREO | MARITIMO
    private String estadoNombre;    // opcional; si no viene se usa "Cotizado"
    private String nota;            // nota para el historial de estado
    private BigDecimal gastosAdicionales;
    private BigDecimal montoPagado;
    private List<PedidoItemDTO> items = new ArrayList<>();
    private List<PaqueteDTO> paquetes = new ArrayList<>();
}
