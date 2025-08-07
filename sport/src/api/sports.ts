import api from './index';
import type { 
  SportsData, 
  WeatherData, 
  SportStats, 
  Achievement, 
  ApiResponse 
} from './types';

// 获取今日运动数据
export const getTodaySportsData = (): Promise<ApiResponse<SportsData>> => {
  return api.get('/sports/today');
};

// 获取运动统计数据
export const getSportStats = (days: number = 30): Promise<ApiResponse<SportStats>> => {
  return api.get(`/sports/stats?days=${days}`);
};

// 更新运动数据
export const updateSportsData = (data: Partial<SportsData>): Promise<ApiResponse<SportsData>> => {
  return api.post('/sports/update', data);
};

// 获取天气数据
export const getWeatherData = (city?: string): Promise<ApiResponse<WeatherData>> => {
  return api.get(`/weather/current${city ? `?city=${city}` : ''}`);
};

// 获取成就列表
export const getAchievements = (): Promise<ApiResponse<Achievement[]>> => {
  return api.get('/sports/achievements');
};

// 记录运动活动
export const recordSportsActivity = (data: {
  type: 'running' | 'walking' | 'cycling' | 'swimming' | 'other';
  duration: number; // 分钟
  distance?: number; // 公里
  calories?: number;
}): Promise<ApiResponse<SportsData>> => {
  return api.post('/sports/record', data);
};

// 设置运动目标
export const setSportsGoal = (goal: number): Promise<ApiResponse<{ success: boolean }>> => {
  return api.post('/sports/goal', { goal });
};

// 获取历史运动数据
export const getHistorySportsData = (params: {
  startDate: string;
  endDate: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<SportsData[]>> => {
  return api.get('/sports/history', { params });
}; 