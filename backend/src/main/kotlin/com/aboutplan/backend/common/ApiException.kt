package com.aboutplan.backend.common

import org.springframework.http.HttpStatus

open class ApiException(
    val status: HttpStatus,
    override val message: String,
) : RuntimeException(message)

class BadRequestException(message: String) : ApiException(HttpStatus.BAD_REQUEST, message)

class UnauthorizedException(message: String = "Unauthorized") :
    ApiException(HttpStatus.UNAUTHORIZED, message)

class ForbiddenException(message: String = "Forbidden") : ApiException(HttpStatus.FORBIDDEN, message)

class NotFoundException(message: String = "Not found") : ApiException(HttpStatus.NOT_FOUND, message)
