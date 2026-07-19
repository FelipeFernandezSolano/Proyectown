package com.importsmart.exception;

import com.importsmart.dto.ErrorResponse;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(IllegalArgumentException ex) {
        return construir(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex) {
        return construir(HttpStatus.UNAUTHORIZED, "Correo o contraseña incorrectos");
    }

    @ExceptionHandler(EmailEnUsoException.class)
    public ResponseEntity<ErrorResponse> handleEmailEnUso(EmailEnUsoException ex) {
        return construir(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(TelefonoEnUsoException.class)
    public ResponseEntity<ErrorResponse> handleTelefonoEnUso(TelefonoEnUsoException ex) {
        return construir(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(SolicitudInvalidaException.class)
    public ResponseEntity<ErrorResponse> handleSolicitudInvalida(SolicitudInvalidaException ex) {
        return construir(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        String mensaje = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .orElse("Datos invalidos");
        return construir(HttpStatus.BAD_REQUEST, mensaje);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraint(ConstraintViolationException ex) {
        return construir(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        return construir(HttpStatus.INTERNAL_SERVER_ERROR, "Error interno: " + ex.getMessage());
    }

    private ResponseEntity<ErrorResponse> construir(HttpStatus status, String mensaje) {
        return ResponseEntity.status(status).body(new ErrorResponse(LocalDateTime.now(), status.value(), mensaje));
    }
}
