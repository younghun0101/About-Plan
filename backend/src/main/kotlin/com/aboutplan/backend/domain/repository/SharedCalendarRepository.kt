package com.aboutplan.backend.domain.repository

import com.aboutplan.backend.domain.entity.SharedCalendarEntity
import org.springframework.data.jpa.repository.JpaRepository

interface SharedCalendarRepository : JpaRepository<SharedCalendarEntity, String> {
    fun findAllByOrderByCreatedAtDesc(): List<SharedCalendarEntity>
}
