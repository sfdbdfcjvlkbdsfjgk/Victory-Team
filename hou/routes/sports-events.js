const express = require('express');
const router = express.Router();
const { ExamItem, TrainingCourse, ExamNotification, Questionnaire, QuestionnaireResponse } = require('../models');

// 获取考试项目列表
router.get('/exam-items', async (req, res) => {
  try {
    const { gender = 'both' } = req.query;
    
    // 根据性别筛选考试项目
    const filter = { status: 'active' };
    if (gender !== 'both') {
      filter.$or = [
        { gender: gender },
        { gender: 'both' }
      ];
    }
    
    const examItems = await ExamItem.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    // 如果没有数据，返回模拟数据
    if (examItems.length === 0) {
      const mockExamItems = [
        {
          _id: '1',
          name: '1000米跑步',
          icon: '🏃‍♂️',
          category: '耐力',
          difficulty: '中等',
          gender: 'both',
          tutorialCount: 22,
          scoringStandard: {
            excellent: 90,
            good: 80,
            pass: 60
          },
          status: 'active',
          sortOrder: 1
        },
        {
          _id: '2',
          name: '1000米游泳',
          icon: '🏊‍♂️',
          category: '耐力',
          difficulty: '困难',
          gender: 'both',
          tutorialCount: 23,
          scoringStandard: {
            excellent: 90,
            good: 80,
            pass: 60
          },
          status: 'active',
          sortOrder: 2
        },
        {
          _id: '3',
          name: '引体向上',
          icon: '🤸‍♂️',
          category: '力量',
          difficulty: '中等',
          gender: 'male',
          tutorialCount: 22,
          scoringStandard: {
            excellent: 90,
            good: 80,
            pass: 60
          },
          status: 'active',
          sortOrder: 3
        },
        {
          _id: '4',
          name: '仰卧起坐',
          icon: '💪',
          category: '力量',
          difficulty: '简单',
          gender: 'both',
          tutorialCount: 23,
          scoringStandard: {
            excellent: 90,
            good: 80,
            pass: 60
          },
          status: 'active',
          sortOrder: 4
        },
        {
          _id: '5',
          name: '前滚实心球',
          icon: '⚽',
          category: '技巧',
          difficulty: '中等',
          gender: 'both',
          tutorialCount: 22,
          scoringStandard: {
            excellent: 90,
            good: 80,
            pass: 60
          },
          status: 'active',
          sortOrder: 5
        },
        {
          _id: '6',
          name: '足球',
          icon: '⚽',
          category: '球类',
          difficulty: '中等',
          gender: 'both',
          tutorialCount: 23,
          scoringStandard: {
            excellent: 90,
            good: 80,
            pass: 60
          },
          status: 'active',
          sortOrder: 6
        }
      ];

      // 根据性别筛选模拟数据
      const filteredMockItems = mockExamItems.filter(item => {
        if (gender === 'both') return true;
        return item.gender === gender || item.gender === 'both';
      });

      return res.json({
        success: true,
        data: filteredMockItems
      });
    }

    res.json({
      success: true,
      data: examItems
    });
  } catch (error) {
    console.error('获取考试项目失败:', error);
    res.status(500).json({
      success: false,
      message: '获取考试项目失败',
      error: error.message
    });
  }
});

