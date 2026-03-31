// ABOUT Plan - Client-side data store with localStorage persistence
import type {
  User,
  SharedCalendar,
  Event,
  Goal,
  Category,
  MeetingNote,
  MeetingEvent,
  BoardPost,
  BoardItem,
  AuthUser,
} from './types'

const STORAGE_KEY = 'about_plan_data'

// Initial seed data - 2 fixed users
const SEED_USERS: User[] = [
  {
    tbl_user_id: 'user-a-001',
    str_name: 'User A',
    str_email: 'usera@aboutplan.com',
    str_password_hash: 'password123', // In real app, this would be hashed
  },
  {
    tbl_user_id: 'user-b-002',
    str_name: 'User B',
    str_email: 'userb@aboutplan.com',
    str_password_hash: 'password123',
  },
]

export interface AppData {
  users: User[]
  sharedCalendars: SharedCalendar[]
  events: Event[]
  goals: Goal[]
  categories: Category[]
  meetingNotes: MeetingNote[]
  meetingEvents: MeetingEvent[]
  boardPosts: BoardPost[]
  boardItems: BoardItem[]
  currentUser: AuthUser | null
}

const initialData: AppData = {
  users: SEED_USERS,
  sharedCalendars: [
    {
      tbl_shared_calendar_id: 'shared-cal-001',
      str_name: '공동 캘린더',
      ref_created_by: 'user-a-001',
      dte_created_at: new Date(),
    },
  ],
  events: [],
  goals: [],
  categories: [],
  meetingNotes: [],
  meetingEvents: [],
  boardPosts: [],
  boardItems: [],
  currentUser: null,
}

// Helper to serialize dates
function serialize(data: AppData): string {
  return JSON.stringify(data, (key, value) => {
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() }
    }
    return value
  })
}

// Helper to deserialize dates
function deserialize(json: string): AppData {
  return JSON.parse(json, (key, value) => {
    if (value && typeof value === 'object' && value.__type === 'Date') {
      return new Date(value.value)
    }
    return value
  })
}

// Load data from localStorage
export function loadData(): AppData {
  if (typeof window === 'undefined') return initialData
  
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    saveData(initialData)
    return initialData
  }
  
  try {
    const data = deserialize(stored)
    // Ensure seed users always exist
    const existingUserIds = data.users.map(u => u.tbl_user_id)
    for (const seedUser of SEED_USERS) {
      if (!existingUserIds.includes(seedUser.tbl_user_id)) {
        data.users.push(seedUser)
      }
    }
    return data
  } catch {
    return initialData
  }
}

// Save data to localStorage
export function saveData(data: AppData): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, serialize(data))
}

// Generate UUID
export function generateId(): string {
  return crypto.randomUUID()
}

// Clear all data (for testing)
export function clearData(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
