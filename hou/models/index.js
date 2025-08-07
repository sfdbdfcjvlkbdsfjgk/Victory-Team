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
const Activitymanage = mongoose.model('activitymanage', activitymanageSchema, 'activitymanage')
const activitySchema = new mongoose.Schema({
    type: String, // 类型
    title: String, // 标题
    sportTag: String, // 运动标签
    content: String, // 内容简介
    id: String, // 活动id
    sportstype: String, // 运动类型
    // state: String,
    topstate: Number, // 是否置顶
    enrollment: Number, // 报名人数
    readnumber: Number, // 阅读人数
    coverImage: String, // 封面图片URL
    maxParticipants: Number, // 报名人数上限

    registrationTime: Array, // 报名起止时间
    activityTime: Array, // 活动起止时间


    registrationItems: Array, // 报名项目/费用

    requireInsurance: Boolean, // 是否需要购买保险
    consultationPhone: String, // 咨询电话

    activityAddress: Array,//地址

    detailAddress: String, // 详细地址

    registrationMethod: Array, // 报名方式对象

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
const individualForm = mongoose.model('individualForm', individualFormSchema, 'individualForm')

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



//家庭活动数据添加
const familyFormSchema = new mongoose.Schema({
    activityId: { type: String, required: true },
    members: Array,
    createTime: {
        type: Date,
        default: Date.now
    }
}) 
const familyForm = mongoose.model('familyForm', familyFormSchema, 'familyForm')

module.exports = {
    activityEvent,
    Activitymanage,
    teamForm,
    individualForm,
    familyForm,
  RbacUserModel,            // RBAC 用户表
  PermissionModel,          // 权限表
  RoleModel,                // 角色表
  RolePermissionModel,      // 角色权限关联表
  UserRoleModel,            // 用户角色关联表
  YonghuUserModel,           // 用户表

  UserModel,                  // 登录注册专用表

};