// 获取培训课程列表
router.get('/training-courses', async (req, res) => {
  try {
    const { page = 1, limit = 10, category } = req.query;
    
    const filter = { status: 'active' };
    if (category) {
      filter.category = category;
    }
    
    const skip = (page - 1) * limit;
    
    const [courses, total] = await Promise.all([
      TrainingCourse.find(filter)
        .sort({ isHot: -1, sortOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      TrainingCourse.countDocuments(filter)
    ]);

    // 如果没有数据，返回模拟数据
    if (courses.length === 0) {
      const mockCourses = [
        {
          _id: '1',
          title: '超跑培训营',
          instructor: '双十名师教学，男生女生，限时特惠',
          description: '专业的跑步技巧训练，提高中考体育成绩',
          price: 230.00,
          originalPrice: 380.00,
          duration: '30天',
          level: '初级',
          students: 1234,
          rating: 4.8,
          imageUrl: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=300&h=200&fit=crop',
          tags: ['限时优惠'],
          isHot: true,
          category: '跑步',
          status: 'active',
          sortOrder: 1
        },
        {
          _id: '2',
          title: '中考体育培训营',
          instructor: '双十名师教学，男生女生，限时特惠',
          description: '全面的中考体育项目训练，确保高分通过',
          price: 230.00,
          originalPrice: 380.00,
          duration: '45天',
          level: '中级',
          students: 2156,
          rating: 4.9,
          imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop',
          tags: ['王牌'],
          isHot: false,
          category: '综合',
          status: 'active',
          sortOrder: 2
        },
        {
          _id: '3',
          title: '超哥篮球考试培训',
          instructor: '双十名师教学，男生女生',
          description: '专业篮球技巧训练，提升球感和投篮准确率',
          price: 280.00,
          duration: '60天',
          level: '高级',
          students: 987,
          rating: 4.7,
          imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=300&h=200&fit=crop',
          tags: ['篮球'],
          isHot: false,
          category: '球类',
          status: 'active',
          sortOrder: 3
        }
      ];

      return res.json({
        success: true,
        data: {
          courses: mockCourses,
          pagination: {
            total: mockCourses.length,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(mockCourses.length / limit)
          }
        }
      });
    }

    res.json({
      success: true,
      data: {
        courses,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取培训课程失败:', error);
    res.status(500).json({
      success: false,
      message: '获取培训课程失败',
      error: error.message
    });
  }
});

// 获取考试通知列表
router.get('/notifications', async (req, res) => {
  try {
    const { year = new Date().getFullYear(), type, page = 1, limit = 10 } = req.query;
    
    const filter = { status: 'published', examYear: parseInt(year) };
    if (type) {
      filter.type = type;
    }
    
    const skip = (page - 1) * limit;
    
    const [notifications, total] = await Promise.all([
      ExamNotification.find(filter)
        .sort({ isImportant: -1, publishDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ExamNotification.countDocuments(filter)
    ]);

    // 如果没有数据，返回模拟数据
    if (notifications.length === 0) {
      const mockNotifications = [
        {
          _id: '1',
          title: '2024年厦门体育中考报名须知',
          content: '2024年厦门市体育中考报名即将开始，请各位考生及家长关注相关要求...',
          type: '报名须知',
          publishDate: new Date(),
          examYear: parseInt(year),
          city: '厦门',
          isImportant: true,
          status: 'published'
        }
      ];

      return res.json({
        success: true,
        data: {
          notifications: mockNotifications,
          pagination: {
            total: mockNotifications.length,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(mockNotifications.length / limit)
          }
        }
      });
    }

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取考试通知失败:', error);
    res.status(500).json({
      success: false,
      message: '获取考试通知失败',
      error: error.message
    });
  }
});

// 创建考试项目
router.post('/exam-items', async (req, res) => {
  try {
    const examItem = new ExamItem(req.body);
    await examItem.save();
    
    res.status(201).json({
      success: true,
      data: examItem,
      message: '考试项目创建成功'
    });
  } catch (error) {
    console.error('创建考试项目失败:', error);
    res.status(400).json({
      success: false,
      message: '创建考试项目失败',
      error: error.message
    });
  }
});

// 创建培训课程
router.post('/training-courses', async (req, res) => {
  try {
    const course = new TrainingCourse(req.body);
    await course.save();
    
    res.status(201).json({
      success: true,
      data: course,
      message: '培训课程创建成功'
    });
  } catch (error) {
    console.error('创建培训课程失败:', error);
    res.status(400).json({
      success: false,
      message: '创建培训课程失败',
      error: error.message
    });
  }
});

// 创建考试通知
router.post('/notifications', async (req, res) => {
  try {
    const notification = new ExamNotification(req.body);
    await notification.save();
    
    res.status(201).json({
      success: true,
      data: notification,
      message: '考试通知创建成功'
    });
  } catch (error) {
    console.error('创建考试通知失败:', error);
    res.status(400).json({
      success: false,
      message: '创建考试通知失败',
      error: error.message
    });
  }
});

// 更新考试项目
router.put('/exam-items/:id', async (req, res) => {
  try {
    const examItem = await ExamItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!examItem) {
      return res.status(404).json({
        success: false,
        message: '考试项目不存在'
      });
    }
    
    res.json({
      success: true,
      data: examItem,
      message: '考试项目更新成功'
    });
  } catch (error) {
    console.error('更新考试项目失败:', error);
    res.status(400).json({
      success: false,
      message: '更新考试项目失败',
      error: error.message
    });
  }
});

// 删除考试项目
router.delete('/exam-items/:id', async (req, res) => {
  try {
    const examItem = await ExamItem.findByIdAndDelete(req.params.id);
    
    if (!examItem) {
      return res.status(404).json({
        success: false,
        message: '考试项目不存在'
      });
    }
    
    res.json({
      success: true,
      message: '考试项目删除成功'
    });
  } catch (error) {
    console.error('删除考试项目失败:', error);
    res.status(500).json({
      success: false,
      message: '删除考试项目失败',
      error: error.message
    });
  }
});

// 获取问卷信息
router.get('/questionnaire', async (req, res) => {
  try {
    let questionnaire = await Questionnaire.findOne({ 
      status: 'active',
      targetGroup: { $in: ['student', 'all'] }
    }).lean();

    // 如果没有问卷数据，返回模拟数据
    if (!questionnaire) {
      questionnaire = {
        _id: '1',
        title: '中考体育身体情况调查',
        description: '为了更好地为您推荐合适的训练项目，请如实回答以下问题',
        questions: [
          {
            questionId: 'q1',
            question: '你家孩子是？',
            type: 'single-choice',
            options: [
              { optionId: 'male', text: '男生', value: 'male' },
              { optionId: 'female', text: '女生', value: 'female' }
            ],
            required: true,
            order: 1
          },
          {
            questionId: 'q2',
            question: '孩子目前的运动基础如何？',
            type: 'single-choice',
            options: [
              { optionId: 'beginner', text: '零基础，很少运动', value: 'beginner' },
              { optionId: 'basic', text: '有一定基础，偶尔运动', value: 'basic' },
              { optionId: 'intermediate', text: '基础较好，经常运动', value: 'intermediate' },
              { optionId: 'advanced', text: '基础很好，每天都运动', value: 'advanced' }
            ],
            required: true,
            order: 2
          },
          {
            questionId: 'q3',
            question: '孩子最擅长的运动项目是？（可多选）',
            type: 'multiple-choice',
            options: [
              { optionId: 'running', text: '跑步', value: 'running' },
              { optionId: 'swimming', text: '游泳', value: 'swimming' },
              { optionId: 'basketball', text: '篮球', value: 'basketball' },
              { optionId: 'football', text: '足球', value: 'football' },
              { optionId: 'volleyball', text: '排球', value: 'volleyball' },
              { optionId: 'strength', text: '力量训练', value: 'strength' },
              { optionId: 'none', text: '都不擅长', value: 'none' }
            ],
            required: true,
            order: 3
          },
          {
            questionId: 'q4',
            question: '孩子是否有运动伤病史？',
            type: 'single-choice',
            options: [
              { optionId: 'no', text: '没有', value: 'no' },
              { optionId: 'minor', text: '有轻微伤病，已康复', value: 'minor' },
              { optionId: 'current', text: '目前有伤病，需要注意', value: 'current' }
            ],
            required: true,
            order: 4
          },
          {
            questionId: 'q5',
            question: '孩子每周运动时间大概是？',
            type: 'single-choice',
            options: [
              { optionId: 'none', text: '几乎不运动', value: 0 },
              { optionId: 'low', text: '1-2小时', value: 1.5 },
              { optionId: 'medium', text: '3-5小时', value: 4 },
              { optionId: 'high', text: '6-10小时', value: 8 },
              { optionId: 'very_high', text: '10小时以上', value: 12 }
            ],
            required: true,
            order: 5
          },
          {
            questionId: 'q6',
            question: '您希望孩子在哪些方面得到提升？（可多选）',
            type: 'multiple-choice',
            options: [
              { optionId: 'endurance', text: '耐力提升', value: 'endurance' },
              { optionId: 'strength', text: '力量增强', value: 'strength' },
              { optionId: 'speed', text: '速度提高', value: 'speed' },
              { optionId: 'flexibility', text: '柔韧性改善', value: 'flexibility' },
              { optionId: 'coordination', text: '协调性训练', value: 'coordination' },
              { optionId: 'technique', text: '技术动作规范', value: 'technique' }
            ],
            required: true,
            order: 6
          }
        ],
        targetGroup: 'student',
        status: 'active'
      };
    }

    res.json({
      success: true,
      data: questionnaire
    });
  } catch (error) {
    console.error('获取问卷失败:', error);
    res.status(500).json({
      success: false,
      message: '获取问卷失败',
      error: error.message
    });
  }
});

// 提交问卷答案
router.post('/questionnaire/response', async (req, res) => {
  try {
    const { questionnaireId, userId, questionId, answer } = req.body;

    // 查找或创建问卷回答记录
    let response = await QuestionnaireResponse.findOne({
      questionnaireId,
      userId
    });

    if (!response) {
      response = new QuestionnaireResponse({
        questionnaireId,
        userId,
        responses: [],
        deviceInfo: {
          userAgent: req.get('User-Agent'),
          ip: req.ip
        }
      });
    }

    // 更新或添加答案
    const existingResponseIndex = response.responses.findIndex(
      r => r.questionId === questionId
    );

    if (existingResponseIndex >= 0) {
      response.responses[existingResponseIndex].answer = answer;
      response.responses[existingResponseIndex].answeredAt = new Date();
    } else {
      response.responses.push({
        questionId,
        answer,
        answeredAt: new Date()
      });
    }

    await response.save();

    res.json({
      success: true,
      data: response,
      message: '答案保存成功'
    });
  } catch (error) {
    console.error('提交答案失败:', error);
    res.status(400).json({
      success: false,
      message: '提交答案失败',
      error: error.message
    });
  }
});

// 完成问卷
router.post('/questionnaire/complete', async (req, res) => {
  try {
    const { questionnaireId, userId } = req.body;

    const response = await QuestionnaireResponse.findOneAndUpdate(
      { questionnaireId, userId },
      { 
        completed: true,
        completedAt: new Date()
      },
      { new: true }
    );

    if (!response) {
      return res.status(404).json({
        success: false,
        message: '未找到问卷回答记录'
      });
    }

    res.json({
      success: true,
      data: response,
      message: '问卷完成！'
    });
  } catch (error) {
    console.error('完成问卷失败:', error);
    res.status(400).json({
      success: false,
      message: '完成问卷失败',
      error: error.message
    });
  }
});

// 获取个性化推荐
router.get('/recommendations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 获取用户的问卷回答
    const userResponse = await QuestionnaireResponse.findOne({
      userId,
      completed: true
    }).sort({ completedAt: -1 }).lean();

    if (!userResponse) {
      return res.status(404).json({
        success: false,
        message: '未找到用户的问卷回答记录'
      });
    }

    // 解析用户答案
    const answers = {};
    userResponse.responses.forEach(response => {
      answers[response.questionId] = response.answer;
    });

    // 推荐算法
    const recommendations = generateRecommendations(answers);

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('获取推荐失败:', error);
    res.status(500).json({
      success: false,
      message: '获取推荐失败',
      error: error.message
    });
  }
});

// 推荐算法函数
function generateRecommendations(answers) {
  const gender = answers.q1; // 性别
  const fitnessLevel = answers.q2; // 运动基础
  const goodAtSports = answers.q3 || []; // 擅长项目
  const injuryHistory = answers.q4; // 伤病史
  const weeklyHours = answers.q5; // 每周运动时间
  const improvementGoals = answers.q6 || []; // 提升目标

  let recommendations = {
    examItems: [],
    trainingCourses: [],
    personalizedPlan: {
      title: '',
      description: '',
      weeklySchedule: [],
      tips: []
    }
  };

  // 根据性别和基础推荐考试项目
  let recommendedExamItems = [
    {
      _id: '1',
      name: gender === 'male' ? '1000米跑步' : '800米跑步',
      icon: '🏃‍♂️',
      category: '耐力',
      difficulty: fitnessLevel === 'beginner' ? '简单' : '中等',
      priority: 'high',
      reason: '必考项目，建议优先训练',
      trainingTips: [
        '每周至少3次有氧训练',
        '循序渐进增加跑步距离',
        '注意跑步姿势和呼吸节奏'
      ]
    }
  ];

  // 根据擅长项目推荐
  if (goodAtSports.includes('basketball')) {
    recommendedExamItems.push({
      _id: '8',
      name: '篮球运球',
      icon: '🏀',
      category: '球类',
      difficulty: '中等',
      priority: 'medium',
      reason: '您擅长篮球，这是优势项目',
      trainingTips: [
        '练习单手运球和双手运球',
        '提高运球速度和稳定性',
        '加强球感训练'
      ]
    });
  }

  if (goodAtSports.includes('swimming')) {
    recommendedExamItems.push({
      _id: '3',
      name: '游泳',
      icon: '🏊‍♂️',
      category: '耐力',
      difficulty: '困难',
      priority: 'high',
      reason: '您有游泳基础，可以选择此项获得高分',
      trainingTips: [
        '完善游泳技术动作',
        '提高游泳速度和耐力',
        '练习水中呼吸技巧'
      ]
    });
  }

  // 根据运动基础推荐力量项目
  if (gender === 'male') {
    recommendedExamItems.push({
      _id: '4',
      name: '引体向上',
      icon: '🤸‍♂️',
      category: '力量',
      difficulty: fitnessLevel === 'beginner' ? '困难' : '中等',
      priority: fitnessLevel === 'advanced' ? 'high' : 'low',
      reason: fitnessLevel === 'advanced' ? '您的运动基础较好，适合挑战力量项目' : '需要加强上肢力量训练',
      trainingTips: [
        '先从悬挂开始练习',
        '逐步增加引体向上次数',
        '配合其他上肢力量训练'
      ]
    });
  } else {
    recommendedExamItems.push({
      _id: '5',
      name: '仰卧起坐',
      icon: '💪',
      category: '力量',
      difficulty: '简单',
      priority: 'medium',
      reason: '适合女生的核心力量训练项目',
      trainingTips: [
        '注意动作标准性',
        '循序渐进增加次数',
        '配合其他腹部训练'
      ]
    });
  }

  recommendations.examItems = recommendedExamItems;

  // 推荐培训课程
  let recommendedCourses = [];

  if (fitnessLevel === 'beginner') {
    recommendedCourses.push({
      _id: '1',
      title: '中考体育冲刺班',
      instructor: '双十名师团队',
      price: 1980.00,
      originalPrice: 2980.00,
      duration: '60天',
      level: '初级',
      rating: 4.9,
      priority: 'high',
      reason: '零基础学员的最佳选择，全面系统训练',
      features: ['基础动作教学', '体能循序渐进', '专业指导']
    });
  }

  if (goodAtSports.includes('running') || improvementGoals.includes('endurance')) {
    recommendedCourses.push({
      _id: '2',
      title: '跑步技巧提升营',
      instructor: '田径专业教练',
      price: 890.00,
      originalPrice: 1290.00,
      duration: '30天',
      level: '初级',
      rating: 4.8,
      priority: 'high',
      reason: '针对跑步项目的专项训练',
      features: ['跑步姿势纠正', '呼吸技巧', '速度提升']
    });
  }

  if (goodAtSports.includes('basketball') || goodAtSports.includes('football')) {
    recommendedCourses.push({
      _id: '4',
      title: '篮球技巧训练营',
      instructor: '篮球专业教练',
      price: 1280.00,
      duration: '40天',
      level: '中级',
      rating: 4.6,
      priority: 'medium',
      reason: '提升球类项目技能',
      features: ['基本功强化', '技巧训练', '比赛实战']
    });
  }

  recommendations.trainingCourses = recommendedCourses;

  // 生成个性化训练计划
  const planTitle = `${gender === 'male' ? '男生' : '女生'}专属中考体育训练计划`;
  const planDescription = `基于您的${fitnessLevel === 'beginner' ? '零基础' : fitnessLevel === 'basic' ? '基础' : fitnessLevel === 'intermediate' ? '中等基础' : '良好基础'}水平，为您定制的${weeklyHours < 2 ? '轻量级' : weeklyHours < 6 ? '标准' : '强化'}训练方案`;

  let weeklySchedule = [];
  let tips = [];

  // 根据每周运动时间制定计划
  if (weeklyHours < 2) {
    weeklySchedule = [
      { day: '周一', activity: '慢跑20分钟', intensity: '轻松' },
      { day: '周三', activity: '基础体能训练', intensity: '中等' },
      { day: '周五', activity: '技能练习', intensity: '轻松' }
    ];
    tips = [
      '从低强度开始，逐步适应运动节奏',
      '每次运动前充分热身',
      '运动后注意拉伸放松'
    ];
  } else if (weeklyHours < 6) {
    weeklySchedule = [
      { day: '周一', activity: '跑步训练30分钟', intensity: '中等' },
      { day: '周二', activity: '力量训练', intensity: '中等' },
      { day: '周四', activity: '技能专项练习', intensity: '中高' },
      { day: '周六', activity: '综合训练', intensity: '中等' }
    ];
    tips = [
      '保持规律的训练频率',
      '注意训练强度的渐进增加',
      '合理安排休息和恢复'
    ];
  } else {
    weeklySchedule = [
      { day: '周一', activity: '跑步训练45分钟', intensity: '中高' },
      { day: '周二', activity: '力量训练', intensity: '高' },
      { day: '周三', activity: '技能训练', intensity: '中高' },
      { day: '周四', activity: '体能训练', intensity: '中等' },
      { day: '周五', activity: '专项强化', intensity: '高' },
      { day: '周日', activity: '放松恢复', intensity: '轻松' }
    ];
    tips = [
      '高强度训练需要充分的恢复时间',
      '注意营养补充和睡眠质量',
      '定期评估训练效果并调整计划'
    ];
  }

  // 根据伤病史调整建议
  if (injuryHistory === 'current') {
    tips.unshift('目前有伤病，请在专业指导下谨慎训练');
    weeklySchedule = weeklySchedule.map(item => ({
      ...item,
      intensity: item.intensity === '高' ? '中等' : item.intensity === '中高' ? '中等' : item.intensity
    }));
  }

  recommendations.personalizedPlan = {
    title: planTitle,
    description: planDescription,
    weeklySchedule,
    tips
  };

  return recommendations;
}

module.exports = router; 