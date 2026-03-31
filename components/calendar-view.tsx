'use client'

import { useState, useMemo } from 'react'
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
  addDays,
  subDays,
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

type ViewType = 'day' | 'week' | 'month'

interface CalendarViewProps {
  events: Event[]
  goals?: Goal[]
  categories?: Category[]
  onDateClick?: (date: Date) => void
  onEventClick?: (event: Event) => void
  showOtherUserEvents?: boolean
  otherUserEvents?: Event[]
}

export function CalendarView({
  events,
  goals = [],
  categories = [],
  onDateClick,
  onEventClick,
  showOtherUserEvents = false,
  otherUserEvents = [],
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewType, setViewType] = useState<ViewType>('month')

  const navigatePrev = () => {
    if (viewType === 'month') setCurrentDate(subMonths(currentDate, 1))
    else if (viewType === 'week') setCurrentDate(subWeeks(currentDate, 1))
    else setCurrentDate(subDays(currentDate, 1))
  }

  const navigateNext = () => {
    if (viewType === 'month') setCurrentDate(addMonths(currentDate, 1))
    else if (viewType === 'week') setCurrentDate(addWeeks(currentDate, 1))
    else setCurrentDate(addDays(currentDate, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getTitle = () => {
    if (viewType === 'month') return format(currentDate, 'yyyy년 M월', { locale: ko })
    if (viewType === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 })
      const end = endOfWeek(currentDate, { weekStartsOn: 0 })
      return `${format(start, 'M월 d일', { locale: ko })} - ${format(end, 'M월 d일', { locale: ko })}`
    }
    return format(currentDate, 'yyyy년 M월 d일 (EEEE)', { locale: ko })
  }

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 })
    const end = endOfWeek(currentDate, { weekStartsOn: 0 })
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

  const renderDayCell = (date: Date, isCompact = true) => {
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
          isToday(date) && 'bg-primary/5'
        )}
        onClick={() => onDateClick?.(date)}
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

  const renderDayView = () => {
    const dayEvents = getEventsForDay(currentDate)
    const otherEvents = getOtherEventsForDay(currentDate)
    const dayGoals = getGoalsForDay(currentDate)
    const hours = Array.from({ length: 24 }, (_, i) => i)

    return (
      <div className="border rounded-lg overflow-hidden">
        {/* Goals banner */}
        {dayGoals.length > 0 && (
          <div className="p-2 bg-amber-50 dark:bg-amber-900/20 border-b">
            <div className="text-sm font-medium mb-1">목표 데드라인</div>
            {dayGoals.map((goal) => (
              <div key={goal.tbl_goal_id} className="text-sm">
                {goal.str_title}
              </div>
            ))}
          </div>
        )}
        
        <div className="h-[600px] overflow-y-auto">
          {hours.map((hour) => {
            const hourEvents = dayEvents.filter((event) => {
              const eventStart = new Date(event.dte_start_at)
              return eventStart.getHours() === hour
            })
            const hourOtherEvents = otherEvents.filter((event) => {
              const eventStart = new Date(event.dte_start_at)
              return eventStart.getHours() === hour
            })

            return (
              <div key={hour} className="flex border-b min-h-[50px]">
                <div className="w-16 p-2 text-sm text-muted-foreground border-r">
                  {format(new Date().setHours(hour, 0), 'HH:mm')}
                </div>
                <div 
                  className="flex-1 p-1 hover:bg-muted/50 cursor-pointer"
                  onClick={() => {
                    const date = new Date(currentDate)
                    date.setHours(hour, 0, 0, 0)
                    onDateClick?.(date)
                  }}
                >
                  {hourEvents.map((event) => (
                    <div
                      key={event.tbl_event_id}
                      className="text-sm px-2 py-1 rounded mb-1 cursor-pointer hover:opacity-80"
                      style={{ 
                        backgroundColor: getCategoryColor(event.ref_category_id) + '20',
                        borderLeft: `3px solid ${getCategoryColor(event.ref_category_id)}`
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventClick?.(event)
                      }}
                    >
                      <div className="font-medium">{event.str_title}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(event.dte_start_at), 'HH:mm')} - {format(new Date(event.dte_end_at), 'HH:mm')}
                      </div>
                    </div>
                  ))}
                  {hourOtherEvents.map((event) => (
                    <div
                      key={event.tbl_event_id}
                      className="text-sm px-2 py-1 rounded mb-1 bg-muted text-muted-foreground"
                    >
                      상대방 일정 ({format(new Date(event.dte_start_at), 'HH:mm')} - {format(new Date(event.dte_end_at), 'HH:mm')})
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
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
            <Tabs value={viewType} onValueChange={(v) => setViewType(v as ViewType)}>
              <TabsList>
                <TabsTrigger value="day">일</TabsTrigger>
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
        {viewType === 'day' && renderDayView()}
        
        {viewType === 'week' && (
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-7 border-b">
              {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium border-r last:border-r-0">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {weekDays.map((date) => renderDayCell(date, false))}
            </div>
          </div>
        )}
        
        {viewType === 'month' && (
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-7 border-b">
              {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium border-r last:border-r-0">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {monthDays.map((date) => renderDayCell(date))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
