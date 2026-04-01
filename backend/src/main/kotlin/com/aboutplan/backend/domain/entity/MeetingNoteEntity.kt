package com.aboutplan.backend.domain.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "meeting_notes")
class MeetingNoteEntity(
    @Id
    @Column(name = "tbl_meeting_note_id", length = 64)
    var id: String,
    @Column(name = "str_title", nullable = false, length = 255)
    var title: String,
    @Column(name = "str_type", nullable = false, length = 32)
    var type: String,
    @Column(name = "str_content", nullable = false)
    var content: String,
    @Column(name = "ref_created_by", nullable = false, length = 64)
    var createdBy: String,
    @Column(name = "dte_created_at", nullable = false)
    var createdAt: Instant = Instant.now(),
    @Column(name = "dte_updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),
) {
    @PreUpdate
    fun touch() {
        updatedAt = Instant.now()
    }
}
