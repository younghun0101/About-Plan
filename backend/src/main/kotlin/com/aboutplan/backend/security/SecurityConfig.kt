package com.aboutplan.backend.security

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.beans.factory.annotation.Value
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter

@Configuration
@EnableWebSecurity
class SecurityConfig(
    private val jwtTokenProvider: JwtTokenProvider,
    @Value("\${app.cors.allowed-origins}")
    private val allowedOriginsRaw: String,
) {
    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val allowedOrigins =
            allowedOriginsRaw
                .split(",")
                .map { it.trim() }
                .filter { it.isNotEmpty() }

        val configuration =
            CorsConfiguration().apply {
                this.allowedOrigins = allowedOrigins
                allowedMethods = listOf("GET", "POST", "PATCH", "DELETE", "OPTIONS")
                allowedHeaders = listOf("*")
                allowCredentials = true
            }
        return UrlBasedCorsConfigurationSource().apply {
            registerCorsConfiguration("/**", configuration)
        }
    }

    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()

    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain {
        val jwtAuthFilter = JwtAuthFilter(jwtTokenProvider)

        http
            .csrf { it.disable() }
            .cors { }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests { auth ->
                auth
                    .requestMatchers("/api/health", "/api/auth/**", "/actuator/health", "/actuator/info")
                    .permitAll()
                    .anyRequest()
                    .authenticated()
            }
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter::class.java)

        return http.build()
    }
}
