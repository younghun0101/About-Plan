'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { useData } from '@/contexts/data-context'
import type { Event, EventFormData } from '@/lib/types'
import { AlertTriangle } from 'lucide-react'

interface EventFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event?: Event | null
  defaultDate?: Date
  defaultEndDate?: Date
  isShared?: boolean
  sharedCalendarId?: string | null
  onDelete?: (event: Event) => void
}

export function EventFormDialog({
  open,
  onOpenChange,
  event,
  defaultDate,
  defaultEndDate,
  isShared = false,
  sharedCalendarId = null,
  onDelete,
}: EventFormDialogProps) {
  const { createEvent, updateEvent, getUserCategories, checkConflict } = useData()
  const categories = getUserCategories()
  
  const [formData, setFormData] = useState<EventFormData>({
    str_title: '',
    dte_start_at: '',
    dte_end_at: '',
    ref_category_id: null,
    bln_allow_overlap: false,
    ref_shared_calendar_id: null,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [hasConflict, setHasConflict] = useState(false)

  useEffect(() => {
    if (event) {
      setFormData({
        str_title: event.str_title,
        dte_start_at: format(new Date(event.dte_start_at), "yyyy-MM-dd'T'HH:mm"),
        dte_end_at: format(new Date(event.dte_end_at), "yyyy-MM-dd'T'HH:mm"),
        ref_category_id: event.ref_category_id,
        bln_allow_overlap: event.bln_allow_overlap,
        ref_shared_calendar_id: event.ref_shared_calendar_id,
      })
    } else if (defaultDate) {
      const startDate = new Date(defaultDate)
      const endDate = defaultEndDate ? new Date(defaultEndDate) : new Date(defaultDate)

      if (!defaultEndDate || endDate <= startDate) {
        endDate.setHours(endDate.getHours() + 1)
      }
      
      setFormData({
        str_title: '',
        dte_start_at: format(startDate, "yyyy-MM-dd'T'HH:mm"),
        dte_end_at: format(endDate, "yyyy-MM-dd'T'HH:mm"),
        ref_category_id: null,
        bln_allow_overlap: false,
        ref_shared_calendar_id: isShared ? sharedCalendarId : null,
      })
    }
  }, [event, defaultDate, defaultEndDate, isShared, sharedCalendarId])

  useEffect(() => {
    if (formData.dte_start_at && formData.dte_end_at) {
      const conflict = checkConflict(
        new Date(formData.dte_start_at),
        new Date(formData.dte_end_at),
        event?.tbl_event_id
      )
      setHasConflict(conflict)
    }
  }, [formData.dte_start_at, formData.dte_end_at, event, checkConflict])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.str_title.trim()) {
      toast.error('일정 제목을 입력해주세요.')
      return
    }
    
    if (!formData.dte_start_at || !formData.dte_end_at) {
      toast.error('시작 및 종료 시간을 입력해주세요.')
      return
    }
    
    if (new Date(formData.dte_start_at) >= new Date(formData.dte_end_at)) {
      toast.error('종료 시간은 시작 시간보다 늦어야 합니다.')
      return
    }
    
    if (hasConflict && !formData.bln_allow_overlap) {
      toast.error('일정 충돌이 있습니다. 동시 진행 예외를 허용하거나 시간을 변경해주세요.')
      return
    }

    setIsLoading(true)
    
    try {
      if (event) {
        await updateEvent(event.tbl_event_id, formData)
        toast.success('일정이 수정되었습니다.')
      } else {
        await createEvent({
          ...formData,
          ref_shared_calendar_id: isShared ? sharedCalendarId : null,
        })
        toast.success('일정이 생성되었습니다.')
      }
      onOpenChange(false)
    } catch {
      toast.error('일정 저장 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{event ? '일정 수정' : '새 일정'}</DialogTitle>
          <DialogDescription>
            {isShared ? '공동 캘린더에 일정을 추가합니다.' : '개인 캘린더에 일정을 추가합니다.'}
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
                placeholder="일정 제목"
                disabled={isLoading}
              />
            </Field>
            
            <Field>
              <FieldLabel htmlFor="start">시작</FieldLabel>
              <Input
                id="start"
                type="datetime-local"
                value={formData.dte_start_at}
                onChange={(e) => setFormData({ ...formData, dte_start_at: e.target.value })}
                disabled={isLoading}
              />
            </Field>
            
            <Field>
              <FieldLabel htmlFor="end">종료</FieldLabel>
              <Input
                id="end"
                type="datetime-local"
                value={formData.dte_end_at}
                onChange={(e) => setFormData({ ...formData, dte_end_at: e.target.value })}
                disabled={isLoading}
              />
            </Field>
            
            {!isShared && categories.length > 0 && (
              <Field>
                <FieldLabel htmlFor="category">카테고리</FieldLabel>
                <Select
                  value={formData.ref_category_id || 'none'}
                  onValueChange={(value) => 
                    setFormData({ ...formData, ref_category_id: value === 'none' ? null : value })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">카테고리 없음</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.tbl_category_id} value={cat.tbl_category_id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: cat.str_color }}
                          />
                          {cat.str_name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
            
            {hasConflict && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  해당 시간에 다른 일정이 있습니다. 동시 진행을 허용하시겠습니까?
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex items-center gap-3 py-2">
              <Checkbox
                id="allow-overlap"
                checked={formData.bln_allow_overlap}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, bln_allow_overlap: checked === true })
                }
                disabled={isLoading}
              />
              <label 
                htmlFor="allow-overlap" 
                className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                동시 진행 허용
              </label>
            </div>
          </FieldGroup>
          
          <DialogFooter>
            <div className="flex w-full items-center justify-between gap-2">
              {event && onDelete ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => onDelete(event)}
                  disabled={isLoading}
                >
                  삭제
                </Button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                  취소
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Spinner className="mr-2" />}
                  {event ? '수정' : '생성'}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
