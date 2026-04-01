package com.aboutplan.backend.domain.repository

import com.aboutplan.backend.domain.entity.MeetingNoteEntity
import org.springframework.data.jpa.repository.JpaRepository

interface MeetingNoteRepository : JpaRepository<MeetingNoteEntity, String> {
    fun findAllByCreatedByOrderByCreatedAtDesc(createdBy: String): List<MeetingNoteEntity>
}
