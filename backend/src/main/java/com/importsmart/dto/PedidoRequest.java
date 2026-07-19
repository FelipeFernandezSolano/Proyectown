package com.importsmart.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/** Datos que envia el frontend para crear o actualizar un pedido. */
@Data
public class PedidoRequest {
    // Sin @NotNull: cuando el creador es rol CLIENTE, el controlador lo completa
    // con su propio clienteId DESPUES del data-binding (ver PedidoController.crear).
    private Long clienteId;
    private String descripcion;
    @NotBlank(message = "El pais de entrega es obligatorio.")
    private String pais;
    @NotBlank(message = "La ciudad de entrega es obligatoria.")
    private String ciudad;
    @NotBlank(message = "El canton de entrega es obligatorio.")
    private String canton;
    @NotBlank(message = "Las senas exactas de entrega son obligatorias.")
    private String direccionEntrega;
    @NotBlank(message = "Selecciona la modalidad de envio.")
    private String tipoEnvio;       // AEREO | MARITIMO
    private String estadoNombre;    // opcional; si no viene se usa "Cotizado"
    private String nota;            // nota para el historial de estado
    private BigDecimal gastosAdicionales;
    private BigDecimal montoPagado;
    private List<PedidoItemDTO> items = new ArrayList<>();
    private List<PaqueteDTO> paquetes = new ArrayList<>();
}
