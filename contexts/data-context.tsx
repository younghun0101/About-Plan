'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type {
  Event,
  Goal,
  Category,
  MeetingNote,
  MeetingEvent,
  BoardPost,
  BoardItem,
  SharedCalendar,
  EventFormData,
  GoalFormData,
  MeetingNoteFormData,
  BoardPostFormData,
  CategoryFormData,
} from '@/lib/types'
import { apiRequest } from '@/lib/api'
import { useAuth } from './auth-context'

interface DataContextType {
  events: Event[]
  goals: Goal[]
  categories: Category[]
  meetingNotes: MeetingNote[]
  meetingEvents: MeetingEvent[]
  boardPosts: BoardPost[]
  boardItems: BoardItem[]
  sharedCalendars: SharedCalendar[]

  createEvent: (data: EventFormData) => Promise<Event>
  updateEvent: (id: string, data: Partial<EventFormData>) => Promise<Event | null>
  deleteEvent: (id: string) => Promise<boolean>
  getEventsByUser: (userId: string) => Event[]
  getSharedEvents: (calendarId: string) => Event[]

  createGoal: (data: GoalFormData) => Promise<Goal>
  updateGoal: (id: string, data: Partial<GoalFormData & { bln_is_completed: boolean }>) => Promise<Goal | null>
  deleteGoal: (id: string) => Promise<boolean>
  getPersonalGoals: () => Goal[]
  getSharedGoals: (calendarId: string) => Goal[]

  createCategory: (data: CategoryFormData) => Promise<Category>
  updateCategory: (id: string, data: Partial<CategoryFormData>) => Promise<Category | null>
  deleteCategory: (id: string) => Promise<boolean>
  getUserCategories: () => Category[]

  createMeetingNote: (data: MeetingNoteFormData) => Promise<MeetingNote>
  updateMeetingNote: (id: string, data: Partial<MeetingNoteFormData>) => Promise<MeetingNote | null>
  deleteMeetingNote: (id: string) => Promise<boolean>
  linkMeetingToEvent: (meetingId: string, eventId: string) => Promise<void>
  unlinkMeetingFromEvent: (meetingId: string, eventId: string) => Promise<void>
  getMeetingEvents: (meetingId: string) => Event[]

  createBoardPost: (data: BoardPostFormData) => Promise<BoardPost>
  updateBoardPost: (id: string, data: Partial<BoardPostFormData>) => Promise<BoardPost | null>
  deleteBoardPost: (id: string) => Promise<boolean>

  createBoardItem: (postId: string, content: string) => Promise<BoardItem>
  updateBoardItem: (id: string, content: string) => Promise<BoardItem | null>
  deleteBoardItem: (id: string) => Promise<boolean>
  getBoardItems: (postId: string) => BoardItem[]

  createSharedCalendar: (name: string) => Promise<SharedCalendar>
  updateSharedCalendar: (id: string, name: string) => Promise<SharedCalendar | null>
  deleteSharedCalendar: (id: string) => Promise<boolean>

  checkConflict: (startAt: Date, endAt: Date, excludeEventId?: string) => boolean
  refresh: () => Promise<void>
}

const DataContext = createContext<DataContextType | null>(null)

function toDate(value: string | Date | null | undefined): Date {
  return value instanceof Date ? value : new Date(value || new Date().toISOString())
}

