package com.aboutplan.backend.security

import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.nio.charset.StandardCharsets
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.Date
import javax.crypto.SecretKey

@Component
class JwtTokenProvider(
    @Value("\${app.jwt.secret:about-plan-dev-secret-key-change-this-in-production-32chars}")
    secretValue: String,
    @Value("\${app.jwt.access-token-exp-minutes:720}")
    private val accessTokenExpMinutes: Long,
) {
    private val secret: String =
        if (secretValue.length >= 32) {
            secretValue
        } else {
            secretValue.padEnd(32, 'x')
        }

    private val secretKey: SecretKey =
        Keys.hmacShaKeyFor(secret.toByteArray(StandardCharsets.UTF_8))

    fun generateToken(userId: String, email: String): String {
        val now = Instant.now()
        val expiration = now.plus(accessTokenExpMinutes, ChronoUnit.MINUTES)

        return Jwts
            .builder()
            .subject(userId)
            .claim("email", email)
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiration))
            .signWith(secretKey)
            .compact()
    }

    fun parseToken(token: String): JwtPrincipal? {
        return runCatching {
            val claims =
                Jwts
                    .parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token)
                    .payload

            JwtPrincipal(
                userId = claims.subject,
                email = claims["email"]?.toString().orEmpty(),
            )
        }.getOrNull()
    }
}

data class JwtPrincipal(
    val userId: String,
    val email: String,
)
