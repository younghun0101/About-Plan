package com.aboutplan.backend.domain.controller

import com.aboutplan.backend.common.ApiResponse
import com.aboutplan.backend.common.ApiResponses
import com.aboutplan.backend.common.ForbiddenException
import com.aboutplan.backend.common.IdGenerator
import com.aboutplan.backend.common.NotFoundException
import com.aboutplan.backend.domain.entity.SharedCalendarEntity
import com.aboutplan.backend.domain.repository.SharedCalendarRepository
import com.aboutplan.backend.security.CurrentUserService
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

data class SharedCalendarRequest(
    @field:NotBlank
    @field:Size(max = 120)
    val str_name: String,
)

data class SharedCalendarUpdateRequest(
    @field:NotBlank
    @field:Size(max = 120)
    val str_name: String,
)

data class SharedCalendarResponse(
    val tbl_shared_calendar_id: String,
    val str_name: String,
    val ref_created_by: String,
    val dte_created_at: java.time.Instant,
)

@RestController
@RequestMapping("/api/shared-calendars")
class SharedCalendarController(
    private val sharedCalendarRepository: SharedCalendarRepository,
    private val currentUserService: CurrentUserService,
) {
    @GetMapping
    fun listSharedCalendars(): ApiResponse<List<SharedCalendarResponse>> {
        return ApiResponses.ok(
            sharedCalendarRepository.findAllByOrderByCreatedAtDesc().map { it.toResponse() },
        )
    }

    @PostMapping
    fun createSharedCalendar(
        @Valid @RequestBody request: SharedCalendarRequest,
    ): ApiResponse<SharedCalendarResponse> {
        val userId = currentUserService.getCurrentUserId()
        val sharedCalendar =
            sharedCalendarRepository.save(
                SharedCalendarEntity(
                    id = IdGenerator.prefixed("shared-cal"),
                    name = request.str_name.trim(),
                    createdBy = userId,
                ),
        )
        return ApiResponses.ok(sharedCalendar.toResponse())
    }

    @PatchMapping("/{sharedCalendarId}")
    fun updateSharedCalendar(
        @PathVariable sharedCalendarId: String,
        @Valid @RequestBody request: SharedCalendarUpdateRequest,
    ): ApiResponse<SharedCalendarResponse> {
        val userId = currentUserService.getCurrentUserId()
        val sharedCalendar =
            sharedCalendarRepository.findById(sharedCalendarId)
                .orElseThrow { NotFoundException("Shared calendar not found") }

        if (sharedCalendar.createdBy != userId) {
            throw ForbiddenException("You cannot edit this shared calendar")
        }

        sharedCalendar.name = request.str_name.trim()
        return ApiResponses.ok(sharedCalendarRepository.save(sharedCalendar).toResponse())
    }

    @DeleteMapping("/{sharedCalendarId}")
    fun deleteSharedCalendar(@PathVariable sharedCalendarId: String): ApiResponse<Map<String, String>> {
        val userId = currentUserService.getCurrentUserId()
        val sharedCalendar =
            sharedCalendarRepository.findById(sharedCalendarId)
                .orElseThrow { NotFoundException("Shared calendar not found") }

        if (sharedCalendar.createdBy != userId) {
            throw ForbiddenException("You cannot delete this shared calendar")
        }

        sharedCalendarRepository.delete(sharedCalendar)
        return ApiResponses.okMessage("Shared calendar deleted")
    }

    private fun SharedCalendarEntity.toResponse(): SharedCalendarResponse =
        SharedCalendarResponse(
            tbl_shared_calendar_id = id,
            str_name = name,
            ref_created_by = createdBy,
            dte_created_at = createdAt,
        )
}
