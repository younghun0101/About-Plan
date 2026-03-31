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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Target, Plus, Pencil, Trash2, ChevronDown, Calendar, Users } from 'lucide-react'
import type { Goal, GoalFormData } from '@/lib/types'

export default function SharedGoalsPage() {
  const { goals, sharedCalendars, createGoal, updateGoal, deleteGoal } = useData()
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null)
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState<GoalFormData>({
    str_title: '',
    str_description: '',
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

  const toggleExpanded = (goalId: string) => {
    const newExpanded = new Set(expandedGoals)
    if (newExpanded.has(goalId)) {
      newExpanded.delete(goalId)
    } else {
      newExpanded.add(goalId)
    }
    setExpandedGoals(newExpanded)
  }

  const handleOpenForm = (goal?: Goal) => {
    if (goal) {
      setSelectedGoal(goal)
      setFormData({
        str_title: goal.str_title,
        str_description: goal.str_description || '',
        dte_deadline: format(new Date(goal.dte_deadline), 'yyyy-MM-dd'),
        ref_shared_calendar_id: goal.ref_shared_calendar_id,
      })
    } else {
      setSelectedGoal(null)
      setFormData({
        str_title: '',
        str_description: '',
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

  const getDaysRemaining = (deadline: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const deadlineDate = new Date(deadline)
    deadlineDate.setHours(0, 0, 0, 0)
    const diff = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const renderGoalItem = (goal: Goal) => {
    const daysRemaining = getDaysRemaining(goal.dte_deadline)
    const isOverdue = daysRemaining < 0 && !goal.bln_is_completed
    const isUrgent = daysRemaining <= 3 && daysRemaining >= 0 && !goal.bln_is_completed
    const hasDescription = goal.str_description && goal.str_description.trim().length > 0

    return (
      <Collapsible 
        key={goal.tbl_goal_id}
        open={expandedGoals.has(goal.tbl_goal_id)}
        onOpenChange={() => hasDescription && toggleExpanded(goal.tbl_goal_id)}
      >
        <div className={`border rounded-lg transition-colors ${
          isOverdue ? 'border-destructive/50 bg-destructive/5' : 
          isUrgent ? 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/20' : 
          'hover:bg-muted/50'
        }`}>
          <div className="flex items-center gap-4 p-4">
            <Checkbox
              checked={goal.bln_is_completed}
              onCheckedChange={() => handleToggleComplete(goal)}
              className="shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`font-medium ${goal.bln_is_completed ? 'line-through text-muted-foreground' : ''}`}>
                  {goal.str_title}
                </p>
                {isOverdue && (
                  <Badge variant="destructive" className="text-xs">지연됨</Badge>
                )}
                {isUrgent && (
                  <Badge className="bg-amber-500 hover:bg-amber-600 text-xs">
                    {daysRemaining === 0 ? '오늘 마감' : `D-${daysRemaining}`}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{format(new Date(goal.dte_deadline), 'yyyy년 M월 d일', { locale: ko })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  <span>{getCalendarName(goal.ref_shared_calendar_id)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {hasDescription && (
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedGoals.has(goal.tbl_goal_id) ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenForm(goal)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setGoalToDelete(goal)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
          {hasDescription && (
            <CollapsibleContent>
              <div className="px-4 pb-4 pt-0">
                <div className="ml-10 p-3 bg-muted/50 rounded-md">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{goal.str_description}</p>
                </div>
              </div>
            </CollapsibleContent>
          )}
        </div>
      </Collapsible>
    )
  }

  return (
    <AppShell title="공동 목표">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">공동 목표</h2>
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
          <div className="space-y-6">
            {pendingGoals.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    진행 중 ({pendingGoals.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingGoals.map(renderGoalItem)}
                </CardContent>
              </Card>
            )}

            {completedGoals.length > 0 && (
              <Card className="opacity-75">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                    완료됨 ({completedGoals.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {completedGoals.map(renderGoalItem)}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[480px]">
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
                    placeholder="함께 달성할 목표를 입력하세요"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="description">세부사항 (선택)</FieldLabel>
                  <Textarea
                    id="description"
                    value={formData.str_description}
                    onChange={(e) => setFormData({ ...formData, str_description: e.target.value })}
                    placeholder="목표에 대한 세부사항이나 메모를 입력하세요..."
                    rows={4}
                    className="resize-none"
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
