import api from './index'

// Banner相关的API接口类型定义
export interface BannerData {
  _id?: string
  locationType: '首页banner位' | '快捷功能' | '活动'
  title: string
  subtitle?: string
  imageUrl: string
  redirectType: '内部' | '外部'
  redirectUrl?: string
  startTime: string
  endTime: string
  status: '待发布' | '已发布' | '已下线' | 'active' | 'inactive'
  sortOrder: number
  // 快捷功能专用字段
  icon?: string
  type?: 'booking' | 'activity' | 'event' | 'preference' | 'youth'
  // 活动专用字段
  description?: string
  participants?: number
  category?: string
  location?: string
  createdAt?: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
  code: number
}

export interface QueryParams {
  title?: string
  status?: string
  locationType?: string
  startTime?: string
  endTime?: string
  page?: number
  limit?: number
}

// Banner管理API
export const bannerApi = {
  // 获取Banner列表
  getBanners: (params?: QueryParams): Promise<ApiResponse<BannerData[]>> => {
    return api.get('/api/banners', { params })
  },

  // 获取快捷功能列表
  getQuickActions: (params?: QueryParams): Promise<ApiResponse<BannerData[]>> => {
    return api.get('/api/quickActions', { params })
  },

  // 获取活动列表
  getActivities: (params?: QueryParams): Promise<ApiResponse<BannerData[]>> => {
    return api.get('/api/activities', { params })
  },

  // 创建Banner/快捷功能/活动
  createBanner: (data: Omit<BannerData, '_id' | 'createdAt'>): Promise<ApiResponse<BannerData>> => {
    return api.post('/api/banners', data)
  },

  // 更新Banner/快捷功能/活动
  updateBanner: (id: string, data: Partial<BannerData>): Promise<ApiResponse<BannerData>> => {
    return api.put(`/api/banners/${id}`, data)
  },

  // 删除Banner/快捷功能/活动
  deleteBanner: (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`/api/banners/${id}`)
  },

  // 批量更新排序
  updateSortOrder: (items: { id: string; sortOrder: number }[]): Promise<ApiResponse<void>> => {
    return api.put('/api/banners/sort', { items })
  },

  // 切换状态
  toggleStatus: (id: string): Promise<ApiResponse<BannerData>> => {
    return api.put(`/api/banners/${id}/toggle`)
  }
}

export default bannerApi 