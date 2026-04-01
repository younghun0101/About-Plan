package com.aboutplan.backend.domain.controller

import com.aboutplan.backend.common.ApiResponse
import com.aboutplan.backend.common.ApiResponses
import com.aboutplan.backend.common.ForbiddenException
import com.aboutplan.backend.common.IdGenerator
import com.aboutplan.backend.common.NotFoundException
import com.aboutplan.backend.domain.entity.EventEntity
import com.aboutplan.backend.domain.entity.MeetingEventEntity
import com.aboutplan.backend.domain.entity.MeetingEventId
import com.aboutplan.backend.domain.entity.MeetingNoteEntity
import com.aboutplan.backend.domain.repository.EventRepository
import com.aboutplan.backend.domain.repository.MeetingEventRepository
import com.aboutplan.backend.domain.repository.MeetingNoteRepository
import com.aboutplan.backend.security.CurrentUserService
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

data class MeetingNoteCreateRequest(
    @field:NotBlank
    val str_title: String,
    @field:Pattern(regexp = "requirements|technical|testing|design|deployment|post_deployment|general")
    val str_type: String,
    @field:NotBlank
    val str_content: String,
)

data class MeetingNoteUpdateRequest(
    val str_title: String?,
    @field:Pattern(regexp = "requirements|technical|testing|design|deployment|post_deployment|general")
    val str_type: String?,
    val str_content: String?,
)

data class MeetingNoteResponse(
    val tbl_meeting_note_id: String,
    val str_title: String,
    val str_type: String,
    val str_content: String,
    val ref_created_by: String,
    val dte_created_at: java.time.Instant,
    val dte_updated_at: java.time.Instant,
)

data class MeetingEventResponse(
    val ref_meeting_note_id: String,
    val ref_event_id: String,
    val str_title: String,
    val dte_start_at: java.time.Instant,
    val dte_end_at: java.time.Instant,
)

