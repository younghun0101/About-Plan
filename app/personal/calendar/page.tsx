'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { AppShell } from '@/components/app-shell'
import { CalendarView } from '@/components/calendar-view'
import { EventFormDialog } from '@/components/event-form-dialog'
import { useAuth } from '@/contexts/auth-context'
import { useData } from '@/contexts/data-context'
import { Empty } from '@/components/ui/empty'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Event } from '@/lib/types'
import { Calendar } from 'lucide-react'

export default function PersonalCalendarPage() {
  const { user, getOtherUser } = useAuth()
  const { events, goals, categories, deleteEvent, sharedCalendars } = useData()
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null)

  // Filter personal events for current user
  const personalEvents = events.filter(e => e.ref_user_id === user?.id)
  const personalGoals = goals.filter(g => g.ref_user_id === user?.id)
  const userCategories = categories.filter(c => c.ref_user_id === user?.id)
  
  // Get other user's events (only for availability display)
  const otherUser = getOtherUser()
  const otherUserEvents = otherUser 
    ? events.filter(e => e.ref_user_id === otherUser.tbl_user_id)
    : []
  
  // Get shared calendar events
  const sharedEvents = events.filter(e => 
    e.ref_shared_calendar_id && sharedCalendars.some(sc => sc.tbl_shared_calendar_id === e.ref_shared_calendar_id)
  )
  
  // Combine all events visible on personal calendar
  const allVisibleEvents = [...personalEvents, ...sharedEvents]

  const handleDateClick = (date: Date) => {
    setSelectedEvent(null)
    setSelectedDate(date)
    setIsFormOpen(true)
  }

  const handleEventClick = (event: Event) => {
    // Only allow editing personal events
    if (event.ref_user_id === user?.id) {
      setSelectedEvent(event)
      setSelectedDate(undefined)
      setIsFormOpen(true)
    }
  }

  const handleDeleteEvent = () => {
    if (eventToDelete) {
      deleteEvent(eventToDelete.tbl_event_id)
      toast.success('일정이 삭제되었습니다.')
      setEventToDelete(null)
    }
  }

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open)
    if (!open) {
      setSelectedEvent(null)
      setSelectedDate(undefined)
    }
  }

  return (
    <AppShell title="개인 캘린더">
      {personalEvents.length === 0 && personalGoals.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <Empty
            icon={<Calendar className="h-12 w-12 text-muted-foreground" />}
            title="아직 일정이 없어요"
            description="첫 일정을 만들어보세요!"
            action={{
              label: '일정 추가',
              onClick: () => handleDateClick(new Date()),
            }}
          />
        </div>
      ) : null}
      
      <CalendarView
        events={allVisibleEvents}
        goals={personalGoals}
        categories={userCategories}
        onDateClick={handleDateClick}
        onEventClick={handleEventClick}
        showOtherUserEvents={true}
        otherUserEvents={otherUserEvents}
      />
      
      <EventFormDialog
        open={isFormOpen}
        onOpenChange={handleFormClose}
        event={selectedEvent}
        defaultDate={selectedDate}
        isShared={false}
      />
      
      <AlertDialog open={!!eventToDelete} onOpenChange={() => setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>일정 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              {`"${eventToDelete?.str_title}" 일정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  )
}
