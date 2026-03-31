'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AppShell } from '@/components/app-shell'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
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
import { LogOut, Trash2 } from 'lucide-react'
import { clearData } from '@/lib/store'

export default function SettingsPage() {
  const { user, logout, getOtherUser } = useAuth()
  const router = useRouter()
  const [showClearDialog, setShowClearDialog] = useState(false)

  const otherUser = getOtherUser()

  const handleLogout = () => {
    logout()
    router.push('/login')
    toast.success('로그아웃되었습니다.')
  }

  const handleClearData = () => {
    clearData()
    logout()
    router.push('/login')
    toast.success('모든 데이터가 초기화되었습니다.')
  }

  return (
    <AppShell title="설정">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle>프로필</CardTitle>
            <CardDescription>현재 로그인된 계정 정보입니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{user?.name}</h3>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Partner info */}
        {otherUser && (
          <Card>
            <CardHeader>
              <CardTitle>파트너</CardTitle>
              <CardDescription>함께 사용 중인 파트너 정보입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    {otherUser.str_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{otherUser.str_name}</h3>
                  <p className="text-sm text-muted-foreground">{otherUser.str_email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Account actions */}
        <Card>
          <CardHeader>
            <CardTitle>계정</CardTitle>
            <CardDescription>계정 관련 작업을 수행합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </Button>
            
            <Separator />
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-destructive">위험 구역</h4>
              <Button 
                variant="destructive" 
                className="w-full justify-start"
                onClick={() => setShowClearDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                모든 데이터 초기화
              </Button>
              <p className="text-xs text-muted-foreground">
                모든 일정, 목표, 미팅 노트, 게시판 글이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* App info */}
        <Card>
          <CardHeader>
            <CardTitle>앱 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>ABOUT Plan v1.0</p>
            <p>개인 & 공동 플랜 통합 관리 앱</p>
            <p>데이터는 브라우저의 로컬 스토리지에 저장됩니다.</p>
          </CardContent>
        </Card>

        <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>모든 데이터 초기화</AlertDialogTitle>
              <AlertDialogDescription>
                정말로 모든 데이터를 삭제하시겠습니까? 모든 일정, 목표, 미팅 노트, 게시판 글, 카테고리가 삭제되며, 이 작업은 되돌릴 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                초기화
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppShell>
  )
}
