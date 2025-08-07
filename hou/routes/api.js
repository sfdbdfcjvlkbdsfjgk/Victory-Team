const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// 导入模型
const { Banner, Notification, FeatureIntro, CategoryTag } = require('../models/index');

// 通用响应格式
const createResponse = (success, data, message = '') => ({
  success,
  data,
  message,
  code: success ? 200 : 400
});

// ======================== 横幅相关接口 ========================

// 获取首页横幅数据
router.get('/banners', async (req, res) => {
  try {
    const { locationType, status, title, page = 1, limit = 10 } = req.query;
    
    // 构建查询条件
    const query = {};
    if (locationType) query.locationType = locationType;
    if (status) query.status = status;
    if (title) {
      query.$or = [
        { title: { $regex: title, $options: 'i' } },
        { _id: title }
      ];
    }
    
    // 如果没有指定查询条件，默认查询首页banner，支持多种发布状态
    if (!locationType && !req.query.hasOwnProperty('locationType')) {
      query.locationType = '首页banner位';
      // 支持"已发布"和"active"状态
      query.status = { $in: ['active', '已发布'] };
    }
    
    // 分页参数
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const banners = await Banner.find(query)
      .sort({ sortOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // 处理图片URL，确保是完整路径
    const processedBanners = banners.map(banner => {
      const bannerObj = banner.toObject();
      if (bannerObj.imageUrl && !bannerObj.imageUrl.startsWith('http')) {
        // 如果是相对路径，转换为完整URL
        bannerObj.imageUrl = `http://localhost:3000${bannerObj.imageUrl}`;
      }
      return bannerObj;
    });
    
    const total = await Banner.countDocuments(query);
    
    console.log(`📊 返回${processedBanners.length}个Banner数据:`, processedBanners.map(b => ({ title: b.title, status: b.status, imageUrl: b.imageUrl })));
    
    res.json(createResponse(true, processedBanners, '获取横幅数据成功'));
  } catch (error) {
    console.error('获取横幅数据失败:', error);
    res.status(500).json(createResponse(false, null, '获取横幅数据失败'));
  }
});

// 创建Banner/快捷功能/活动
router.post('/banners', async (req, res) => {
  try {
    const bannerData = req.body;
    
    // 验证必填字段
    if (!bannerData.title || !bannerData.locationType) {
      return res.status(400).json(createResponse(false, null, '标题和位置类型不能为空'));
    }
    
    const banner = new Banner(bannerData);
    await banner.save();
    
    res.json(createResponse(true, banner, '创建成功'));
  } catch (error) {
    console.error('创建Banner失败:', error);
    res.status(500).json(createResponse(false, null, '创建失败'));
  }
});

// 更新Banner/快捷功能/活动
router.put('/banners/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const banner = await Banner.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!banner) {
      return res.status(404).json(createResponse(false, null, 'Banner不存在'));
    }
    
    res.json(createResponse(true, banner, '更新成功'));
  } catch (error) {
    console.error('更新Banner失败:', error);
    res.status(500).json(createResponse(false, null, '更新失败'));
  }
});

// 删除Banner/快捷功能/活动
router.delete('/banners/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const banner = await Banner.findByIdAndDelete(id);
    
    if (!banner) {
      return res.status(404).json(createResponse(false, null, 'Banner不存在'));
    }
    
    res.json(createResponse(true, null, '删除成功'));
  } catch (error) {
    console.error('删除Banner失败:', error);
    res.status(500).json(createResponse(false, null, '删除失败'));
  }
});

// 批量更新排序
router.put('/banners/sort', async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!Array.isArray(items)) {
      return res.status(400).json(createResponse(false, null, '参数格式错误'));
    }
    
    // 批量更新排序
    const updatePromises = items.map(item =>
      Banner.findByIdAndUpdate(item.id, { sortOrder: item.sortOrder })
    );
    
    await Promise.all(updatePromises);
    
    res.json(createResponse(true, null, '排序更新成功'));
  } catch (error) {
    console.error('更新排序失败:', error);
    res.status(500).json(createResponse(false, null, '更新排序失败'));
  }
});

