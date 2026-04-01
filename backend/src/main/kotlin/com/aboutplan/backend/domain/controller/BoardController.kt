package com.aboutplan.backend.domain.controller

import com.aboutplan.backend.common.ApiResponse
import com.aboutplan.backend.common.ApiResponses
import com.aboutplan.backend.common.ForbiddenException
import com.aboutplan.backend.common.IdGenerator
import com.aboutplan.backend.common.NotFoundException
import com.aboutplan.backend.domain.entity.BoardItemEntity
import com.aboutplan.backend.domain.entity.BoardPostEntity
import com.aboutplan.backend.domain.repository.BoardItemRepository
import com.aboutplan.backend.domain.repository.BoardPostRepository
import com.aboutplan.backend.security.CurrentUserService
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

data class BoardPostCreateRequest(
    @field:NotBlank
    val str_title: String,
    val str_content: String = "",
)

data class BoardPostUpdateRequest(
    val str_title: String?,
    val str_content: String?,
)

data class BoardPostResponse(
    val tbl_board_post_id: String,
    val str_title: String,
    val str_content: String,
    val ref_created_by: String,
    val dte_created_at: java.time.Instant,
    val dte_updated_at: java.time.Instant,
)

data class BoardItemCreateRequest(
    @field:NotBlank
    val str_content: String,
)

data class BoardItemUpdateRequest(
    val str_content: String?,
)

data class BoardItemResponse(
    val tbl_board_item_id: String,
    val str_content: String,
    val ref_board_post_id: String,
    val ref_created_by: String,
    val dte_created_at: java.time.Instant,
)

@RestController
@RequestMapping("/api")
class BoardController(
    private val boardPostRepository: BoardPostRepository,
    private val boardItemRepository: BoardItemRepository,
    private val currentUserService: CurrentUserService,
) {
    @GetMapping("/board-posts")
    fun listBoardPosts(): ApiResponse<List<BoardPostResponse>> {
        return ApiResponses.ok(
            boardPostRepository.findAllByOrderByCreatedAtDesc().map { it.toResponse() },
        )
    }

    @PostMapping("/board-posts")
    fun createBoardPost(@Valid @RequestBody request: BoardPostCreateRequest): ApiResponse<BoardPostResponse> {
        val userId = currentUserService.getCurrentUserId()
        val boardPost =
            boardPostRepository.save(
                BoardPostEntity(
                    id = IdGenerator.prefixed("post"),
                    title = request.str_title.trim(),
                    content = request.str_content,
                    createdBy = userId,
                ),
            )
        return ApiResponses.ok(boardPost.toResponse())
    }

    @PatchMapping("/board-posts/{boardPostId}")
    fun updateBoardPost(
        @PathVariable boardPostId: String,
        @RequestBody request: BoardPostUpdateRequest,
    ): ApiResponse<BoardPostResponse> {
        val userId = currentUserService.getCurrentUserId()
        val boardPost =
            boardPostRepository.findById(boardPostId).orElseThrow { NotFoundException("Board post not found") }
        ensureBoardPostOwner(boardPost, userId)

        request.str_title?.let { boardPost.title = it.trim() }
        request.str_content?.let { boardPost.content = it }

        return ApiResponses.ok(boardPostRepository.save(boardPost).toResponse())
    }

    @DeleteMapping("/board-posts/{boardPostId}")
    fun deleteBoardPost(@PathVariable boardPostId: String): ApiResponse<Map<String, String>> {
        val userId = currentUserService.getCurrentUserId()
        val boardPost =
            boardPostRepository.findById(boardPostId).orElseThrow { NotFoundException("Board post not found") }
        ensureBoardPostOwner(boardPost, userId)
        boardPostRepository.delete(boardPost)
        return ApiResponses.okMessage("Board post deleted")
    }

    @GetMapping("/board-posts/{boardPostId}/items")
    fun listBoardItems(@PathVariable boardPostId: String): ApiResponse<List<BoardItemResponse>> {
        boardPostRepository.findById(boardPostId).orElseThrow { NotFoundException("Board post not found") }
        return ApiResponses.ok(
            boardItemRepository.findAllByBoardPostIdOrderByCreatedAtAsc(boardPostId).map { it.toResponse() },
        )
    }

    @PostMapping("/board-posts/{boardPostId}/items")
    fun createBoardItem(
        @PathVariable boardPostId: String,
        @Valid @RequestBody request: BoardItemCreateRequest,
    ): ApiResponse<BoardItemResponse> {
        val userId = currentUserService.getCurrentUserId()
        boardPostRepository.findById(boardPostId).orElseThrow { NotFoundException("Board post not found") }

        val boardItem =
            boardItemRepository.save(
                BoardItemEntity(
                    id = IdGenerator.prefixed("item"),
                    content = request.str_content,
                    boardPostId = boardPostId,
                    createdBy = userId,
                ),
            )
        return ApiResponses.ok(boardItem.toResponse())
    }

    @PatchMapping("/board-items/{boardItemId}")
    fun updateBoardItem(
        @PathVariable boardItemId: String,
        @RequestBody request: BoardItemUpdateRequest,
    ): ApiResponse<BoardItemResponse> {
        val userId = currentUserService.getCurrentUserId()
        val boardItem =
            boardItemRepository.findById(boardItemId).orElseThrow { NotFoundException("Board item not found") }
        ensureBoardItemOwner(boardItem, userId)

        request.str_content?.let { boardItem.content = it }
        return ApiResponses.ok(boardItemRepository.save(boardItem).toResponse())
    }

    @DeleteMapping("/board-items/{boardItemId}")
    fun deleteBoardItem(@PathVariable boardItemId: String): ApiResponse<Map<String, String>> {
        val userId = currentUserService.getCurrentUserId()
        val boardItem =
            boardItemRepository.findById(boardItemId).orElseThrow { NotFoundException("Board item not found") }
        ensureBoardItemOwner(boardItem, userId)
        boardItemRepository.delete(boardItem)
        return ApiResponses.okMessage("Board item deleted")
    }

    private fun ensureBoardPostOwner(boardPost: BoardPostEntity, userId: String) {
        if (boardPost.createdBy != userId) {
            throw ForbiddenException("You cannot edit this board post")
        }
    }

    private fun ensureBoardItemOwner(boardItem: BoardItemEntity, userId: String) {
        if (boardItem.createdBy != userId) {
            throw ForbiddenException("You cannot edit this board item")
        }
    }

    private fun BoardPostEntity.toResponse(): BoardPostResponse =
        BoardPostResponse(
            tbl_board_post_id = id,
            str_title = title,
            str_content = content,
            ref_created_by = createdBy,
            dte_created_at = createdAt,
            dte_updated_at = updatedAt,
        )

    private fun BoardItemEntity.toResponse(): BoardItemResponse =
        BoardItemResponse(
            tbl_board_item_id = id,
            str_content = content,
            ref_board_post_id = boardPostId,
            ref_created_by = createdBy,
            dte_created_at = createdAt,
        )
}
