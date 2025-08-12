let mongoose = require("mongoose");
// 添加更详细的连接日志
mongoose.connection.on("connected", () => {
  console.log("MongoDB connected successfully");
});

mongoose.connection.on("error", (err) => {
  console.log("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

mongoose
  .connect(
    "mongodb+srv://yy2935140484:439952014710q@cluster0.kuvzpp4.mongodb.net/sport",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000
    }
  )
  .then(() => {
    console.log("数据库连接成功！");
  })
  .catch((err) => {
    console.log("数据库连接失败:", err);
  });

// 活动帖子
const activityPostSchema = new mongoose.Schema({
  // 基础信息
  id: String,
  title: String,
  
  // 发布者信息
  user: {
    id: String,
    name: String,
    avatar: String,
    isPresident: { type: Boolean, default: false }
  },
  
  // 发布时间
  publishTime: { type: Date, default: Date.now },
  
  // 所属协会
  association: {
    id: String,
    name: String
  },
  
  // 活动内容
  content: {
    title: String,
    description: String,
    registrationDeadline: String,
    activityTime: String,
    location: String,
    maxParticipants: Number
  },
  
  // 媒体内容
  images: [String],
  
  // 互动数据
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  
  // 报名相关
  registeredCount: { type: Number, default: 0 },
  registrationStatus: {
    type: String,
    enum: ['not_registered', 'registered', 'in_progress', 'ended'],
    default: 'not_registered'
  },
  
  // 时间控制
  registrationStartTime: Date,
  registrationEndTime: Date,
  activityStartTime: Date,
  activityEndTime: Date,
  
  // 用户状态
  isLiked: { type: Boolean, default: false },
  isUserMember: { type: Boolean, default: false },
  
  // 活动状态
  state: { type: Number, default: 1 }, // 0-不显示，1-显示
  activityprogress: String, // 活动进度
  sportstype: String, // 运动类型
  topstate: { type: Number, default: 0 }, // 置顶状态
  type: String, // 活动类型
  enrollment: Number, // 报名人数
  readnumber: Number, // 阅读数量
  
  // 创建时间
  createtime: { type: Date, default: Date.now }
});
const ActivityPost = mongoose.model('activitypost', activityPostSchema, 'activitypost');

// 协会信息
const associationSchema = new mongoose.Schema({
  // 基础信息
  id: String,
  name: String,
  description: String,
  avatar: String,
  coverImage: String,
  
  // 协会状态
  state: { type: Number, default: 1 }, // 0-不显示，1-显示
  
  // 成员信息
  memberCount: { type: Number, default: 0 },
  maxMembers: Number,
  
  // 会长信息
  president: {
    id: String,
    name: String,
    avatar: String
  },
  
  // 协会设置
  needApproval: { type: Boolean, default: true }, // 是否需要审核入会
  
  // 统计数据
  activityCount: { type: Number, default: 0 }, // 活动数量
  
  // 创建时间
  createtime: { type: Date, default: Date.now }
});
const Association = mongoose.model('association', associationSchema, 'association');

// 用户协会关联
const userAssociationSchema = new mongoose.Schema({
  // 用户ID
  userId: String,
  
  // 协会ID
  associationId: String,
  
  // 成员状态
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  
  // 角色
  role: {
    type: String,
    enum: ['member', 'admin', 'president'],
    default: 'member'
  },
  
  // 加入时间
  joinTime: Date,
  
  // 申请时间
  applyTime: { type: Date, default: Date.now }
});

const UserAssociation = mongoose.model('userassociation', userAssociationSchema, 'userassociation');
const activitymanageSchema = new mongoose.Schema({
    id: String,
    title: String,
    activityprogress: String,
    sportstype: String,
    state: String,
    topstate: Number,
    type: String,
    enrollment: Number,
    readnumber: Number,
    createtime: Date
})



//新增标签
const tagSchema = new mongoose.Schema({
    id:String,
    sport_tag: String,
    tag_createTime: {
        type: Date,
        default: Date.now
    }
})
const addlabel = mongoose.model('addlabel', tagSchema,'addlabel')



//发布活动不含赛事
const hdSchema = new mongoose.Schema({
    type:String, // 类型 (活动/赛事)
    title: String, // 标题
    sportTag: String, // 运动标签
    content: String, // 内容简介
    coverImage: String, // 封面图片URL
    maxParticipants: Number, // 报名人数上限
    registrationTime: Array, // 报名起止时间
    activityTime: Array, // 活动起止时间
    registrationItems: Array, // 报名项目/费用
    requireInsurance: Boolean, // 是否需要购买保险
    consultationPhone: String, // 报名咨询电话
    province: String, // 省份代码
    city: String, // 城市代码
    district: String, // 区县代码
    detailAddress: String, // 详细地址
    formFields: Array, // 报名表单信息

    state: String//发布状态
})


// ======RBAC 系统相关表结构======

// RBAC 用户表
let RbacUser = new mongoose.Schema({
  _id: { type: String, required: true },           // 用户ID（字符串类型）
  userName: {type: String, required: true, unique: true},        // 用户名
  passWord: {type: String, required: true},        // 密码
  realName: {type: String, required: true},        // 真实姓名
  email: {type: String, required: true},           // 邮箱
  phone: {type: String, required: true},           // 手机号
  status: {                // 状态：active-启用，inactive-禁用
    type: String,
    default: 'active',
    enum: ['active', 'inactive']
  },
  createdAt: {             // 创建时间
    type: Date,
    default: Date.now
  },
  updatedAt: {             // 更新时间
    type: Date,
    default: Date.now
  },
  resetCode: {             // 密码重置验证码
    type: String,
    default: null
  },
  resetCodeExpires: {      // 验证码过期时间
    type: Date,
    default: null
  },
});


// 权限表
let Permission = new mongoose.Schema({
  _id: { type: String, required: true },           // 权限ID（字符串类型）
  name: {type: String, required: true},            // 权限名称
  code: {type: String, required: true, unique: true},            // 权限代码（唯一）
  description: {type: String, default: ''},     // 权限描述
  parentId: {type: String},          // 上级权限ID：线性数据库表示树形结构
  path: {type: String, required: true, unique: true},     // 权限路径
  icon: {type: String, default: ''},     // 图标
  sort: {type: Number, default: 0},     // 排序
  isShow: {type: Boolean, default: false},     // 是否显示
  status: {                // 是否启用
    type: String,
    default: 'active',
    enum: ['active', 'inactive']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 角色表
let Role = new mongoose.Schema({
  _id: { type: String, required: true },           // 角色ID（字符串类型）
  name: {type: String, required: true},            // 角色名称
  code: {type: String, required: true, unique: true},            // 角色代码（唯一）
  description: {type: String, default: ''},     // 角色描述
  status: {                // 是否启用
    type: String,
    default: 'active',
    enum: ['active', 'inactive']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 角色权限关联表
let RolePermission = new mongoose.Schema({
  roleId: {                // 角色ID
    type: String,
    required: true
  },
  permissionId: {          // 权限ID
    type: String,
    required: true
  },
});
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
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 用户角色关联表
let UserRole = new mongoose.Schema({
  userId: {                // 用户ID
    type: String,
    required: true
  },
  roleId: {                // 角色ID
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// ======移动端相关表结构======

// 登录注册专用表
let User = new mongoose.Schema({
  userName: String,
  passWord: String,
});
// 用户表
let YonghuUser = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // 用户ID
  userName: { type: String, required: true, unique: true }, // 用户名
  nickname: { type: String, required: true },      // 昵称
  avatar: { type: String, default: '' },           // 头像
  phone: { type: String, required: true },         // 手机号
  email: { type: String, required: true },         // 邮箱
  passWord: { type: String, required: true },      // 密码
  vipLevel: { type: Number, default: 0 },          // VIP等级
  points: { type: Number, default: 0 },            // 积分
  verified: { type: Boolean, default: false },     // 是否验证
  gender: { type: String, enum: ['男', '女', '保密'], default: '保密' }, // 性别
  city: { type: String, default: '' },             // 城市
  registerTime: { type: Date, default: Date.now }, // 注册时间
  lastLoginTime: { type: Date, default: Date.now }, // 最后登录时间
  status: { 
    type: String, 
    default: 'active',
    enum: ['active', 'inactive']
  },                                                // 状态
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})
const releaseactivity = mongoose.model('releaseactivity', hdSchema,'releaseactivity')






//发布活动含赛事
const activitySchema = new mongoose.Schema({
   type: String, // 类型
   title: String, // 标题
   sportTag: String, // 运动标签
   content: String, // 内容简介
   coverImage: String, // 封面图片URL
   maxParticipants: Number, // 报名人数上限

   registrationTime: Array, // 报名起止时间
   activityTime: Array, // 活动起止时间


   registrationItems: Array, // 报名项目/费用

   requireInsurance: Boolean, // 是否需要购买保险
   consultationPhone: String, // 咨询电话

   activityAddress:Array,//地址

   detailAddress: String, // 详细地址

   registrationMethod:Array, // 报名方式对象
  
   formFields: Array, // 报名表单信息
   
   state:String,//发布状态

   createTime: {
        type: Date,
        default: Date.now
    } // 创建时间
  });


const activityEvent = mongoose.model('activityEvent', activitySchema, 'activityEvent')




//前端添加的活动赛事数据团队的
const teamFormSchema = new mongoose.Schema({
    activityId: String,
    selectedItem: String,
    teamName: String,
    teamLeader:String,
    teamLeaderPhone:String,
    teamDescription:String,
    contactEmail:String,
    // formdata:Array,
    members: [{
        name: String,           // 姓名
        phone: String,          // 手机号
        idCard: String,         // 证件类型/证件号
        emergencyContact: String, // 紧急联系人
        age: String,            // 年龄
        gender: String          // 性别
    }],
    createTime: {
        type: Date,
        default: Date.now
    }
})
const teamForm = mongoose.model('teamForm', teamFormSchema, 'teamForm')


//前端添加的活动赛事数据个人的
const individualFormSchema = new mongoose.Schema({
    activityId: String,
    formData:Array,
    createTime: {
        type: Date,
        default: Date.now
    }
})
let individualForm = mongoose.model('individualForm', individualFormSchema, 'individualForm')

// 创建 RBAC 相关模型
let RbacUserModel = mongoose.model("RbacUser", RbacUser, "User_hy");
let PermissionModel = mongoose.model("Permission", Permission, "Permission_hy");
let RoleModel = mongoose.model("Role", Role, "Role_hy");
let RolePermissionModel = mongoose.model("RolePermission", RolePermission, "RolePermission_hy");
let UserRoleModel = mongoose.model("UserRole", UserRole, "UserRole_hy");

// 创建移动端用户相关模型
let YonghuUserModel = mongoose.model("User_yonghu", YonghuUser, "User_yonghu");

// 创建登录注册专用模型
let UserModel = mongoose.model("User", User, "User");


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

//家庭活动数据添加
const familyFormSchema = new mongoose.Schema({
    activityId:String,
    members: Array,
    createTime: {
        type: Date,
        default: Date.now
    }
}) 
const familyForm = mongoose.model('familyForm', familyFormSchema, 'familyForm')






//视频表 - 统一管理所有视频数据
const videoSchema = new mongoose.Schema({
    title: String,           // 视频标题
    fileName: String,        // 文件名
    // duration: Number,        // 视频时长（分钟）
    // level: String,           // 难度等级 (K1 零基础, K2 初级, K3 进阶, K4 高级)
    category: String,        // 分类 (大家都在学, 视频教程)
    popularity: Number,      // 观看人数
    thumbnail: String,       // 缩略图URL
    videoUrl: String,        // 视频URL
    description: String,     // 视频描述
    // tags: [String],          // 标签数组
    isActive: {
        type: Boolean,
        default: true
    },
    createTime: {
        type: Date,
        default: Date.now
    },
    updateTime: {
        type: Date,
        default: Date.now
    },
    fileId: { type: String, unique: true, sparse: true } // 新增：用于关联分片上传的文件ID
})
const Video = mongoose.model('Video', videoSchema, 'video')


module.exports = {
    releaseactivity,
    addlabel,
    activityEvent,
    teamForm,
    individualForm,
    familyForm,
  RbacUserModel,            // RBAC 用户表
  PermissionModel,          // 权限表
  RoleModel,                // 角色表
  RolePermissionModel,      // 角色权限关联表
  UserRoleModel,            // 用户角色关联表
  YonghuUserModel,           // 用户表
  ActivityPost,             // 活动赛事表
  UserModel,                  // 登录注册专用表
  Association,             // 社团表
  UserAssociation,         // 用户社团关联表
};
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
