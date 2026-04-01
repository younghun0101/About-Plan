package com.aboutplan.backend.domain.repository

import com.aboutplan.backend.domain.entity.BoardPostEntity
import org.springframework.data.jpa.repository.JpaRepository

interface BoardPostRepository : JpaRepository<BoardPostEntity, String> {
    fun findAllByOrderByCreatedAtDesc(): List<BoardPostEntity>
}
