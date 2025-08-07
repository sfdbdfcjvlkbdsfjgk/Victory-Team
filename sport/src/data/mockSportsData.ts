import type { SportsData, WeatherData, SportStats, Achievement } from '../api/types';

// 模拟今日运动数据 - 从0开始
export const mockTodaySports: SportsData = {
  _id: '1',
  userId: 'mock_user',
  date: new Date().toISOString().split('T')[0],
  steps: 0,
  distance: 0,
  calories: 0,
  activeMinutes: 0,
  goal: 10000,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// 模拟天气数据
export const mockWeather: WeatherData = {
  _id: '1',
  temperature: 28,
  condition: '晴',
  humidity: 65,
  windSpeed: 5,
  city: '厦门',
  date: new Date().toISOString().split('T')[0],
  icon: '☀️'
};

// 模拟运动统计数据 - 从较小值开始
export const mockSportsStats: SportStats = {
  totalDistance: 0,
  totalSteps: 0,
  totalCalories: 0,
  averageDaily: {
    steps: 0,
    distance: 0,
    calories: 0
  },
  achievements: [
    {
      _id: '1',
      title: '步行新手',
      description: '累计步行5000步',
      icon: '🚶‍♂️',
      target: 5000,
      progress: 0,
      unlockedAt: undefined
    },
    {
      _id: '2',
      title: '步行达人',
      description: '累计步行50000步',
      icon: '🏃‍♂️',
      target: 50000,
      progress: 0,
      unlockedAt: undefined
    },
    {
      _id: '3',
      title: '马拉松挑战者',
      description: '累计步行100000步',
      icon: '🏆',
      target: 100000,
      progress: 0,
      unlockedAt: undefined
    },
    {
      _id: '4',
      title: '距离新手',
      description: '累计跑步10公里',
      icon: '🎯',
      target: 10,
      progress: 0,
      unlockedAt: undefined
    },
    {
      _id: '5',
      title: '长跑健将',
      description: '累计跑步100公里',
      icon: '🚀',
      target: 100,
      progress: 0,
      unlockedAt: undefined
    }
  ]
};

// 模拟历史运动数据
export const mockHistorySports: SportsData[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - i);
  
  return {
    _id: `history_${i}`,
    userId: 'mock_user',
    date: date.toISOString().split('T')[0],
    steps: Math.floor(Math.random() * 5000) + 5000,
    distance: Math.round((Math.random() * 3 + 2) * 100) / 100,
    calories: Math.floor(Math.random() * 150) + 200,
    activeMinutes: Math.floor(Math.random() * 40) + 40,
    goal: 10000,
    createdAt: date.toISOString(),
    updatedAt: date.toISOString()
  };
});

// 励志语句数组
export const motivationalQuotes = [
  "看着镜子里的马甲线，曾经的胖子如今都是倍棒的！",
  "每一滴汗水都是对未来更好自己的投资！",
  "坚持运动，让健康成为一种生活方式！",
  "今天的努力，是为了明天更强壮的自己！",
  "运动不是惩罚，而是对身体最好的奖励！"
];

// 随机获取励志语句
export const getRandomQuote = (): string => {
  return motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
}; 