package com.aboutplan.backend.domain.repository

import com.aboutplan.backend.domain.entity.EventEntity
import org.springframework.data.jpa.repository.JpaRepository

interface EventRepository : JpaRepository<EventEntity, String> {
    fun findByIdAndDeletedAtIsNull(id: String): EventEntity?
    fun findAllByUserIdAndDeletedAtIsNullOrderByStartAtAsc(userId: String): List<EventEntity>
    fun findAllBySharedCalendarIdIsNotNullAndDeletedAtIsNullOrderByStartAtAsc(): List<EventEntity>
}
