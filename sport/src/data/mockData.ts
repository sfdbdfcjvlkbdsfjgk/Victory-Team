import type {
  Activity,
  Banner,
  Notification,
  FeatureIntro,
  QuickAction,
  CategoryTag,
  ApiResponse
} from '../api/types';

// 模拟横幅数据（匹配hou后端数据结构）
export const mockBanners: Banner[] = [
  {
    _id: '1',
    locationType: '首页banner位',
    title: '为蓝一小时',
    subtitle: '国防号召技术上岗',
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop',
    redirectType: '内部',
    redirectUrl: '/activity/1',
    startTime: '2024-01-01',
    endTime: '2024-12-31',
    status: '已发布',
    sortOrder: 1,
    createdAt: '2024-02-01'
  },
  {
    _id: '2',
    locationType: '首页banner位',
    title: '全民健身运动月',
    subtitle: '参与运动，健康生活',
    imageUrl: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=800&h=400&fit=crop',
    redirectType: '内部',
    redirectUrl: '/activity/2',
    startTime: '2024-01-01',
    endTime: '2024-12-31',
    status: '已发布',
    sortOrder: 2,
    createdAt: '2024-02-01'
  },
  {
    _id: '3',
    locationType: '首页banner位',
    title: '春季马拉松大赛',
    subtitle: '挑战自我，超越极限',
    imageUrl: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=800&h=400&fit=crop',
    redirectType: '外部',
    redirectUrl: 'https://marathon.example.com',
    startTime: '2024-01-01',
    endTime: '2024-12-31',
    status: '已发布',
    sortOrder: 3,
    createdAt: '2024-02-01'
  }
];

// 兼容性：保留原来的单个banner
export const mockBanner: Banner = mockBanners[0];

// 模拟快捷功能数据
export const mockQuickActions: QuickAction[] = [
  {
    _id: '1',
    title: '场地预约',
    icon: '🏟️',
    type: 'booking',
    redirectUrl: '/venue-booking',
    sortOrder: 1,
    status: 'active'
  },
  {
    _id: '2',
    title: '体质监测',
    icon: '📊',
    type: 'activity',
    redirectUrl: '/fitness-test',
    sortOrder: 2,
    status: 'active'
  },
  {
    _id: '3',
    title: '活动来袭',
    icon: '🎯',
    type: 'event',
    redirectUrl: '/events',
    sortOrder: 3,
    status: 'active'
  },
  {
    _id: '4',
    title: '体育赛事',
    icon: '🏆',
    type: 'preference',
    redirectUrl: '/sports-events',
    sortOrder: 4,
    status: 'active'
  },
  {
    _id: '5',
    title: '营养选择',
    icon: '🥗',
    type: 'youth',
    redirectUrl: '/nutrition',
    sortOrder: 5,
    status: 'active'
  },
  {
    _id: '6',
    title: '运动装备',
    icon: '🎽',
    type: 'booking',
    redirectUrl: '/equipment',
    sortOrder: 6,
    status: 'active'
  },
  {
    _id: '7',
    title: '健身课程',
    icon: '🧘‍♀️',
    type: 'activity',
    redirectUrl: '/courses',
    sortOrder: 7,
    status: 'active'
  },
  {
    _id: '8',
    title: '运动社群',
    icon: '👥',
    type: 'event',
    redirectUrl: '/community',
    sortOrder: 8,
    status: 'active'
  },
  {
    _id: '9',
    title: '数据分析',
    icon: '📈',
    type: 'preference',
    redirectUrl: '/analytics',
    sortOrder: 9,
    status: 'active'
  },
  {
    _id: '10',
    title: '运动计划',
    icon: '📅',
    type: 'youth',
    redirectUrl: '/plans',
    sortOrder: 10,
    status: 'active'
  },
  {
    _id: '11',
    title: '教练服务',
    icon: '👨‍🏫',
    type: 'booking',
    redirectUrl: '/coaches',
    sortOrder: 11,
    status: 'active'
  },
  {
    _id: '12',
    title: '运动商城',
    icon: '🛒',
    type: 'activity',
    redirectUrl: '/shop',
    sortOrder: 12,
    status: 'active'
  }
];

// 模拟通知数据
export const mockNotifications: Notification[] = [
  {
    _id: '1',
    title: '信了"第一届进击杯"篮球赛获得者姓名',
    content: '厦门体育馆杯让技术营与赛事搭配',
    type: 'info',
    isRead: false,
    createdAt: '2024-02-01'
  },
  {
    _id: '2',
    title: '新的运动课程已上线',
    content: '瑜伽、普拉提等课程现已开放报名',
    type: 'success',
    isRead: false,
    createdAt: '2024-02-02'
  }
];

