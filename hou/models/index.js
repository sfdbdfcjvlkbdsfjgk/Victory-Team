const mongoose = require('mongoose')

// 数据库连接
mongoose.connect('mongodb+srv://yy2935140484:439952014710q@cluster0.kuvzpp4.mongodb.net/sport')
  .then(() => {
    console.log('数据库连接成功')
  })
  .catch(err => {
    console.log('数据库连接失败', err)
  })

// Banner模型 - 扩展为多用途内容模型
const bannerSchema = new mongoose.Schema({
  // 所属运营位/内容类型
  locationType: {
    type: String,
    enum: ['首页banner位', '快捷功能', '活动'],
    default: '首页banner位'
  },
  // 标题
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  // 副标题(Banner专用)
  subtitle: String,
  // 图片路径
  imageUrl: {
    type: String,
    default: ''
  },
  // 跳转地址类型
  redirectType: {
    type: String,
    enum: ['内部', '外部'],
    default: '内部'
  },
  // 跳转地址
  redirectUrl: String,
  // 开始时间
  startTime: {
    type: Date,
    required: true
  },
  // 结束时间
  endTime: {
    type: Date,
    required: true
  },
  // 状态
  status: {
    type: String,
    enum: ['待发布', '已发布', '已下线', 'active', 'inactive', 'ended', 'upcoming'],
    default: '待发布'
  },
  // 排序字段
  sortOrder: {
    type: Number,
    default: 0
  },
  // === 快捷功能专用字段 ===
  icon: String,  // 图标
  type: {  // 功能类型
    type: String,
    enum: ['booking', 'activity', 'event', 'preference', 'youth']
  },
  // === 活动专用字段 ===
  description: String,  // 活动描述
  participants: {  // 报名人数
    type: Number,
    default: 0
  },
  category: String,  // 活动分类
  location: String,  // 活动地点
  // 创建时间
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const Banner = mongoose.model('Banner', bannerSchema)

// 通知模型
const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'error'],
    default: 'info'
  },
  // 消息分类：系统通知 或 体育资讯
  category: {
    type: String,
    enum: ['system', 'sports'],
    default: 'system'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  // 是否显示红点提示
  showRedDot: {
    type: Boolean,
    default: true
  },
  // 优先级（用于排序）
  priority: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const Notification = mongoose.model('Notification', notificationSchema)

// 功能介绍模型
const featureIntroSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  icon: String,
  description: String,
  features: [{
    label: String,
    content: String
  }],
  type: {
    type: String,
    enum: ['management', 'display', 'model', 'service', 'sports'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const FeatureIntro = mongoose.model('FeatureIntro', featureIntroSchema)

// 分类标签模型
const categoryTagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const CategoryTag = mongoose.model('CategoryTag', categoryTagSchema)

// 体育内容模型（文章/视频）
const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['article', 'video'],
    required: true
  },
  // 封面图片
  coverImage: {
    type: String,
    required: true
  },
  // 视频专用字段
  videoUrl: String,
  videoDuration: Number, // 视频时长（秒）
  // 作者信息
  author: {
    name: String,
    avatar: String
  },
  // 统计数据
  viewCount: {
    type: Number,
    default: 0
  },
  likeCount: {
    type: Number,
    default: 0
  },
  commentCount: {
    type: Number,
    default: 0
  },
  shareCount: {
    type: Number,
    default: 0
  },
  // 标签
  tags: [String],
  // 分类
  category: {
    type: String,
    enum: ['跑步', '健身', '足球', '篮球', '游泳', '瑜伽', '营养', '装备', '赛事'],
    default: '健身'
  },
  // 状态
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  // 是否推荐
  featured: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const Content = mongoose.model('Content', contentSchema)

// 用户互动记录模型
const userActionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true
  },
  actionType: {
    type: String,
    enum: ['like', 'comment', 'share', 'view'],
    required: true
  },
  // 评论内容（仅评论类型需要）
  commentText: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const UserAction = mongoose.model('UserAction', userActionSchema)

// 运动数据模型
const sportsDataSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  steps: {
    type: Number,
    default: 0
  },
  distance: {
    type: Number,
    default: 0
  },
  calories: {
    type: Number,
    default: 0
  },
  activeMinutes: {
    type: Number,
    default: 0
  },
  goal: {
    type: Number,
    default: 10000
  }
}, {
  timestamps: true
})

