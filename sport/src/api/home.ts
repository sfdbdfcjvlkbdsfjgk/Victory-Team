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
  // 连接到hou后端的API
  return api.get('/api/banners')
}

// 获取快捷功能
export const getQuickActions = (): Promise<ApiResponse<QuickAction[]>> => {
  return api.get('/api/quickActions')
}

// 获取通知列表
export const getNotifications = (params: BaseQueryParams = {}): Promise<ApiResponse<Notification[]>> => {
  return api.get('/api/notifications', { params })
}

// 获取热门活动
export const getHotActivities = (params: BaseQueryParams = {}): Promise<ApiResponse<Activity[]>> => {
  return api.get('/api/activities', { params })
}

// 获取功能介绍
export const getFeatureIntros = (): Promise<ApiResponse<FeatureIntro[]>> => {
  return api.get('/api/featureIntros')
}

// 获取分类标签
export const getCategoryTags = (): Promise<ApiResponse<CategoryTag[]>> => {
  return api.get('/api/categoryTags')
}

// 活动报名 - 修复API路径
export const joinActivity = (activityId: string): Promise<ApiResponse<any>> => {
  return api.post('/api/activities/join', { activityId })
}

// 标记通知为已读 - 修复API路径
export const markNotificationRead = (notificationId: string): Promise<ApiResponse<any>> => {
  return api.put(`/api/notifications/${notificationId}/read`)
}

// 获取未读消息数量 - 使用模拟数据
export const getUnreadCount = (): Promise<ApiResponse<any>> => {
  return Promise.resolve({
    success: true,
    data: {
      system: Math.floor(Math.random() * 5),
      sports: Math.floor(Math.random() * 3),
      total: Math.floor(Math.random() * 8)
    },
    message: '获取未读数量成功',
    code: 200
  })
}

// 清除红点提示 - 使用模拟数据
export const clearRedDot = (category: 'system' | 'sports' | 'all' = 'all'): Promise<ApiResponse<any>> => {
  return Promise.resolve({
    success: true,
    data: { cleared: true, category },
    message: '红点清除成功',
    code: 200
  })
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