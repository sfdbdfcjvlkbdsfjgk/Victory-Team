// 体育赛事相关的模拟数据
export interface Question {
  questionId: string;
  question: string;
  type: 'single-choice' | 'multiple-choice' | 'text' | 'scale';
  options: Array<{
    optionId: string;
    text: string;
    value: any;
  }>;
  required: boolean;
  order: number;
}

export interface Questionnaire {
  _id: string;
  title: string;
  description: string;
  questions: Question[];
}

export interface SportRecommendation {
  _id: string;
  name: string;
  description: string;
  difficulty: '初级' | '中级' | '高级';
  duration: string;
  calories: number;
  equipment: string[];
  benefits: string[];
  imageUrl: string;
  matchScore: number;
}

// 模拟问卷数据
export const mockQuestionnaire: Questionnaire = {
  _id: 'questionnaire_001',
  title: '体育偏好调查问卷',
  description: '通过这份问卷，我们将为您推荐最适合的运动项目',
  questions: [
    {
      questionId: 'q1',
      question: '您的性别是？',
      type: 'single-choice',
      options: [
        { optionId: 'gender1', text: '男', value: 'male' },
        { optionId: 'gender2', text: '女', value: 'female' }
      ],
      required: true,
      order: 1
    },
    {
      questionId: 'q2',
      question: '您的年龄段是？',
      type: 'single-choice',
      options: [
        { optionId: 'age1', text: '18-25岁', value: '18-25' },
        { optionId: 'age2', text: '26-35岁', value: '26-35' },
        { optionId: 'age3', text: '36-45岁', value: '36-45' },
        { optionId: 'age4', text: '46-55岁', value: '46-55' },
        { optionId: 'age5', text: '55岁以上', value: '55+' }
      ],
      required: true,
      order: 2
    },
    {
      questionId: 'q3',
      question: '您目前的运动频率是？',
      type: 'single-choice',
      options: [
        { optionId: 'freq1', text: '几乎不运动', value: 'rarely' },
        { optionId: 'freq2', text: '每周1-2次', value: '1-2' },
        { optionId: 'freq3', text: '每周3-4次', value: '3-4' },
        { optionId: 'freq4', text: '每周5-6次', value: '5-6' },
        { optionId: 'freq5', text: '每天都运动', value: 'daily' }
      ],
      required: true,
      order: 3
    },
    {
      questionId: 'q4',
      question: '您喜欢的运动类型有哪些？（可多选）',
      type: 'multiple-choice',
      options: [
        { optionId: 'sport1', text: '跑步', value: 'running' },
        { optionId: 'sport2', text: '游泳', value: 'swimming' },
        { optionId: 'sport3', text: '篮球', value: 'basketball' },
        { optionId: 'sport4', text: '足球', value: 'football' },
        { optionId: 'sport5', text: '网球', value: 'tennis' },
        { optionId: 'sport6', text: '羽毛球', value: 'badminton' },
        { optionId: 'sport7', text: '瑜伽', value: 'yoga' },
        { optionId: 'sport8', text: '健身', value: 'fitness' },
        { optionId: 'sport9', text: '骑行', value: 'cycling' },
        { optionId: 'sport10', text: '登山', value: 'hiking' }
      ],
      required: true,
      order: 4
    },
    {
      questionId: 'q5',
      question: '您更偏向于哪种运动方式？',
      type: 'single-choice',
      options: [
        { optionId: 'place1', text: '室内运动', value: 'indoor' },
        { optionId: 'place2', text: '户外运动', value: 'outdoor' },
        { optionId: 'place3', text: '都可以', value: 'both' }
      ],
      required: true,
      order: 5
    },
    {
      questionId: 'q6',
      question: '您希望通过运动达到什么目标？（可多选）',
      type: 'multiple-choice',
      options: [
        { optionId: 'goal1', text: '减肥瘦身', value: 'weight-loss' },
        { optionId: 'goal2', text: '增肌塑形', value: 'muscle-building' },
        { optionId: 'goal3', text: '提高体能', value: 'fitness' },
        { optionId: 'goal4', text: '放松身心', value: 'relaxation' },
        { optionId: 'goal5', text: '社交娱乐', value: 'social' },
        { optionId: 'goal6', text: '挑战自我', value: 'challenge' }
      ],
      required: true,
      order: 6
    },
    {
      questionId: 'q7',
      question: '您每次运动的时间通常是？',
      type: 'single-choice',
      options: [
        { optionId: 'time1', text: '30分钟以内', value: '0-30' },
        { optionId: 'time2', text: '30-60分钟', value: '30-60' },
        { optionId: 'time3', text: '1-2小时', value: '60-120' },
        { optionId: 'time4', text: '2小时以上', value: '120+' }
      ],
      required: true,
      order: 7
    },
    {
      questionId: 'q8',
      question: '您的运动强度偏好是？',
      type: 'scale',
      options: [
        { optionId: 'intensity1', text: '低强度', value: 1 },
        { optionId: 'intensity2', text: '较低强度', value: 2 },
        { optionId: 'intensity3', text: '中等强度', value: 3 },
        { optionId: 'intensity4', text: '较高强度', value: 4 },
        { optionId: 'intensity5', text: '高强度', value: 5 }
      ],
      required: true,
      order: 8
    }
  ]
};

