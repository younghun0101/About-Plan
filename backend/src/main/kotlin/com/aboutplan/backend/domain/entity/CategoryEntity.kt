package com.aboutplan.backend.domain.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "categories")
class CategoryEntity(
    @Id
    @Column(name = "tbl_category_id", length = 64)
    var id: String,
    @Column(name = "str_name", nullable = false, length = 120)
    var name: String,
    @Column(name = "str_color", nullable = false, length = 32)
    var color: String,
    @Column(name = "opt_style", nullable = false, length = 32)
    var style: String,
    @Column(name = "ref_user_id", nullable = false, length = 64)
    var userId: String,
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
