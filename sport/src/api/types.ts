// 活动类型
export interface Activity {
  _id: string
  title: string
  description?: string
  imageUrl: string
  participants: number
  status: 'active' | 'ended' | 'upcoming'
  category: string
  startTime: string
  endTime: string
  location?: string
  createdAt: string
}

// Banner横幅类型（与hou后端模型完全匹配）
export interface Banner {
  _id: string
  // 运营位类型 - 与hou后端枚举值匹配
  locationType: '首页banner位' | '快捷功能' | '活动'
  title: string
  subtitle?: string
  imageUrl: string
  redirectType: '内部' | '外部'
  redirectUrl: string
  startTime: string | Date
  endTime: string | Date
  // 状态 - 与hou后端枚举值匹配  
  status: '待发布' | '已发布' | '已下线' | 'active' | 'inactive' | 'ended' | 'upcoming'
  sortOrder?: number
  createdAt: string | Date
  // 快捷功能专用字段
  icon?: string
  type?: 'booking' | 'activity' | 'event' | 'preference' | 'youth'
  // 活动专用字段  
  description?: string
  participants?: number
  category?: string
  location?: string
}

// 通知类型
export interface Notification {
  _id: string
  title: string
  content: string
  type: 'info' | 'warning' | 'success' | 'error'
  category: 'system' | 'sports' // 消息分类
  isRead: boolean
  showRedDot: boolean // 是否显示红点
  priority: number // 优先级
  createdAt: string
}

// 未读消息统计
export interface UnreadCount {
  system: number
  sports: number
  total: number
}

// 功能介绍类型
export interface FeatureIntro {
  _id: string
  title: string
  icon: string
  description: string
  features: FeatureItem[]
  type: 'management' | 'display' | 'model' | 'service' | 'sports'
  status: 'active' | 'inactive'
}

export interface FeatureItem {
  label: string
  content: string
}

// 快捷功能类型
export interface QuickAction {
  _id: string
  title: string
  icon: string
  type: 'booking' | 'activity' | 'event' | 'preference' | 'youth'
  redirectUrl: string
  sortOrder: number
  status: 'active' | 'inactive'
}

// 分类标签类型
export interface CategoryTag {
  _id: string
  name: string
  isActive: boolean
  sortOrder: number
}

// API响应通用格式
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  success: boolean
}

// 体育内容类型
export interface Content {
  _id: string
  title: string
  content: string
  type: 'article' | 'video'
  coverImage: string
  videoUrl?: string
  videoDuration?: number
  author: {
    name: string
    avatar: string
  }
  viewCount: number
  likeCount: number
  commentCount: number
  shareCount: number
  tags: string[]
  category: string
  status: 'draft' | 'published' | 'archived'
  featured: boolean
  publishedAt: string
  createdAt: string
}

// 用户互动状态
export interface UserActions {
  liked: boolean
  commented: boolean
  shared: boolean
}

// 内容列表响应
export interface ContentListResponse {
  list: Content[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// 运动数据类型
export interface SportsData {
  _id: string
  userId: string
  date: string
  steps: number
  distance: number // 公里
  calories: number
  activeMinutes: number
  goal: number
  createdAt: string
  updatedAt: string
}

// 天气数据类型
export interface WeatherData {
  _id?: string
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
  city: string
  date: string
  icon?: string
}

// 运动统计类型
export interface SportStats {
  totalDistance: number
  totalSteps: number
  totalCalories: number
  averageDaily: {
    steps: number
    distance: number
    calories: number
  }
  achievements: Achievement[]
}

// 成就类型
export interface Achievement {
  _id: string
  title: string
  description: string
  icon: string
  unlockedAt?: string
  progress: number
  target: number
}

// 查询参数基础类型
export interface BaseQueryParams {
  page?: number
  limit?: number
  status?: string
} 