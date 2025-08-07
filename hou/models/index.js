const mongoose = require('mongoose')
mongoose.connect('mongodb+srv://yy2935140484:439952014710q@cluster0.kuvzpp4.mongodb.net/sport').then(() => {
    console.log('数据库连接成功')
}).catch(err => {
    console.log('数据库连接失败', err)
})

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

    state: String,//发布状态




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
    familyForm
}