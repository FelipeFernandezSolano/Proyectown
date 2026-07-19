package com.importsmart.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "El nombre completo es obligatorio")
    private String nombre;

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "El correo no es valido")
    private String email;

    @NotBlank(message = "El telefono es obligatorio")
    private String telefono;

    @NotBlank(message = "La contraseña es obligatoria")
    @Pattern(
            regexp = "^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$",
            message = "La contraseña debe tener al menos 8 caracteres, una mayuscula y un caracter especial"
    )
    private String password;

    @NotBlank(message = "Debes confirmar la contraseña")
    private String confirmarPassword;
}
