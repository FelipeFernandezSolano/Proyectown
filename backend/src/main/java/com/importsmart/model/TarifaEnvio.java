package com.importsmart.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/** Tarifa configurable por modalidad de envio (aereo / maritimo). */
@Entity
@Table(name = "tarifas_envio")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TarifaEnvio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String tipo; // AEREO | MARITIMO

    @Column(name = "costo_por_kg_usd", precision = 10, scale = 2)
    private BigDecimal costoPorKgUsd = BigDecimal.ZERO;

    @Column(name = "dias_estimados")
    private Integer diasEstimados = 0;

    @Column(length = 300)
    private String descripcion;
}
