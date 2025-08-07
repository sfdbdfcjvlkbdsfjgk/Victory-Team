const axios = require('axios');

// 测试后端连接
async function testConnection() {
  console.log('🔍 开始测试前后端连接...\n');

  const backendUrl = 'http://localhost:3000';

  try {
    // 1. 测试ht后台API - 获取Banner列表
    console.log('1️⃣ 测试ht后台API连接...');
    const bannerListResponse = await axios.get(`${backendUrl}/banner/list`);
    console.log('✅ ht后台API连接成功');
    console.log(`   获取到 ${bannerListResponse.data.data.length} 条Banner数据`);
    
    // 2. 测试sport前端API - 获取首页横幅
    console.log('\n2️⃣ 测试sport前端API连接...');
    const homeBannerResponse = await axios.get(`${backendUrl}/home/banner`);
    console.log('✅ sport前端横幅API连接成功');
    console.log(`   获取到 ${homeBannerResponse.data.data.length} 条横幅数据`);
    
    // 3. 测试快捷功能API
    const quickActionsResponse = await axios.get(`${backendUrl}/home/quick-actions`);
    console.log('✅ sport前端快捷功能API连接成功');
    console.log(`   获取到 ${quickActionsResponse.data.data.length} 条快捷功能数据`);
    
    // 4. 测试活动API
    const activitiesResponse = await axios.get(`${backendUrl}/home/activities`);
    console.log('✅ sport前端活动API连接成功');
    console.log(`   获取到 ${activitiesResponse.data.data.length} 条活动数据`);
    
    console.log('\n🎉 所有API连接测试完成！');
    console.log('\n📊 数据统计：');
    console.log(`   - ht后台Banner总数: ${bannerListResponse.data.data.length}`);
    console.log(`   - sport前端横幅: ${homeBannerResponse.data.data.length}`);
    console.log(`   - sport前端快捷功能: ${quickActionsResponse.data.data.length}`);
    console.log(`   - sport前端活动: ${activitiesResponse.data.data.length}`);
    
    // 检查关键字段
    console.log('\n🔍 检查关键字段映射：');
    if (homeBannerResponse.data.data.length > 0) {
      const banner = homeBannerResponse.data.data[0];
      console.log('   横幅字段:', Object.keys(banner));
      if (banner.subtitle !== undefined) {
        console.log('   ✅ subtitle字段存在');
      } else {
        console.log('   ⚠️ subtitle字段缺失');
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ 连接测试失败:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   请确认后端服务器已启动（端口3000）');
    }
    return false;
  }
}

// 运行测试
testConnection();

module.exports = { testConnection }; 