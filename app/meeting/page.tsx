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
import type { MeetingNote, MeetingNoteFormData, Event, MeetingType } from '@/lib/types'
import { MiniCalendarWidget } from '@/components/mini-calendar-widget'

// Meeting type labels and templates
const MEETING_TYPES: { value: MeetingType; label: string; color: string }[] = [
  { value: 'requirements', label: '요구사항 미팅', color: 'bg-blue-500' },
  { value: 'technical', label: 'Technische Meeting', color: 'bg-purple-500' },
  { value: 'testing', label: '테스팅 미팅', color: 'bg-amber-500' },
  { value: 'design', label: '디자인 미팅', color: 'bg-pink-500' },
  { value: 'deployment', label: '배포 미팅', color: 'bg-green-500' },
  { value: 'post_deployment', label: '배포 후 테스팅', color: 'bg-teal-500' },
  { value: 'general', label: '일반 미팅', color: 'bg-gray-500' },
]

const MEETING_TEMPLATES: Record<MeetingType, string> = {
  requirements: `## 요구사항 미팅

### 참석자
- 

### 논의 주제
1. 

### 기능 요구사항
- [ ] 

### 비기능 요구사항
- [ ] 

### 우선순위
| 기능 | 우선순위 | 비고 |
|------|---------|------|
|      |         |      |

### 결정 사항
- 

### 다음 단계
- `,

  technical: `## Technische Meeting

### Teilnehmer / 참석자
- 

### Agenda / 안건
1. 

### Technische Entscheidungen / 기술 결정
- Architektur / 아키텍처:
- Stack / 기술 스택:
- Database / 데이터베이스:

### API Endpoints
| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
|        |          |              |

### Code Review / 코드 리뷰
- 

### Offene Punkte / 미결 사항
- [ ] 

### Nächste Schritte / 다음 단계
- `,

  testing: `## 테스팅 미팅

### 참석자
- 

### 테스트 범위
- [ ] 단위 테스트
- [ ] 통합 테스트
- [ ] E2E 테스트
- [ ] 성능 테스트

### 테스트 시나리오
| ID | 시나리오 | 예상 결과 | 실제 결과 | 상태 |
|----|---------|----------|----------|------|
| 1  |         |          |          |      |

### 발견된 버그
| ID | 설명 | 심각도 | 담당자 |
|----|-----|-------|-------|
|    |     |       |       |

### 테스트 환경
- 브라우저:
- 디바이스:
- OS:

### 다음 단계
- `,

  design: `## 디자인 미팅

### 참석자
- 

### 논의 주제
1. 

### UI/UX 검토
- 컬러 팔레트:
- 타이포그래피:
- 레이아웃:

### 화면 설계
| 화면명 | 상태 | 비고 |
|-------|------|------|
|       |      |      |

### 디자인 시스템
- 컴포넌트:
- 아이콘:
- 스페이싱:

### 피드백
- 

### 수정 사항
- [ ] 

### 다음 단계
- `,

  deployment: `## 배포 미팅

### 참석자
- 

### 배포 정보
- 버전:
- 환경: [ ] Staging [ ] Production
- 예정 시간:

### 배포 체크리스트
- [ ] 코드 리뷰 완료
- [ ] 테스트 통과
- [ ] 마이그레이션 스크립트 확인
- [ ] 환경 변수 설정
- [ ] 백업 완료

### 변경 사항
1. 

### 롤백 계획
- 트리거 조건:
- 롤백 절차:

### 모니터링
- 메트릭:
- 알림 설정:

### 다음 단계
- `,

  post_deployment: `## 배포 후 테스팅 미팅

### 참석자
- 

### 배포 정보
- 버전:
- 배포 시간:

### 검증 체크리스트
- [ ] 핵심 기능 동작 확인
- [ ] API 응답 확인
- [ ] 에러 로그 확인
- [ ] 성능 모니터링

### 테스트 결과
| 항목 | 상태 | 비고 |
|-----|------|------|
|     |      |      |

### 발견된 이슈
| ID | 설명 | 심각도 | 해결 방안 |
|----|-----|-------|----------|
|    |     |       |          |

### 성능 지표
- 응답 시간:
- 에러율:
- 사용자 수:

### 결론
- [ ] 배포 성공
- [ ] 롤백 필요

### 다음 단계
- `,

  general: `## 일반 미팅

### 참석자
- 

### 안건
1. 

### 논의 내용
- 

### 결정 사항
- 

### Action Items
- [ ] 

### 다음 미팅
- 일시:
- 안건:
`,
}

function getMeetingTypeLabel(type: MeetingType): string {
  return MEETING_TYPES.find(t => t.value === type)?.label || '일반 미팅'
}

function getMeetingTypeColor(type: MeetingType): string {
  return MEETING_TYPES.find(t => t.value === type)?.color || 'bg-gray-500'
}

