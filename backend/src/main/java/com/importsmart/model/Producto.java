package com.importsmart.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/** Producto importable, con costo, precio, peso y dimensiones (RF-03). */
@Entity
@Table(name = "productos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "categoria_id")
    private Categoria categoria;

    @Column(nullable = false, length = 200)
    private String nombre;

    @Column(length = 400)
    private String descripcion;

    @Column(name = "costo_unitario", precision = 12, scale = 2)
    private BigDecimal costoUnitario = BigDecimal.ZERO;

    @Column(name = "precio_venta", precision = 12, scale = 2)
    private BigDecimal precioVenta = BigDecimal.ZERO;

    @Column(name = "peso_kg", precision = 10, scale = 2)
    private BigDecimal pesoKg = BigDecimal.ZERO;

    @Column(name = "largo_cm", precision = 10, scale = 2)
    private BigDecimal largoCm = BigDecimal.ZERO;

    @Column(name = "ancho_cm", precision = 10, scale = 2)
    private BigDecimal anchoCm = BigDecimal.ZERO;

    @Column(name = "alto_cm", precision = 10, scale = 2)
    private BigDecimal altoCm = BigDecimal.ZERO;

    @Column(name = "link_proveedor", length = 500)
    private String linkProveedor;

    @Column(nullable = false)
    private Boolean activo = true;
}
