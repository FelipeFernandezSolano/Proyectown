package com.importsmart.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** Empresa cliente que realiza importaciones a traves de la plataforma. */
@Entity
@Table(name = "clientes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_cliente", nullable = false, unique = true, length = 20)
    private String numeroCliente;

    @NotBlank(message = "El nombre de la empresa es obligatorio")
    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(length = 120)
    private String contacto;

    @Column(length = 150)
    private String email;

    @Column(length = 30)
    private String telefono;

    @Column(length = 60)
    private String pais;

    @Column(length = 255)
    private String direccion;

    @Column(name = "creado_en", updatable = false, insertable = false)
    private LocalDateTime creadoEn;
}