// 切换状态
router.put('/banners/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    
    const banner = await Banner.findById(id);
    
    if (!banner) {
      return res.status(404).json(createResponse(false, null, 'Banner不存在'));
    }
    
    // 切换状态逻辑
    let newStatus;
    if (banner.status === 'active' || banner.status === '已发布') {
      newStatus = 'inactive';
    } else {
      newStatus = 'active';
    }
    
    banner.status = newStatus;
    await banner.save();
    
    res.json(createResponse(true, banner, '状态切换成功'));
  } catch (error) {
    console.error('切换状态失败:', error);
    res.status(500).json(createResponse(false, null, '切换状态失败'));
  }
});

// 获取快捷功能数据
router.get('/quickActions', async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    // 构建查询条件
    const query = {
      locationType: '快捷功能',
      // 支持"已发布"和"active"状态
      status: status ? status : { $in: ['active', '已发布'] }
    };
    
    // 分页参数
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const quickActions = await Banner.find(query)
      .sort({ sortOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // 处理图片URL，确保是完整路径
    const processedActions = quickActions.map(action => {
      const actionObj = action.toObject();
      if (actionObj.imageUrl && !actionObj.imageUrl.startsWith('http')) {
        actionObj.imageUrl = `http://localhost:3000${actionObj.imageUrl}`;
      }
      return actionObj;
    });
    
    console.log(`📊 返回${processedActions.length}个快捷功能:`, processedActions.map(a => ({ title: a.title, status: a.status, icon: a.icon })));
    
    res.json(createResponse(true, processedActions, '获取快捷功能数据成功'));
  } catch (error) {
    console.error('获取快捷功能数据失败:', error);
    res.status(500).json(createResponse(false, null, '获取快捷功能数据失败'));
  }
});

// 获取活动数据
router.get('/activities', async (req, res) => {
  try {
    const { status, category, page = 1, limit = 10 } = req.query;
    
    // 构建查询条件
    const query = {
      locationType: '活动',
      // 支持"已发布"和"active"状态
      status: status ? status : { $in: ['active', '已发布'] }
    };
    
    if (category && category !== '全部') {
      query.category = category;
    }
    
    // 分页参数
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const activities = await Banner.find(query)
      .sort({ createdAt: -1, sortOrder: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // 处理图片URL，确保是完整路径
    const processedActivities = activities.map(activity => {
      const activityObj = activity.toObject();
      if (activityObj.imageUrl && !activityObj.imageUrl.startsWith('http')) {
        activityObj.imageUrl = `http://localhost:3000${activityObj.imageUrl}`;
      }
      return activityObj;
    });
    
    console.log(`📊 返回${processedActivities.length}个活动:`, processedActivities.map(a => ({ title: a.title, status: a.status, participants: a.participants })));
    
    res.json(createResponse(true, processedActivities, '获取活动数据成功'));
  } catch (error) {
    console.error('获取活动数据失败:', error);
    res.status(500).json(createResponse(false, null, '获取活动数据失败'));
  }
});

// ======================== 通知相关接口 ========================

// 获取通知数据
router.get('/notifications', async (req, res) => {
  try {
    const notifications = await Notification.find({
      category: 'system'
    }).sort({ createdAt: -1 });
    
    res.json(createResponse(true, notifications, '获取通知数据成功'));
  } catch (error) {
    console.error('获取通知数据失败:', error);
    res.status(500).json(createResponse(false, null, '获取通知数据失败'));
  }
});

// 标记通知为已读
router.put('/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true, showRedDot: false },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json(createResponse(false, null, '通知不存在'));
    }
    
    res.json(createResponse(true, notification, '标记已读成功'));
  } catch (error) {
    console.error('标记通知已读失败:', error);
    res.status(500).json(createResponse(false, null, '标记已读失败'));
  }
});

// ======================== 功能介绍相关接口 ========================

// 获取功能介绍数据
router.get('/featureIntros', async (req, res) => {
  try {
    const featureIntros = await FeatureIntro.find({
      status: 'active'
    }).sort({ createdAt: -1 });
    
    res.json(createResponse(true, featureIntros, '获取功能介绍数据成功'));
  } catch (error) {
    console.error('获取功能介绍数据失败:', error);
    res.status(500).json(createResponse(false, null, '获取功能介绍数据失败'));
  }
});

// ======================== 分类标签相关接口 ========================

