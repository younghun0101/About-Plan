'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'sonner'
import { AppShell } from '@/components/app-shell'
import { useData } from '@/contexts/data-context'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
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
import { ClipboardList, Plus, Pencil, Trash2, MessageSquarePlus, X } from 'lucide-react'
import type { BoardPost, BoardItem, BoardPostFormData } from '@/lib/types'

export default function BoardPage() {
  const { user, getOtherUser } = useAuth()
  const { boardPosts, createBoardPost, updateBoardPost, deleteBoardPost, createBoardItem, updateBoardItem, deleteBoardItem, getBoardItems } = useData()
  const otherUser = getOtherUser()
  
  const [selectedPost, setSelectedPost] = useState<BoardPost | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [postToDelete, setPostToDelete] = useState<BoardPost | null>(null)
  const [itemToDelete, setItemToDelete] = useState<BoardItem | null>(null)
  const [formData, setFormData] = useState<BoardPostFormData>({
    str_title: '',
    str_content: '',
  })
  const [newItemContent, setNewItemContent] = useState('')
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingItemContent, setEditingItemContent] = useState('')

  const getUserName = (userId: string) => {
    if (user?.id === userId) return user.name
    if (otherUser?.tbl_user_id === userId) return otherUser.str_name
    return userId
  }

  const handleOpenForm = (post?: BoardPost) => {
    if (post) {
      setSelectedPost(post)
      setFormData({
        str_title: post.str_title,
        str_content: post.str_content,
      })
    } else {
      setSelectedPost(null)
      setFormData({
        str_title: '',
        str_content: '',
      })
    }
    setIsFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.str_title.trim()) {
      toast.error('게시글 제목을 입력해주세요.')
      return
    }

    try {
      if (selectedPost) {
        await updateBoardPost(selectedPost.tbl_board_post_id, formData)
        toast.success('게시글이 수정되었습니다.')
      } else {
        await createBoardPost(formData)
        toast.success('게시글이 생성되었습니다.')
      }
      setIsFormOpen(false)
    } catch {
      toast.error('게시글 저장 중 오류가 발생했습니다.')
    }
  }

  const handleDeletePost = async () => {
    if (postToDelete) {
      try {
        await deleteBoardPost(postToDelete.tbl_board_post_id)
        toast.success('게시글이 삭제되었습니다.')
        setPostToDelete(null)
        setIsDetailOpen(false)
      } catch {
        toast.error('게시글 삭제 중 오류가 발생했습니다.')
      }
    }
  }

  const handleOpenDetail = (post: BoardPost) => {
    setSelectedPost(post)
    setIsDetailOpen(true)
    setNewItemContent('')
    setEditingItemId(null)
  }

  const handleAddItem = async () => {
    if (!newItemContent.trim() || !selectedPost) {
      toast.error('항목 내용을 입력해주세요.')
      return
    }

    try {
      await createBoardItem(selectedPost.tbl_board_post_id, newItemContent.trim())
      toast.success('항목이 추가되었습니다.')
      setNewItemContent('')
    } catch {
      toast.error('항목 추가 중 오류가 발생했습니다.')
    }
  }

  const handleStartEditItem = (item: BoardItem) => {
    setEditingItemId(item.tbl_board_item_id)
    setEditingItemContent(item.str_content)
  }

  const handleSaveEditItem = async () => {
    if (!editingItemContent.trim() || !editingItemId) return

    try {
      await updateBoardItem(editingItemId, editingItemContent.trim())
      toast.success('항목이 수정되었습니다.')
      setEditingItemId(null)
    } catch {
      toast.error('항목 수정 중 오류가 발생했습니다.')
    }
  }

  const handleDeleteItem = async () => {
    if (itemToDelete) {
      try {
        await deleteBoardItem(itemToDelete.tbl_board_item_id)
        toast.success('항목이 삭제되었습니다.')
        setItemToDelete(null)
      } catch {
        toast.error('항목 삭제 중 오류가 발생했습니다.')
      }
    }
  }

  const postItems = selectedPost ? getBoardItems(selectedPost.tbl_board_post_id) : []

  return (
    <AppShell title="게시판">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">게시판</h2>
            <p className="text-muted-foreground">자유롭게 정보를 기입하고 항목을 추가하세요.</p>
          </div>
          <Button onClick={() => handleOpenForm()}>
            <Plus className="h-4 w-4 mr-2" />
            새 게시글
          </Button>
        </div>

        {boardPosts.length === 0 ? (
          <Empty
            icon={<ClipboardList className="h-12 w-12 text-muted-foreground" />}
            title="아직 게시글이 없어요"
            description="첫 글을 남겨보세요!"
            action={{
              label: '작성',
              onClick: () => handleOpenForm(),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {boardPosts.map((post) => {
              const items = getBoardItems(post.tbl_board_post_id)
              return (
                <Card 
                  key={post.tbl_board_post_id} 
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => handleOpenDetail(post)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{post.str_title}</CardTitle>
                        <CardDescription>
                          {getUserName(post.ref_created_by)} | {format(new Date(post.dte_created_at), 'yyyy.M.d', { locale: ko })}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">{items.length}개 항목</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {post.str_content || '(내용 없음)'}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Post form dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{selectedPost ? '게시글 수정' : '새 게시글'}</DialogTitle>
              <DialogDescription>
                자유 형식으로 내용을 작성하세요.
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
                    placeholder="게시글 제목"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="content">내용</FieldLabel>
                  <Textarea
                    id="content"
                    value={formData.str_content}
                    onChange={(e) => setFormData({ ...formData, str_content: e.target.value })}
                    placeholder="내용을 작성하세요..."
                    rows={6}
                  />
                </Field>
              </FieldGroup>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  취소
                </Button>
                <Button type="submit">
                  {selectedPost ? '수정' : '작성'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Post detail dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            {selectedPost && (
              <>
                <DialogHeader>
                  <div className="flex items-start justify-between pr-8">
                    <div>
                      <DialogTitle className="text-xl">{selectedPost.str_title}</DialogTitle>
                      <DialogDescription>
                        {getUserName(selectedPost.ref_created_by)} | {format(new Date(selectedPost.dte_created_at), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                        {selectedPost.dte_updated_at !== selectedPost.dte_created_at && (
                          <span> (수정됨)</span>
                        )}
                      </DialogDescription>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => {
                        setIsDetailOpen(false)
                        handleOpenForm(selectedPost)
                      }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setPostToDelete(selectedPost)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </DialogHeader>

                <div className="py-4">
                  <div className="whitespace-pre-wrap text-sm mb-6">
                    {selectedPost.str_content || '(내용 없음)'}
                  </div>

                  {/* Items section */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <MessageSquarePlus className="h-4 w-4" />
                      항목 ({postItems.length})
                    </h4>

                    <div className="space-y-2 mb-4">
                      {postItems.map((item) => (
                        <div key={item.tbl_board_item_id} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                          {editingItemId === item.tbl_board_item_id ? (
                            <>
                              <Input
                                value={editingItemContent}
                                onChange={(e) => setEditingItemContent(e.target.value)}
                                className="flex-1"
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveEditItem()}
                                autoFocus
                              />
                              <Button size="sm" onClick={handleSaveEditItem}>저장</Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingItemId(null)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <div className="flex-1">
                                <p className="text-sm">{item.str_content}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {getUserName(item.ref_created_by)} | {format(new Date(item.dte_created_at), 'M/d HH:mm')}
                                </p>
                              </div>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStartEditItem(item)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setItemToDelete(item)}>
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Add new item */}
                    <div className="flex gap-2">
                      <Input
                        value={newItemContent}
                        onChange={(e) => setNewItemContent(e.target.value)}
                        placeholder="새 항목 추가..."
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                      />
                      <Button onClick={handleAddItem}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete post confirmation */}
        <AlertDialog open={!!postToDelete} onOpenChange={() => setPostToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>게시글 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                {`"${postToDelete?.str_title}" 게시글을 삭제하시겠습니까? 모든 항목도 함께 삭제됩니다.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeletePost} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete item confirmation */}
        <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>항목 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                이 항목을 삭제하시겠습니까?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppShell>
  )
}
