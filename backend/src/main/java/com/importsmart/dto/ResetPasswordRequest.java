package com.importsmart.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ResetPasswordRequest {

    @NotBlank(message = "El token de recuperacion es obligatorio")
    private String token;

    @NotBlank(message = "La contraseña es obligatoria")
    @Pattern(
            regexp = "^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$",
            message = "La contraseña debe tener al menos 8 caracteres, una mayuscula y un caracter especial"
    )
    private String password;

    @NotBlank(message = "Debes confirmar la contraseña")
    private String confirmarPassword;
}