// 获取分类标签数据
router.get('/categoryTags', async (req, res) => {
  try {
    const categoryTags = await CategoryTag.find({
      status: { $ne: 'inactive' }
    }).sort({ sortOrder: 1 });
    
    res.json(createResponse(true, categoryTags, '获取分类标签数据成功'));
  } catch (error) {
    console.error('获取分类标签数据失败:', error);
    res.status(500).json(createResponse(false, null, '获取分类标签数据失败'));
  }
});

// 更新分类标签状态
router.put('/categoryTags/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const categoryTag = await CategoryTag.findById(id);
    
    if (!categoryTag) {
      return res.status(404).json(createResponse(false, null, '分类标签不存在'));
    }
    
    // 先将所有标签设为非激活
    await CategoryTag.updateMany({}, { isActive: false });
    
    // 激活当前标签
    categoryTag.isActive = true;
    await categoryTag.save();
    
    // 返回更新后的所有标签
    const updatedTags = await CategoryTag.find({}).sort({ sortOrder: 1 });
    
    res.json(createResponse(true, updatedTags, '更新分类标签成功'));
  } catch (error) {
    console.error('更新分类标签失败:', error);
    res.status(500).json(createResponse(false, null, '更新分类标签失败'));
  }
});

// ======================== 体育赛事相关接口 ========================

// 活动报名接口
router.post('/activities/join', async (req, res) => {
  try {
    const { activityId } = req.body;
    
    if (!activityId) {
      return res.status(400).json(createResponse(false, null, '活动ID不能为空'));
    }
    
    // 查找活动
    const activity = await Banner.findById(activityId);
    
    if (!activity) {
      return res.status(404).json(createResponse(false, null, '活动不存在'));
    }
    
    if (activity.locationType !== '活动') {
      return res.status(400).json(createResponse(false, null, '此项目不是活动'));
    }
    
    // 增加报名人数
    activity.participants = (activity.participants || 0) + 1;
    await activity.save();
    
    res.json(createResponse(true, { 
      activityId,
      participants: activity.participants 
    }, '报名成功'));
    
  } catch (error) {
    console.error('活动报名失败:', error);
    res.status(500).json(createResponse(false, null, '报名失败'));
  }
});

// 获取问卷数据
router.get('/sports-events/questionnaire', async (req, res) => {
  try {
    // 检查问卷模型是否存在
    let Questionnaire;
    try {
      Questionnaire = mongoose.model('Questionnaire');
    } catch (error) {
      return res.status(404).json(createResponse(false, null, '问卷数据不存在'));
    }
    
    const questionnaire = await Questionnaire.findOne({
      status: 'active'
    });
    
    if (!questionnaire) {
      return res.status(404).json(createResponse(false, null, '未找到活跃的问卷'));
    }
    
    res.json(createResponse(true, questionnaire, '获取问卷数据成功'));
  } catch (error) {
    console.error('获取问卷数据失败:', error);
    res.status(500).json(createResponse(false, null, '获取问卷数据失败'));
  }
});

// 提交问卷答案
router.post('/sports-events/questionnaire/response', async (req, res) => {
  try {
    const { questionnaireId, userId, questionId, answer } = req.body;
    
    // 这里可以保存用户答案到数据库
    // 暂时只返回成功响应
    console.log('收到问卷答案:', { questionnaireId, userId, questionId, answer });
    
    res.json(createResponse(true, { submitted: true }, '答案提交成功'));
  } catch (error) {
    console.error('提交问卷答案失败:', error);
    res.status(500).json(createResponse(false, null, '提交答案失败'));
  }
});

// 完成问卷
router.post('/sports-events/questionnaire/complete', async (req, res) => {
  try {
    const { questionnaireId, userId } = req.body;
    
    // 这里可以标记问卷完成状态
    console.log('问卷完成:', { questionnaireId, userId });
    
    res.json(createResponse(true, { completed: true }, '问卷完成'));
  } catch (error) {
    console.error('完成问卷失败:', error);
    res.status(500).json(createResponse(false, null, '完成问卷失败'));
  }
});

