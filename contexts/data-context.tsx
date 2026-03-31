'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
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
import { loadData, saveData, generateId } from '@/lib/store'
import { useAuth } from './auth-context'

interface DataContextType {
  // Data
  events: Event[]
  goals: Goal[]
  categories: Category[]
  meetingNotes: MeetingNote[]
  meetingEvents: MeetingEvent[]
  boardPosts: BoardPost[]
  boardItems: BoardItem[]
  sharedCalendars: SharedCalendar[]
  
  // Events CRUD
  createEvent: (data: EventFormData) => Event
  updateEvent: (id: string, data: Partial<EventFormData>) => Event | null
  deleteEvent: (id: string) => boolean
  getEventsByUser: (userId: string) => Event[]
  getSharedEvents: (calendarId: string) => Event[]
  
  // Goals CRUD
  createGoal: (data: GoalFormData) => Goal
  updateGoal: (id: string, data: Partial<GoalFormData & { bln_is_completed: boolean }>) => Goal | null
  deleteGoal: (id: string) => boolean
  getPersonalGoals: () => Goal[]
  getSharedGoals: (calendarId: string) => Goal[]
  
  // Categories CRUD
  createCategory: (data: CategoryFormData) => Category
  updateCategory: (id: string, data: Partial<CategoryFormData>) => Category | null
  deleteCategory: (id: string) => boolean
  getUserCategories: () => Category[]
  
  // Meeting Notes CRUD
  createMeetingNote: (data: MeetingNoteFormData) => MeetingNote
  updateMeetingNote: (id: string, data: Partial<MeetingNoteFormData>) => MeetingNote | null
  deleteMeetingNote: (id: string) => boolean
  linkMeetingToEvent: (meetingId: string, eventId: string) => void
  unlinkMeetingFromEvent: (meetingId: string, eventId: string) => void
  getMeetingEvents: (meetingId: string) => Event[]
  
  // Board Posts CRUD
  createBoardPost: (data: BoardPostFormData) => BoardPost
  updateBoardPost: (id: string, data: Partial<BoardPostFormData>) => BoardPost | null
  deleteBoardPost: (id: string) => boolean
  
  // Board Items CRUD
  createBoardItem: (postId: string, content: string) => BoardItem
  updateBoardItem: (id: string, content: string) => BoardItem | null
  deleteBoardItem: (id: string) => boolean
  getBoardItems: (postId: string) => BoardItem[]
  
  // Shared Calendars
  createSharedCalendar: (name: string) => SharedCalendar
  updateSharedCalendar: (id: string, name: string) => SharedCalendar | null
  deleteSharedCalendar: (id: string) => boolean
  
  // Conflict detection
  checkConflict: (startAt: Date, endAt: Date, excludeEventId?: string) => boolean
  
  // Refresh
  refresh: () => void
}

