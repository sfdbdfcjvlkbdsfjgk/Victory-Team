const mongoose = require('mongoose')

// 数据库连接
mongoose.connect('mongodb+srv://yy2935140484:439952014710q@cluster0.kuvzpp4.mongodb.net/sport')
  .then(() => {
    console.log('数据库连接成功')
  })
  .catch(err => {
    console.log('数据库连接失败', err)
  })

// Banner模型
const bannerSchema = new mongoose.Schema({
  // 所属运营位
  locationType: {
    type: String,
    default: '首页banner位'
  },
  // 标题
  title: {
    type: String,
    required: true,
    maxlength: 30
  },
  // 图片路径
  imageUrl: {
    type: String,
    required: true
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
    enum: ['待发布', '已发布', '已下线'],
    default: '待发布'
  },
  // 排序字段
  sortOrder: {
    type: Number,
    default: Date.now
  },
  // 创建时间
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const Banner = mongoose.model('Banner', bannerSchema)

module.exports = {
  Banner
}