// 模拟活动数据
export const mockActivities: Activity[] = [
  {
    _id: '1',
    title: '晨跑夜行自由成就新感成人体育赛',
    description: '适合所有年龄段的晨跑活动',
    imageUrl: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=300&h=200&fit=crop',
    participants: 233,
    status: 'active',
    category: '跑步',
    startTime: '2024-02-15T06:00:00Z',
    endTime: '2024-02-15T08:00:00Z',
    location: '人民公园',
    createdAt: '2024-02-01'
  },
  {
    _id: '2',
    title: '晨跑夜行自由兴趣体能训练初级运动大赛',
    description: '体能训练课程',
    imageUrl: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=100&h=80&fit=crop',
    participants: 156,
    status: 'active',
    category: '训练',
    startTime: '2024-02-16T19:00:00Z',
    endTime: '2024-02-16T21:00:00Z',
    location: '体育馆',
    createdAt: '2024-02-01'
  },
  {
    _id: '3',
    title: '晨跑夜行自由训练综合网络成人健体育赛',
    description: '综合训练项目',
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=80&fit=crop',
    participants: 89,
    status: 'active',
    category: '综合',
    startTime: '2024-02-17T15:00:00Z',
    endTime: '2024-02-17T17:00:00Z',
    location: '运动中心',
    createdAt: '2024-02-01'
  }
];

// 模拟功能介绍数据
export const mockFeatureIntros: FeatureIntro[] = [
  {
    _id: '1',
    title: '京西运动管理站',
    icon: '🏢',
    description: '管理站功能介绍',
    features: [
      {
        label: '课程Banner',
        content: '奥行体技术多样化，杰出五行转换技的政策'
      },
      {
        label: '数据来源',
        content: '台站、水果行等轮、月光开放样成样铁，费中间体跨周维持续'
      }
    ],
    type: 'management',
    status: 'active'
  },
  {
    _id: '2',
    title: '功能展示',
    icon: '⚙️',
    description: '功能展示区域',
    features: [
      {
        label: '',
        content: '创区成功能系统，在上镇的配令多年供后台分布行转态，建筑大创型远场面及状'
      },
      {
        label: '',
        content: '是开新的理台分信行下等，有详细分下，重实等话行，个开气心必要'
      }
    ],
    type: 'display',
    status: 'active'
  },
  {
    _id: '3',
    title: '功能显型区',
    icon: '📊',
    description: '功能模型展示',
    features: [
      {
        label: '',
        content: '有效公生，灵就勉阳/转背资属，杰出台入力创就经女决感女'
      },
      {
        label: '',
        content: '年：学会物要创期勉系，整子计大科机话的'
      }
    ],
    type: 'model',
    status: 'active'
  },
  {
    _id: '4',
    title: '服务成果',
    icon: '🎯',
    description: '服务成果展示',
    features: [
      {
        label: '',
        content: '时间成会量，内容口总能话，方别朋章会人员成'
      }
    ],
    type: 'service',
    status: 'active'
  },
  {
    _id: '5',
    title: '体育赛事管理链',
    icon: '🏃‍♂️',
    description: '体育赛事管理功能',
    features: [
      {
        label: '无力太装话建文女真据',
        content: '鸟及最都是无有有原前话有态'
      },
      {
        label: '内容行链',
        content: '阿调/大意'
      },
      {
        label: '即可',
        content: '特朋及动态，公满谱，环况'
      },
      {
        label: '网城',
        content: '经商中朋的计，动员，帮机加，公满谱，环况'
      },
      {
        label: '体为',
        content: '无'
      },
      {
        label: '自上体育权中',
        content: '阿让是，中是迦的可等，适入成心厌/读访相性'
      }
    ],
    type: 'sports',
    status: 'active'
  }
];

// 模拟分类标签数据
export const mockCategoryTags: CategoryTag[] = [
  { _id: '1', name: '跑步', isActive: true, sortOrder: 1 },
  { _id: '2', name: '爬山', isActive: false, sortOrder: 2 },
  { _id: '3', name: '骑行', isActive: false, sortOrder: 3 },
  { _id: '4', name: '马拉松', isActive: false, sortOrder: 4 },
  { _id: '5', name: '足球', isActive: false, sortOrder: 5 },
  { _id: '6', name: '篮球', isActive: false, sortOrder: 6 },
  { _id: '7', name: '瑜伽', isActive: false, sortOrder: 7 }
];

// 模拟API响应格式
export const createMockResponse = <T>(data: T): ApiResponse<T> => ({
  code: 200,
  message: 'success',
  data,
  success: true
});

// 导出所有模拟数据
export const mockData = {
  banner: mockBanner,
  quickActions: mockQuickActions,
  notifications: mockNotifications,
  activities: mockActivities,
  featureIntros: mockFeatureIntros,
  categoryTags: mockCategoryTags
}; 