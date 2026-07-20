package com.importsmart.controller;

import com.importsmart.dto.ForgotPasswordRequest;
import com.importsmart.dto.GoogleAuthRequest;
import com.importsmart.dto.LoginRequest;
import com.importsmart.dto.LoginResponse;
import com.importsmart.dto.RegisterRequest;
import com.importsmart.dto.ResetPasswordRequest;
import com.importsmart.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/register")
    public LoginResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/google")
    public LoginResponse google(@Valid @RequestBody GoogleAuthRequest request) {
        return authService.loginConGoogle(request);
    }

    /** Ruta de redireccion: envia al navegador directo al flujo de consentimiento de Google. */
    @GetMapping("/google/login")
    public void iniciarLoginGoogle(HttpServletResponse response) throws IOException {
        response.sendRedirect(authService.construirUrlAutorizacionGoogle());
    }

    /** Ruta de captura (callback): Google vuelve aqui con el "code" tras el consentimiento. */
    @GetMapping("/google/callback")
    public void callbackGoogle(@RequestParam(required = false) String code,
                                @RequestParam(required = false) String error,
                                HttpServletResponse response) throws IOException {
        if (error != null || code == null || code.isBlank()) {
            response.sendRedirect(frontendUrl + "/login?googleError=1");
            return;
        }
        try {
            LoginResponse loginResponse = authService.loginConGoogleAuthorizationCode(code);
            String token = URLEncoder.encode(loginResponse.getToken(), StandardCharsets.UTF_8);
            String nombre = URLEncoder.encode(loginResponse.getNombre(), StandardCharsets.UTF_8);
            String destino = frontendUrl + "/login/google/callback?token=" + token
                    + "&nombre=" + nombre
                    + "&rol=" + loginResponse.getRol()
                    + (loginResponse.getClienteId() != null ? "&clienteId=" + loginResponse.getClienteId() : "");
            response.sendRedirect(destino);
        } catch (Exception ex) {
            response.sendRedirect(frontendUrl + "/login?googleError=1");
        }
    }

    @PostMapping("/forgot-password")
    public void forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
    }

    @PostMapping("/reset-password")
    public void resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
    }
}
