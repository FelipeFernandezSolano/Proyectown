package com.importsmart.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** Pedido de importacion asociado a un cliente, con items y paquetes (RF-04, RF-05). */
@Entity
@Table(name = "pedidos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String codigo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    @Column(length = 400)
    private String descripcion;

    // Direccion de entrega desglosada: pais/ciudad/canton por separado, y "direccionEntrega"
    // se usa como las senas exactas (punto de referencia, numero de casa, etc).
    @Column(length = 100)
    private String pais;

    @Column(length = 100)
    private String ciudad;

    @Column(length = 100)
    private String canton;

    @Column(name = "direccion_entrega", length = 500)
    private String direccionEntrega;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_envio", nullable = false, length = 20)
    private TipoEnvio tipoEnvio = TipoEnvio.AEREO;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "estado_pedido_id")
    private EstadoPedido estadoPedido;

    @Column(name = "tipo_cambio", precision = 12, scale = 4)
    private BigDecimal tipoCambio;

    @Column(name = "subtotal_productos", precision = 12, scale = 2)
    private BigDecimal subtotalProductos = BigDecimal.ZERO;

    @Column(name = "costo_envio", precision = 12, scale = 2)
    private BigDecimal costoEnvio = BigDecimal.ZERO;

    @Column(name = "gastos_adicionales", precision = 12, scale = 2)
    private BigDecimal gastosAdicionales = BigDecimal.ZERO;

    @Column(name = "total_venta", precision = 12, scale = 2)
    private BigDecimal totalVenta = BigDecimal.ZERO;

    @Column(name = "monto_pagado", precision = 12, scale = 2)
    private BigDecimal montoPagado = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    private BigDecimal utilidad = BigDecimal.ZERO;

    @Column(name = "margen_pct", precision = 6, scale = 2)
    private BigDecimal margenPct = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Rentabilidad rentabilidad = Rentabilidad.NO_RENTABLE;

    @Column(name = "peso_real_total", precision = 10, scale = 2)
    private BigDecimal pesoRealTotal = BigDecimal.ZERO;

    @Column(name = "peso_volumetrico_total", precision = 10, scale = 2)
    private BigDecimal pesoVolumetricoTotal = BigDecimal.ZERO;

    @Column(name = "peso_facturable_total", precision = 10, scale = 2)
    private BigDecimal pesoFacturableTotal = BigDecimal.ZERO;

    @Column(name = "fecha_pedido")
    private LocalDate fechaPedido;

    @Column(name = "creado_en", updatable = false, insertable = false)
    private LocalDateTime creadoEn;

    @JsonIgnore
    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<PedidoItem> items = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Paquete> paquetes = new ArrayList<>();
}