const DataContext = createContext<DataContextType | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [meetingNotes, setMeetingNotes] = useState<MeetingNote[]>([])
  const [meetingEvents, setMeetingEvents] = useState<MeetingEvent[]>([])
  const [boardPosts, setBoardPosts] = useState<BoardPost[]>([])
  const [boardItems, setBoardItems] = useState<BoardItem[]>([])
  const [sharedCalendars, setSharedCalendars] = useState<SharedCalendar[]>([])

  const refresh = useCallback(() => {
    const data = loadData()
    setEvents(data.events.filter(e => !e.dte_deleted_at))
    setGoals(data.goals)
    setCategories(data.categories)
    setMeetingNotes(data.meetingNotes)
    setMeetingEvents(data.meetingEvents)
    setBoardPosts(data.boardPosts)
    setBoardItems(data.boardItems)
    setSharedCalendars(data.sharedCalendars)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Events CRUD
  const createEvent = useCallback((formData: EventFormData): Event => {
    const data = loadData()
    const newEvent: Event = {
      tbl_event_id: generateId(),
      str_title: formData.str_title,
      dte_start_at: new Date(formData.dte_start_at),
      dte_end_at: new Date(formData.dte_end_at),
      ref_user_id: formData.ref_shared_calendar_id ? null : user?.id || null,
      ref_shared_calendar_id: formData.ref_shared_calendar_id,
      ref_category_id: formData.ref_category_id,
      bln_allow_overlap: formData.bln_allow_overlap,
      opt_source_type: 'manual',
      ref_source_id: null,
      dte_deleted_at: null,
    }
    data.events.push(newEvent)
    saveData(data)
    refresh()
    return newEvent
  }, [user, refresh])

  const updateEvent = useCallback((id: string, formData: Partial<EventFormData>): Event | null => {
    const data = loadData()
    const idx = data.events.findIndex(e => e.tbl_event_id === id)
    if (idx === -1) return null
    
    const event = data.events[idx]
    if (formData.str_title !== undefined) event.str_title = formData.str_title
    if (formData.dte_start_at !== undefined) event.dte_start_at = new Date(formData.dte_start_at)
    if (formData.dte_end_at !== undefined) event.dte_end_at = new Date(formData.dte_end_at)
    if (formData.ref_category_id !== undefined) event.ref_category_id = formData.ref_category_id
    if (formData.bln_allow_overlap !== undefined) event.bln_allow_overlap = formData.bln_allow_overlap
    
    saveData(data)
    refresh()
    return event
  }, [refresh])

  const deleteEvent = useCallback((id: string): boolean => {
    const data = loadData()
    const idx = data.events.findIndex(e => e.tbl_event_id === id)
    if (idx === -1) return false
    
    // Soft delete
    data.events[idx].dte_deleted_at = new Date()
    saveData(data)
    refresh()
    return true
  }, [refresh])

  const getEventsByUser = useCallback((userId: string): Event[] => {
    return events.filter(e => e.ref_user_id === userId && !e.dte_deleted_at)
  }, [events])

  const getSharedEvents = useCallback((calendarId: string): Event[] => {
    return events.filter(e => e.ref_shared_calendar_id === calendarId && !e.dte_deleted_at)
  }, [events])

  // Goals CRUD
  const createGoal = useCallback((formData: GoalFormData): Goal => {
    const data = loadData()
    const newGoal: Goal = {
      tbl_goal_id: generateId(),
      str_title: formData.str_title,
      str_description: formData.str_description || '',
      dte_deadline: new Date(formData.dte_deadline),
      bln_is_completed: false,
      ref_user_id: formData.ref_shared_calendar_id ? null : user?.id || null,
      ref_shared_calendar_id: formData.ref_shared_calendar_id,
      dte_created_at: new Date(),
    }
    data.goals.push(newGoal)
    saveData(data)
    refresh()
    return newGoal
  }, [user, refresh])

  const updateGoal = useCallback((id: string, formData: Partial<GoalFormData & { bln_is_completed: boolean }>): Goal | null => {
    const data = loadData()
    const idx = data.goals.findIndex(g => g.tbl_goal_id === id)
    if (idx === -1) return null
    
    const goal = data.goals[idx]
    if (formData.str_title !== undefined) goal.str_title = formData.str_title
    if (formData.str_description !== undefined) goal.str_description = formData.str_description
    if (formData.dte_deadline !== undefined) goal.dte_deadline = new Date(formData.dte_deadline)
    if (formData.bln_is_completed !== undefined) goal.bln_is_completed = formData.bln_is_completed
    
    saveData(data)
    refresh()
    return goal
  }, [refresh])

  const deleteGoal = useCallback((id: string): boolean => {
    const data = loadData()
    const idx = data.goals.findIndex(g => g.tbl_goal_id === id)
    if (idx === -1) return false
    
    data.goals.splice(idx, 1)
    saveData(data)
    refresh()
    return true
  }, [refresh])

  const getPersonalGoals = useCallback((): Goal[] => {
    return goals.filter(g => g.ref_user_id === user?.id)
  }, [goals, user])

  const getSharedGoals = useCallback((calendarId: string): Goal[] => {
    return goals.filter(g => g.ref_shared_calendar_id === calendarId)
  }, [goals])

  // Categories CRUD
  const createCategory = useCallback((formData: CategoryFormData): Category => {
    const data = loadData()
    const newCategory: Category = {
      tbl_category_id: generateId(),
      str_name: formData.str_name,
      str_color: formData.str_color,
      opt_style: formData.opt_style,
      ref_user_id: user?.id || '',
    }
    data.categories.push(newCategory)
    saveData(data)
    refresh()
    return newCategory
  }, [user, refresh])

  const updateCategory = useCallback((id: string, formData: Partial<CategoryFormData>): Category | null => {
    const data = loadData()
    const idx = data.categories.findIndex(c => c.tbl_category_id === id)
    if (idx === -1) return null
    
    const category = data.categories[idx]
    if (formData.str_name !== undefined) category.str_name = formData.str_name
    if (formData.str_color !== undefined) category.str_color = formData.str_color
    if (formData.opt_style !== undefined) category.opt_style = formData.opt_style
    
    saveData(data)
    refresh()
    return category
  }, [refresh])

  const deleteCategory = useCallback((id: string): boolean => {
    const data = loadData()
    const idx = data.categories.findIndex(c => c.tbl_category_id === id)
    if (idx === -1) return false
    
    data.categories.splice(idx, 1)
    saveData(data)
    refresh()
    return true
  }, [refresh])

  const getUserCategories = useCallback((): Category[] => {
    return categories.filter(c => c.ref_user_id === user?.id)
  }, [categories, user])

  // Meeting Notes CRUD
  const createMeetingNote = useCallback((formData: MeetingNoteFormData): MeetingNote => {
    const data = loadData()
    const now = new Date()
    const newNote: MeetingNote = {
      tbl_meeting_note_id: generateId(),
      str_title: formData.str_title,
      str_type: formData.str_type || 'general',
      str_content: formData.str_content,
      ref_created_by: user?.id || '',
      dte_created_at: now,
      dte_updated_at: now,
    }
    data.meetingNotes.push(newNote)
    saveData(data)
    refresh()
    return newNote
  }, [user, refresh])

  const updateMeetingNote = useCallback((id: string, formData: Partial<MeetingNoteFormData>): MeetingNote | null => {
    const data = loadData()
    const idx = data.meetingNotes.findIndex(n => n.tbl_meeting_note_id === id)
    if (idx === -1) return null
    
    const note = data.meetingNotes[idx]
    if (formData.str_title !== undefined) note.str_title = formData.str_title
    if (formData.str_type !== undefined) note.str_type = formData.str_type
    if (formData.str_content !== undefined) note.str_content = formData.str_content
    note.dte_updated_at = new Date()
    
    saveData(data)
    refresh()
    return note
  }, [refresh])

  const deleteMeetingNote = useCallback((id: string): boolean => {
    const data = loadData()
    const idx = data.meetingNotes.findIndex(n => n.tbl_meeting_note_id === id)
    if (idx === -1) return false
    
    // Also remove linked meeting events
    data.meetingEvents = data.meetingEvents.filter(me => me.ref_meeting_note_id !== id)
    data.meetingNotes.splice(idx, 1)
    saveData(data)
    refresh()
    return true
  }, [refresh])

  const linkMeetingToEvent = useCallback((meetingId: string, eventId: string): void => {
    const data = loadData()
    const exists = data.meetingEvents.some(
      me => me.ref_meeting_note_id === meetingId && me.ref_event_id === eventId
    )
    if (!exists) {
      data.meetingEvents.push({ ref_meeting_note_id: meetingId, ref_event_id: eventId })
      saveData(data)
      refresh()
    }
  }, [refresh])

  const unlinkMeetingFromEvent = useCallback((meetingId: string, eventId: string): void => {
    const data = loadData()
    data.meetingEvents = data.meetingEvents.filter(
      me => !(me.ref_meeting_note_id === meetingId && me.ref_event_id === eventId)
    )
    saveData(data)
    refresh()
  }, [refresh])

  const getMeetingEvents = useCallback((meetingId: string): Event[] => {
    const eventIds = meetingEvents
      .filter(me => me.ref_meeting_note_id === meetingId)
      .map(me => me.ref_event_id)
    return events.filter(e => eventIds.includes(e.tbl_event_id))
  }, [meetingEvents, events])

  // Board Posts CRUD
  const createBoardPost = useCallback((formData: BoardPostFormData): BoardPost => {
    const data = loadData()
    const now = new Date()
    const newPost: BoardPost = {
      tbl_board_post_id: generateId(),
      str_title: formData.str_title,
      str_content: formData.str_content,
      ref_created_by: user?.id || '',
      dte_created_at: now,
      dte_updated_at: now,
    }
    data.boardPosts.push(newPost)
    saveData(data)
    refresh()
    return newPost
  }, [user, refresh])

  const updateBoardPost = useCallback((id: string, formData: Partial<BoardPostFormData>): BoardPost | null => {
    const data = loadData()
    const idx = data.boardPosts.findIndex(p => p.tbl_board_post_id === id)
    if (idx === -1) return null
    
    const post = data.boardPosts[idx]
    if (formData.str_title !== undefined) post.str_title = formData.str_title
    if (formData.str_content !== undefined) post.str_content = formData.str_content
    post.dte_updated_at = new Date()
    
    saveData(data)
    refresh()
    return post
  }, [refresh])

  const deleteBoardPost = useCallback((id: string): boolean => {
    const data = loadData()
    const idx = data.boardPosts.findIndex(p => p.tbl_board_post_id === id)
    if (idx === -1) return false
    
    // Also remove related items
    data.boardItems = data.boardItems.filter(i => i.ref_board_post_id !== id)
    data.boardPosts.splice(idx, 1)
    saveData(data)
    refresh()
    return true
  }, [refresh])

  // Board Items CRUD
  const createBoardItem = useCallback((postId: string, content: string): BoardItem => {
    const data = loadData()
    const newItem: BoardItem = {
      tbl_board_item_id: generateId(),
      str_content: content,
      ref_board_post_id: postId,
      ref_created_by: user?.id || '',
      dte_created_at: new Date(),
    }
    data.boardItems.push(newItem)
    saveData(data)
    refresh()
    return newItem
  }, [user, refresh])

  const updateBoardItem = useCallback((id: string, content: string): BoardItem | null => {
    const data = loadData()
    const idx = data.boardItems.findIndex(i => i.tbl_board_item_id === id)
    if (idx === -1) return null
    
    data.boardItems[idx].str_content = content
    saveData(data)
    refresh()
    return data.boardItems[idx]
  }, [refresh])

  const deleteBoardItem = useCallback((id: string): boolean => {
    const data = loadData()
    const idx = data.boardItems.findIndex(i => i.tbl_board_item_id === id)
    if (idx === -1) return false
    
    data.boardItems.splice(idx, 1)
    saveData(data)
    refresh()
    return true
  }, [refresh])

  const getBoardItems = useCallback((postId: string): BoardItem[] => {
    return boardItems.filter(i => i.ref_board_post_id === postId)
  }, [boardItems])

  // Shared Calendars
  const createSharedCalendar = useCallback((name: string): SharedCalendar => {
    const data = loadData()
    const newCalendar: SharedCalendar = {
      tbl_shared_calendar_id: generateId(),
      str_name: name,
      ref_created_by: user?.id || '',
      dte_created_at: new Date(),
    }
    data.sharedCalendars.push(newCalendar)
    saveData(data)
    refresh()
    return newCalendar
  }, [user, refresh])

  const updateSharedCalendar = useCallback((id: string, name: string): SharedCalendar | null => {
    const data = loadData()
    const idx = data.sharedCalendars.findIndex(c => c.tbl_shared_calendar_id === id)
    if (idx === -1) return null
    
    data.sharedCalendars[idx].str_name = name
    saveData(data)
    refresh()
    return data.sharedCalendars[idx]
  }, [refresh])

  const deleteSharedCalendar = useCallback((id: string): boolean => {
    const data = loadData()
    const idx = data.sharedCalendars.findIndex(c => c.tbl_shared_calendar_id === id)
    if (idx === -1) return false
    
    // Also remove related events and goals
    data.events = data.events.filter(e => e.ref_shared_calendar_id !== id)
    data.goals = data.goals.filter(g => g.ref_shared_calendar_id !== id)
    data.sharedCalendars.splice(idx, 1)
    saveData(data)
    refresh()
    return true
  }, [refresh])

  // Conflict detection
  const checkConflict = useCallback((startAt: Date, endAt: Date, excludeEventId?: string): boolean => {
    const data = loadData()
    const activeEvents = data.events.filter(e => !e.dte_deleted_at && e.tbl_event_id !== excludeEventId)
    
    for (const event of activeEvents) {
      const eventStart = new Date(event.dte_start_at)
      const eventEnd = new Date(event.dte_end_at)
      
      // Check overlap
      if (startAt < eventEnd && endAt > eventStart) {
        if (!event.bln_allow_overlap) {
          return true
        }
      }
    }
    
    return false
  }, [])

  return (
    <DataContext.Provider
      value={{
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
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
