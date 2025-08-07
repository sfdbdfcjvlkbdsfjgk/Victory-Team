const express = require('express')
const router = express.Router()
const { SportsData, Weather, Achievement } = require('../models')

// 获取今日运动数据
router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const userId = req.query.userId || 'default_user'
    
    let sportsData = await SportsData.findOne({
      userId,
      date: today
    })
    
    // 如果没有今日数据，创建默认数据
    if (!sportsData) {
      sportsData = new SportsData({
        userId,
        date: today,
        steps: Math.floor(Math.random() * 8000) + 2000, // 2000-10000步
        distance: Math.round((Math.random() * 3 + 1) * 100) / 100, // 1-4公里
        calories: Math.floor(Math.random() * 200) + 150, // 150-350卡路里
        activeMinutes: Math.floor(Math.random() * 60) + 30, // 30-90分钟
        goal: 10000
      })
      await sportsData.save()
    }
    
    res.json({
      success: true,
      data: sportsData
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// 获取运动统计数据
router.get('/stats', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30
    const userId = req.query.userId || 'default_user'
    
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000))
    
    const stats = await SportsData.aggregate([
      {
        $match: {
          userId,
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: null,
          totalSteps: { $sum: '$steps' },
          totalDistance: { $sum: '$distance' },
          totalCalories: { $sum: '$calories' },
          avgSteps: { $avg: '$steps' },
          avgDistance: { $avg: '$distance' },
          avgCalories: { $avg: '$calories' },
          count: { $sum: 1 }
        }
      }
    ])
    
    const achievements = await Achievement.find().lean()
    
    const result = {
      totalDistance: stats[0]?.totalDistance || 0,
      totalSteps: stats[0]?.totalSteps || 0,
      totalCalories: stats[0]?.totalCalories || 0,
      averageDaily: {
        steps: Math.round(stats[0]?.avgSteps || 0),
        distance: Math.round((stats[0]?.avgDistance || 0) * 100) / 100,
        calories: Math.round(stats[0]?.avgCalories || 0)
      },
      achievements: achievements.map(achievement => ({
        ...achievement,
        progress: Math.min(stats[0]?.totalSteps || 0, achievement.target),
        unlockedAt: (stats[0]?.totalSteps || 0) >= achievement.target ? new Date().toISOString() : null
      }))
    }
    
    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// 更新运动数据
router.post('/update', async (req, res) => {
  try {
    const { userId = 'default_user', date, ...updateData } = req.body
    const today = date || new Date().toISOString().split('T')[0]
    
    const sportsData = await SportsData.findOneAndUpdate(
      { userId, date: today },
      { $set: updateData },
      { new: true, upsert: true }
    )
    
    res.json({
      success: true,
      data: sportsData
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// 记录运动活动
router.post('/record', async (req, res) => {
  try {
    const { type, duration, distance = 0, calories = 0 } = req.body
    const userId = req.body.userId || 'default_user'
    const today = new Date().toISOString().split('T')[0]
    
    // 计算步数（粗略估算）
    let estimatedSteps = 0
    if (type === 'running') {
      estimatedSteps = duration * 150 // 跑步每分钟约150步
    } else if (type === 'walking') {
      estimatedSteps = duration * 100 // 走路每分钟约100步
    }
    
    // 更新今日数据
    const sportsData = await SportsData.findOneAndUpdate(
      { userId, date: today },
      {
        $inc: {
          steps: estimatedSteps,
          distance: distance,
          calories: calories,
          activeMinutes: duration
        }
      },
      { new: true, upsert: true }
    )
    
    res.json({
      success: true,
      data: sportsData
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// 设置运动目标
router.post('/goal', async (req, res) => {
  try {
    const { goal } = req.body
    const userId = req.body.userId || 'default_user'
    const today = new Date().toISOString().split('T')[0]
    
    const sportsData = await SportsData.findOneAndUpdate(
      { userId, date: today },
      { $set: { goal } },
      { new: true, upsert: true }
    )
    
    res.json({
      success: true,
      data: { success: true }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// 获取成就列表
router.get('/achievements', async (req, res) => {
  try {
    const achievements = await Achievement.find().lean()
    
    res.json({
      success: true,
      data: achievements
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// 获取历史运动数据
router.get('/history', async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 30 } = req.query
    const userId = req.query.userId || 'default_user'
    
    const query = { userId }
    if (startDate && endDate) {
      query.date = {
        $gte: startDate,
        $lte: endDate
      }
    }
    
    const skip = (page - 1) * limit
    const sportsData = await SportsData.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean()
    
    const total = await SportsData.countDocuments(query)
    
    res.json({
      success: true,
      data: sportsData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

module.exports = router 