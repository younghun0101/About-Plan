package com.aboutplan.backend.auth

import com.aboutplan.backend.common.ApiResponse
import com.aboutplan.backend.common.ApiResponses
import com.aboutplan.backend.common.BadRequestException
import com.aboutplan.backend.common.IdGenerator
import com.aboutplan.backend.common.NotFoundException
import com.aboutplan.backend.common.UnauthorizedException
import com.aboutplan.backend.domain.entity.UserEntity
import com.aboutplan.backend.domain.repository.UserRepository
import com.aboutplan.backend.security.CurrentUserService
import com.aboutplan.backend.security.JwtTokenProvider
import jakarta.validation.Valid
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val jwtTokenProvider: JwtTokenProvider,
    private val currentUserService: CurrentUserService,
) {
    @PostMapping("/signup")
    fun signup(@Valid @RequestBody request: SignupRequest): ApiResponse<AuthTokenResponse> {
        val normalizedEmail = request.email.trim().lowercase()
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw BadRequestException("Email already in use")
        }

        val user =
            userRepository.save(
                UserEntity(
                    id = IdGenerator.prefixed("user"),
                    name = request.name.trim(),
                    email = normalizedEmail,
                    passwordHash = passwordEncoder.encode(request.password),
                ),
            )

        return ApiResponses.ok(generateAuthResponse(user))
    }

    @PostMapping("/login")
    fun login(@Valid @RequestBody request: LoginRequest): ApiResponse<AuthTokenResponse> {
        val normalizedEmail = request.email.trim().lowercase()
        val user = userRepository.findByEmailIgnoreCase(normalizedEmail) ?: throw UnauthorizedException("Invalid credentials")

        val valid = verifyPassword(request.password, user.passwordHash)
        if (!valid) {
            throw UnauthorizedException("Invalid credentials")
        }

        if (!isBcryptHash(user.passwordHash)) {
            user.passwordHash = passwordEncoder.encode(request.password)
            userRepository.save(user)
        }

        return ApiResponses.ok(generateAuthResponse(user))
    }

    @GetMapping("/me")
    fun me(): ApiResponse<AuthUserDto> {
        val userId = currentUserService.getCurrentUserId()
        val user = userRepository.findById(userId).orElseThrow { NotFoundException("User not found") }
        return ApiResponses.ok(AuthUserDto(id = user.id, name = user.name, email = user.email))
    }

    private fun generateAuthResponse(user: UserEntity): AuthTokenResponse {
        val token = jwtTokenProvider.generateToken(user.id, user.email)
        return AuthTokenResponse(
            token = token,
            user = AuthUserDto(id = user.id, name = user.name, email = user.email),
        )
    }

    private fun verifyPassword(rawPassword: String, storedPasswordHash: String): Boolean {
        return if (isBcryptHash(storedPasswordHash)) {
            passwordEncoder.matches(rawPassword, storedPasswordHash)
        } else {
            rawPassword == storedPasswordHash
        }
    }

    private fun isBcryptHash(passwordHash: String): Boolean {
        return passwordHash.startsWith("\$2a$") ||
            passwordHash.startsWith("\$2b$") ||
            passwordHash.startsWith("\$2y$")
    }
}