function toNullable(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function toIso(value: string): string {
  return new Date(value).toISOString()
}

function mapEvent(raw: {
  tbl_event_id: string
  str_title: string
  dte_start_at: string
  dte_end_at: string
  ref_user_id: string | null
  ref_shared_calendar_id: string | null
  ref_category_id: string | null
  bln_allow_overlap: boolean
  opt_source_type: 'manual' | 'meeting' | 'goal'
  ref_source_id: string | null
  dte_deleted_at: string | null
}): Event {
  return {
    ...raw,
    dte_start_at: toDate(raw.dte_start_at),
    dte_end_at: toDate(raw.dte_end_at),
    dte_deleted_at: raw.dte_deleted_at ? toDate(raw.dte_deleted_at) : null,
  }
}

function mapGoal(raw: {
  tbl_goal_id: string
  str_title: string
  str_description: string
  dte_deadline: string
  bln_is_completed: boolean
  ref_user_id: string | null
  ref_shared_calendar_id: string | null
  dte_created_at: string
}): Goal {
  return {
    ...raw,
    dte_deadline: toDate(raw.dte_deadline),
    dte_created_at: toDate(raw.dte_created_at),
  }
}

function mapCategory(raw: {
  tbl_category_id: string
  str_name: string
  str_color: string
  opt_style: 'dot' | 'highlight'
  ref_user_id: string
}): Category {
  return raw
}

function mapMeetingNote(raw: {
  tbl_meeting_note_id: string
  str_title: string
  str_type: MeetingNote['str_type']
  str_content: string
  ref_created_by: string
  dte_created_at: string
  dte_updated_at: string
}): MeetingNote {
  return {
    ...raw,
    dte_created_at: toDate(raw.dte_created_at),
    dte_updated_at: toDate(raw.dte_updated_at),
  }
}

function mapBoardPost(raw: {
  tbl_board_post_id: string
  str_title: string
  str_content: string
  ref_created_by: string
  dte_created_at: string
  dte_updated_at: string
}): BoardPost {
  return {
    ...raw,
    dte_created_at: toDate(raw.dte_created_at),
    dte_updated_at: toDate(raw.dte_updated_at),
  }
}

function mapBoardItem(raw: {
  tbl_board_item_id: string
  str_content: string
  ref_board_post_id: string
  ref_created_by: string
  dte_created_at: string
}): BoardItem {
  return {
    ...raw,
    dte_created_at: toDate(raw.dte_created_at),
  }
}

function mapSharedCalendar(raw: {
  tbl_shared_calendar_id: string
  str_name: string
  ref_created_by: string
  dte_created_at: string
}): SharedCalendar {
  return {
    ...raw,
    dte_created_at: toDate(raw.dte_created_at),
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [meetingNotes, setMeetingNotes] = useState<MeetingNote[]>([])
  const [meetingEvents, setMeetingEvents] = useState<MeetingEvent[]>([])
  const [boardPosts, setBoardPosts] = useState<BoardPost[]>([])
  const [boardItems, setBoardItems] = useState<BoardItem[]>([])
  const [sharedCalendars, setSharedCalendars] = useState<SharedCalendar[]>([])

  const clearAll = useCallback(() => {
    setEvents([])
    setGoals([])
    setCategories([])
    setMeetingNotes([])
    setMeetingEvents([])
    setBoardPosts([])
    setBoardItems([])
    setSharedCalendars([])
  }, [])

  const refresh = useCallback(async () => {
    if (!user) {
      clearAll()
      return
    }

    try {
      const [
        rawEvents,
        rawGoals,
        rawCategories,
        rawMeetingNotes,
        rawBoardPosts,
        rawSharedCalendars,
      ] = await Promise.all([
        apiRequest<Array<Parameters<typeof mapEvent>[0]>>('/api/events?scope=all'),
        apiRequest<Array<Parameters<typeof mapGoal>[0]>>('/api/goals?scope=all'),
        apiRequest<Array<Parameters<typeof mapCategory>[0]>>('/api/categories'),
        apiRequest<Array<Parameters<typeof mapMeetingNote>[0]>>('/api/meeting-notes'),
        apiRequest<Array<Parameters<typeof mapBoardPost>[0]>>('/api/board-posts'),
        apiRequest<Array<Parameters<typeof mapSharedCalendar>[0]>>('/api/shared-calendars'),
      ])

      const [meetingEventGroups, boardItemGroups] = await Promise.all([
        Promise.all(
          rawMeetingNotes.map(async (note) => {
            const linked = await apiRequest<Array<{ ref_meeting_note_id: string; ref_event_id: string }>>(
              `/api/meeting-notes/${note.tbl_meeting_note_id}/events`,
            )
            return linked.map((item) => ({
              ref_meeting_note_id: item.ref_meeting_note_id,
              ref_event_id: item.ref_event_id,
            }))
          }),
        ),
        Promise.all(
          rawBoardPosts.map(async (post) => {
            const items = await apiRequest<Array<Parameters<typeof mapBoardItem>[0]>>(
              `/api/board-posts/${post.tbl_board_post_id}/items`,
            )
            return items.map(mapBoardItem)
          }),
        ),
      ])

      setEvents(rawEvents.map(mapEvent).filter((event) => !event.dte_deleted_at))
      setGoals(rawGoals.map(mapGoal))
      setCategories(rawCategories.map(mapCategory))
      setMeetingNotes(rawMeetingNotes.map(mapMeetingNote))
      setMeetingEvents(meetingEventGroups.flat())
      setBoardPosts(rawBoardPosts.map(mapBoardPost))
      setBoardItems(boardItemGroups.flat())
      setSharedCalendars(rawSharedCalendars.map(mapSharedCalendar))
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (message.toLowerCase().includes('unauthorized') || message.includes('401')) {
        logout()
      }
      throw error
    }
  }, [user, logout, clearAll])

  useEffect(() => {
    void refresh().catch(() => undefined)
  }, [refresh])

  const createEvent = useCallback(async (formData: EventFormData): Promise<Event> => {
    const created = await apiRequest<Parameters<typeof mapEvent>[0]>('/api/events', {
      method: 'POST',
      body: JSON.stringify({
        str_title: formData.str_title,
        dte_start_at: toIso(formData.dte_start_at),
        dte_end_at: toIso(formData.dte_end_at),
        ref_category_id: toNullable(formData.ref_category_id),
        bln_allow_overlap: formData.bln_allow_overlap,
        ref_shared_calendar_id: toNullable(formData.ref_shared_calendar_id),
      }),
    })
    const mapped = mapEvent(created)
    await refresh()
    return mapped
  }, [refresh])

  const updateEvent = useCallback(async (id: string, formData: Partial<EventFormData>): Promise<Event | null> => {
    const payload: Record<string, unknown> = {}

    if (formData.str_title !== undefined) payload.str_title = formData.str_title
    if (formData.dte_start_at !== undefined) payload.dte_start_at = toIso(formData.dte_start_at)
    if (formData.dte_end_at !== undefined) payload.dte_end_at = toIso(formData.dte_end_at)
    if (formData.ref_category_id !== undefined) payload.ref_category_id = toNullable(formData.ref_category_id)
    if (formData.bln_allow_overlap !== undefined) payload.bln_allow_overlap = formData.bln_allow_overlap
    if (formData.ref_shared_calendar_id !== undefined) {
      payload.ref_shared_calendar_id = toNullable(formData.ref_shared_calendar_id)
    }

    if (Object.keys(payload).length === 0) return null

    const updated = await apiRequest<Parameters<typeof mapEvent>[0]>(`/api/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    const mapped = mapEvent(updated)
    await refresh()
    return mapped
  }, [refresh])

  const deleteEvent = useCallback(async (id: string): Promise<boolean> => {
    await apiRequest<{ message: string }>(`/api/events/${id}`, { method: 'DELETE' })
    await refresh()
    return true
  }, [refresh])

  const getEventsByUser = useCallback((userId: string): Event[] => {
    return events.filter((event) => event.ref_user_id === userId && !event.dte_deleted_at)
  }, [events])

  const getSharedEvents = useCallback((calendarId: string): Event[] => {
    return events.filter((event) => event.ref_shared_calendar_id === calendarId && !event.dte_deleted_at)
  }, [events])

  const createGoal = useCallback(async (formData: GoalFormData): Promise<Goal> => {
    const created = await apiRequest<Parameters<typeof mapGoal>[0]>('/api/goals', {
      method: 'POST',
      body: JSON.stringify({
        str_title: formData.str_title,
        str_description: formData.str_description || '',
        dte_deadline: toIso(formData.dte_deadline),
        ref_shared_calendar_id: toNullable(formData.ref_shared_calendar_id),
      }),
    })
    const mapped = mapGoal(created)
    await refresh()
    return mapped
  }, [refresh])

  const updateGoal = useCallback(async (
    id: string,
    formData: Partial<GoalFormData & { bln_is_completed: boolean }>,
  ): Promise<Goal | null> => {
    const payload: Record<string, unknown> = {}

    if (formData.str_title !== undefined) payload.str_title = formData.str_title
    if (formData.str_description !== undefined) payload.str_description = formData.str_description
    if (formData.dte_deadline !== undefined) payload.dte_deadline = toIso(formData.dte_deadline)
    if (formData.bln_is_completed !== undefined) payload.bln_is_completed = formData.bln_is_completed
    if (formData.ref_shared_calendar_id !== undefined) {
      payload.ref_shared_calendar_id = toNullable(formData.ref_shared_calendar_id)
    }

    if (Object.keys(payload).length === 0) return null

    const updated = await apiRequest<Parameters<typeof mapGoal>[0]>(`/api/goals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    const mapped = mapGoal(updated)
    await refresh()
    return mapped
  }, [refresh])

  const deleteGoal = useCallback(async (id: string): Promise<boolean> => {
    await apiRequest<{ message: string }>(`/api/goals/${id}`, { method: 'DELETE' })
    await refresh()
    return true
  }, [refresh])

  const getPersonalGoals = useCallback((): Goal[] => {
    return goals.filter((goal) => goal.ref_user_id === user?.id)
  }, [goals, user])

  const getSharedGoals = useCallback((calendarId: string): Goal[] => {
    return goals.filter((goal) => goal.ref_shared_calendar_id === calendarId)
  }, [goals])

  const createCategory = useCallback(async (formData: CategoryFormData): Promise<Category> => {
    const created = await apiRequest<Parameters<typeof mapCategory>[0]>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(formData),
    })
    const mapped = mapCategory(created)
    await refresh()
    return mapped
  }, [refresh])

  const updateCategory = useCallback(async (id: string, formData: Partial<CategoryFormData>): Promise<Category | null> => {
    if (Object.keys(formData).length === 0) return null

    const updated = await apiRequest<Parameters<typeof mapCategory>[0]>(`/api/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(formData),
    })
    const mapped = mapCategory(updated)
    await refresh()
    return mapped
  }, [refresh])

  const deleteCategory = useCallback(async (id: string): Promise<boolean> => {
    await apiRequest<{ message: string }>(`/api/categories/${id}`, { method: 'DELETE' })
    await refresh()
    return true
  }, [refresh])

  const getUserCategories = useCallback((): Category[] => {
    return categories.filter((category) => category.ref_user_id === user?.id)
  }, [categories, user])

  const createMeetingNote = useCallback(async (formData: MeetingNoteFormData): Promise<MeetingNote> => {
    const created = await apiRequest<Parameters<typeof mapMeetingNote>[0]>('/api/meeting-notes', {
      method: 'POST',
      body: JSON.stringify(formData),
    })
    const mapped = mapMeetingNote(created)
    await refresh()
    return mapped
  }, [refresh])

  const updateMeetingNote = useCallback(async (
    id: string,
    formData: Partial<MeetingNoteFormData>,
  ): Promise<MeetingNote | null> => {
    if (Object.keys(formData).length === 0) return null

    const updated = await apiRequest<Parameters<typeof mapMeetingNote>[0]>(`/api/meeting-notes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(formData),
    })
    const mapped = mapMeetingNote(updated)
    await refresh()
    return mapped
  }, [refresh])

  const deleteMeetingNote = useCallback(async (id: string): Promise<boolean> => {
    await apiRequest<{ message: string }>(`/api/meeting-notes/${id}`, { method: 'DELETE' })
    await refresh()
    return true
  }, [refresh])

  const linkMeetingToEvent = useCallback(async (meetingId: string, eventId: string): Promise<void> => {
    await apiRequest<{ message: string }>(`/api/meeting-notes/${meetingId}/events/${eventId}`, {
      method: 'POST',
    })
    await refresh()
  }, [refresh])

  const unlinkMeetingFromEvent = useCallback(async (meetingId: string, eventId: string): Promise<void> => {
    await apiRequest<{ message: string }>(`/api/meeting-notes/${meetingId}/events/${eventId}`, {
      method: 'DELETE',
    })
    await refresh()
  }, [refresh])

  const getMeetingEvents = useCallback((meetingId: string): Event[] => {
    const eventIds = meetingEvents
      .filter((link) => link.ref_meeting_note_id === meetingId)
      .map((link) => link.ref_event_id)

    return events.filter((event) => eventIds.includes(event.tbl_event_id))
  }, [meetingEvents, events])

  const createBoardPost = useCallback(async (formData: BoardPostFormData): Promise<BoardPost> => {
    const created = await apiRequest<Parameters<typeof mapBoardPost>[0]>('/api/board-posts', {
      method: 'POST',
      body: JSON.stringify(formData),
    })
    const mapped = mapBoardPost(created)
    await refresh()
    return mapped
  }, [refresh])

  const updateBoardPost = useCallback(async (
    id: string,
    formData: Partial<BoardPostFormData>,
  ): Promise<BoardPost | null> => {
    if (Object.keys(formData).length === 0) return null

    const updated = await apiRequest<Parameters<typeof mapBoardPost>[0]>(`/api/board-posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(formData),
    })
    const mapped = mapBoardPost(updated)
    await refresh()
    return mapped
  }, [refresh])

  const deleteBoardPost = useCallback(async (id: string): Promise<boolean> => {
    await apiRequest<{ message: string }>(`/api/board-posts/${id}`, { method: 'DELETE' })
    await refresh()
    return true
  }, [refresh])

  const createBoardItem = useCallback(async (postId: string, content: string): Promise<BoardItem> => {
    const created = await apiRequest<Parameters<typeof mapBoardItem>[0]>(`/api/board-posts/${postId}/items`, {
      method: 'POST',
      body: JSON.stringify({ str_content: content }),
    })
    const mapped = mapBoardItem(created)
    await refresh()
    return mapped
  }, [refresh])

  const updateBoardItem = useCallback(async (id: string, content: string): Promise<BoardItem | null> => {
    const updated = await apiRequest<Parameters<typeof mapBoardItem>[0]>(`/api/board-items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ str_content: content }),
    })
    const mapped = mapBoardItem(updated)
    await refresh()
    return mapped
  }, [refresh])

  const deleteBoardItem = useCallback(async (id: string): Promise<boolean> => {
    await apiRequest<{ message: string }>(`/api/board-items/${id}`, { method: 'DELETE' })
    await refresh()
    return true
  }, [refresh])

  const getBoardItems = useCallback((postId: string): BoardItem[] => {
    return boardItems.filter((item) => item.ref_board_post_id === postId)
  }, [boardItems])

  const createSharedCalendar = useCallback(async (name: string): Promise<SharedCalendar> => {
    const created = await apiRequest<Parameters<typeof mapSharedCalendar>[0]>('/api/shared-calendars', {
      method: 'POST',
      body: JSON.stringify({ str_name: name }),
    })
    const mapped = mapSharedCalendar(created)
    await refresh()
    return mapped
  }, [refresh])

  const updateSharedCalendar = useCallback(async (id: string, name: string): Promise<SharedCalendar | null> => {
    const updated = await apiRequest<Parameters<typeof mapSharedCalendar>[0]>(`/api/shared-calendars/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ str_name: name }),
    })
    const mapped = mapSharedCalendar(updated)
    await refresh()
    return mapped
  }, [refresh])

  const deleteSharedCalendar = useCallback(async (id: string): Promise<boolean> => {
    await apiRequest<{ message: string }>(`/api/shared-calendars/${id}`, { method: 'DELETE' })
    await refresh()
    return true
  }, [refresh])

  const checkConflict = useCallback((startAt: Date, endAt: Date, excludeEventId?: string): boolean => {
    const activeEvents = events.filter((event) => !event.dte_deleted_at && event.tbl_event_id !== excludeEventId)

    for (const event of activeEvents) {
      const eventStart = new Date(event.dte_start_at)
      const eventEnd = new Date(event.dte_end_at)

      if (startAt < eventEnd && endAt > eventStart && !event.bln_allow_overlap) {
        return true
      }
    }

    return false
  }, [events])

  const value = useMemo<DataContextType>(() => ({
    events,
    goals,
    categories,
    meetingNotes,
    meetingEvents,
    boardPosts,
    boardItems,
    sharedCalendars,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventsByUser,
    getSharedEvents,
    createGoal,
    updateGoal,
    deleteGoal,
    getPersonalGoals,
    getSharedGoals,
    createCategory,
    updateCategory,
    deleteCategory,
    getUserCategories,
    createMeetingNote,
    updateMeetingNote,
    deleteMeetingNote,
    linkMeetingToEvent,
    unlinkMeetingFromEvent,
    getMeetingEvents,
    createBoardPost,
    updateBoardPost,
    deleteBoardPost,
    createBoardItem,
    updateBoardItem,
    deleteBoardItem,
    getBoardItems,
    createSharedCalendar,
    updateSharedCalendar,
    deleteSharedCalendar,
    checkConflict,
    refresh,
  }), [
    events,
    goals,
    categories,
    meetingNotes,
    meetingEvents,
    boardPosts,
    boardItems,
    sharedCalendars,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventsByUser,
    getSharedEvents,
    createGoal,
    updateGoal,
    deleteGoal,
    getPersonalGoals,
    getSharedGoals,
    createCategory,
    updateCategory,
    deleteCategory,
    getUserCategories,
    createMeetingNote,
    updateMeetingNote,
    deleteMeetingNote,
    linkMeetingToEvent,
    unlinkMeetingFromEvent,
    getMeetingEvents,
    createBoardPost,
    updateBoardPost,
    deleteBoardPost,
    createBoardItem,
    updateBoardItem,
    deleteBoardItem,
    getBoardItems,
    createSharedCalendar,
    updateSharedCalendar,
    deleteSharedCalendar,
    checkConflict,
    refresh,
  ])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
