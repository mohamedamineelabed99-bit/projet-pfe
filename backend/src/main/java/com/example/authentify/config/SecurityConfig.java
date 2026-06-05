package com.example.authentify.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
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
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Public routes — no token needed
                .requestMatchers(
                    "/api/v1.0/login",
                    "/api/v1.0/register",
                    "/api/v1.0/verify-otp",
                    "/api/v1.0/reset-password",
                    "/api/v1.0/check-email",
                    "/api/v1.0/register-from-demande/**",
                    "/api/v1.0/test",
                    "/api/v1.0/uploads/**",
                    "/api/v1.0/files/**",
                    "/api/v1.0/email/**",
                    "/api/v1.0/evaluation/**",
                    "/actuator/health"
                ).permitAll()

                // Public demande registration
                .requestMatchers("/api/v1.0/demandes/**").permitAll()

                // ADMIN or EVALUATEUR only
                .requestMatchers("/api/v1.0/users").hasAnyAuthority("ADMIN", "EVALUATEUR")

                // ADMIN only
                .requestMatchers(HttpMethod.DELETE, "/api/v1.0/users/**").hasAuthority("ADMIN")
                .requestMatchers("/api/v1.0/users/*/activer").hasAuthority("ADMIN")
                .requestMatchers("/api/v1.0/users/*/desactiver").hasAuthority("ADMIN")
                .requestMatchers("/api/v1.0/principes/update/**").hasAuthority("ADMIN")
                .requestMatchers("/api/v1.0/*/listOrganismesEval/").hasAuthority("EVALUATEUR")

                // Everything else requires login
                .anyRequest().authenticated()
            )
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
            "http://localhost:5173",
            "https://projet-pfe-livid.vercel.app"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setExposedHeaders(List.of("Set-Cookie", "X-Auth-Token"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}