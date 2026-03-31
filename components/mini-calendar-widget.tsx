'use client'

import { useState } from 'react'
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
} from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Event } from '@/lib/types'

interface MiniCalendarWidgetProps {
  events: Event[]
  onDateClick?: (date: Date) => void
}

export function MiniCalendarWidget({ events, onDateClick }: MiniCalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 }),
  })

  const hasEventsOnDay = (date: Date) => {
    return events.some((event) => {
      const eventDate = new Date(event.dte_start_at)
      return isSameDay(eventDate, date)
    })
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">캘린더</CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[80px] text-center">
              {format(currentDate, 'yyyy.M', { locale: ko })}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
            <div key={day} className="py-1 font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          {days.map((day) => {
            const hasEvents = hasEventsOnDay(day)
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => onDateClick?.(day)}
                className={cn(
                  'relative py-1 rounded-md text-sm transition-colors hover:bg-muted',
                  !isSameMonth(day, currentDate) && 'text-muted-foreground',
                  isToday(day) && 'bg-primary text-primary-foreground hover:bg-primary/90',
                )}
              >
                {format(day, 'd')}
                {hasEvents && !isToday(day) && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                )}
              </button>
            )
          })}
        </div>

        {/* Upcoming events */}
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">다가오는 일정</h4>
          <div className="space-y-2">
            {events
              .filter((event) => new Date(event.dte_start_at) >= new Date())
              .sort((a, b) => new Date(a.dte_start_at).getTime() - new Date(b.dte_start_at).getTime())
              .slice(0, 5)
              .map((event) => (
                <div key={event.tbl_event_id} className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground min-w-[50px]">
                    {format(new Date(event.dte_start_at), 'M/d')}
                  </span>
                  <span className="truncate">{event.str_title}</span>
                </div>
              ))}
            {events.filter((event) => new Date(event.dte_start_at) >= new Date()).length === 0 && (
              <p className="text-sm text-muted-foreground">예정된 일정이 없습니다.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
