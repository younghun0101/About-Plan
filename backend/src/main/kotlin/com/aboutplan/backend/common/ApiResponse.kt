package com.aboutplan.backend.common

data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val error: String? = null,
)

object ApiResponses {
    fun <T> ok(data: T): ApiResponse<T> = ApiResponse(success = true, data = data)

    fun okMessage(message: String): ApiResponse<Map<String, String>> =
        ok(mapOf("message" to message))

    fun fail(message: String): ApiResponse<Nothing> = ApiResponse(success = false, error = message)
}
