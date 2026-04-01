package com.aboutplan.backend.domain.repository

import com.aboutplan.backend.domain.entity.BoardItemEntity
import org.springframework.data.jpa.repository.JpaRepository

interface BoardItemRepository : JpaRepository<BoardItemEntity, String> {
    fun findAllByBoardPostIdOrderByCreatedAtAsc(boardPostId: String): List<BoardItemEntity>
}
