// 路由路径常量
export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  LOGIN: '/login',
  REGISTER: '/register',
  GUIDE: '/guide',
  PREFERENCES: '/preferences',
  COMMUNITY: '/community',
  SPORTS: '/sports',
  BOOKING: '/booking',
  SPORTS_EVENTS: '/sports-events',
  PROFILE: '/profile',
  PROFILE_SETTINGS: '/profile/settings'
} as const;

// 路由元信息类型
export interface RouteMetadata {
  title: string;
  requiresAuth?: boolean;
  showInBottomNav?: boolean;
  icon?: string;
}

// 路由配置映射
export const ROUTE_METADATA: Record<string, RouteMetadata> = {
  [ROUTES.HOME]: {
    title: '主页',
    showInBottomNav: true,
    icon: '🏠'
  },
  [ROUTES.COMMUNITY]: {
    title: '运动圈',
    showInBottomNav: true,
    icon: '👥'
  },
  [ROUTES.SPORTS]: {
    title: '运动',
    showInBottomNav: true,
    icon: '🏃'
  },
  [ROUTES.BOOKING]: {
    title: '运动馆',
    showInBottomNav: true,
    icon: '🏢'
  },
  [ROUTES.PROFILE]: {
    title: '我的',
    requiresAuth: true,
    showInBottomNav: true,
    icon: '👤'
  },
  [ROUTES.AUTH]: {
    title: '登录注册'
  },
  [ROUTES.GUIDE]: {
    title: '基础规范说明'
  },
  [ROUTES.PREFERENCES]: {
    title: '喜好选择'

  },
  [ROUTES.SPORTS_EVENTS]: {
    title: '体育赛事'
  },
};

