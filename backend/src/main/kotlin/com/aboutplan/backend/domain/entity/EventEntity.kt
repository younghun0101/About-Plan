package com.aboutplan.backend.domain.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "events")
class EventEntity(
    @Id
    @Column(name = "tbl_event_id", length = 64)
    var id: String,
    @Column(name = "str_title", nullable = false, length = 255)
    var title: String,
    @Column(name = "dte_start_at", nullable = false)
    var startAt: Instant,
    @Column(name = "dte_end_at", nullable = false)
    var endAt: Instant,
    @Column(name = "ref_user_id", length = 64)
    var userId: String? = null,
    @Column(name = "ref_shared_calendar_id", length = 64)
    var sharedCalendarId: String? = null,
    @Column(name = "ref_category_id", length = 64)
    var categoryId: String? = null,
    @Column(name = "bln_allow_overlap", nullable = false)
    var allowOverlap: Boolean = false,
    @Column(name = "opt_source_type", nullable = false, length = 32)
    var sourceType: String = "manual",
    @Column(name = "ref_source_id", length = 64)
    var sourceId: String? = null,
    @Column(name = "dte_deleted_at")
    var deletedAt: Instant? = null,
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
