package com.importsmart.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPasswordRequest {

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "El correo no es valido")
    private String email;
}
