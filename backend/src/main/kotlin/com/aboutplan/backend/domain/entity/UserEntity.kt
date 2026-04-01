package com.aboutplan.backend.domain.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "users")
class UserEntity(
    @Id
    @Column(name = "tbl_user_id", length = 64)
    var id: String,
    @Column(name = "str_name", nullable = false, length = 120)
    var name: String,
    @Column(name = "str_email", nullable = false, length = 255, unique = true)
    var email: String,
    @Column(name = "str_password_hash", nullable = false, length = 255)
    var passwordHash: String,
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
