'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'sonner'
import { AppShell } from '@/components/app-shell'
import { useData } from '@/contexts/data-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Empty } from '@/components/ui/empty'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
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
import { Target, Plus, Pencil, Trash2 } from 'lucide-react'
import type { Goal, GoalFormData } from '@/lib/types'

export default function SharedGoalsPage() {
  const { goals, sharedCalendars, createGoal, updateGoal, deleteGoal } = useData()
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null)
  const [formData, setFormData] = useState<GoalFormData>({
    str_title: '',
    dte_deadline: '',
    ref_shared_calendar_id: sharedCalendars[0]?.tbl_shared_calendar_id || null,
  })

  const sharedGoals = goals.filter(g => g.ref_shared_calendar_id !== null)
  const pendingGoals = sharedGoals.filter(g => !g.bln_is_completed)
  const completedGoals = sharedGoals.filter(g => g.bln_is_completed)

  const getCalendarName = (calendarId: string | null) => {
    if (!calendarId) return '알 수 없음'
    const calendar = sharedCalendars.find(c => c.tbl_shared_calendar_id === calendarId)
    return calendar?.str_name || '알 수 없음'
  }

  const handleOpenForm = (goal?: Goal) => {
    if (goal) {
      setSelectedGoal(goal)
      setFormData({
        str_title: goal.str_title,
        dte_deadline: format(new Date(goal.dte_deadline), 'yyyy-MM-dd'),
        ref_shared_calendar_id: goal.ref_shared_calendar_id,
      })
    } else {
      setSelectedGoal(null)
      setFormData({
        str_title: '',
        dte_deadline: '',
        ref_shared_calendar_id: sharedCalendars[0]?.tbl_shared_calendar_id || null,
      })
    }
    setIsFormOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.str_title.trim()) {
      toast.error('목표 제목을 입력해주세요.')
      return
    }
    
    if (!formData.dte_deadline) {
      toast.error('데드라인을 입력해주세요.')
      return
    }

    if (!formData.ref_shared_calendar_id) {
      toast.error('공동 캘린더를 선택해주세요.')
      return
    }

    if (selectedGoal) {
      updateGoal(selectedGoal.tbl_goal_id, formData)
      toast.success('목표가 수정되었습니다.')
    } else {
      createGoal(formData)
      toast.success('목표가 생성되었습니다.')
    }
    
    setIsFormOpen(false)
  }

  const handleToggleComplete = (goal: Goal) => {
    updateGoal(goal.tbl_goal_id, { bln_is_completed: !goal.bln_is_completed })
    toast.success(goal.bln_is_completed ? '목표가 미완료 상태로 변경되었습니다.' : '목표가 완료되었습니다!')
  }

  const handleDelete = () => {
    if (goalToDelete) {
      deleteGoal(goalToDelete.tbl_goal_id)
      toast.success('목표가 삭제되었습니다.')
      setGoalToDelete(null)
    }
  }

  const renderGoalItem = (goal: Goal) => (
    <div key={goal.tbl_goal_id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <Checkbox
        checked={goal.bln_is_completed}
        onCheckedChange={() => handleToggleComplete(goal)}
      />
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${goal.bln_is_completed ? 'line-through text-muted-foreground' : ''}`}>
          {goal.str_title}
        </p>
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span>데드라인: {format(new Date(goal.dte_deadline), 'yyyy년 M월 d일', { locale: ko })}</span>
          <span>|</span>
          <span>{getCalendarName(goal.ref_shared_calendar_id)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => handleOpenForm(goal)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setGoalToDelete(goal)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  )

  return (
    <AppShell title="공동 목표">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">공동 목표</h2>
            <p className="text-muted-foreground">두 사람이 함께 달성할 목표를 설정하세요.</p>
          </div>
          <Button onClick={() => handleOpenForm()} disabled={sharedCalendars.length === 0}>
            <Plus className="h-4 w-4 mr-2" />
            목표 추가
          </Button>
        </div>

        {sharedCalendars.length === 0 ? (
          <Empty
            icon={<Target className="h-12 w-12 text-muted-foreground" />}
            title="공동 캘린더가 없습니다"
            description="먼저 공동 캘린더를 만들어주세요."
          />
        ) : sharedGoals.length === 0 ? (
          <Empty
            icon={<Target className="h-12 w-12 text-muted-foreground" />}
            title="공동 목표를 설정하면 캘린더에 자동으로 표시됩니다"
            description="첫 번째 공동 목표를 추가해보세요."
            action={{
              label: '목표 추가',
              onClick: () => handleOpenForm(),
            }}
          />
        ) : (
          <>
            {pendingGoals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>진행 중 ({pendingGoals.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {pendingGoals.map(renderGoalItem)}
                </CardContent>
              </Card>
            )}

            {completedGoals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>완료됨 ({completedGoals.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {completedGoals.map(renderGoalItem)}
                </CardContent>
              </Card>
            )}
          </>
        )}

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{selectedGoal ? '목표 수정' : '새 공동 목표'}</DialogTitle>
              <DialogDescription>
                목표와 데드라인을 설정하세요. 공동 캘린더에 자동으로 표시됩니다.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <FieldGroup className="py-4">
                <Field>
                  <FieldLabel htmlFor="title">목표</FieldLabel>
                  <Input
                    id="title"
                    value={formData.str_title}
                    onChange={(e) => setFormData({ ...formData, str_title: e.target.value })}
                    placeholder="목표를 입력하세요"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="deadline">데드라인</FieldLabel>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.dte_deadline}
                    onChange={(e) => setFormData({ ...formData, dte_deadline: e.target.value })}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="calendar">공동 캘린더</FieldLabel>
                  <Select
                    value={formData.ref_shared_calendar_id || ''}
                    onValueChange={(value) => setFormData({ ...formData, ref_shared_calendar_id: value })}
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
              </FieldGroup>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  취소
                </Button>
                <Button type="submit">
                  {selectedGoal ? '수정' : '생성'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!goalToDelete} onOpenChange={() => setGoalToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>목표 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                {`"${goalToDelete?.str_title}" 목표를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
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
      </div>
    </AppShell>
  )
}
