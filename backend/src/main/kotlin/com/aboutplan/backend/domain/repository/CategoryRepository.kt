package com.aboutplan.backend.domain.repository

import com.aboutplan.backend.domain.entity.CategoryEntity
import org.springframework.data.jpa.repository.JpaRepository

interface CategoryRepository : JpaRepository<CategoryEntity, String> {
    fun findAllByUserIdOrderByCreatedAtDesc(userId: String): List<CategoryEntity>
    fun existsByUserIdAndNameIgnoreCase(userId: String, name: String): Boolean
}
