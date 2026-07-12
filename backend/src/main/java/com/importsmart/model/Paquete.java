package com.importsmart.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/** Paquete/caja fisica de un pedido, con dimensiones y pesos calculados (RF-05, RF-06). */
@Entity
@Table(name = "paquetes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Paquete {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_id")
    private Pedido pedido;

    @Column(length = 120)
    private String descripcion;

    @Column(name = "largo_cm", precision = 10, scale = 2)
    private BigDecimal largoCm = BigDecimal.ZERO;

    @Column(name = "ancho_cm", precision = 10, scale = 2)
    private BigDecimal anchoCm = BigDecimal.ZERO;

    @Column(name = "alto_cm", precision = 10, scale = 2)
    private BigDecimal altoCm = BigDecimal.ZERO;

    @Column(name = "peso_real_kg", precision = 10, scale = 2)
    private BigDecimal pesoRealKg = BigDecimal.ZERO;

    @Column(name = "peso_volumetrico_kg", precision = 10, scale = 2)
    private BigDecimal pesoVolumetricoKg = BigDecimal.ZERO;

    @Column(name = "peso_facturable_kg", precision = 10, scale = 2)
    private BigDecimal pesoFacturableKg = BigDecimal.ZERO;
}
