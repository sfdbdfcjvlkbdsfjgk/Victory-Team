// API服务配置
const API_BASE_URL = 'http://localhost:3000/api';

// 通用请求函数
const request = async (url: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API请求失败:', error);
    throw error;
  }
};

// ======================== 横幅相关API ========================

export const bannerApi = {
  // 获取首页横幅
  getBanners: () => request('/banners'),
  
  // 获取快捷功能
  getQuickActions: () => request('/quickActions'),
  
  // 获取活动数据
  getActivities: () => request('/activities'),
};

// ======================== 通知相关API ========================

export const notificationApi = {
  // 获取通知列表
  getNotifications: () => request('/notifications'),
  
  // 标记通知为已读
  markAsRead: (id: string) => request(`/notifications/${id}/read`, {
    method: 'PUT',
  }),
};

// ======================== 功能介绍相关API ========================

export const featureApi = {
  // 获取功能介绍
  getFeatureIntros: () => request('/featureIntros'),
};

// ======================== 分类标签相关API ========================

export const categoryApi = {
  // 获取分类标签
  getCategoryTags: () => request('/categoryTags'),
  
  // 切换标签状态
  toggleTag: (id: string) => request(`/categoryTags/${id}/toggle`, {
    method: 'PUT',
  }),
};

// ======================== 体育赛事相关API ========================

export const sportsEventsApi = {
  // 获取问卷
  getQuestionnaire: () => request('/sports-events/questionnaire'),
  
  // 提交问卷答案
  submitAnswer: (data: {
    questionnaireId: string;
    userId: string;
    questionId: string;
    answer: any;
  }) => request('/sports-events/questionnaire/response', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // 完成问卷
  completeQuestionnaire: (data: {
    questionnaireId: string;
    userId: string;
  }) => request('/sports-events/questionnaire/complete', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // 获取推荐结果
  getRecommendations: (userId: string) => request(`/sports-events/recommendations/${userId}`),
};

// ======================== 运动数据相关API ========================

export const sportsApi = {
  // 获取今日运动数据
  getTodaySports: () => request('/sports/today'),
  
  // 获取当前天气
  getCurrentWeather: () => request('/weather/current'),
  
  // 获取运动统计
  getSportsStats: () => request('/sports/stats'),
  
  // 刷新运动数据
  refreshSportsData: (data: {
    currentSteps?: number;
    currentDistance?: number;
    currentCalories?: number;
  }) => request('/sports/refresh', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// ======================== 系统相关API ========================

export const systemApi = {
  // 健康检查
  healthCheck: () => request('/health'),
};

// ======================== 通用API响应类型 ========================

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  code: number;
}

// ======================== 错误处理 ========================

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ======================== 统一导出 ========================

export const api = {
  banner: bannerApi,
  notification: notificationApi,
  feature: featureApi,
  category: categoryApi,
  sportsEvents: sportsEventsApi,
  sports: sportsApi,
  system: systemApi,
}; 