// 获取运动推荐
router.get('/sports-events/recommendations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 检查推荐模型是否存在
    let Recommendation;
    try {
      Recommendation = mongoose.model('Recommendation');
    } catch (error) {
      return res.status(404).json(createResponse(false, null, '推荐数据不存在'));
    }
    
    const recommendation = await Recommendation.findOne({
      status: 'active'
    });
    
    if (!recommendation) {
      return res.status(404).json(createResponse(false, null, '未找到推荐数据'));
    }
    
    res.json(createResponse(true, recommendation, '获取推荐数据成功'));
  } catch (error) {
    console.error('获取推荐数据失败:', error);
    res.status(500).json(createResponse(false, null, '获取推荐数据失败'));
  }
});

// ======================== 运动数据相关接口 ========================

// 获取今日运动数据
router.get('/sports/today', async (req, res) => {
  try {
    // 模拟今日运动数据
    const todaySports = {
      steps: Math.floor(Math.random() * 5000) + 8000, // 8000-13000步
      goal: 10000,
      distance: Math.round((Math.random() * 3 + 5) * 100) / 100, // 5-8公里
      calories: Math.floor(Math.random() * 200) + 300, // 300-500卡路里
      activeMinutes: Math.floor(Math.random() * 60) + 120, // 120-180分钟
      lastUpdated: new Date().toISOString()
    };
    
    res.json(createResponse(true, todaySports, '获取今日运动数据成功'));
  } catch (error) {
    console.error('获取今日运动数据失败:', error);
    res.status(500).json(createResponse(false, null, '获取运动数据失败'));
  }
});

// 获取天气数据
router.get('/weather/current', async (req, res) => {
  try {
    const weatherConditions = ['晴', '多云', '晴朗', '微风', '阴天'];
    const temperatures = [22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32];
    
    const weather = {
      temperature: temperatures[Math.floor(Math.random() * temperatures.length)],
      condition: weatherConditions[Math.floor(Math.random() * weatherConditions.length)],
      humidity: Math.floor(Math.random() * 30) + 50, // 50-80%
      windSpeed: Math.floor(Math.random() * 10) + 5, // 5-15 km/h
      location: '北京市',
      lastUpdated: new Date().toISOString()
    };
    
    res.json(createResponse(true, weather, '获取天气数据成功'));
  } catch (error) {
    console.error('获取天气数据失败:', error);
    res.status(500).json(createResponse(false, null, '获取天气数据失败'));
  }
});

// 获取运动统计数据
router.get('/sports/stats', async (req, res) => {
  try {
    const stats = {
      weeklySteps: Math.floor(Math.random() * 20000) + 50000, // 50000-70000步
      weeklyDistance: Math.round((Math.random() * 20 + 30) * 100) / 100, // 30-50公里
      weeklyCalories: Math.floor(Math.random() * 1000) + 2000, // 2000-3000卡路里
      weeklyWorkouts: Math.floor(Math.random() * 3) + 5, // 5-8次
      averageSteps: Math.floor(Math.random() * 2000) + 8000, // 8000-10000步
      lastWeekComparison: Math.floor(Math.random() * 20) + 5, // 5-25%增长
      lastUpdated: new Date().toISOString()
    };
    
    res.json(createResponse(true, stats, '获取运动统计成功'));
  } catch (error) {
    console.error('获取运动统计失败:', error);
    res.status(500).json(createResponse(false, null, '获取运动统计失败'));
  }
});

// 更新运动数据（刷新功能）
router.post('/sports/refresh', async (req, res) => {
  try {
    const { currentSteps, currentDistance, currentCalories } = req.body;
    
    // 模拟增加运动数据
    const addedSteps = Math.floor(Math.random() * 500) + 200;
    const addedDistance = Math.round((Math.random() * 0.5 + 0.2) * 100) / 100;
    const addedCalories = Math.floor(Math.random() * 50) + 30;
    
    const updatedData = {
      steps: (currentSteps || 0) + addedSteps,
      distance: Math.round(((currentDistance || 0) + addedDistance) * 100) / 100,
      calories: (currentCalories || 0) + addedCalories,
      activeMinutes: Math.floor(Math.random() * 15) + 10,
      lastUpdated: new Date().toISOString()
    };
    
    res.json(createResponse(true, updatedData, '运动数据更新成功'));
  } catch (error) {
    console.error('更新运动数据失败:', error);
    res.status(500).json(createResponse(false, null, '更新运动数据失败'));
  }
});

// ======================== 健康检查接口 ========================

// API健康检查
router.get('/health', (req, res) => {
  res.json(createResponse(true, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  }, 'API服务正常'));
});

module.exports = router; 