// 模拟运动推荐数据
export const mockRecommendations: SportRecommendation[] = [
  {
    _id: 'rec_001',
    name: '晨间慢跑',
    description: '适合初学者的有氧运动，帮助提高心肺功能，燃烧卡路里',
    difficulty: '初级',
    duration: '30-45分钟',
    calories: 300,
    equipment: ['运动鞋', '运动服'],
    benefits: ['提高心肺功能', '燃烧脂肪', '改善睡眠', '增强体质'],
    imageUrl: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=300&fit=crop',
    matchScore: 95
  },
  {
    _id: 'rec_002',
    name: '瑜伽练习',
    description: '柔和的身心运动，提高柔韧性，缓解压力',
    difficulty: '初级',
    duration: '45-60分钟',
    calories: 180,
    equipment: ['瑜伽垫', '瑜伽服'],
    benefits: ['提高柔韧性', '缓解压力', '改善姿态', '增强平衡'],
    imageUrl: 'https://images.unsplash.com/photo-1506629905607-ce19b1b9a8d6?w=400&h=300&fit=crop',
    matchScore: 88
  },
  {
    _id: 'rec_003',
    name: '力量训练',
    description: '使用器械进行肌肉训练，增强力量和肌肉量',
    difficulty: '中级',
    duration: '60-90分钟',
    calories: 400,
    equipment: ['哑铃', '杠铃', '训练服'],
    benefits: ['增肌塑形', '提高力量', '改善体态', '提升代谢'],
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
    matchScore: 82
  },
  {
    _id: 'rec_004',
    name: '游泳训练',
    description: '全身有氧运动，对关节友好，适合各个年龄段',
    difficulty: '中级',
    duration: '45-60分钟',
    calories: 450,
    equipment: ['泳衣', '泳帽', '泳镜'],
    benefits: ['全身锻炼', '保护关节', '提高耐力', '塑造体型'],
    imageUrl: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400&h=300&fit=crop',
    matchScore: 78
  },
  {
    _id: 'rec_005',
    name: '骑行运动',
    description: '户外有氧运动，既能锻炼身体又能欣赏风景',
    difficulty: '初级',
    duration: '60-120分钟',
    calories: 350,
    equipment: ['自行车', '头盔', '骑行服'],
    benefits: ['增强腿部力量', '提高耐力', '亲近自然', '环保出行'],
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop',
    matchScore: 75
  }
];

// 模拟 API 响应格式
export const createMockApiResponse = <T>(data: T, success: boolean = true) => ({
  success,
  data,
  message: success ? '操作成功' : '操作失败',
  code: success ? 200 : 400
});

// 完整的推荐数据结构
export const mockRecommendationData = {
  examItems: [
    {
      _id: '1',
      name: '1000米跑步',
      icon: '🏃‍♂️',
      category: '耐力',
      difficulty: '中等',
      priority: 'high',
      reason: '必考项目，建议优先训练',
      trainingTips: [
        '每周至少3次有氧训练',
        '循序渐进增加跑步距离',
        '注意跑步姿势和呼吸节奏'
      ]
    },
    {
      _id: '2',
      name: '引体向上',
      icon: '🤸‍♂️',
      category: '力量',
      difficulty: '中等',
      priority: 'medium',
      reason: '上肢力量训练，提高综合体能',
      trainingTips: [
        '先从悬挂开始练习',
        '逐步增加引体向上次数',
        '配合其他上肢力量训练'
      ]
    }
  ],
  trainingCourses: [
    {
      _id: '1',
      title: '个性化健身训练课程',
      instructor: '专业健身教练',
      price: 1980,
      originalPrice: 2980,
      duration: '60天',
      level: '中级',
      rating: 4.9,
      priority: 'high',
      reason: '根据您的偏好定制的训练课程',
      features: ['个性化指导', '科学训练计划', '营养建议']
    }
  ],
  personalizedPlan: {
    title: '个性化运动训练计划',
    description: '根据您的问卷回答为您量身定制的运动方案',
    weeklySchedule: [
      { day: '周一', activity: '有氧运动30分钟', intensity: '中等' },
      { day: '周三', activity: '力量训练45分钟', intensity: '中高' },
      { day: '周五', activity: '柔韧性训练30分钟', intensity: '轻松' },
      { day: '周日', activity: '户外活动60分钟', intensity: '中等' }
    ],
    tips: [
      '每次运动前进行5-10分钟热身',
      '根据身体状况调整运动强度',
      '运动后及时补充水分和营养',
      '保证充足的休息和睡眠'
    ]
  }
};

