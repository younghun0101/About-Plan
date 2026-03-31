// ABOUT Plan - Type Definitions based on Mermaid ERD

export interface User {
  tbl_user_id: string
  str_name: string
  str_email: string
  str_password_hash: string
}

export interface SharedCalendar {
  tbl_shared_calendar_id: string
  str_name: string
  ref_created_by: string
  dte_created_at: Date
}

export type SourceType = 'manual' | 'meeting' | 'goal'
export type CategoryStyle = 'dot' | 'highlight'

export interface Event {
  tbl_event_id: string
  str_title: string
  dte_start_at: Date
  dte_end_at: Date
  ref_user_id: string | null
  ref_shared_calendar_id: string | null
  ref_category_id: string | null
  bln_allow_overlap: boolean
  opt_source_type: SourceType
  ref_source_id: string | null
  dte_deleted_at: Date | null
}

export interface Goal {
  tbl_goal_id: string
  str_title: string
  str_description: string
  dte_deadline: Date
  bln_is_completed: boolean
  ref_user_id: string | null
  ref_shared_calendar_id: string | null
  dte_created_at: Date
}

export interface Category {
  tbl_category_id: string
  str_name: string
  str_color: string
  opt_style: CategoryStyle
  ref_user_id: string
}

export type MeetingType = 
  | 'requirements'      // 앱 요구사항 미팅
  | 'technical'         // Technische Meeting
  | 'testing'           // 테스팅 미팅
  | 'design'            // 디자인 미팅
  | 'deployment'        // 배포 미팅
  | 'post_deployment'   // 배포 후 테스팅 미팅
  | 'general'           // 일반 미팅

export interface MeetingNote {
  tbl_meeting_note_id: string
  str_title: string
  str_type: MeetingType
  str_content: string
  ref_created_by: string
  dte_created_at: Date
  dte_updated_at: Date
}

export interface MeetingEvent {
  ref_meeting_note_id: string
  ref_event_id: string
}

export interface BoardPost {
  tbl_board_post_id: string
  str_title: string
  str_content: string
  ref_created_by: string
  dte_created_at: Date
  dte_updated_at: Date
}

export interface BoardItem {
  tbl_board_item_id: string
  str_content: string
  ref_board_post_id: string
  ref_created_by: string
  dte_created_at: Date
}

// Auth context type
export interface AuthUser {
  id: string
  name: string
  email: string
}

// Form types
export interface EventFormData {
  str_title: string
  dte_start_at: string
  dte_end_at: string
  ref_category_id: string | null
  bln_allow_overlap: boolean
  ref_shared_calendar_id: string | null
}

export interface GoalFormData {
  str_title: string
  str_description: string
  dte_deadline: string
  ref_shared_calendar_id: string | null
}

export interface MeetingNoteFormData {
  str_title: string
  str_type: MeetingType
  str_content: string
}

export interface BoardPostFormData {
  str_title: string
  str_content: string
}

export interface CategoryFormData {
  str_name: string
  str_color: string
  opt_style: CategoryStyle
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
