'use client'

import { useState, useMemo } from 'react'
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay, differenceInMinutes } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'sonner'
import { AppShell } from '@/components/app-shell'
import { useAuth } from '@/contexts/auth-context'
import { useData } from '@/contexts/data-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Empty } from '@/components/ui/empty'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { BarChart3, Plus, Pencil, Trash2, Calendar } from 'lucide-react'
import type { Category, CategoryFormData, CategoryStyle } from '@/lib/types'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#8DD1E1', '#A4DE6C', '#D0ED57',
]

const colorOptions = [
  { value: '#EF4444', label: '빨강' },
  { value: '#F97316', label: '주황' },
  { value: '#EAB308', label: '노랑' },
  { value: '#22C55E', label: '초록' },
  { value: '#0EA5E9', label: '파랑' },
  { value: '#8B5CF6', label: '보라' },
  { value: '#EC4899', label: '핑크' },
  { value: '#6B7280', label: '회색' },
]

export default function AnalyticsPage() {
  const { user } = useAuth()
  const { events, categories, createCategory, updateCategory, deleteCategory, getUserCategories } = useData()
  
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'custom'>('week')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({
    str_name: '',
    str_color: '#0EA5E9',
    opt_style: 'dot',
  })

  const userCategories = getUserCategories()
  const personalEvents = events.filter(e => e.ref_user_id === user?.id)

  // Calculate date range
  const getDateRange = () => {
    const now = new Date()
    let start: Date
    let end: Date = endOfDay(now)

    switch (dateRange) {
      case 'week':
        start = startOfDay(subWeeks(now, 1))
        break
      case 'month':
        start = startOfDay(subMonths(now, 1))
        break
      case 'custom':
        start = customStartDate ? startOfDay(new Date(customStartDate)) : startOfDay(subWeeks(now, 1))
        end = customEndDate ? endOfDay(new Date(customEndDate)) : end
        break
      default:
        start = startOfDay(subWeeks(now, 1))
    }

    return { start, end }
  }

  // Filter events by date range
  const filteredEvents = useMemo(() => {
    const { start, end } = getDateRange()
    return personalEvents.filter((event) => {
      const eventStart = new Date(event.dte_start_at)
      return eventStart >= start && eventStart <= end
    })
  }, [personalEvents, dateRange, customStartDate, customEndDate])

  // Calculate category statistics
  const categoryStats = useMemo(() => {
    const stats: Record<string, { name: string; color: string; minutes: number; count: number }> = {}
    
    // Initialize with existing categories
    userCategories.forEach((cat) => {
      stats[cat.tbl_category_id] = {
        name: cat.str_name,
        color: cat.str_color,
        minutes: 0,
        count: 0,
      }
    })
    
    // Add "uncategorized" for events without category
    stats['uncategorized'] = {
      name: '미분류',
      color: '#6B7280',
      minutes: 0,
      count: 0,
    }

    filteredEvents.forEach((event) => {
      const categoryId = event.ref_category_id || 'uncategorized'
      if (!stats[categoryId]) return
      
      const duration = differenceInMinutes(new Date(event.dte_end_at), new Date(event.dte_start_at))
      stats[categoryId].minutes += duration
      stats[categoryId].count += 1
    })

    return Object.entries(stats)
      .map(([id, data]) => ({
        id,
        ...data,
        hours: Math.round(data.minutes / 60 * 10) / 10,
      }))
      .filter((item) => item.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes)
  }, [filteredEvents, userCategories])

  const totalMinutes = categoryStats.reduce((sum, item) => sum + item.minutes, 0)
  const totalHours = Math.round(totalMinutes / 60 * 10) / 10

  const handleOpenForm = (category?: Category) => {
    if (category) {
      setSelectedCategory(category)
      setFormData({
        str_name: category.str_name,
        str_color: category.str_color,
        opt_style: category.opt_style,
      })
    } else {
      setSelectedCategory(null)
      setFormData({
        str_name: '',
        str_color: '#0EA5E9',
        opt_style: 'dot',
      })
    }
    setIsFormOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.str_name.trim()) {
      toast.error('카테고리 이름을 입력해주세요.')
      return
    }

    if (selectedCategory) {
      updateCategory(selectedCategory.tbl_category_id, formData)
      toast.success('카테고리가 수정되었습니다.')
    } else {
      createCategory(formData)
      toast.success('카테고리가 생성되었습니다.')
    }
    
    setIsFormOpen(false)
  }

  const handleDelete = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete.tbl_category_id)
      toast.success('카테고리가 삭제되었습니다.')
      setCategoryToDelete(null)
    }
  }

  const { start, end } = getDateRange()

  return (
    <AppShell title="카테고리 분석">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">카테고리 분석</h2>
            <p className="text-muted-foreground">
              {format(start, 'yyyy년 M월 d일', { locale: ko })} - {format(end, 'yyyy년 M월 d일', { locale: ko })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
              <TabsList>
                <TabsTrigger value="week">한 주</TabsTrigger>
                <TabsTrigger value="month">한 달</TabsTrigger>
                <TabsTrigger value="custom">직접 입력</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Custom date range */}
        {dateRange === 'custom' && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-4 items-end">
                <Field className="flex-1 min-w-[150px]">
                  <FieldLabel>시작일</FieldLabel>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </Field>
                <Field className="flex-1 min-w-[150px]">
                  <FieldLabel>종료일</FieldLabel>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </Field>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>총 일정 수</CardDescription>
              <CardTitle className="text-3xl">{filteredEvents.length}개</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>총 시간</CardDescription>
              <CardTitle className="text-3xl">{totalHours}시간</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>카테고리 수</CardDescription>
              <CardTitle className="text-3xl">{userCategories.length}개</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Charts */}
        {categoryStats.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie chart */}
            <Card>
              <CardHeader>
                <CardTitle>카테고리 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="minutes"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`${Math.round(value / 60 * 10) / 10}시간`, '시간']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Bar chart */}
            <Card>
              <CardHeader>
                <CardTitle>카테고리별 시간</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryStats} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" unit="시간" />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip formatter={(value: number) => [`${value}시간`, '시간']} />
                      <Bar dataKey="hours" fill="var(--color-primary)">
                        {categoryStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <Empty
                icon={<Calendar className="h-12 w-12 text-muted-foreground" />}
                title="선택한 기간에 일정이 없습니다"
                description="다른 기간을 선택하거나 일정을 추가해보세요."
              />
            </CardContent>
          </Card>
        )}

        {/* Category list */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>카테고리 관리</CardTitle>
              <Button onClick={() => handleOpenForm()}>
                <Plus className="h-4 w-4 mr-2" />
                카테고리 추가
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {userCategories.length === 0 ? (
              <Empty
                icon={<BarChart3 className="h-12 w-12 text-muted-foreground" />}
                title="카테고리가 없습니다"
                description="카테고리를 만들어 일정을 분류해보세요."
                action={{
                  label: '카테고리 추가',
                  onClick: () => handleOpenForm(),
                }}
              />
            ) : (
              <div className="space-y-2">
                {userCategories.map((category) => {
                  const stat = categoryStats.find((s) => s.id === category.tbl_category_id)
                  return (
                    <div 
                      key={category.tbl_category_id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full ${category.opt_style === 'highlight' ? 'rounded-sm' : ''}`}
                          style={{ backgroundColor: category.str_color }}
                        />
                        <span className="font-medium">{category.str_name}</span>
                        {stat && (
                          <span className="text-sm text-muted-foreground">
                            ({stat.count}개, {stat.hours}시간)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenForm(category)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setCategoryToDelete(category)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category form dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>{selectedCategory ? '카테고리 수정' : '새 카테고리'}</DialogTitle>
              <DialogDescription>
                일정을 분류할 카테고리를 만드세요.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <FieldGroup className="py-4">
                <Field>
                  <FieldLabel htmlFor="name">이름</FieldLabel>
                  <Input
                    id="name"
                    value={formData.str_name}
                    onChange={(e) => setFormData({ ...formData, str_name: e.target.value })}
                    placeholder="카테고리 이름"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="color">색상</FieldLabel>
                  <Select
                    value={formData.str_color}
                    onValueChange={(value) => setFormData({ ...formData, str_color: value })}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: formData.str_color }}
                          />
                          {colorOptions.find((c) => c.value === formData.str_color)?.label || '색상 선택'}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: color.value }}
                            />
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="style">스타일</FieldLabel>
                  <Select
                    value={formData.opt_style}
                    onValueChange={(value: CategoryStyle) => setFormData({ ...formData, opt_style: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="스타일 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dot">점</SelectItem>
                      <SelectItem value="highlight">형광펜</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  취소
                </Button>
                <Button type="submit">
                  {selectedCategory ? '수정' : '생성'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation */}
        <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>카테고리 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                {`"${categoryToDelete?.str_name}" 카테고리를 삭제하시겠습니까? 해당 카테고리가 적용된 일정의 카테고리는 해제됩니다.`}
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
