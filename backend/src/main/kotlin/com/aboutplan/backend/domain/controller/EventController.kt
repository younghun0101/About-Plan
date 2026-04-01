package com.aboutplan.backend.domain.controller

import com.aboutplan.backend.common.ApiResponse
import com.aboutplan.backend.common.ApiResponses
import com.aboutplan.backend.common.BadRequestException
import com.aboutplan.backend.common.ForbiddenException
import com.aboutplan.backend.common.IdGenerator
import com.aboutplan.backend.common.NotFoundException
import com.aboutplan.backend.domain.entity.EventEntity
import com.aboutplan.backend.domain.repository.CategoryRepository
import com.aboutplan.backend.domain.repository.EventRepository
import com.aboutplan.backend.domain.repository.SharedCalendarRepository
import com.aboutplan.backend.security.CurrentUserService
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import java.time.Instant
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

data class EventCreateRequest(
    @field:NotBlank
    val str_title: String,
    val dte_start_at: Instant,
    val dte_end_at: Instant,
    val ref_category_id: String?,
    val bln_allow_overlap: Boolean = false,
    val ref_shared_calendar_id: String?,
)

data class EventUpdateRequest(
    val str_title: String?,
    val dte_start_at: Instant?,
    val dte_end_at: Instant?,
    val ref_category_id: String?,
    val bln_allow_overlap: Boolean?,
    val ref_shared_calendar_id: String?,
)

data class EventResponse(
    val tbl_event_id: String,
    val str_title: String,
    val dte_start_at: Instant,
    val dte_end_at: Instant,
    val ref_user_id: String?,
    val ref_shared_calendar_id: String?,
    val ref_category_id: String?,
    val bln_allow_overlap: Boolean,
    val opt_source_type: String,
    val ref_source_id: String?,
    val dte_deleted_at: Instant?,
)

