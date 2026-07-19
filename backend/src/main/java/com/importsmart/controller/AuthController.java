package com.importsmart.controller;

import com.importsmart.dto.ForgotPasswordRequest;
import com.importsmart.dto.GoogleAuthRequest;
import com.importsmart.dto.LoginRequest;
import com.importsmart.dto.LoginResponse;
import com.importsmart.dto.RegisterRequest;
import com.importsmart.dto.ResetPasswordRequest;
import com.importsmart.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

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

    @PostMapping("/forgot-password")
    public void forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
    }

    @PostMapping("/reset-password")
    public void resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
    }
}