export default function MeetingPage() {
  const { meetingNotes, events, sharedCalendars, createMeetingNote, updateMeetingNote, deleteMeetingNote, createEvent, linkMeetingToEvent, getMeetingEvents } = useData()
  
  const [selectedNote, setSelectedNote] = useState<MeetingNote | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<MeetingNote | null>(null)
  const [isEventFormOpen, setIsEventFormOpen] = useState(false)
  const [formData, setFormData] = useState<MeetingNoteFormData>({
    str_title: '',
    str_type: 'general',
    str_content: '',
  })
  const [eventFormData, setEventFormData] = useState({
    str_title: '',
    dte_start_at: '',
    dte_end_at: '',
    ref_shared_calendar_id: sharedCalendars[0]?.tbl_shared_calendar_id || '',
  })

  const handleTypeChange = (type: MeetingType) => {
    const template = MEETING_TEMPLATES[type]
    setFormData({ 
      ...formData, 
      str_type: type,
      str_content: selectedNote ? formData.str_content : template 
    })
  }

  const handleOpenForm = (note?: MeetingNote) => {
    if (note) {
      setSelectedNote(note)
      setFormData({
        str_title: note.str_title,
        str_type: note.str_type || 'general',
        str_content: note.str_content,
      })
    } else {
      setSelectedNote(null)
      setFormData({
        str_title: '',
        str_type: 'general',
        str_content: MEETING_TEMPLATES.general,
      })
    }
    setIsFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.str_title.trim()) {
      toast.error('미팅 노트 제목을 입력해주세요.')
      return
    }

    try {
      if (selectedNote) {
        await updateMeetingNote(selectedNote.tbl_meeting_note_id, formData)
        toast.success('미팅 노트가 수정되었습니다.')
      } else {
        await createMeetingNote(formData)
        toast.success('미팅 노트가 생성되었습니다.')
      }
      setIsFormOpen(false)
    } catch {
      toast.error('미팅 노트 저장 중 오류가 발생했습니다.')
    }
  }

  const handleDelete = async () => {
    if (noteToDelete) {
      try {
        await deleteMeetingNote(noteToDelete.tbl_meeting_note_id)
        toast.success('미팅 노트가 삭제되었습니다.')
        setNoteToDelete(null)
      } catch {
        toast.error('미팅 노트 삭제 중 오류가 발생했습니다.')
      }
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

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!eventFormData.str_title.trim()) {
      toast.error('일정 제목을 입력해주세요.')
      return
    }
    
    if (!eventFormData.dte_start_at || !eventFormData.dte_end_at) {
      toast.error('시작 및 종료 시간을 입력해주세요.')
      return
    }

    try {
      const newEvent = await createEvent({
        str_title: eventFormData.str_title,
        dte_start_at: eventFormData.dte_start_at,
        dte_end_at: eventFormData.dte_end_at,
        ref_category_id: null,
        bln_allow_overlap: false,
        ref_shared_calendar_id: eventFormData.ref_shared_calendar_id || null,
      })

      if (selectedNote) {
        await linkMeetingToEvent(selectedNote.tbl_meeting_note_id, newEvent.tbl_event_id)
      }

      toast.success('캘린더에 일정이 추가되었습니다.')
      setIsEventFormOpen(false)
    } catch {
      toast.error('일정 생성 중 오류가 발생했습니다.')
    }
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
              <h2 className="text-2xl font-bold text-foreground">미팅 노트</h2>
              <p className="text-muted-foreground">미팅 유형별 템플릿으로 효율적으로 기록하세요.</p>
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
                const noteType = note.str_type || 'general'
                return (
                  <Card key={note.tbl_meeting_note_id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge 
                              variant="secondary" 
                              className={`${getMeetingTypeColor(noteType)} text-white text-xs`}
                            >
                              {getMeetingTypeLabel(noteType)}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">{note.str_title}</CardTitle>
                          <CardDescription>
                            {format(new Date(note.dte_created_at), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="outline" size="sm" onClick={() => handleOpenEventForm(note)}>
                            <CalendarPlus className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">캘린더</span>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenForm(note)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setNoteToDelete(note)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted/50 rounded-lg p-4 max-h-48 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans">
                          {note.str_content || '(내용 없음)'}
                        </pre>
                      </div>
                      
                      {linkedEvents.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {linkedEvents.map((event) => (
                            <Badge key={event.tbl_event_id} variant="outline" className="flex items-center gap-1">
                              <Link2 className="h-3 w-3" />
                              {event.str_title}
                              <span className="text-xs text-muted-foreground">
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
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedNote ? '미팅 노트 수정' : '새 미팅 노트'}</DialogTitle>
            <DialogDescription>
              미팅 유형을 선택하면 적합한 템플릿이 자동으로 적용됩니다.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
            <FieldGroup className="py-4 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <FieldLabel htmlFor="type">미팅 유형</FieldLabel>
                  <Select
                    value={formData.str_type}
                    onValueChange={(value) => handleTypeChange(value as MeetingType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="유형 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {MEETING_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${type.color}`} />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field className="flex-1">
                <FieldLabel htmlFor="content">내용</FieldLabel>
                <Textarea
                  id="content"
                  value={formData.str_content}
                  onChange={(e) => setFormData({ ...formData, str_content: e.target.value })}
                  placeholder="미팅 내용을 기록하세요..."
                  className="min-h-[400px] resize-none font-mono text-sm"
                />
              </Field>
            </FieldGroup>
            <DialogFooter className="shrink-0">
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
