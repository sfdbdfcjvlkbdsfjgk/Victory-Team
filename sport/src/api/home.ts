import api from './index'
import type { 
  Activity, 
  Banner, 
  Notification, 
  FeatureIntro, 
  QuickAction, 
  CategoryTag,
  ApiResponse,
  BaseQueryParams 
} from './types'

// 获取首页横幅（连接到hou后端）
export const getHomeBanner = (): Promise<ApiResponse<Banner[]>> => {
  // 连接到hou后端的前端专用API
  return api.get('/home/banner')
}

// 获取快捷功能
export const getQuickActions = (): Promise<ApiResponse<QuickAction[]>> => {
  return api.get('/home/quick-actions')
}

// 获取通知列表
export const getNotifications = (params: BaseQueryParams = {}): Promise<ApiResponse<Notification[]>> => {
  return api.get('/home/notifications', { params })
}

// 获取热门活动
export const getHotActivities = (params: BaseQueryParams = {}): Promise<ApiResponse<Activity[]>> => {
  return api.get('/home/activities', { params })
}

// 获取功能介绍
export const getFeatureIntros = (): Promise<ApiResponse<FeatureIntro[]>> => {
  return api.get('/home/feature-intros')
}

// 获取分类标签
export const getCategoryTags = (): Promise<ApiResponse<CategoryTag[]>> => {
  return api.get('/home/category-tags')
}

// 活动报名
export const joinActivity = (activityId: string): Promise<ApiResponse<any>> => {
  return api.post('/activities/join', { activityId })
}

// 标记通知为已读
export const markNotificationRead = (notificationId: string): Promise<ApiResponse<any>> => {
  return api.post('/notifications/read', { notificationId })
}

// 获取未读消息数量
export const getUnreadCount = (): Promise<ApiResponse<any>> => {
  return api.get('/notifications/unread-count')
}

// 清除红点提示
export const clearRedDot = (category: 'system' | 'sports' | 'all' = 'all'): Promise<ApiResponse<any>> => {
  return api.post('/notifications/clear-red-dot', { category })
}

export default {
  getHomeBanner,
  getQuickActions,
  getNotifications,
  getHotActivities,
  getFeatureIntros,
  getCategoryTags,
  joinActivity,
  markNotificationRead,
  getUnreadCount,
  clearRedDot
} 