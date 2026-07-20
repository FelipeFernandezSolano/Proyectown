package com.importsmart.config;

import com.importsmart.security.CustomUserDetailsService;
import com.importsmart.security.JwtAuthFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    private final CustomUserDetailsService userDetailsService;
    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(CustomUserDetailsService userDetailsService, JwtAuthFilter jwtAuthFilter) {
        this.userDetailsService = userDetailsService;
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Publico
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/chatbot/**").permitAll()

                // ---- Solo ADMINISTRADOR: informacion sensible y toda escritura ----
                // Dashboard (utilidades, costos) y cotizaciones (contienen utilidad)
                .requestMatchers("/api/dashboard/**").hasRole("ADMINISTRADOR")
                .requestMatchers(HttpMethod.GET, "/api/cotizaciones/**").hasRole("ADMINISTRADOR")
                .requestMatchers(HttpMethod.GET, "/api/clientes/**").hasRole("ADMINISTRADOR")
                // Crear / editar / borrar (el OPERADOR solo edita medidas de logistica en pedidos)
                .requestMatchers(HttpMethod.POST, "/api/pedidos/**").hasAnyRole("ADMINISTRADOR", "CLIENTE")
                .requestMatchers(HttpMethod.POST, "/api/clientes/**", "/api/productos/**",
                        "/api/categorias/**").hasRole("ADMINISTRADOR")
                .requestMatchers(HttpMethod.PUT, "/api/pedidos/**").hasAnyRole("ADMINISTRADOR", "OPERADOR")
                .requestMatchers(HttpMethod.PUT, "/api/clientes/**", "/api/productos/**")
                        .hasRole("ADMINISTRADOR")
                .requestMatchers(HttpMethod.PATCH, "/api/pedidos/**").hasAnyRole("ADMINISTRADOR", "OPERADOR")
                .requestMatchers(HttpMethod.DELETE, "/api/clientes/**", "/api/productos/**",
                        "/api/pedidos/**").hasRole("ADMINISTRADOR")

                // El resto (lecturas, simulador, tipo de cambio) lo pueden ver ambos roles
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(allowedOrigins.split(",")));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
