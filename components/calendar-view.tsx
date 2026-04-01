'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfDay,
  endOfDay,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { Event, Goal, Category } from '@/lib/types'

type ViewType = 'week' | 'month'
type PendingRange = {
  start: Date
  end: Date
  top: number
  height: number
  label: string
}

interface CalendarViewProps {
  events: Event[]
  goals?: Goal[]
  categories?: Category[]
  onDateClick?: (date: Date) => void
  onTimeRangeSelect?: (start: Date, end: Date) => void
  onEventClick?: (event: Event) => void
  showOtherUserEvents?: boolean
  otherUserEvents?: Event[]
}

export function CalendarView({
  events,
  goals = [],
  categories = [],
  onDateClick,
  onTimeRangeSelect,
  onEventClick,
  showOtherUserEvents = false,
  otherUserEvents = [],
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewType, setViewType] = useState<ViewType>('month')
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [dragStartY, setDragStartY] = useState<number | null>(null)
  const [dragCurrentY, setDragCurrentY] = useState<number | null>(null)
  const [pendingRange, setPendingRange] = useState<PendingRange | null>(null)
  const dragStartYRef = useRef<number | null>(null)
  const dragCurrentYRef = useRef<number | null>(null)
  const weekTimelineScrollRef = useRef<HTMLDivElement | null>(null)
  const dayTimelineScrollRef = useRef<HTMLDivElement | null>(null)

  const HOUR_HEIGHT = 52
  const WEEK_HOUR_HEIGHT = 26
  const timelineHeight = HOUR_HEIGHT * 24
  const TIMELINE_LABEL_WIDTH = 56

  const navigatePrev = () => {
    setPendingRange(null)
    if (viewType === 'month') setCurrentDate(subMonths(currentDate, 1))
    else setCurrentDate(subWeeks(currentDate, 1))
  }

  const navigateNext = () => {
    setPendingRange(null)
    if (viewType === 'month') setCurrentDate(addMonths(currentDate, 1))
    else setCurrentDate(addWeeks(currentDate, 1))
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDay(today)
    setPendingRange(null)
  }

  const getTitle = () => {
    if (viewType === 'month') return format(currentDate, 'yyyy년 M월', { locale: ko })
    const start = startOfWeek(currentDate, { weekStartsOn: 1 })
    const end = endOfWeek(currentDate, { weekStartsOn: 1 })
    return `${format(start, 'M월 d일', { locale: ko })} - ${format(end, 'M월 d일', { locale: ko })}`
  }

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 })
    const end = endOfWeek(currentDate, { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  const getEventsForDay = (date: Date) => {
    const dayStart = startOfDay(date)
    const dayEnd = endOfDay(date)
    return events.filter((event) => {
      const eventStart = new Date(event.dte_start_at)
      const eventEnd = new Date(event.dte_end_at)
      return eventStart < dayEnd && eventEnd > dayStart
    })
  }

  const getOtherEventsForDay = (date: Date) => {
    if (!showOtherUserEvents) return []
    const dayStart = startOfDay(date)
    const dayEnd = endOfDay(date)
    return otherUserEvents.filter((event) => {
      const eventStart = new Date(event.dte_start_at)
      const eventEnd = new Date(event.dte_end_at)
      return eventStart < dayEnd && eventEnd > dayStart
    })
  }

  const getGoalsForDay = (date: Date) => {
    return goals.filter((goal) => isSameDay(new Date(goal.dte_deadline), date))
  }

  const getCategoryColor = (categoryId: string | null) => {
    if (!categoryId) return '#6B7280'
    const category = categories.find((c) => c.tbl_category_id === categoryId)
    return category?.str_color || '#6B7280'
  }

  const clamp = (value: number, min: number, max: number) => {
    return Math.min(max, Math.max(min, value))
  }

  const toSnappedMinutes = (y: number, mode: 'floor' | 'ceil' | 'round' = 'round') => {
    const minutes = (y / HOUR_HEIGHT) * 60
    const unit = 5
    const snapped =
      mode === 'floor'
        ? Math.floor(minutes / unit) * unit
        : mode === 'ceil'
          ? Math.ceil(minutes / unit) * unit
          : Math.round(minutes / unit) * unit
    return clamp(snapped, 0, 24 * 60)
  }

  const buildDateFromMinutes = (baseDate: Date, minutes: number) => {
    const d = new Date(baseDate)
    const hour = Math.floor(minutes / 60)
    const minute = minutes % 60
    d.setHours(hour, minute, 0, 0)
    return d
  }

  const formatMinutes = (minutes: number) => {
    const normalized = clamp(minutes, 0, 24 * 60)
    const hour = Math.floor(normalized / 60)
    const minute = normalized % 60
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }

  const scrollCurrentTimeToCenter = (container: HTMLDivElement | null) => {
    if (!container) return

    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const nowTop = (nowMinutes / 60) * HOUR_HEIGHT
    const targetTop = nowTop - container.clientHeight / 2
    const maxScrollTop = Math.max(container.scrollHeight - container.clientHeight, 0)

    container.scrollTop = clamp(targetTop, 0, maxScrollTop)
  }

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      if (viewType === 'week') {
        scrollCurrentTimeToCenter(weekTimelineScrollRef.current)
        return
      }

      if (viewType === 'month' && isSameDay(selectedDay, new Date())) {
        scrollCurrentTimeToCenter(dayTimelineScrollRef.current)
      }
    })

    return () => cancelAnimationFrame(raf)
  }, [viewType, selectedDay, currentDate])

  const getEventPositionInDay = (event: Event, day: Date, hourHeight: number) => {
    const dayStart = startOfDay(day)
    const dayEnd = endOfDay(day)
    const eventStart = new Date(event.dte_start_at)
    const eventEnd = new Date(event.dte_end_at)

    const visibleStart = eventStart > dayStart ? eventStart : dayStart
    const visibleEnd = eventEnd < dayEnd ? eventEnd : dayEnd

    const startMinutes = visibleStart.getHours() * 60 + visibleStart.getMinutes()
    const endMinutes = visibleEnd.getHours() * 60 + visibleEnd.getMinutes()
    const top = (startMinutes / 60) * hourHeight
    const height = Math.max(((endMinutes - startMinutes) / 60) * hourHeight, 18)

    return { top, height }
  }

  const renderDayCell = (
    date: Date,
    isCompact = true,
    onCellClick?: (date: Date) => void,
    isSelected = false
  ) => {
    const dayEvents = getEventsForDay(date)
    const otherEvents = getOtherEventsForDay(date)
    const dayGoals = getGoalsForDay(date)
    const isCurrentMonth = isSameMonth(date, currentDate)

    return (
      <div
        key={date.toISOString()}
        className={cn(
          'min-h-[100px] border-r border-b p-1 cursor-pointer hover:bg-muted/50 transition-colors',
          !isCurrentMonth && 'bg-muted/30',
          isToday(date) && 'bg-primary/5',
          isSelected && 'ring-2 ring-primary/40 ring-inset'
        )}
        onClick={() => onCellClick?.(date)}
      >
        <div className="flex items-center justify-between mb-1">
          <span
            className={cn(
              'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
              isToday(date) && 'bg-primary text-primary-foreground',
              !isCurrentMonth && 'text-muted-foreground'
            )}
          >
            {format(date, 'd')}
          </span>
        </div>
        
        {/* Goals banner */}
        {dayGoals.map((goal) => (
          <div
            key={goal.tbl_goal_id}
            className={cn(
              'text-xs px-1 py-0.5 mb-0.5 rounded truncate',
              goal.bln_is_completed ? 'bg-muted line-through text-muted-foreground' : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100'
            )}
            title={goal.str_description || undefined}
          >
            {goal.str_title}
          </div>
        ))}
        
        {/* Events */}
        <div className="space-y-0.5">
          {dayEvents.slice(0, isCompact ? 3 : 10).map((event) => (
            <div
              key={event.tbl_event_id}
              className="text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
              style={{ 
                backgroundColor: getCategoryColor(event.ref_category_id) + '20',
                borderLeft: `2px solid ${getCategoryColor(event.ref_category_id)}`
              }}
              onClick={(e) => {
                e.stopPropagation()
                onEventClick?.(event)
              }}
            >
              {event.str_title}
            </div>
          ))}
          
          {/* Other user events (gray blocks) */}
          {otherEvents.slice(0, isCompact ? 2 : 5).map((event) => (
            <div
              key={event.tbl_event_id}
              className="text-xs px-1 py-0.5 rounded truncate bg-muted text-muted-foreground"
              title="상대방 일정"
            >
              {format(new Date(event.dte_start_at), 'HH:mm')} - {format(new Date(event.dte_end_at), 'HH:mm')}
            </div>
          ))}
          
          {dayEvents.length > (isCompact ? 3 : 10) && (
            <div className="text-xs text-muted-foreground px-1">
              +{dayEvents.length - (isCompact ? 3 : 10)} 더보기
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderDayPanel = (date: Date) => {
    const dayEvents = getEventsForDay(date)
    const otherEvents = getOtherEventsForDay(date)
    const dayGoals = getGoalsForDay(date)
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const now = new Date()
    const isSelectedToday = isSameDay(date, now)

    const getPosition = (startAt: Date, endAt: Date) => {
      const start = new Date(startAt)
      const end = new Date(endAt)

      const startMinutes = start.getHours() * 60 + start.getMinutes()
      const endMinutes = end.getHours() * 60 + end.getMinutes()

      const top = (startMinutes / 60) * HOUR_HEIGHT
      const height = Math.max(((endMinutes - startMinutes) / 60) * HOUR_HEIGHT, 24)

      return { top, height }
    }

    const nowTop = (now.getHours() * 60 + now.getMinutes()) / 60 * HOUR_HEIGHT
    const isDragging = dragStartY !== null && dragCurrentY !== null
    const dragTop = isDragging ? Math.min(dragStartY, dragCurrentY) : null
    const dragHeight = isDragging ? Math.max(Math.abs(dragCurrentY - dragStartY), 6) : null
    const dragStartMinutes = isDragging ? toSnappedMinutes(Math.min(dragStartY, dragCurrentY), 'floor') : null
    const dragEndMinutes = isDragging ? toSnappedMinutes(Math.max(dragStartY, dragCurrentY), 'ceil') : null
    const dragLabel =
      isDragging && dragStartMinutes !== null && dragEndMinutes !== null
        ? `${formatMinutes(dragStartMinutes)} - ${formatMinutes(Math.max(dragEndMinutes, dragStartMinutes + 5))}`
        : ''
    const pendingButtonSize = pendingRange ? clamp(pendingRange.height - 8, 18, 34) : 24
    const pendingIconSize = pendingButtonSize < 22 ? 12 : pendingButtonSize < 28 ? 14 : 16

    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="p-3 border-b bg-muted/30">
          <div className="text-xs text-muted-foreground">선택한 날짜</div>
          <div className="text-base font-semibold">
            {format(date, 'M월 d일 (EEE)', { locale: ko })}
          </div>
        </div>

        {dayGoals.length > 0 && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border-b">
            <div className="text-sm font-medium mb-2">목표 데드라인</div>
            {dayGoals.map((goal) => (
              <div key={goal.tbl_goal_id} className="mb-2 last:mb-0">
                <div className="text-sm font-medium">{goal.str_title}</div>
                {goal.str_description && (
                  <div className="text-xs text-muted-foreground mt-0.5">{goal.str_description}</div>
                )}
              </div>
            ))}
          </div>
        )}

        <div ref={dayTimelineScrollRef} className="h-[620px] overflow-y-auto">
          <div
            className="relative select-none"
            style={{ height: timelineHeight }}
            onPointerDown={(e) => {
              const target = e.target as HTMLElement
              if (target.closest('[data-ignore-drag="true"]')) return
              if (target.closest('[data-calendar-block="event"]')) return
              if (e.pointerType === 'mouse' && e.button !== 0) return

              setPendingRange(null)
              const rect = e.currentTarget.getBoundingClientRect()
              const x = e.clientX - rect.left
              if (x < TIMELINE_LABEL_WIDTH) return

              e.preventDefault()
              const y = clamp(e.clientY - rect.top, 0, timelineHeight)
              dragStartYRef.current = y
              dragCurrentYRef.current = y
              setDragStartY(y)
              setDragCurrentY(y)
              e.currentTarget.setPointerCapture(e.pointerId)
            }}
            onPointerMove={(e) => {
              if (dragStartYRef.current === null) return
              const rect = e.currentTarget.getBoundingClientRect()
              const y = clamp(e.clientY - rect.top, 0, timelineHeight)
              dragCurrentYRef.current = y
              setDragCurrentY(y)
            }}
            onPointerUp={(e) => {
              const startY = dragStartYRef.current
              const currentY = dragCurrentYRef.current
              if (startY === null || currentY === null) return

              if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                e.currentTarget.releasePointerCapture(e.pointerId)
              }

              const delta = Math.abs(currentY - startY)
              const minY = Math.min(startY, currentY)
              const maxY = Math.max(startY, currentY)

              if (delta < 8) {
                const hour = Math.floor(clamp(minY, 0, timelineHeight - 1) / HOUR_HEIGHT)
                const clickedDate = new Date(date)
                clickedDate.setHours(hour, 0, 0, 0)
                setPendingRange(null)
                onDateClick?.(clickedDate)
              } else {
                const startMinutes = toSnappedMinutes(minY, 'floor')
                let endMinutes = toSnappedMinutes(maxY, 'ceil')

                if (endMinutes <= startMinutes) {
                  endMinutes = clamp(startMinutes + 5, 0, 24 * 60)
                }

                const startDate = buildDateFromMinutes(date, startMinutes)
                const endDate = buildDateFromMinutes(date, endMinutes)
                const top = (startMinutes / 60) * HOUR_HEIGHT
                const height = Math.max(((endMinutes - startMinutes) / 60) * HOUR_HEIGHT, 14)

                setPendingRange({
                  start: startDate,
                  end: endDate,
                  top,
                  height,
                  label: `${formatMinutes(startMinutes)} - ${formatMinutes(endMinutes)}`,
                })
              }

              dragStartYRef.current = null
              dragCurrentYRef.current = null
              setDragStartY(null)
              setDragCurrentY(null)
            }}
            onPointerCancel={() => {
              dragStartYRef.current = null
              dragCurrentYRef.current = null
              setDragStartY(null)
              setDragCurrentY(null)
            }}
          >
            {hours.map((hour) => (
              <div key={hour} className="absolute inset-x-0 flex pointer-events-none" style={{ top: hour * HOUR_HEIGHT }}>
                <div className="w-14 pr-2 text-[11px] text-muted-foreground text-right -translate-y-2 select-none">
                  {`${String(hour).padStart(2, '0')}:00`}
                </div>
                <div className="flex-1 border-t border-border/70" />
              </div>
            ))}

            {isSelectedToday && (
              <div className="absolute inset-x-0 flex items-center z-20" style={{ top: nowTop }}>
                <div className="w-14 pr-2">
                  <span className="inline-block bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded">
                    {format(now, 'HH:mm')}
                  </span>
                </div>
                <div className="flex-1 h-px bg-destructive" />
              </div>
            )}

            {otherEvents.map((event) => {
              const { top, height } = getPosition(new Date(event.dte_start_at), new Date(event.dte_end_at))
              return (
                <button
                  key={event.tbl_event_id}
                  type="button"
                  data-calendar-block="event"
                  className="absolute left-16 right-2 rounded-md border border-border/70 bg-muted/70 px-2 py-1 text-left text-xs text-muted-foreground overflow-hidden"
                  style={{ top, height }}
                  onClick={(e) => {
                    e.stopPropagation()
                  }}
                  title="상대방 일정"
                >
                  <div className="font-medium">상대방 일정</div>
                  <div>
                    {format(new Date(event.dte_start_at), 'HH:mm')} - {format(new Date(event.dte_end_at), 'HH:mm')}
                  </div>
                </button>
              )
            })}

            {dayEvents.map((event) => {
              const { top, height } = getPosition(new Date(event.dte_start_at), new Date(event.dte_end_at))
              return (
                <button
                  key={event.tbl_event_id}
                  type="button"
                  data-calendar-block="event"
                  className="absolute left-16 right-2 rounded-md border px-2 py-1 text-left text-xs shadow-sm overflow-hidden"
                  style={{
                    top,
                    height,
                    backgroundColor: getCategoryColor(event.ref_category_id) + '20',
                    borderColor: getCategoryColor(event.ref_category_id) + '99',
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onEventClick?.(event)
                  }}
                >
                  <div className="font-semibold truncate">{event.str_title}</div>
                  <div className="text-muted-foreground">
                    {format(new Date(event.dte_start_at), 'HH:mm')} - {format(new Date(event.dte_end_at), 'HH:mm')}
                  </div>
                </button>
              )
            })}

            {isDragging && dragTop !== null && dragHeight !== null && (
              <div
                className="absolute left-16 right-2 rounded-md border border-primary/60 bg-primary/20 pointer-events-none z-30"
                style={{ top: dragTop, height: dragHeight }}
              >
                <div className="absolute -top-6 left-0 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                  {dragLabel}
                </div>
              </div>
            )}

            {pendingRange && (
              <>
                <div
                  className="absolute left-16 right-2 rounded-md border border-primary/60 bg-primary/15 z-20"
                  style={{ top: pendingRange.top, height: pendingRange.height }}
                >
                  <div className="absolute -top-6 left-0 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                    {pendingRange.label}
                  </div>
                </div>
                <Button
                  type="button"
                  size="icon-sm"
                  data-ignore-drag="true"
                  className="absolute z-40 left-16 right-2 mx-auto p-0"
                  style={{
                    top: pendingRange.top + pendingRange.height / 2,
                    transform: 'translateY(-50%)',
                    width: pendingButtonSize,
                    height: pendingButtonSize,
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (onTimeRangeSelect) {
                      onTimeRangeSelect(pendingRange.start, pendingRange.end)
                    } else {
                      onDateClick?.(pendingRange.start)
                    }
                    setPendingRange(null)
                  }}
                >
                  <Plus style={{ width: pendingIconSize, height: pendingIconSize }} />
                </Button>
              </>
            )}
          </div>

          {dayEvents.length === 0 && otherEvents.length === 0 && dayGoals.length === 0 && (
            <div className="p-6 text-sm text-muted-foreground text-center border-t">
              선택한 날짜에 일정이 없습니다.
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={navigatePrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={goToToday}>
              오늘
            </Button>
            <h2 className="text-xl font-semibold ml-2">{getTitle()}</h2>
          </div>
          
        <div className="flex items-center gap-2">
            <Tabs
              value={viewType}
              onValueChange={(v) => {
                setPendingRange(null)
                setViewType(v as ViewType)
              }}
            >
              <TabsList>
                <TabsTrigger value="week">주</TabsTrigger>
                <TabsTrigger value="month">월</TabsTrigger>
              </TabsList>
            </Tabs>
            
            {onDateClick && (
              <Button onClick={() => onDateClick(new Date())}>
                <Plus className="h-4 w-4 mr-2" />
                새 일정
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {viewType === 'week' && (
          <div className="border rounded-2xl overflow-hidden bg-background">
            <div ref={weekTimelineScrollRef} className="overflow-visible">
              <div className="min-w-[1036px]">
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: '56px repeat(7, minmax(140px, 1fr))',
                  }}
                >
                  <div className="border-r border-b px-2 py-2 text-[11px] text-muted-foreground">
                    시간
                  </div>
                  {weekDays.map((date) => (
                    <button
                      key={`week-head-${date.toISOString()}`}
                      type="button"
                      className={cn(
                        'border-r border-b px-2 py-2 text-center hover:bg-muted/40 transition-colors',
                        isSameDay(date, currentDate) && 'bg-destructive/[0.08]'
                      )}
                      onClick={() => setCurrentDate(date)}
                    >
                      <div className="text-[11px] text-muted-foreground">
                        {format(date, 'EEE', { locale: ko })}
                      </div>
                      <div
                        className={cn(
                          'mx-auto mt-1 h-7 w-7 rounded-full text-sm font-semibold flex items-center justify-center',
                          isSameDay(date, currentDate) && 'bg-destructive text-destructive-foreground',
                          !isSameDay(date, currentDate) && isToday(date) && 'text-destructive'
                        )}
                      >
                        {format(date, 'd')}
                      </div>
                    </button>
                  ))}

                  <div className="border-r">
                    {Array.from({ length: 24 }, (_, hour) => (
                      <div
                        key={`week-hour-label-${hour}`}
                        className="relative border-b"
                        style={{ height: WEEK_HOUR_HEIGHT }}
                      >
                        <span className="absolute right-2 -top-2 text-[11px] text-muted-foreground select-none">
                          {`${String(hour).padStart(2, '0')}:00`}
                        </span>
                      </div>
                    ))}
                  </div>

                  {weekDays.map((date) => {
                    const dayEvents = getEventsForDay(date)
                    const dayOtherEvents = getOtherEventsForDay(date)
                    const now = new Date()
                    const isThisDayToday = isToday(date)
                    const nowTop = (now.getHours() * 60 + now.getMinutes()) / 60 * WEEK_HOUR_HEIGHT

                    return (
                      <div
                        key={`week-col-${date.toISOString()}`}
                        className={cn(
                          'relative border-r',
                          isThisDayToday && 'bg-destructive/[0.03]'
                        )}
                      >
                        {Array.from({ length: 24 }, (_, hour) => (
                          <div
                            key={`week-grid-${date.toISOString()}-${hour}`}
                            className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                            style={{ height: WEEK_HOUR_HEIGHT }}
                            onClick={() => {
                              const clickedDate = new Date(date)
                              clickedDate.setHours(hour, 0, 0, 0)
                              onDateClick?.(clickedDate)
                            }}
                          />
                        ))}

                        {isThisDayToday && (
                          <div className="absolute inset-x-0 z-20 flex items-center" style={{ top: nowTop }}>
                            <div className="h-px flex-1 bg-destructive" />
                          </div>
                        )}

                        {dayOtherEvents.map((event) => {
                          const { top, height } = getEventPositionInDay(event, date, WEEK_HOUR_HEIGHT)
                          return (
                            <div
                              key={`week-other-${event.tbl_event_id}`}
                              className="absolute left-1 right-1 rounded-md border border-border/70 bg-muted/70 px-1.5 py-1 text-[10px] text-muted-foreground overflow-hidden"
                              style={{ top, height }}
                            >
                              <div className="font-medium">상대방 일정</div>
                            </div>
                          )
                        })}

                        {dayEvents.map((event) => {
                          const { top, height } = getEventPositionInDay(event, date, WEEK_HOUR_HEIGHT)
                          return (
                            <button
                              key={`week-event-${event.tbl_event_id}`}
                              type="button"
                              className="absolute left-1 right-1 rounded-md border px-1.5 py-1 text-left text-[10px] shadow-sm overflow-hidden"
                              style={{
                                top,
                                height,
                                backgroundColor: getCategoryColor(event.ref_category_id) + '20',
                                borderColor: getCategoryColor(event.ref_category_id) + '99',
                              }}
                              onClick={() => onEventClick?.(event)}
                            >
                              <div className="font-semibold truncate">{event.str_title}</div>
                              <div className="text-muted-foreground">
                                {format(new Date(event.dte_start_at), 'HH:mm')}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {viewType === 'month' && (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-7 border-b">
                {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium border-r last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {monthDays.map((date) =>
                  renderDayCell(
                    date,
                    true,
                    (clickedDate) => {
                      setPendingRange(null)
                      setSelectedDay(clickedDate)
                      if (!isSameMonth(clickedDate, currentDate)) {
                        setCurrentDate(clickedDate)
                      }
                    },
                    isSameDay(date, selectedDay)
                  )
                )}
              </div>
            </div>

            <div className="lg:sticky lg:top-4">
              {renderDayPanel(selectedDay)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
