package com.importsmart.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ClienteDTO {
    private String numeroCliente;

    @NotBlank(message = "El nombre de la empresa es obligatorio")
    private String nombre;

    @NotBlank(message = "La persona de contacto es obligatoria")
    private String contacto;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El email no es valido (debe incluir @)")
    private String email;

    @NotBlank(message = "El telefono es obligatorio")
    @Pattern(regexp = "^\\+?[0-9\\s()\\-]{8,}$", message = "El telefono solo puede contener numeros")
    private String telefono;

    @NotBlank(message = "El pais es obligatorio")
    private String pais;

    @NotBlank(message = "La direccion es obligatoria")
    private String direccion;
}
