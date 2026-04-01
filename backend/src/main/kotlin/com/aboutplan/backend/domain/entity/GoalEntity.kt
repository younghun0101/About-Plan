package com.aboutplan.backend.domain.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "goals")
class GoalEntity(
    @Id
    @Column(name = "tbl_goal_id", length = 64)
    var id: String,
    @Column(name = "str_title", nullable = false, length = 255)
    var title: String,
    @Column(name = "str_description", nullable = false)
    var description: String = "",
    @Column(name = "dte_deadline", nullable = false)
    var deadline: Instant,
    @Column(name = "bln_is_completed", nullable = false)
    var isCompleted: Boolean = false,
    @Column(name = "ref_user_id", length = 64)
    var userId: String? = null,
    @Column(name = "ref_shared_calendar_id", length = 64)
    var sharedCalendarId: String? = null,
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
