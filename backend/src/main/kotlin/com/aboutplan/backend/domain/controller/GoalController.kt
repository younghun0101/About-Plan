package com.aboutplan.backend.domain.controller

import com.aboutplan.backend.common.ApiResponse
import com.aboutplan.backend.common.ApiResponses
import com.aboutplan.backend.common.BadRequestException
import com.aboutplan.backend.common.ForbiddenException
import com.aboutplan.backend.common.IdGenerator
import com.aboutplan.backend.common.NotFoundException
import com.aboutplan.backend.domain.entity.GoalEntity
import com.aboutplan.backend.domain.repository.GoalRepository
import com.aboutplan.backend.domain.repository.SharedCalendarRepository
import com.aboutplan.backend.security.CurrentUserService
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import java.time.Instant
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

data class GoalCreateRequest(
    @field:NotBlank
    val str_title: String,
    val str_description: String = "",
    val dte_deadline: Instant,
    val ref_shared_calendar_id: String?,
)

data class GoalUpdateRequest(
    val str_title: String?,
    val str_description: String?,
    val dte_deadline: Instant?,
    val bln_is_completed: Boolean?,
    val ref_shared_calendar_id: String?,
)

data class GoalResponse(
    val tbl_goal_id: String,
    val str_title: String,
    val str_description: String,
    val dte_deadline: Instant,
    val bln_is_completed: Boolean,
    val ref_user_id: String?,
    val ref_shared_calendar_id: String?,
    val dte_created_at: Instant,
)

@RestController
@RequestMapping("/api/goals")
class GoalController(
    private val goalRepository: GoalRepository,
    private val sharedCalendarRepository: SharedCalendarRepository,
    private val currentUserService: CurrentUserService,
) {
    @GetMapping
    fun listGoals(
        @RequestParam(defaultValue = "all") scope: String,
    ): ApiResponse<List<GoalResponse>> {
        val userId = currentUserService.getCurrentUserId()
        val goals =
            when (scope.lowercase()) {
                "personal" -> goalRepository.findAllByUserIdOrderByDeadlineAsc(userId)
                "shared" -> goalRepository.findAllBySharedCalendarIdIsNotNullOrderByDeadlineAsc()
                "all" -> {
                    val personal = goalRepository.findAllByUserIdOrderByDeadlineAsc(userId)
                    val shared = goalRepository.findAllBySharedCalendarIdIsNotNullOrderByDeadlineAsc()
                    (personal + shared).distinctBy { it.id }.sortedBy { it.deadline }
                }
                else -> throw BadRequestException("scope must be one of: all, personal, shared")
            }
        return ApiResponses.ok(goals.map { it.toResponse() })
    }

    @PostMapping
    fun createGoal(@Valid @RequestBody request: GoalCreateRequest): ApiResponse<GoalResponse> {
        val userId = currentUserService.getCurrentUserId()
        val targetSharedCalendarId = request.ref_shared_calendar_id?.trim()?.ifBlank { null }
        if (targetSharedCalendarId != null) {
            sharedCalendarRepository.findById(targetSharedCalendarId)
                .orElseThrow { NotFoundException("Shared calendar not found") }
        }

        val goal =
            goalRepository.save(
                GoalEntity(
                    id = IdGenerator.prefixed("goal"),
                    title = request.str_title.trim(),
                    description = request.str_description,
                    deadline = request.dte_deadline,
                    userId = if (targetSharedCalendarId == null) userId else null,
                    sharedCalendarId = targetSharedCalendarId,
                ),
            )
        return ApiResponses.ok(goal.toResponse())
    }

    @PatchMapping("/{goalId}")
    fun updateGoal(
        @PathVariable goalId: String,
        @RequestBody request: GoalUpdateRequest,
    ): ApiResponse<GoalResponse> {
        val userId = currentUserService.getCurrentUserId()
        val goal = goalRepository.findById(goalId).orElseThrow { NotFoundException("Goal not found") }

        ensureGoalWriteAccess(goal, userId)

        request.str_title?.let { goal.title = it.trim() }
        request.str_description?.let { goal.description = it }
        request.dte_deadline?.let { goal.deadline = it }
        request.bln_is_completed?.let { goal.isCompleted = it }
        request.ref_shared_calendar_id?.let {
            val targetSharedCalendarId = it.trim().ifBlank { null }
            if (targetSharedCalendarId != null) {
                sharedCalendarRepository.findById(targetSharedCalendarId)
                    .orElseThrow { NotFoundException("Shared calendar not found") }
                goal.userId = null
                goal.sharedCalendarId = targetSharedCalendarId
            }
        }
        return ApiResponses.ok(goalRepository.save(goal).toResponse())
    }

    @DeleteMapping("/{goalId}")
    fun deleteGoal(@PathVariable goalId: String): ApiResponse<Map<String, String>> {
        val userId = currentUserService.getCurrentUserId()
        val goal = goalRepository.findById(goalId).orElseThrow { NotFoundException("Goal not found") }
        ensureGoalWriteAccess(goal, userId)
        goalRepository.delete(goal)
        return ApiResponses.okMessage("Goal deleted")
    }

    private fun ensureGoalWriteAccess(goal: GoalEntity, currentUserId: String) {
        if (goal.userId != null && goal.userId != currentUserId) {
            throw ForbiddenException("You cannot edit this goal")
        }
    }

    private fun GoalEntity.toResponse(): GoalResponse =
        GoalResponse(
            tbl_goal_id = id,
            str_title = title,
            str_description = description,
            dte_deadline = deadline,
            bln_is_completed = isCompleted,
            ref_user_id = userId,
            ref_shared_calendar_id = sharedCalendarId,
            dte_created_at = createdAt,
        )
}
