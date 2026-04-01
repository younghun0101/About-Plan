package com.aboutplan.backend.domain.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "board_items")
class BoardItemEntity(
    @Id
    @Column(name = "tbl_board_item_id", length = 64)
    var id: String,
    @Column(name = "str_content", nullable = false)
    var content: String,
    @Column(name = "ref_board_post_id", nullable = false, length = 64)
    var boardPostId: String,
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
