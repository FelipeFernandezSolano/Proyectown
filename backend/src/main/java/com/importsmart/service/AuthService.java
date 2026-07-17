package com.importsmart.service;

import com.importsmart.dto.LoginRequest;
import com.importsmart.dto.LoginResponse;
import com.importsmart.model.Usuario;
import com.importsmart.repository.UsuarioRepository;
import com.importsmart.security.JwtService;
import com.importsmart.security.UserPrincipal;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;

    public AuthService(AuthenticationManager authenticationManager,
                        UsuarioRepository usuarioRepository,
                        JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.usuarioRepository = usuarioRepository;
        this.jwtService = jwtService;
    }

    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        Usuario usuario = usuarioRepository.findByEmailIgnoreCaseAndActivoTrue(request.getEmail())
                .orElseThrow(() -> new IllegalStateException("Usuario no encontrado tras autenticar"));

        String token = jwtService.generateToken(new UserPrincipal(usuario));
        Long clienteId = usuario.getCliente() != null ? usuario.getCliente().getId() : null;
        return new LoginResponse(token, usuario.getNombre(), usuario.getRol().name(), clienteId);
    }
}
