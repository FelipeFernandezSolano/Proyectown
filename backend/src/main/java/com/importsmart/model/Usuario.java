package com.importsmart.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(length = 30)
    private String telefono;

    @Column(name = "reset_token", length = 100)
    private String resetToken;

    @Column(name = "reset_token_expira")
    private LocalDateTime resetTokenExpira;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RolUsuario rol;

    @Column(nullable = false)
    private Boolean activo = true;

    @Column(name = "creado_en", updatable = false, insertable = false)
    private LocalDateTime creadoEn;

    public enum RolUsuario {
        ADMINISTRADOR,
        OPERADOR,
        CLIENTE
    }
}
