import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:3000', // 后端服务地址
  timeout: 5000
})

// Banner接口类型定义（与hou后端模型完全匹配）
export interface Banner {
  _id?: string
  // 运营位类型 - 与hou后端枚举值匹配
  locationType: '首页banner位' | '快捷功能' | '活动'
  title: string
  subtitle?: string  // 副标题字段
  imageUrl: string
  redirectType: '内部' | '外部'
  redirectUrl: string
  startTime: string | Date
  endTime: string | Date
  // 状态 - 与hou后端枚举值匹配
  status: '待发布' | '已发布' | '已下线' | 'active' | 'inactive' | 'ended' | 'upcoming'
  sortOrder?: number
  createdAt?: string | Date
  // 快捷功能专用字段
  icon?: string
  type?: 'booking' | 'activity' | 'event' | 'preference' | 'youth'
  // 活动专用字段  
  description?: string
  participants?: number
  category?: string
  location?: string
}

// 查询参数类型
export interface BannerQueryParams {
  title?: string
  status?: string
  locationType?: string
}

// 获取Banner列表
export const getBannerList = (params: BannerQueryParams = {}) => {
  return api.get('/banner/list', { params })
}

// 添加Banner
export const addBanner = (data: Banner) => {
  return api.post('/banner/add', data)
}

// 更新Banner
export const updateBanner = (data: Partial<Banner> & { _id: string }) => {
  return api.post('/banner/update', data)
}

// 删除Banner
export const deleteBanner = (id: string) => {
  return api.post('/banner/delete', { _id: id })
}

// 获取Banner详情
export const getBannerDetail = (id: string) => {
  return api.get(`/banner/detail/${id}`)
}

// 更新Banner状态（上线/下线）
export const updateBannerStatus = (id: string, status: '待发布' | '已发布' | '已下线') => {
  return api.post('/banner/updateStatus', { _id: id, status })
}

// 更新Banner排序
export const updateBannerSort = (data: Array<{_id: string, sortOrder: number}>) => {
  return api.post('/banner/updateSort', { items: data })
}

// Excel导入导出API
export const importExcel = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/banner/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 导出Excel
export const exportExcel = (params: {
  selectedIds?: string[]
  filters?: BannerQueryParams
}) => {
  return api.post('/banner/export', params, {
    responseType: 'blob' // 重要：设置响应类型为blob
  })
}

// 下载导入模板
export const downloadTemplate = () => {
  return api.get('/banner/template', {
    responseType: 'blob'
  })
}

// 获取导入导出任务状态（如果需要异步处理）
export const getTaskStatus = (taskId: string) => {
  return api.get(`/banner/task/${taskId}`)
}

export default {
  getBannerList,
  addBanner,
  updateBanner,
  deleteBanner,
  getBannerDetail,
  updateBannerStatus,
  updateBannerSort,
  importExcel,
  exportExcel,
  downloadTemplate,
  getTaskStatus
} 