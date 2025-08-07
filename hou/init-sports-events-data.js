const { ExamItem, TrainingCourse, ExamNotification } = require('./models');

async function initSportsEventsData() {
  try {
    console.log('开始初始化体育赛事数据...');

    // 清空现有数据
    await Promise.all([
      ExamItem.deleteMany({}),
      TrainingCourse.deleteMany({}),
      ExamNotification.deleteMany({})
    ]);
    console.log('已清空现有数据');

    // 初始化考试项目数据
    const examItems = [
      {
        name: '1000米跑步',
        icon: '🏃‍♂️',
        category: '耐力',
        difficulty: '中等',
        gender: 'both',
        description: '中长跑项目，考查学生有氧耐力和心肺功能',
        tutorialCount: 22,
        scoringStandard: {
          excellent: 90,
          good: 75,
          pass: 60
        },
        status: 'active',
        sortOrder: 1
      },
      {
        name: '800米跑步',
        icon: '🏃‍♀️',
        category: '耐力',
        difficulty: '中等',
        gender: 'female',
        description: '女生中长跑项目，培养有氧耐力',
        tutorialCount: 20,
        scoringStandard: {
          excellent: 90,
          good: 75,
          pass: 60
        },
        status: 'active',
        sortOrder: 2
      },
      {
        name: '游泳',
        icon: '🏊‍♂️',
        category: '耐力',
        difficulty: '困难',
        gender: 'both',
        description: '游泳技能考试，考查水性和游泳技巧',
        tutorialCount: 18,
        scoringStandard: {
          excellent: 90,
          good: 75,
          pass: 60
        },
        status: 'active',
        sortOrder: 3
      },
      {
        name: '引体向上',
        icon: '🤸‍♂️',
        category: '力量',
        difficulty: '中等',
        gender: 'male',
        description: '上肢力量测试，考查男生臂力和背部肌肉力量',
        tutorialCount: 25,
        scoringStandard: {
          excellent: 90,
          good: 75,
          pass: 60
        },
        status: 'active',
        sortOrder: 4
      },
      {
        name: '仰卧起坐',
        icon: '💪',
        category: '力量',
        difficulty: '简单',
        gender: 'both',
        description: '腹部力量测试，训练核心肌群',
        tutorialCount: 30,
        scoringStandard: {
          excellent: 90,
          good: 75,
          pass: 60
        },
        status: 'active',
        sortOrder: 5
      },
      {
        name: '实心球',
        icon: '⚽',
        category: '技巧',
        difficulty: '中等',
        gender: 'both',
        description: '投掷项目，考查协调性和爆发力',
        tutorialCount: 15,
        scoringStandard: {
          excellent: 90,
          good: 75,
          pass: 60
        },
        status: 'active',
        sortOrder: 6
      },
      {
        name: '立定跳远',
        icon: '🦘',
        category: '技巧',
        difficulty: '简单',
        gender: 'both',
        description: '下肢爆发力测试，训练弹跳能力',
        tutorialCount: 28,
        scoringStandard: {
          excellent: 90,
          good: 75,
          pass: 60
        },
        status: 'active',
        sortOrder: 7
      },
      {
        name: '篮球运球',
        icon: '🏀',
        category: '球类',
        difficulty: '中等',
        gender: 'both',
        description: '篮球基本技能，考查球感和协调性',
        tutorialCount: 22,
        scoringStandard: {
          excellent: 90,
          good: 75,
          pass: 60
        },
        status: 'active',
        sortOrder: 8
      },
      {
        name: '足球运球',
        icon: '⚽',
        category: '球类',
        difficulty: '中等',
        gender: 'both',
        description: '足球基本技能，考查脚法和球感',
        tutorialCount: 20,
        scoringStandard: {
          excellent: 90,
          good: 75,
          pass: 60
        },
        status: 'active',
        sortOrder: 9
      },
      {
        name: '排球垫球',
        icon: '🏐',
        category: '球类',
        difficulty: '简单',
        gender: 'both',
        description: '排球基本技能，训练手眼协调',
        tutorialCount: 18,
        scoringStandard: {
          excellent: 90,
          good: 75,
          pass: 60
        },
        status: 'active',
        sortOrder: 10
      }
    ];

    await ExamItem.insertMany(examItems);
    console.log(`已插入 ${examItems.length} 个考试项目`);

    // 初始化培训课程数据
    const trainingCourses = [
      {
        title: '中考体育冲刺班',
        instructor: '双十名师团队',
        description: '针对中考体育的全面训练，包含所有必考和选考项目的专业指导，保证学生在中考中取得优异成绩。课程包括理论讲解、技术训练、体能提升等全方位内容。',
        price: 1980.00,
        originalPrice: 2980.00,
        duration: '60天',
        level: '中级',
        students: 2856,
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop',
        tags: ['王牌课程', '限时优惠'],
        isHot: true,
        category: '综合',
        status: 'active',
        sortOrder: 1
      },
      {
        title: '跑步技巧提升营',
        instructor: '田径专业教练',
        description: '专业的跑步技巧训练，从起跑、途中跑到冲刺的全程技术指导，帮助学生掌握正确的跑步姿势，提高跑步效率和成绩。',
        price: 890.00,
        originalPrice: 1290.00,
        duration: '30天',
        level: '初级',
        students: 1234,
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=250&fit=crop',
        tags: ['技巧提升'],
        isHot: true,
        category: '跑步',
        status: 'active',
        sortOrder: 2
      },
      {
        title: '游泳技能特训',
        instructor: '游泳国家级教练',
        description: '从零基础到熟练掌握，包括蛙泳、自由泳等多种泳姿教学，水性培养，呼吸技巧，让学生安全高效地学会游泳。',
        price: 1580.00,
        originalPrice: 2080.00,
        duration: '45天',
        level: '初级',
        students: 856,
        rating: 4.7,
        imageUrl: 'https://images.unsplash.com/photo-1560089000-7433a4ebbd64?w=400&h=250&fit=crop',
        tags: ['零基础'],
        isHot: false,
        category: '游泳',
        status: 'active',
        sortOrder: 3
      },
      {
        title: '篮球技巧训练营',
        instructor: '篮球专业教练',
        description: '篮球基本功训练，运球、投篮、传球等技术动作规范化教学，提高球感和比赛技巧，适合有一定基础的学生。',
        price: 1280.00,
        duration: '40天',
        level: '中级',
        students: 678,
        rating: 4.6,
        imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=250&fit=crop',
        tags: ['技能训练'],
        isHot: false,
        category: '球类',
        status: 'active',
        sortOrder: 4
      },
      {
        title: '力量训练基础课',
        instructor: '体能训练师',
        description: '安全有效的力量训练方法，针对中学生身体特点设计的训练计划，包括引体向上、仰卧起坐等项目的针对性训练。',
        price: 680.00,
        originalPrice: 980.00,
        duration: '25天',
        level: '初级',
        students: 445,
        rating: 4.5,
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop',
        tags: ['基础训练'],
        isHot: false,
        category: '力量',
        status: 'active',
        sortOrder: 5
      },
      {
        title: '足球基本功训练',
        instructor: '足球青训教练',
        description: '足球运球、传球、射门等基本技术教学，培养良好的球感和场上意识，适合足球初学者和进阶学员。',
        price: 980.00,
        duration: '35天',
        level: '初级',
        students: 523,
        rating: 4.4,
        imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=250&fit=crop',
        tags: ['基本功'],
        isHot: false,
        category: '球类',
        status: 'active',
        sortOrder: 6
      }
    ];

    await TrainingCourse.insertMany(trainingCourses);
    console.log(`已插入 ${trainingCourses.length} 个培训课程`);

    // 初始化考试通知数据
    const examNotifications = [
      {
        title: '2024年厦门市中考体育考试报名须知',
        content: `各位考生及家长：

2024年厦门市中考体育考试即将开始，现将有关事项通知如下：

一、考试时间
1. 报名时间：2024年3月1日至3月15日
2. 考试时间：2024年4月15日至5月15日

二、考试项目
1. 必考项目：1000米跑（男）/800米跑（女）
2. 选考项目：从篮球、足球、排球、游泳、引体向上（男）/仰卧起坐（女）、立定跳远、实心球中选择两项

三、报名要求
1. 身体健康，无重大疾病
2. 按时参加体检
3. 准备相关证件材料

四、注意事项
1. 考试期间注意安全
2. 遵守考试纪律
3. 如有身体不适及时报告

请各位考生认真准备，祝取得优异成绩！

厦门市教育局
2024年2月20日`,
        type: '报名须知',
        publishDate: new Date('2024-02-20'),
        examYear: 2024,
        city: '厦门',
        isImportant: true,
        status: 'published'
      },
      {
        title: '中考体育考试项目评分标准公布',
        content: `根据教育部最新要求，现公布2024年中考体育考试各项目评分标准：

一、跑步项目
男子1000米：优秀3'20"，良好3'50"，及格4'30"
女子800米：优秀3'18"，良好3'48"，及格4'23"

二、球类项目
篮球运球：优秀9.4秒，良好12.8秒，及格17.0秒
足球运球：优秀7.5秒，良好10.5秒，及格15.6秒

三、力量项目
引体向上（男）：优秀15个，良好10个，及格4个
仰卧起坐（女）：优秀52个，良好44个，及格26个

详细标准请查看附件。`,
        type: '考试安排',
        publishDate: new Date('2024-02-25'),
        examYear: 2024,
        city: '厦门',
        isImportant: true,
        status: 'published'
      },
      {
        title: '体育考试安全注意事项',
        content: `为确保考试安全顺利进行，特提醒以下注意事项：

1. 考前准备
- 充分热身，避免运动损伤
- 穿着合适的运动服装和鞋子
- 检查身体状况，如有不适及时报告

2. 考试期间
- 严格遵守考试纪律
- 听从监考老师指挥
- 注意安全，量力而行

3. 考后注意
- 适当放松，避免剧烈运动
- 及时补充水分
- 如有身体不适及时就医

祝愿所有考生考试顺利！`,
        type: '注意事项',
        publishDate: new Date('2024-03-01'),
        examYear: 2024,
        city: '厦门',
        isImportant: false,
        status: 'published'
      },
      {
        title: '中考体育成绩查询通知',
        content: `2024年中考体育考试成绩将于考试结束后一周内公布。

查询方式：
1. 登录厦门市教育局官网
2. 使用准考证号和身份证号查询
3. 关注官方微信公众号获取成绩推送

如对成绩有异议，可在公布后3日内提出申请复查。

查询网址：www.xmedu.gov.cn`,
        type: '成绩查询',
        publishDate: new Date('2024-04-01'),
        examYear: 2024,
        city: '厦门',
        isImportant: false,
        status: 'published'
      }
    ];

    await ExamNotification.insertMany(examNotifications);
    console.log(`已插入 ${examNotifications.length} 个考试通知`);

    console.log('✅ 体育赛事数据初始化完成！');
    
    // 输出统计信息
    const itemCount = await ExamItem.countDocuments();
    const courseCount = await TrainingCourse.countDocuments();
    const notificationCount = await ExamNotification.countDocuments();
    
    console.log(`📊 数据统计：`);
    console.log(`- 考试项目：${itemCount} 个`);
    console.log(`- 培训课程：${courseCount} 个`);
    console.log(`- 考试通知：${notificationCount} 个`);
    
  } catch (error) {
    console.error('❌ 初始化体育赛事数据失败:', error);
  } finally {
    process.exit(0);
  }
}

// 运行初始化
initSportsEventsData(); 