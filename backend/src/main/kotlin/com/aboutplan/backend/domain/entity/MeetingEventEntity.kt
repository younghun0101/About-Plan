package com.aboutplan.backend.domain.entity

import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import jakarta.persistence.EmbeddedId
import jakarta.persistence.Entity
import jakarta.persistence.Table
import java.io.Serializable
import java.time.Instant

@Embeddable
data class MeetingEventId(
    @Column(name = "ref_meeting_note_id", length = 64)
    var meetingNoteId: String = "",
    @Column(name = "ref_event_id", length = 64)
    var eventId: String = "",
) : Serializable

@Entity
@Table(name = "meeting_events")
class MeetingEventEntity(
    @EmbeddedId
    var id: MeetingEventId = MeetingEventId(),
    @Column(name = "dte_created_at", nullable = false)
    var createdAt: Instant = Instant.now(),
)
