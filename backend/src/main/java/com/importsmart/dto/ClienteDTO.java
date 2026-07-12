package com.importsmart.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ClienteDTO {
    private String numeroCliente;

    @NotBlank(message = "El nombre de la empresa es obligatorio")
    private String nombre;

    private String contacto;
    private String email;
    private String telefono;
    private String pais;
    private String direccion;
}
