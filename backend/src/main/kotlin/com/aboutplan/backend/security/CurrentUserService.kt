package com.aboutplan.backend.security

import com.aboutplan.backend.common.UnauthorizedException
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component

@Component
class CurrentUserService {
    fun getCurrentUserId(): String {
        val authentication = SecurityContextHolder.getContext().authentication
        val principal = authentication?.principal as? String
        if (principal.isNullOrBlank()) {
            throw UnauthorizedException()
        }
        return principal
    }
}