// 天气数据模型
const weatherSchema = new mongoose.Schema({
  temperature: {
    type: Number,
    required: true
  },
  condition: {
    type: String,
    required: true
  },
  humidity: {
    type: Number,
    default: 0
  },
  windSpeed: {
    type: Number,
    default: 0
  },
  city: {
    type: String,
    default: '厦门'
  },
  date: {
    type: String,
    required: true
  },
  icon: String
}, {
  timestamps: true
})

// 成就模型
const achievementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  target: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['steps', 'distance', 'calories', 'days'],
    required: true
  }
}, {
  timestamps: true
})

const SportsData = mongoose.model('SportsData', sportsDataSchema)
const Weather = mongoose.model('Weather', weatherSchema)
const Achievement = mongoose.model('Achievement', achievementSchema)

// 体育考试项目模型
const examItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 50
  },
  icon: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['耐力', '力量', '技巧', '球类', '柔韧性']
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['简单', '中等', '困难']
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'both']
  },
  description: {
    type: String,
    maxlength: 500
  },
  // 教程数量
  tutorialCount: {
    type: Number,
    default: 0
  },
  // 评分标准
  scoringStandard: {
    excellent: { type: Number }, // 优秀分数线
    good: { type: Number },      // 良好分数线
    pass: { type: Number }       // 及格分数线
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// 培训课程模型
const trainingCourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  instructor: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 1000
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  duration: {
    type: String,
    required: true
  },
  level: {
    type: String,
    required: true,
    enum: ['初级', '中级', '高级']
  },
  students: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 5
  },
  imageUrl: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    maxlength: 20
  }],
  isHot: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    enum: ['跑步', '游泳', '球类', '力量', '综合'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// 考试通知模型
const examNotificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: ['报名须知', '考试安排', '成绩查询', '注意事项'],
    required: true
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  examYear: {
    type: Number,
    required: true
  },
  city: {
    type: String,
    default: '厦门'
  },
  isImportant: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['published', 'draft'],
    default: 'published'
  }
}, {
  timestamps: true
});

const ExamItem = mongoose.model('ExamItem', examItemSchema)
const TrainingCourse = mongoose.model('TrainingCourse', trainingCourseSchema)
const ExamNotification = mongoose.model('ExamNotification', examNotificationSchema)

// 身体情况调查问卷模型
const questionnaireSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 500
  },
  questions: [{
    questionId: {
      type: String,
      required: true
    },
    question: {
      type: String,
      required: true,
      maxlength: 300
    },
    type: {
      type: String,
      enum: ['single-choice', 'multiple-choice', 'text', 'scale'],
      required: true
    },
    options: [{
      optionId: String,
      text: String,
      value: mongoose.Schema.Types.Mixed
    }],
    required: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      required: true
    }
  }],
  targetGroup: {
    type: String,
    enum: ['student', 'parent', 'teacher', 'all'],
    default: 'student'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

// 问卷回答记录模型
const questionnaireResponseSchema = new mongoose.Schema({
  questionnaireId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Questionnaire',
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  responses: [{
    questionId: String,
    answer: mongoose.Schema.Types.Mixed,
    answeredAt: {
      type: Date,
      default: Date.now
    }
  }],
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  deviceInfo: {
    userAgent: String,
    ip: String
  }
}, {
  timestamps: true
});

const Questionnaire = mongoose.model('Questionnaire', questionnaireSchema)
const QuestionnaireResponse = mongoose.model('QuestionnaireResponse', questionnaireResponseSchema)

module.exports = {
  Banner,
  Notification,
  FeatureIntro,
  CategoryTag,
  Content,
  UserAction,
  SportsData,
  Weather,
  Achievement,
  ExamItem,
  TrainingCourse,
  ExamNotification,
  Questionnaire,
  QuestionnaireResponse
}