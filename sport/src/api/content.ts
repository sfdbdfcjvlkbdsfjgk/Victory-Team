import api from './index'
import type { 
  Content, 
  UserActions, 
  ContentListResponse,
  ApiResponse 
} from './types'

// 获取内容列表
export const getContentList = (params: {
  type?: 'article' | 'video' | 'all'
  category?: string
  featured?: boolean
  limit?: number
  page?: number
} = {}): Promise<ApiResponse<ContentListResponse>> => {
  return api.get('/content/list', { params })
}

// 获取内容详情
export const getContentDetail = (id: string): Promise<ApiResponse<Content>> => {
  return api.get(`/content/${id}`)
}

// 点赞/取消点赞
export const toggleLike = (id: string, userId?: string): Promise<ApiResponse<{ liked: boolean }>> => {
  return api.post(`/content/${id}/like`, { userId })
}

// 评论
export const addComment = (id: string, commentText: string, userId?: string): Promise<ApiResponse<any>> => {
  return api.post(`/content/${id}/comment`, { commentText, userId })
}

// 分享
export const shareContent = (id: string, userId?: string): Promise<ApiResponse<any>> => {
  return api.post(`/content/${id}/share`, { userId })
}

// 获取用户互动状态
export const getUserActions = (id: string, userId?: string): Promise<ApiResponse<UserActions>> => {
  return api.get(`/content/${id}/user-actions`, { params: { userId } })
}

export default {
  getContentList,
  getContentDetail,
  toggleLike,
  addComment,
  shareContent,
  getUserActions
} 