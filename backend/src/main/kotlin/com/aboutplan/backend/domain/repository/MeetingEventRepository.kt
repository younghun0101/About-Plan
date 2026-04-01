package com.aboutplan.backend.domain.repository

import com.aboutplan.backend.domain.entity.MeetingEventEntity
import com.aboutplan.backend.domain.entity.MeetingEventId
import org.springframework.data.jpa.repository.JpaRepository

interface MeetingEventRepository : JpaRepository<MeetingEventEntity, MeetingEventId> {
    fun findAllByIdMeetingNoteId(meetingNoteId: String): List<MeetingEventEntity>
    fun existsByIdMeetingNoteIdAndIdEventId(meetingNoteId: String, eventId: String): Boolean
}
