package com.aboutplan.backend.domain.repository

import com.aboutplan.backend.domain.entity.GoalEntity
import org.springframework.data.jpa.repository.JpaRepository

interface GoalRepository : JpaRepository<GoalEntity, String> {
    fun findAllByUserIdOrderByDeadlineAsc(userId: String): List<GoalEntity>
    fun findAllBySharedCalendarIdIsNotNullOrderByDeadlineAsc(): List<GoalEntity>
}