@RestController
@RequestMapping("/api/events")
class EventController(
    private val eventRepository: EventRepository,
    private val categoryRepository: CategoryRepository,
    private val sharedCalendarRepository: SharedCalendarRepository,
    private val currentUserService: CurrentUserService,
) {
    @GetMapping
    fun listEvents(
        @RequestParam(defaultValue = "all") scope: String,
        @RequestParam(required = false) from: String?,
        @RequestParam(required = false) to: String?,
    ): ApiResponse<List<EventResponse>> {
        val userId = currentUserService.getCurrentUserId()
        val fromAt = from?.let { parseInstant(it, "from") }
        val toAt = to?.let { parseInstant(it, "to") }

        val source =
            when (scope.lowercase()) {
                "personal" -> eventRepository.findAllByUserIdAndDeletedAtIsNullOrderByStartAtAsc(userId)
                "shared" -> eventRepository.findAllBySharedCalendarIdIsNotNullAndDeletedAtIsNullOrderByStartAtAsc()
                "all" -> {
                    val personal = eventRepository.findAllByUserIdAndDeletedAtIsNullOrderByStartAtAsc(userId)
                    val shared = eventRepository.findAllBySharedCalendarIdIsNotNullAndDeletedAtIsNullOrderByStartAtAsc()
                    (personal + shared).distinctBy { it.id }.sortedBy { it.startAt }
                }
                else -> throw BadRequestException("scope must be one of: all, personal, shared")
            }

        val filtered =
            source
                .filter { event ->
                    val fromCheck = fromAt?.let { event.endAt >= it } ?: true
                    val toCheck = toAt?.let { event.startAt <= it } ?: true
                    fromCheck && toCheck
                }.sortedBy { it.startAt }

        return ApiResponses.ok(filtered.map { it.toResponse() })
    }

    @PostMapping
    fun createEvent(@Valid @RequestBody request: EventCreateRequest): ApiResponse<EventResponse> {
        val userId = currentUserService.getCurrentUserId()
        validateEventRange(request.dte_start_at, request.dte_end_at)
        validateCategoryOwnership(userId, request.ref_category_id)

        val targetSharedCalendarId = request.ref_shared_calendar_id?.trim()?.ifBlank { null }
        if (targetSharedCalendarId != null) {
            sharedCalendarRepository.findById(targetSharedCalendarId)
                .orElseThrow { NotFoundException("Shared calendar not found") }
        }

        val event =
            eventRepository.save(
                EventEntity(
                    id = IdGenerator.prefixed("event"),
                    title = request.str_title.trim(),
                    startAt = request.dte_start_at,
                    endAt = request.dte_end_at,
                    userId = if (targetSharedCalendarId == null) userId else null,
                    sharedCalendarId = targetSharedCalendarId,
                    categoryId = request.ref_category_id?.trim()?.ifBlank { null },
                    allowOverlap = request.bln_allow_overlap,
                    sourceType = "manual",
                ),
            )
        return ApiResponses.ok(event.toResponse())
    }

    @PatchMapping("/{eventId}")
    fun updateEvent(
        @PathVariable eventId: String,
        @RequestBody request: EventUpdateRequest,
    ): ApiResponse<EventResponse> {
        val userId = currentUserService.getCurrentUserId()
        val event = eventRepository.findByIdAndDeletedAtIsNull(eventId) ?: throw NotFoundException("Event not found")

        ensureEventWriteAccess(event, userId)

        val newStart = request.dte_start_at ?: event.startAt
        val newEnd = request.dte_end_at ?: event.endAt
        validateEventRange(newStart, newEnd)

        request.str_title?.let { event.title = it.trim() }
        event.startAt = newStart
        event.endAt = newEnd
        request.bln_allow_overlap?.let { event.allowOverlap = it }

        request.ref_category_id?.let {
            validateCategoryOwnership(userId, it)
            event.categoryId = it.trim().ifBlank { null }
        }

        request.ref_shared_calendar_id?.let {
            val sharedCalendarId = it.trim().ifBlank { null }
            if (sharedCalendarId != null) {
                sharedCalendarRepository.findById(sharedCalendarId)
                    .orElseThrow { NotFoundException("Shared calendar not found") }
                event.userId = null
                event.sharedCalendarId = sharedCalendarId
            }
        }

        return ApiResponses.ok(eventRepository.save(event).toResponse())
    }

    @DeleteMapping("/{eventId}")
    fun deleteEvent(@PathVariable eventId: String): ApiResponse<Map<String, String>> {
        val userId = currentUserService.getCurrentUserId()
        val event = eventRepository.findByIdAndDeletedAtIsNull(eventId) ?: throw NotFoundException("Event not found")
        ensureEventWriteAccess(event, userId)

        event.deletedAt = Instant.now()
        eventRepository.save(event)
        return ApiResponses.okMessage("Event deleted")
    }

    private fun ensureEventWriteAccess(event: EventEntity, currentUserId: String) {
        if (event.userId != null && event.userId != currentUserId) {
            throw ForbiddenException("You cannot edit this event")
        }
    }

    private fun validateEventRange(startAt: Instant, endAt: Instant) {
        if (!endAt.isAfter(startAt)) {
            throw BadRequestException("dte_end_at must be after dte_start_at")
        }
    }

    private fun validateCategoryOwnership(userId: String, categoryId: String?) {
        val target = categoryId?.trim()?.ifBlank { null } ?: return
        val category = categoryRepository.findById(target).orElseThrow { NotFoundException("Category not found") }
        if (category.userId != userId) {
            throw ForbiddenException("Category does not belong to current user")
        }
    }

    private fun parseInstant(value: String, fieldName: String): Instant {
        return runCatching { Instant.parse(value) }.getOrElse {
            throw BadRequestException("$fieldName must be ISO-8601 datetime")
        }
    }

    private fun EventEntity.toResponse(): EventResponse =
        EventResponse(
            tbl_event_id = id,
            str_title = title,
            dte_start_at = startAt,
            dte_end_at = endAt,
            ref_user_id = userId,
            ref_shared_calendar_id = sharedCalendarId,
            ref_category_id = categoryId,
            bln_allow_overlap = allowOverlap,
            opt_source_type = sourceType,
            ref_source_id = sourceId,
            dte_deleted_at = deletedAt,
        )
}
