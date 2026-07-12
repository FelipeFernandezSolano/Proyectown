package com.importsmart.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductoDTO {
    private Long categoriaId;

    @NotBlank(message = "El nombre del producto es obligatorio")
    private String nombre;

    private String descripcion;

    @PositiveOrZero(message = "El costo no puede ser negativo")
    private BigDecimal costoUnitario;

    @PositiveOrZero(message = "El precio de venta no puede ser negativo")
    private BigDecimal precioVenta;

    @PositiveOrZero(message = "El peso no puede ser negativo")
    private BigDecimal pesoKg;

    @PositiveOrZero(message = "El largo no puede ser negativo")
    private BigDecimal largoCm;

    @PositiveOrZero(message = "El ancho no puede ser negativo")
    private BigDecimal anchoCm;

    @PositiveOrZero(message = "El alto no puede ser negativo")
    private BigDecimal altoCm;

    private String linkProveedor;
    private Boolean activo;
}
