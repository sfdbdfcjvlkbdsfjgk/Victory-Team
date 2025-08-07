const mongoose = require('mongoose');
const { Banner, Notification, FeatureIntro, CategoryTag } = require('./models/index');

// 连接数据库
mongoose.connect('mongodb+srv://yy2935140484:439952014710q@cluster0.kuvzpp4.mongodb.net/sport')
  .then(() => {
    console.log('数据库连接成功');
    initData();
  })
  .catch(err => {
    console.log('数据库连接失败', err);
  });

async function initData() {
  try {
    // 清空现有数据（可选）
    console.log('开始初始化数据...');

    // 1. 创建横幅数据 - 支持轮播
    console.log('创建横幅数据...');
    await Banner.deleteMany({ locationType: '首页banner位' });
    const bannerDataList = [
      {
        locationType: '首页banner位',
        title: '为蓝一小时',
        subtitle: '国庆体育项目上线',
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop',
        redirectUrl: '/activity/national-day',
        startTime: new Date('2024-01-01'),
        endTime: new Date('2024-12-31'),
        status: 'active',
        sortOrder: 1
      },
      {
        locationType: '首页banner位',
        title: '全民健身计划',
        subtitle: '让运动成为生活的一部分',
        imageUrl: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=800&h=400&fit=crop',
        redirectUrl: '/activity/fitness-plan',
        startTime: new Date('2024-01-01'),
        endTime: new Date('2024-12-31'),
        status: 'active',
        sortOrder: 2
      },
      {
        locationType: '首页banner位',
        title: '青少年体育培训',
        subtitle: '专业教练，科学训练',
        imageUrl: 'https://images.unsplash.com/photo-1594882645126-14020914d58d?w=800&h=400&fit=crop',
        redirectUrl: '/activity/youth-training',
        startTime: new Date('2024-01-01'),
        endTime: new Date('2024-12-31'),
        status: 'active',
        sortOrder: 3
      },
      {
        locationType: '首页banner位',
        title: '社区运动会',
        subtitle: '邻里友谊，健康生活',
        imageUrl: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&h=400&fit=crop',
        redirectUrl: '/activity/community-sports',
        startTime: new Date('2024-01-01'),
        endTime: new Date('2024-12-31'),
        status: 'active',
        sortOrder: 4
      }
    ];
    
    for (const bannerData of bannerDataList) {
      const banner = new Banner(bannerData);
      await banner.save();
    }

    // 2. 创建快捷功能数据
    console.log('创建快捷功能数据...');
    await Banner.deleteMany({ locationType: '快捷功能' });
    const quickActions = [
      {
        locationType: '快捷功能',
        title: '场地预约',
        icon: '🏟️',
        type: 'booking',
        redirectUrl: '/venue-booking',
        startTime: new Date('2024-01-01'),
        endTime: new Date('2024-12-31'),
        status: '已发布',
        sortOrder: 1
      },
      {
        locationType: '快捷功能',
        title: '体质监测',
        icon: '📊',
        type: 'activity',
        redirectUrl: '/fitness-test',
        startTime: new Date('2024-01-01'),
        endTime: new Date('2024-12-31'),
        status: '已发布',
        sortOrder: 2
      },
      {
        locationType: '快捷功能',
        title: '活动来袭',
        icon: '🎯',
        type: 'event',
        redirectUrl: '/events',
        startTime: new Date('2024-01-01'),
        endTime: new Date('2024-12-31'),
        status: '已发布',
        sortOrder: 3
      },
      {
        locationType: '快捷功能',
        title: '体育赛事',
        icon: '🏆',
        type: 'event',
        redirectUrl: '/competitions',
        startTime: new Date('2024-01-01'),
        endTime: new Date('2024-12-31'),
        status: '已发布',
        sortOrder: 4
      },
      {
        locationType: '快捷功能',
        title: '营养选择',
        icon: '🥗',
        type: 'preference',
        redirectUrl: '/nutrition',
        startTime: new Date('2024-01-01'),
        endTime: new Date('2024-12-31'),
        status: '已发布',
        sortOrder: 5
      },
      {
        locationType: '快捷功能',
        title: '运动装备',
        icon: '🎽',
        type: 'booking',
        redirectUrl: '/equipment',
        startTime: new Date('2024-01-01'),
        endTime: new Date('2024-12-31'),
        status: '已发布',
        sortOrder: 6
      },
      {
        locationType: '快捷功能',
        title: '健身课程',
        icon: '🧘‍♀️',
        type: 'activity',
        redirectUrl: '/courses',
        startTime: new Date('2024-01-01'),
        endTime: new Date('2024-12-31'),
        status: '已发布',
        sortOrder: 7
      },
      {
        locationType: '快捷功能',
        title: '运动社群',
        icon: '👥',
        type: 'event',
        redirectUrl: '/community',
        startTime: new Date('2024-01-01'),
        endTime: new Date('2024-12-31'),
        status: '已发布',
        sortOrder: 8
      },
      {
        locationType: '快捷功能',
        title: '数据分析',
        icon: '📈',
        type: 'preference',
        redirectUrl: '/analytics',
        startTime: new Date('2024-01-01'),
        endTime: new Date('2024-12-31'),
        status: '已发布',
        sortOrder: 9
      },
      {
        locationType: '快捷功能',
        title: '运动计划',
        icon: '📅',
        type: 'youth',
        redirectUrl: '/plans',
        startTime: new Date('2024-01-01'),
        endTime: new Date('2024-12-31'),
        status: '已发布',
        sortOrder: 10
      },
      {
        locationType: '快捷功能',
        title: '教练服务',
        icon: '👨‍🏫',
        type: 'booking',
        redirectUrl: '/coaches',
        startTime: new Date('2024-01-01'),
        endTime: new Date('2024-12-31'),
        status: '已发布',
        sortOrder: 11
      },
      {
        locationType: '快捷功能',
        title: '运动商城',
        icon: '🛒',
        type: 'activity',
        redirectUrl: '/shop',
        startTime: new Date('2024-01-01'),
        endTime: new Date('2024-12-31'),
        status: '已发布',
        sortOrder: 12
      }
    ];
    await Banner.insertMany(quickActions);

    // 3. 创建热门活动数据
    console.log('创建热门活动数据...');
    await Banner.deleteMany({ locationType: '活动' });
    const activities = [
      {
        locationType: '活动',
        title: '厦门体育百日健康运动大赛',
        description: '适合所有年龄段的健康运动比赛',
        imageUrl: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=300&h=200&fit=crop',
        participants: 233,
        category: '跑步',
        location: '厦门体育中心',
        startTime: new Date('2024-03-15T06:00:00Z'),
        endTime: new Date('2024-03-15T18:00:00Z'),
        status: 'active',
        redirectUrl: '/activity/xiamen-health-race',
        sortOrder: 1
      },
      {
        locationType: '活动',
        title: '厦门体育百日健康运动第一期',
        description: '第一期健康运动训练营',
        imageUrl: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=300&h=200&fit=crop',
        participants: 156,
        category: '训练',
        location: '厦门市体育馆',
        startTime: new Date('2024-03-20T19:00:00Z'),
        endTime: new Date('2024-03-20T21:00:00Z'),
        status: 'active',
        redirectUrl: '/activity/health-training-1',
        sortOrder: 2
      },
      {
        locationType: '活动',
        title: '厦门体育百日健身运动大赛',
        description: '全民健身运动大赛',
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop',
        participants: 89,
        category: '综合',
        location: '厦门奥林匹克中心',
        startTime: new Date('2024-03-25T15:00:00Z'),
        endTime: new Date('2024-03-25T17:00:00Z'),
        status: 'active',
        redirectUrl: '/activity/fitness-competition',
        sortOrder: 3
      }
    ];
    await Banner.insertMany(activities);

    // 4. 创建通知数据
    console.log('创建通知数据...');
    await Notification.deleteMany({});
    const notifications = [
      {
        title: '系统维护通知',
        content: '系统将于今晚22:00-次日06:00进行例行维护，期间部分功能可能暂时无法使用',
        type: 'info',
        category: 'system',
        showRedDot: true,
        priority: 1,
        isRead: false
      },
      {
        title: '新功能上线提醒',
        content: '全新的体质监测功能已上线，快来体验吧！',
        type: 'success',
        category: 'system',
        showRedDot: true,
        priority: 2,
        isRead: false
      },
      {
        title: '厦门马拉松报名开启',
        content: '2024年厦门国际马拉松赛报名通道正式开启，名额有限先到先得',
        type: 'info',
        category: 'sports',
        showRedDot: true,
        priority: 1,
        isRead: false
      },
      {
        title: '体育明星专访：跑步技巧分享',
        content: '奥运冠军张三分享专业跑步技巧，助你提升运动表现',
        type: 'info',
        category: 'sports',
        showRedDot: true,
        priority: 0,
        isRead: false
      }
    ];
    await Notification.insertMany(notifications);

    // 5. 创建功能介绍数据
    console.log('创建功能介绍数据...');
    await FeatureIntro.deleteMany({});
    const featureIntros = [
      {
        title: '京西运动管理站',
        icon: '🏢',
        description: '管理站功能介绍',
        features: [
          {
            label: '课程Banner',
            content: '奥行体技术多样化，杰出五行转换技的政策'
          },
          {
            label: '数据来源',
            content: '台站、水果行等轮、月光开放样成样铁，费中间体跨周维持续'
          }
        ],
        type: 'management',
        status: 'active'
      },
      {
        title: '功能展示',
        icon: '⚙️',
        description: '功能展示区域',
        features: [
          {
            label: '',
            content: '功能展示：让技术能参与实现，在上镇的配令多年供后台分布行转态，建筑大创型远场面及状'
          },
          {
            label: '',
            content: '是开新的理台分信行下等，有详细分下，重实等话行，个开气心必要'
          }
        ],
        type: 'display',
        status: 'active'
      },
      {
        title: '功能显型区',
        icon: '📊',
        description: '功能模型展示',
        features: [
          {
            label: '',
            content: '功能显型：有效公生，灵就勉阳/转背资属，杰出台入力创就经女决感女'
          },
          {
            label: '',
            content: '年：学会物要创期勉系，整子计大科机话的'
          }
        ],
        type: 'model',
        status: 'active'
      },
      {
        title: '体育赛事管理链',
        icon: '🏃‍♂️',
        description: '体育赛事管理功能',
        features: [
          {
            label: '赛事管理',
            content: '公满谱，环况'
          },
          {
            label: '成果管理',
            content: '经商中朋的计，动员，帮机加'
          },
          {
            label: '数据统计',
            content: '阿让是，中是迦的可等，适入成心厌/读访相性'
          }
        ],
        type: 'sports',
        status: 'active'
      }
    ];
    await FeatureIntro.insertMany(featureIntros);

    // 6. 创建分类标签数据
    console.log('创建分类标签数据...');
    await CategoryTag.deleteMany({});
    const categoryTags = [
      { name: '全部', isActive: true, sortOrder: 1 },
      { name: '跑步', isActive: false, sortOrder: 2 },
      { name: '爬山', isActive: false, sortOrder: 3 },
      { name: '骑行', isActive: false, sortOrder: 4 },
      { name: '马拉松', isActive: false, sortOrder: 5 },
      { name: '足球', isActive: false, sortOrder: 6 },
      { name: '篮球', isActive: false, sortOrder: 7 }
    ];
    await CategoryTag.insertMany(categoryTags);

    // 7. 创建体育内容数据
    console.log('创建体育内容数据...');
    const { Content } = require('./models/index');
    await Content.deleteMany({});
    const contents = [
      {
        title: '马拉松训练完整指南：从新手到专业选手',
        content: '本文将为您详细介绍马拉松训练的完整计划，包括基础体能训练、营养搭配、心理准备等各个方面...',
        type: 'article',
        coverImage: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=800&h=400&fit=crop',
        author: {
          name: '运动专家王教练',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
        },
        viewCount: 1250,
        likeCount: 89,
        commentCount: 23,
        shareCount: 15,
        tags: ['马拉松', '训练计划', '跑步技巧'],
        category: '跑步',
        featured: true,
        status: 'published'
      },
      {
        title: '家庭健身房建设指南',
        content: '疫情期间，居家健身成为趋势。本视频教你如何用有限的空间和预算打造专属家庭健身房...',
        type: 'video',
        coverImage: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop',
        videoUrl: '/videos/home-gym-setup.mp4',
        videoDuration: 480, // 8分钟
        author: {
          name: '健身达人李明',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'
        },
        viewCount: 3420,
        likeCount: 156,
        commentCount: 67,
        shareCount: 45,
        tags: ['家庭健身', '器材推荐', '空间规划'],
        category: '健身',
        featured: true,
        status: 'published'
      },
      {
        title: '瑜伽初学者必知的10个基础动作',
        content: '瑜伽对身心健康都有很好的帮助。本文为初学者介绍10个最基础但最重要的瑜伽动作...',
        type: 'article',
        coverImage: 'https://images.unsplash.com/photo-1506629905607-d60d4939f37a?w=800&h=400&fit=crop',
        author: {
          name: '瑜伽老师张丽',
          avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=100&h=100&fit=crop'
        },
        viewCount: 890,
        likeCount: 67,
        commentCount: 19,
        shareCount: 12,
        tags: ['瑜伽入门', '基础动作', '柔韧性'],
        category: '瑜伽',
        status: 'published'
      },
      {
        title: '篮球技巧教学：提高投篮命中率的5个秘诀',
        content: '想要在篮球场上更加出色？投篮是关键技能。本视频分享5个实用技巧帮你提高命中率...',
        type: 'video',
        coverImage: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=400&fit=crop',
        videoUrl: '/videos/basketball-shooting.mp4',
        videoDuration: 360, // 6分钟
        author: {
          name: '篮球教练陈伟',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop'
        },
        viewCount: 2150,
        likeCount: 98,
        commentCount: 34,
        shareCount: 28,
        tags: ['篮球技巧', '投篮训练', '基础教学'],
        category: '篮球',
        status: 'published'
      },
      {
        title: '游泳减肥攻略：每周3次训练计划',
        content: '游泳是全身性有氧运动，减肥效果显著。本文提供详细的每周3次游泳训练计划...',
        type: 'article',
        coverImage: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop',
        author: {
          name: '游泳教练刘波',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
        },
        viewCount: 1680,
        likeCount: 72,
        commentCount: 28,
        shareCount: 19,
        tags: ['游泳减肥', '训练计划', '有氧运动'],
        category: '游泳',
        status: 'published'
      }
    ];
    await Content.insertMany(contents);

    console.log('✅ 所有测试数据创建完成！');
    console.log('数据统计：');
    console.log(`- 横幅: ${await Banner.countDocuments({ locationType: '首页banner位' })}条`);
    console.log(`- 快捷功能: ${await Banner.countDocuments({ locationType: '快捷功能' })}条`);
    console.log(`- 活动: ${await Banner.countDocuments({ locationType: '活动' })}条`);
    console.log(`- 通知: ${await Notification.countDocuments()}条`);
    console.log(`- 功能介绍: ${await FeatureIntro.countDocuments()}条`);
    console.log(`- 分类标签: ${await CategoryTag.countDocuments()}条`);
    console.log(`- 体育内容: ${await Content.countDocuments()}条`);

    mongoose.disconnect();
  } catch (error) {
    console.error('初始化数据失败:', error);
    mongoose.disconnect();
  }
} 