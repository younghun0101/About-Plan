'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { AppShell } from '@/components/app-shell'
import { CalendarView } from '@/components/calendar-view'
import { EventFormDialog } from '@/components/event-form-dialog'
import { useAuth } from '@/contexts/auth-context'
import { useData } from '@/contexts/data-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Empty } from '@/components/ui/empty'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Event, SharedCalendar } from '@/lib/types'
import { Users, Plus, MoreVertical, Pencil, Trash2, Calendar, CalendarDays } from 'lucide-react'

export default function SharedCalendarPage() {
  const { user, getOtherUser } = useAuth()
  const { events, goals, sharedCalendars, deleteEvent, createSharedCalendar, updateSharedCalendar, deleteSharedCalendar } = useData()
  
  const [selectedCalendar, setSelectedCalendar] = useState<SharedCalendar | null>(
    sharedCalendars.length > 0 ? sharedCalendars[0] : null
  )
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null)
  
  const [isCalendarFormOpen, setIsCalendarFormOpen] = useState(false)
  const [calendarName, setCalendarName] = useState('')
  const [editingCalendar, setEditingCalendar] = useState<SharedCalendar | null>(null)
  const [calendarToDelete, setCalendarToDelete] = useState<SharedCalendar | null>(null)

  // Update selected calendar if it changes
  if (!selectedCalendar && sharedCalendars.length > 0) {
    setSelectedCalendar(sharedCalendars[0])
  }

  // Get other user for displaying their personal events
  const otherUser = getOtherUser()
  
  // Get events for the selected shared calendar
  const sharedEvents = selectedCalendar 
    ? events.filter(e => e.ref_shared_calendar_id === selectedCalendar.tbl_shared_calendar_id)
    : []
  
  // Get shared goals for the selected calendar
  const sharedGoals = selectedCalendar
    ? goals.filter(g => g.ref_shared_calendar_id === selectedCalendar.tbl_shared_calendar_id)
    : []
  
  // Get both users' personal events for availability display
  const myPersonalEvents = events.filter(e => e.ref_user_id === user?.id)
  const otherPersonalEvents = otherUser
    ? events.filter(e => e.ref_user_id === otherUser.tbl_user_id)
    : []
  const allPersonalEvents = [...myPersonalEvents, ...otherPersonalEvents]

  const handleDateClick = (date: Date) => {
    setSelectedEvent(null)
    setSelectedDate(date)
    setIsFormOpen(true)
  }

  const handleEventClick = (event: Event) => {
    // Allow editing any shared event
    if (event.ref_shared_calendar_id) {
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

  const handleCreateCalendar = () => {
    setEditingCalendar(null)
    setCalendarName('')
    setIsCalendarFormOpen(true)
  }

  const handleEditCalendar = (calendar: SharedCalendar) => {
    setEditingCalendar(calendar)
    setCalendarName(calendar.str_name)
    setIsCalendarFormOpen(true)
  }

  const handleSaveCalendar = () => {
    if (!calendarName.trim()) {
      toast.error('캘린더 이름을 입력해주세요.')
      return
    }

    if (editingCalendar) {
      updateSharedCalendar(editingCalendar.tbl_shared_calendar_id, calendarName)
      toast.success('캘린더 이름이 변경되었습니다.')
    } else {
      const newCalendar = createSharedCalendar(calendarName)
      setSelectedCalendar(newCalendar)
      toast.success('공동 캘린더가 생성되었습니다.')
    }
    
    setIsCalendarFormOpen(false)
  }

  const handleDeleteCalendar = () => {
    if (calendarToDelete) {
      deleteSharedCalendar(calendarToDelete.tbl_shared_calendar_id)
      if (selectedCalendar?.tbl_shared_calendar_id === calendarToDelete.tbl_shared_calendar_id) {
        setSelectedCalendar(sharedCalendars.find(c => c.tbl_shared_calendar_id !== calendarToDelete.tbl_shared_calendar_id) || null)
      }
      toast.success('공동 캘린더가 삭제되었습니다.')
      setCalendarToDelete(null)
    }
  }

  return (
    <AppShell title="공동 캘린더">
      <div className="flex flex-col gap-6">
        {/* Calendar selection */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {sharedCalendars.map((calendar) => {
              const eventCount = events.filter(e => e.ref_shared_calendar_id === calendar.tbl_shared_calendar_id).length
              const isSelected = selectedCalendar?.tbl_shared_calendar_id === calendar.tbl_shared_calendar_id
              
              return (
                <Card
                  key={calendar.tbl_shared_calendar_id}
                  className={`cursor-pointer transition-all shrink-0 ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                      : 'hover:bg-muted/50 hover:border-muted-foreground/30'
                  }`}
                  onClick={() => setSelectedCalendar(calendar)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-md ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <CalendarDays className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate max-w-[120px]">{calendar.str_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {eventCount}개 일정
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            handleEditCalendar(calendar)
                          }}>
                            <Pencil className="mr-2 h-4 w-4" />
                            이름 변경
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              setCalendarToDelete(calendar)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          <Button variant="outline" onClick={handleCreateCalendar} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            새 캘린더
          </Button>
        </div>

        {sharedCalendars.length === 0 ? (
          <Empty
            icon={<Users className="h-12 w-12 text-muted-foreground" />}
            title="공동 캘린더가 없어요"
            description="함께 일정을 관리할 공동 캘린더를 만들어보세요!"
            action={{
              label: '공동 캘린더 만들기',
              onClick: handleCreateCalendar,
            }}
          />
        ) : selectedCalendar ? (
          <CalendarView
            events={sharedEvents}
            goals={sharedGoals}
            onDateClick={handleDateClick}
            onEventClick={handleEventClick}
            showOtherUserEvents={true}
            otherUserEvents={allPersonalEvents}
          />
        ) : null}
      </div>

      <EventFormDialog
        open={isFormOpen}
        onOpenChange={handleFormClose}
        event={selectedEvent}
        defaultDate={selectedDate}
        isShared={true}
        sharedCalendarId={selectedCalendar?.tbl_shared_calendar_id}
      />

      {/* Calendar form dialog */}
      <Dialog open={isCalendarFormOpen} onOpenChange={setIsCalendarFormOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editingCalendar ? '캘린더 이름 변경' : '새 공동 캘린더'}</DialogTitle>
            <DialogDescription>
              공동 캘린더의 이름을 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={calendarName}
              onChange={(e) => setCalendarName(e.target.value)}
              placeholder="캘린더 이름"
              onKeyDown={(e) => e.key === 'Enter' && handleSaveCalendar()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCalendarFormOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSaveCalendar}>
              {editingCalendar ? '변경' : '생성'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete event dialog */}
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

      {/* Delete calendar dialog */}
      <AlertDialog open={!!calendarToDelete} onOpenChange={() => setCalendarToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>공동 캘린더 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              {`"${calendarToDelete?.str_name}" 캘린더를 삭제하시겠습니까? 이 캘린더의 모든 일정과 목표가 함께 삭제됩니다.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCalendar} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  )
}
