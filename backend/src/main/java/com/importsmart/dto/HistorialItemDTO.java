package com.importsmart.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/** Un punto en la linea de tiempo de un pedido (RF-14). */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HistorialItemDTO {
    private String estado;
    private String nota;
    private LocalDate fecha;
}
