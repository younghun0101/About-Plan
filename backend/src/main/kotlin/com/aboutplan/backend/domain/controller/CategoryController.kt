package com.aboutplan.backend.domain.controller

import com.aboutplan.backend.common.ApiResponse
import com.aboutplan.backend.common.ApiResponses
import com.aboutplan.backend.common.BadRequestException
import com.aboutplan.backend.common.ForbiddenException
import com.aboutplan.backend.common.IdGenerator
import com.aboutplan.backend.common.NotFoundException
import com.aboutplan.backend.domain.entity.CategoryEntity
import com.aboutplan.backend.domain.repository.CategoryRepository
import com.aboutplan.backend.security.CurrentUserService
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

data class CategoryCreateRequest(
    @field:NotBlank
    @field:Size(max = 120)
    val str_name: String,
    @field:NotBlank
    @field:Size(max = 32)
    val str_color: String,
    @field:Pattern(regexp = "dot|highlight")
    val opt_style: String,
)

data class CategoryUpdateRequest(
    @field:Size(max = 120)
    val str_name: String?,
    @field:Size(max = 32)
    val str_color: String?,
    @field:Pattern(regexp = "dot|highlight")
    val opt_style: String?,
)

data class CategoryResponse(
    val tbl_category_id: String,
    val str_name: String,
    val str_color: String,
    val opt_style: String,
    val ref_user_id: String,
)

@RestController
@RequestMapping("/api/categories")
class CategoryController(
    private val categoryRepository: CategoryRepository,
    private val currentUserService: CurrentUserService,
) {
    @GetMapping
    fun listCategories(): ApiResponse<List<CategoryResponse>> {
        val userId = currentUserService.getCurrentUserId()
        return ApiResponses.ok(
            categoryRepository.findAllByUserIdOrderByCreatedAtDesc(userId).map { it.toResponse() },
        )
    }

    @PostMapping
    fun createCategory(@Valid @RequestBody request: CategoryCreateRequest): ApiResponse<CategoryResponse> {
        val userId = currentUserService.getCurrentUserId()
        if (categoryRepository.existsByUserIdAndNameIgnoreCase(userId, request.str_name.trim())) {
            throw BadRequestException("Category name already exists")
        }

        val category =
            categoryRepository.save(
                CategoryEntity(
                    id = IdGenerator.prefixed("cat"),
                    name = request.str_name.trim(),
                    color = request.str_color.trim(),
                    style = request.opt_style,
                    userId = userId,
                ),
            )
        return ApiResponses.ok(category.toResponse())
    }

    @PatchMapping("/{categoryId}")
    fun updateCategory(
        @PathVariable categoryId: String,
        @Valid @RequestBody request: CategoryUpdateRequest,
    ): ApiResponse<CategoryResponse> {
        val userId = currentUserService.getCurrentUserId()
        val category = categoryRepository.findById(categoryId).orElseThrow { NotFoundException("Category not found") }
        if (category.userId != userId) {
            throw ForbiddenException("You cannot edit this category")
        }

        request.str_name?.let {
            val newName = it.trim()
            if (newName.isBlank()) throw BadRequestException("str_name cannot be blank")
            category.name = newName
        }
        request.str_color?.let { category.color = it.trim() }
        request.opt_style?.let { category.style = it }

        return ApiResponses.ok(categoryRepository.save(category).toResponse())
    }

    @DeleteMapping("/{categoryId}")
    fun deleteCategory(@PathVariable categoryId: String): ApiResponse<Map<String, String>> {
        val userId = currentUserService.getCurrentUserId()
        val category = categoryRepository.findById(categoryId).orElseThrow { NotFoundException("Category not found") }
        if (category.userId != userId) {
            throw ForbiddenException("You cannot delete this category")
        }
        categoryRepository.delete(category)
        return ApiResponses.okMessage("Category deleted")
    }

    private fun CategoryEntity.toResponse(): CategoryResponse =
        CategoryResponse(
            tbl_category_id = id,
            str_name = name,
            str_color = color,
            opt_style = style,
            ref_user_id = userId,
        )
}