@RestController
@RequestMapping("/api/meeting-notes")
class MeetingNoteController(
    private val meetingNoteRepository: MeetingNoteRepository,
    private val meetingEventRepository: MeetingEventRepository,
    private val eventRepository: EventRepository,
    private val currentUserService: CurrentUserService,
) {
    @GetMapping
    fun listMeetingNotes(): ApiResponse<List<MeetingNoteResponse>> {
        val userId = currentUserService.getCurrentUserId()
        return ApiResponses.ok(
            meetingNoteRepository.findAllByCreatedByOrderByCreatedAtDesc(userId).map { it.toResponse() },
        )
    }

    @PostMapping
    fun createMeetingNote(
        @Valid @RequestBody request: MeetingNoteCreateRequest,
    ): ApiResponse<MeetingNoteResponse> {
        val userId = currentUserService.getCurrentUserId()
        val meetingNote =
            meetingNoteRepository.save(
                MeetingNoteEntity(
                    id = IdGenerator.prefixed("meeting"),
                    title = request.str_title.trim(),
                    type = request.str_type,
                    content = request.str_content,
                    createdBy = userId,
                ),
            )
        return ApiResponses.ok(meetingNote.toResponse())
    }

    @PatchMapping("/{meetingNoteId}")
    fun updateMeetingNote(
        @PathVariable meetingNoteId: String,
        @RequestBody request: MeetingNoteUpdateRequest,
    ): ApiResponse<MeetingNoteResponse> {
        val userId = currentUserService.getCurrentUserId()
        val meetingNote =
            meetingNoteRepository.findById(meetingNoteId).orElseThrow { NotFoundException("Meeting note not found") }
        ensureMeetingNoteOwner(meetingNote, userId)

        request.str_title?.let { meetingNote.title = it.trim() }
        request.str_type?.let { meetingNote.type = it }
        request.str_content?.let { meetingNote.content = it }

        return ApiResponses.ok(meetingNoteRepository.save(meetingNote).toResponse())
    }

    @DeleteMapping("/{meetingNoteId}")
    fun deleteMeetingNote(@PathVariable meetingNoteId: String): ApiResponse<Map<String, String>> {
        val userId = currentUserService.getCurrentUserId()
        val meetingNote =
            meetingNoteRepository.findById(meetingNoteId).orElseThrow { NotFoundException("Meeting note not found") }
        ensureMeetingNoteOwner(meetingNote, userId)

        meetingNoteRepository.delete(meetingNote)
        return ApiResponses.okMessage("Meeting note deleted")
    }

    @GetMapping("/{meetingNoteId}/events")
    fun listMeetingEvents(@PathVariable meetingNoteId: String): ApiResponse<List<MeetingEventResponse>> {
        val userId = currentUserService.getCurrentUserId()
        val meetingNote =
            meetingNoteRepository.findById(meetingNoteId).orElseThrow { NotFoundException("Meeting note not found") }
        ensureMeetingNoteOwner(meetingNote, userId)

        val links = meetingEventRepository.findAllByIdMeetingNoteId(meetingNoteId)
        val eventsById =
            eventRepository.findAllById(links.map { it.id.eventId }).associateBy { it.id }

        val response =
            links.mapNotNull { link ->
                val event = eventsById[link.id.eventId] ?: return@mapNotNull null
                MeetingEventResponse(
                    ref_meeting_note_id = link.id.meetingNoteId,
                    ref_event_id = link.id.eventId,
                    str_title = event.title,
                    dte_start_at = event.startAt,
                    dte_end_at = event.endAt,
                )
            }

        return ApiResponses.ok(response)
    }

    @PostMapping("/{meetingNoteId}/events/{eventId}")
    fun addMeetingEvent(
        @PathVariable meetingNoteId: String,
        @PathVariable eventId: String,
    ): ApiResponse<Map<String, String>> {
        val userId = currentUserService.getCurrentUserId()
        val meetingNote =
            meetingNoteRepository.findById(meetingNoteId).orElseThrow { NotFoundException("Meeting note not found") }
        ensureMeetingNoteOwner(meetingNote, userId)

        val event = eventRepository.findByIdAndDeletedAtIsNull(eventId) ?: throw NotFoundException("Event not found")
        ensureEventReadable(event, userId)

        if (!meetingEventRepository.existsByIdMeetingNoteIdAndIdEventId(meetingNoteId, eventId)) {
            meetingEventRepository.save(
                MeetingEventEntity(
                    id = MeetingEventId(meetingNoteId = meetingNoteId, eventId = eventId),
                ),
            )
        }
        return ApiResponses.okMessage("Event linked to meeting note")
    }

    @DeleteMapping("/{meetingNoteId}/events/{eventId}")
    fun removeMeetingEvent(
        @PathVariable meetingNoteId: String,
        @PathVariable eventId: String,
    ): ApiResponse<Map<String, String>> {
        val userId = currentUserService.getCurrentUserId()
        val meetingNote =
            meetingNoteRepository.findById(meetingNoteId).orElseThrow { NotFoundException("Meeting note not found") }
        ensureMeetingNoteOwner(meetingNote, userId)

        val id = MeetingEventId(meetingNoteId = meetingNoteId, eventId = eventId)
        if (meetingEventRepository.existsById(id)) {
            meetingEventRepository.deleteById(id)
        }
        return ApiResponses.okMessage("Meeting event link deleted")
    }

    private fun ensureMeetingNoteOwner(meetingNote: MeetingNoteEntity, userId: String) {
        if (meetingNote.createdBy != userId) {
            throw ForbiddenException("You cannot access this meeting note")
        }
    }

    private fun ensureEventReadable(event: EventEntity, userId: String) {
        if (event.userId != null && event.userId != userId) {
            throw ForbiddenException("You cannot access this event")
        }
    }

    private fun MeetingNoteEntity.toResponse(): MeetingNoteResponse =
        MeetingNoteResponse(
            tbl_meeting_note_id = id,
            str_title = title,
            str_type = type,
            str_content = content,
            ref_created_by = createdBy,
            dte_created_at = createdAt,
            dte_updated_at = updatedAt,
        )
}