// 导出模拟 API 函数
export const mockSportsEventsApi = {
  // 获取问卷
  getQuestionnaire: () => {
    return Promise.resolve(createMockApiResponse(mockQuestionnaire));
  },

  // 提交问卷答案
  submitQuestionnaireResponse: (data: any) => {
    console.log('📝 模拟提交答案:', data);
    return Promise.resolve(createMockApiResponse({ submitted: true }));
  },

  // 完成问卷
  completeQuestionnaire: (data: any) => {
    console.log('✅ 模拟完成问卷:', data);
    return Promise.resolve(createMockApiResponse({ completed: true }));
  },

  // 获取推荐结果 - 返回完整的推荐数据结构
  getRecommendations: (userId: string, answers?: Record<string, any>) => {
    console.log('🔍 模拟获取推荐结果:', userId, answers);
    
    // 根据用户答案生成个性化推荐
    const personalizedData = generatePersonalizedRecommendations(answers || {});
    
    return Promise.resolve(createMockApiResponse(personalizedData));
  }
};

// 根据用户答案生成个性化推荐
const generatePersonalizedRecommendations = (answers: Record<string, any>) => {
  console.log('📊 用户答案:', answers);
  
  // 分析用户偏好
  const gender = answers.q1; // 性别
  const age = answers.q2; // 年龄段
  const frequency = answers.q3; // 运动频率
  const sportsTypes = answers.q4 || []; // 喜欢的运动类型
  const location = answers.q5; // 运动方式偏好
  const goals = answers.q6 || []; // 运动目标
  const duration = answers.q7; // 运动时长
  const intensity = answers.q8; // 运动强度
  
  // 基于答案定制训练计划
  let personalizedPlan = {
    title: '个性化运动训练计划',
    description: '根据您的问卷回答为您量身定制的运动方案',
    weeklySchedule: [] as any[],
    tips: [] as string[]
  };
  
  // 根据运动频率调整训练安排
  if (frequency === 'daily' || frequency === '5-6') {
    personalizedPlan.weeklySchedule = [
      { day: '周一', activity: '有氧运动45分钟', intensity: '中等' },
      { day: '周二', activity: '力量训练30分钟', intensity: '中高' },
      { day: '周三', activity: '柔韧性训练30分钟', intensity: '轻松' },
      { day: '周四', activity: '核心训练25分钟', intensity: '中等' },
      { day: '周五', activity: '间歇训练30分钟', intensity: '高' },
      { day: '周六', activity: '户外活动60分钟', intensity: '中等' },
      { day: '周日', activity: '恢复性运动20分钟', intensity: '轻松' }
    ];
  } else if (frequency === '3-4') {
    personalizedPlan.weeklySchedule = [
      { day: '周一', activity: '有氧运动40分钟', intensity: '中等' },
      { day: '周三', activity: '力量训练35分钟', intensity: '中高' },
      { day: '周五', activity: '柔韧性训练30分钟', intensity: '轻松' },
      { day: '周日', activity: '户外活动50分钟', intensity: '中等' }
    ];
  } else {
    personalizedPlan.weeklySchedule = [
      { day: '周三', activity: '有氧运动30分钟', intensity: '轻松' },
      { day: '周六', activity: '力量训练25分钟', intensity: '中等' }
    ];
  }
  
  // 根据运动目标调整建议
  personalizedPlan.tips = [
    '每次运动前进行5-10分钟热身',
    '根据身体状况调整运动强度',
    '运动后及时补充水分和营养'
  ];
  
  if (goals.includes('weight-loss')) {
    personalizedPlan.tips.push('重点进行有氧运动，控制饮食热量摄入');
  }
  if (goals.includes('muscle-building')) {
    personalizedPlan.tips.push('增加蛋白质摄入，注重力量训练');
  }
  if (goals.includes('relaxation')) {
    personalizedPlan.tips.push('可以尝试瑜伽、太极等放松身心的运动');
  }
  
  // 根据性别和年龄调整描述
  let genderText = gender === 'male' ? '男性' : '女性';
  let ageText = '';
  switch(age) {
    case '18-25': ageText = '青年'; break;
    case '26-35': ageText = '青壮年'; break;
    case '36-45': ageText = '中年'; break;
    default: ageText = '成年';
  }
  
  personalizedPlan.description = `为${ageText}${genderText}量身定制的运动方案，结合您的运动偏好和目标制定`;
  
  return {
    ...mockRecommendationData,
    personalizedPlan
  };
}; 