'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'sonner'
import { AppShell } from '@/components/app-shell'
import { useData } from '@/contexts/data-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Empty } from '@/components/ui/empty'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileText, Plus, Pencil, Trash2, CalendarPlus, Link2 } from 'lucide-react'
import type { MeetingNote, MeetingNoteFormData, Event } from '@/lib/types'
import { MiniCalendarWidget } from '@/components/mini-calendar-widget'

export default function MeetingPage() {
  const { meetingNotes, events, sharedCalendars, createMeetingNote, updateMeetingNote, deleteMeetingNote, createEvent, linkMeetingToEvent, getMeetingEvents } = useData()
  
  const [selectedNote, setSelectedNote] = useState<MeetingNote | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<MeetingNote | null>(null)
  const [isEventFormOpen, setIsEventFormOpen] = useState(false)
  const [formData, setFormData] = useState<MeetingNoteFormData>({
    str_title: '',
    str_content: '',
  })
  const [eventFormData, setEventFormData] = useState({
    str_title: '',
    dte_start_at: '',
    dte_end_at: '',
    ref_shared_calendar_id: sharedCalendars[0]?.tbl_shared_calendar_id || '',
  })

  const handleOpenForm = (note?: MeetingNote) => {
    if (note) {
      setSelectedNote(note)
      setFormData({
        str_title: note.str_title,
        str_content: note.str_content,
      })
    } else {
      setSelectedNote(null)
      setFormData({
        str_title: '',
        str_content: '',
      })
    }
    setIsFormOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.str_title.trim()) {
      toast.error('미팅 노트 제목을 입력해주세요.')
      return
    }

    if (selectedNote) {
      updateMeetingNote(selectedNote.tbl_meeting_note_id, formData)
      toast.success('미팅 노트가 수정되었습니다.')
    } else {
      createMeetingNote(formData)
      toast.success('미팅 노트가 생성되었습니다.')
    }
    
    setIsFormOpen(false)
  }

  const handleDelete = () => {
    if (noteToDelete) {
      deleteMeetingNote(noteToDelete.tbl_meeting_note_id)
      toast.success('미팅 노트가 삭제되었습니다.')
      setNoteToDelete(null)
    }
  }

  const handleOpenEventForm = (note: MeetingNote) => {
    setSelectedNote(note)
    const now = new Date()
    const endTime = new Date(now.getTime() + 60 * 60 * 1000)
    setEventFormData({
      str_title: `미팅: ${note.str_title}`,
      dte_start_at: format(now, "yyyy-MM-dd'T'HH:mm"),
      dte_end_at: format(endTime, "yyyy-MM-dd'T'HH:mm"),
      ref_shared_calendar_id: sharedCalendars[0]?.tbl_shared_calendar_id || '',
    })
    setIsEventFormOpen(true)
  }

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!eventFormData.str_title.trim()) {
      toast.error('일정 제목을 입력해주세요.')
      return
    }
    
    if (!eventFormData.dte_start_at || !eventFormData.dte_end_at) {
      toast.error('시작 및 종료 시간을 입력해주세요.')
      return
    }

    const newEvent = createEvent({
      str_title: eventFormData.str_title,
      dte_start_at: eventFormData.dte_start_at,
      dte_end_at: eventFormData.dte_end_at,
      ref_category_id: null,
      bln_allow_overlap: false,
      ref_shared_calendar_id: eventFormData.ref_shared_calendar_id || null,
    })

    if (selectedNote) {
      linkMeetingToEvent(selectedNote.tbl_meeting_note_id, newEvent.tbl_event_id)
    }

    toast.success('캘린더에 일정이 추가되었습니다.')
    setIsEventFormOpen(false)
  }

  const getLinkedEvents = (noteId: string): Event[] => {
    return getMeetingEvents(noteId)
  }

  // Get shared events for mini calendar
  const sharedEvents = events.filter(e => e.ref_shared_calendar_id !== null)

  return (
    <AppShell title="미팅 노트">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meeting notes list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">미팅 노트</h2>
              <p className="text-muted-foreground">미팅 내용을 기록하고 캘린더와 연동하세요.</p>
            </div>
            <Button onClick={() => handleOpenForm()}>
              <Plus className="h-4 w-4 mr-2" />
              새 미팅 노트
            </Button>
          </div>

          {meetingNotes.length === 0 ? (
            <Empty
              icon={<FileText className="h-12 w-12 text-muted-foreground" />}
              title="미팅 노트가 없어요"
              description="새 미팅을 시작하세요."
              action={{
                label: '노트 생성',
                onClick: () => handleOpenForm(),
              }}
            />
          ) : (
            <div className="space-y-4">
              {meetingNotes.map((note) => {
                const linkedEvents = getLinkedEvents(note.tbl_meeting_note_id)
                return (
                  <Card key={note.tbl_meeting_note_id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{note.str_title}</CardTitle>
                          <CardDescription>
                            {format(new Date(note.dte_created_at), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleOpenEventForm(note)}>
                            <CalendarPlus className="h-4 w-4 mr-1" />
                            캘린더에 저장
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleOpenForm(note)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setNoteToDelete(note)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="whitespace-pre-wrap text-sm text-muted-foreground mb-4">
                        {note.str_content || '(내용 없음)'}
                      </div>
                      
                      {linkedEvents.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {linkedEvents.map((event) => (
                            <Badge key={event.tbl_event_id} variant="secondary" className="flex items-center gap-1">
                              <Link2 className="h-3 w-3" />
                              {event.str_title}
                              <span className="text-xs">
                                ({format(new Date(event.dte_start_at), 'M/d HH:mm')})
                              </span>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Mini calendar widget */}
        <div className="lg:col-span-1">
          <MiniCalendarWidget events={sharedEvents} />
        </div>
      </div>

      {/* Meeting note form */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedNote ? '미팅 노트 수정' : '새 미팅 노트'}</DialogTitle>
            <DialogDescription>
              미팅 내용을 자유롭게 기록하세요.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <FieldGroup className="py-4">
              <Field>
                <FieldLabel htmlFor="title">제목</FieldLabel>
                <Input
                  id="title"
                  value={formData.str_title}
                  onChange={(e) => setFormData({ ...formData, str_title: e.target.value })}
                  placeholder="미팅 제목"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="content">내용</FieldLabel>
                <Textarea
                  id="content"
                  value={formData.str_content}
                  onChange={(e) => setFormData({ ...formData, str_content: e.target.value })}
                  placeholder="미팅 내용을 기록하세요..."
                  rows={10}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                취소
              </Button>
              <Button type="submit">
                {selectedNote ? '수정' : '생성'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create event from meeting form */}
      <Dialog open={isEventFormOpen} onOpenChange={setIsEventFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>캘린더에 일정 추가</DialogTitle>
            <DialogDescription>
              미팅 노트와 연결된 일정을 캘린더에 추가합니다.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateEvent}>
            <FieldGroup className="py-4">
              <Field>
                <FieldLabel htmlFor="event-title">일정 제목</FieldLabel>
                <Input
                  id="event-title"
                  value={eventFormData.str_title}
                  onChange={(e) => setEventFormData({ ...eventFormData, str_title: e.target.value })}
                  placeholder="일정 제목"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="event-start">시작</FieldLabel>
                <Input
                  id="event-start"
                  type="datetime-local"
                  value={eventFormData.dte_start_at}
                  onChange={(e) => setEventFormData({ ...eventFormData, dte_start_at: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="event-end">종료</FieldLabel>
                <Input
                  id="event-end"
                  type="datetime-local"
                  value={eventFormData.dte_end_at}
                  onChange={(e) => setEventFormData({ ...eventFormData, dte_end_at: e.target.value })}
                />
              </Field>
              {sharedCalendars.length > 0 && (
                <Field>
                  <FieldLabel htmlFor="event-calendar">캘린더</FieldLabel>
                  <Select
                    value={eventFormData.ref_shared_calendar_id}
                    onValueChange={(value) => setEventFormData({ ...eventFormData, ref_shared_calendar_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="캘린더 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {sharedCalendars.map((calendar) => (
                        <SelectItem key={calendar.tbl_shared_calendar_id} value={calendar.tbl_shared_calendar_id}>
                          {calendar.str_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEventFormOpen(false)}>
                취소
              </Button>
              <Button type="submit">
                일정 추가
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!noteToDelete} onOpenChange={() => setNoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>미팅 노트 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              {`"${noteToDelete?.str_title}" 노트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  )
}
