const { SportsData, Weather, Achievement } = require('./models')

async function initSportsData() {
  try {
    console.log('开始初始化运动数据...')

    // 初始化成就数据
    const achievements = [
      {
        title: '步行新手',
        description: '累计步行5000步',
        icon: '🚶‍♂️',
        target: 5000,
        type: 'steps'
      },
      {
        title: '步行达人',
        description: '累计步行50000步',
        icon: '🏃‍♂️',
        target: 50000,
        type: 'steps'
      },
      {
        title: '马拉松挑战者',
        description: '累计步行100000步',
        icon: '🏆',
        target: 100000,
        type: 'steps'
      },
      {
        title: '距离新手',
        description: '累计跑步10公里',
        icon: '🎯',
        target: 10,
        type: 'distance'
      },
      {
        title: '长跑健将',
        description: '累计跑步100公里',
        icon: '🚀',
        target: 100,
        type: 'distance'
      }
    ]

    // 清空并重新创建成就数据
    await Achievement.deleteMany({})
    await Achievement.insertMany(achievements)
    console.log('成就数据初始化完成')

    // 初始化今日天气数据
    const today = new Date().toISOString().split('T')[0]
    const weatherData = {
      temperature: 28,
      condition: '晴',
      humidity: 65,
      windSpeed: 5,
      city: '厦门',
      date: today,
      icon: '☀️'
    }

    await Weather.findOneAndUpdate(
      { city: '厦门', date: today },
      weatherData,
      { upsert: true, new: true }
    )
    console.log('天气数据初始化完成')

    // 初始化一些历史运动数据
    const userId = 'default_user'
    const historicalData = []
    
    for (let i = 0; i < 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      historicalData.push({
        userId,
        date: dateStr,
        steps: Math.floor(Math.random() * 5000) + 5000, // 5000-10000步
        distance: Math.round((Math.random() * 3 + 2) * 100) / 100, // 2-5公里
        calories: Math.floor(Math.random() * 150) + 200, // 200-350卡路里
        activeMinutes: Math.floor(Math.random() * 40) + 40, // 40-80分钟
        goal: 10000
      })
    }

    // 删除现有数据并插入新数据
    await SportsData.deleteMany({ userId })
    await SportsData.insertMany(historicalData)
    console.log('历史运动数据初始化完成')

    console.log('✅ 所有运动数据初始化完成！')
    process.exit(0)
  } catch (error) {
    console.error('❌ 初始化失败:', error)
    process.exit(1)
  }
}

initSportsData() 