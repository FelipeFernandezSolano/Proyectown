package com.importsmart.service;

import com.importsmart.dto.ForgotPasswordRequest;
import com.importsmart.dto.GoogleAuthRequest;
import com.importsmart.dto.LoginRequest;
import com.importsmart.dto.LoginResponse;
import com.importsmart.dto.RegisterRequest;
import com.importsmart.dto.ResetPasswordRequest;
import com.importsmart.exception.EmailEnUsoException;
import com.importsmart.exception.SolicitudInvalidaException;
import com.importsmart.exception.TelefonoEnUsoException;
import com.importsmart.model.Cliente;
import com.importsmart.model.Usuario;
import com.importsmart.repository.ClienteRepository;
import com.importsmart.repository.UsuarioRepository;
import com.importsmart.security.JwtService;
import com.importsmart.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final ClienteRepository clienteRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final RestClient restClient = RestClient.create();

    @Value("${app.google.client-id:}")
    private String googleClientId;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public AuthService(AuthenticationManager authenticationManager,
                        UsuarioRepository usuarioRepository,
                        ClienteRepository clienteRepository,
                        JwtService jwtService,
                        PasswordEncoder passwordEncoder,
                        EmailService emailService) {
        this.authenticationManager = authenticationManager;
        this.usuarioRepository = usuarioRepository;
        this.clienteRepository = clienteRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        Usuario usuario = usuarioRepository.findByEmailIgnoreCaseAndActivoTrue(request.getEmail())
                .orElseThrow(() -> new IllegalStateException("Usuario no encontrado tras autenticar"));

        return tokenPara(usuario);
    }

    @Transactional
    public LoginResponse register(RegisterRequest request) {
        if (!request.getPassword().equals(request.getConfirmarPassword())) {
            throw new SolicitudInvalidaException("Las contraseñas no coinciden");
        }
        if (usuarioRepository.findByEmailIgnoreCase(request.getEmail()).isPresent()) {
            throw new EmailEnUsoException("Ya existe una cuenta registrada con ese correo");
        }

        String telefono = normalizarTelefono(request.getTelefono());
        if (usuarioRepository.existsByTelefono(telefono)) {
            throw new TelefonoEnUsoException("Ya existe una cuenta registrada con ese numero de telefono");
        }

        Cliente cliente = crearClienteParaNuevoUsuario(request.getNombre().trim(), request.getEmail().trim(), telefono);

        Usuario usuario = new Usuario();
        usuario.setNombre(request.getNombre().trim());
        usuario.setEmail(request.getEmail().trim().toLowerCase());
        usuario.setTelefono(telefono);
        usuario.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        usuario.setRol(Usuario.RolUsuario.CLIENTE);
        usuario.setCliente(cliente);
        usuario.setActivo(true);
        usuarioRepository.save(usuario);

        return tokenPara(usuario);
    }

    @Transactional
    public LoginResponse loginConGoogle(GoogleAuthRequest request) {
        Map<String, Object> payload = verificarTokenGoogle(request.getCredential());
        String email = (String) payload.get("email");
        String nombre = (String) payload.getOrDefault("name", email);
        if (email == null || email.isBlank()) {
            throw new SolicitudInvalidaException("No se pudo validar la cuenta de Google");
        }

        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
            Cliente cliente = crearClienteParaNuevoUsuario(nombre, email, null);
            Usuario nuevo = new Usuario();
            nuevo.setNombre(nombre);
            nuevo.setEmail(email.toLowerCase());
            nuevo.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
            nuevo.setRol(Usuario.RolUsuario.CLIENTE);
            nuevo.setCliente(cliente);
            nuevo.setActivo(true);
            return usuarioRepository.save(nuevo);
        });

        if (!Boolean.TRUE.equals(usuario.getActivo())) {
            throw new SolicitudInvalidaException("La cuenta esta inactiva");
        }

        return tokenPara(usuario);
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        // No revela si el correo existe o no (evita enumeracion de cuentas): responde igual en ambos casos.
        usuarioRepository.findByEmailIgnoreCaseAndActivoTrue(request.getEmail()).ifPresent(usuario -> {
            String token = UUID.randomUUID().toString();
            usuario.setResetToken(token);
            usuario.setResetTokenExpira(LocalDateTime.now().plusHours(1));
            usuarioRepository.save(usuario);

            String enlace = frontendUrl + "/restablecer-contrasena?token=" + token;
            emailService.enviarRecuperacionContrasena(usuario.getEmail(), enlace);
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (!request.getPassword().equals(request.getConfirmarPassword())) {
            throw new SolicitudInvalidaException("Las contraseñas no coinciden");
        }

        Usuario usuario = usuarioRepository.findByResetToken(request.getToken())
                .orElseThrow(() -> new SolicitudInvalidaException("El enlace de recuperacion no es valido"));

        if (usuario.getResetTokenExpira() == null || usuario.getResetTokenExpira().isBefore(LocalDateTime.now())) {
            throw new SolicitudInvalidaException("El enlace de recuperacion ha expirado, solicita uno nuevo");
        }

        usuario.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        usuario.setResetToken(null);
        usuario.setResetTokenExpira(null);
        usuarioRepository.save(usuario);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> verificarTokenGoogle(String idToken) {
        Map<String, Object> body;
        try {
            body = restClient.get()
                    .uri("https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken)
                    .retrieve()
                    .body(Map.class);
        } catch (Exception ex) {
            throw new SolicitudInvalidaException("No se pudo verificar la cuenta de Google");
        }

        if (body == null || body.get("email") == null) {
            throw new SolicitudInvalidaException("Token de Google invalido");
        }
        if (googleClientId != null && !googleClientId.isBlank()) {
            String aud = String.valueOf(body.get("aud"));
            if (!googleClientId.equals(aud)) {
                throw new SolicitudInvalidaException("El token de Google no corresponde a esta aplicacion");
            }
        }
        return body;
    }

    private String normalizarTelefono(String telefono) {
        return telefono == null ? null : telefono.trim().replaceAll("[^+0-9]", "");
    }

    private Cliente crearClienteParaNuevoUsuario(String nombre, String email, String telefono) {
        Cliente cliente = new Cliente();
        long total = clienteRepository.count();
        cliente.setNumeroCliente(String.format("CL%04d", total + 1));
        cliente.setNombre(nombre);
        cliente.setContacto(nombre);
        cliente.setEmail(email);
        cliente.setTelefono(telefono);
        return clienteRepository.save(cliente);
    }

    private LoginResponse tokenPara(Usuario usuario) {
        String token = jwtService.generateToken(new UserPrincipal(usuario));
        Long clienteId = usuario.getCliente() != null ? usuario.getCliente().getId() : null;
        return new LoginResponse(token, usuario.getNombre(), usuario.getRol().name(), clienteId);
    }
}
