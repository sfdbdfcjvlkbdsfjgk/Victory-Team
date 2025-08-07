const express = require('express')
const router = express.Router()
const { Weather } = require('../models')

// 获取当前天气数据
router.get('/current', async (req, res) => {
  try {
    const city = req.query.city || '厦门'
    const today = new Date().toISOString().split('T')[0]
    
    let weather = await Weather.findOne({
      city,
      date: today
    })
    
    // 如果没有今日天气数据，创建模拟数据
    if (!weather) {
      const conditions = ['晴', '多云', '小雨', '阴']
      const randomCondition = conditions[Math.floor(Math.random() * conditions.length)]
      
      weather = new Weather({
        temperature: Math.floor(Math.random() * 15) + 20, // 20-35度
        condition: randomCondition,
        humidity: Math.floor(Math.random() * 30) + 40, // 40-70%
        windSpeed: Math.floor(Math.random() * 10) + 1, // 1-10 km/h
        city,
        date: today,
        icon: getWeatherIcon(randomCondition)
      })
      await weather.save()
    }
    
    res.json({
      success: true,
      data: weather
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// 获取历史天气数据
router.get('/history', async (req, res) => {
  try {
    const { startDate, endDate, city = '厦门' } = req.query
    
    const query = { city }
    if (startDate && endDate) {
      query.date = {
        $gte: startDate,
        $lte: endDate
      }
    }
    
    const weatherData = await Weather.find(query)
      .sort({ date: -1 })
      .limit(30)
      .lean()
    
    res.json({
      success: true,
      data: weatherData
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// 更新天气数据
router.post('/update', async (req, res) => {
  try {
    const { city = '厦门', date, ...weatherData } = req.body
    const today = date || new Date().toISOString().split('T')[0]
    
    const weather = await Weather.findOneAndUpdate(
      { city, date: today },
      { $set: weatherData },
      { new: true, upsert: true }
    )
    
    res.json({
      success: true,
      data: weather
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// 根据天气条件返回图标
function getWeatherIcon(condition) {
  const iconMap = {
    '晴': '☀️',
    '多云': '⛅',
    '阴': '☁️',
    '小雨': '🌦️',
    '中雨': '🌧️',
    '大雨': '⛈️',
    '雪': '❄️',
    '雾': '🌫️'
  }
  return iconMap[condition] || '🌤️'
}

module.exports = router 