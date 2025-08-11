import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Typography,
  Card,
  Button,
  Space,
  Statistic,
  Avatar,
  Flex,
  ConfigProvider,
  Affix,
  Progress,
  Badge,
  message,
  Spin
} from 'antd';
import {
  ArrowLeftOutlined,
  ThunderboltOutlined,
  FireOutlined,
  TrophyOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  CloudOutlined,
  PlayCircleOutlined,
  CarOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import {
  getRandomQuote
} from '../data/mockSportsData';
import { api } from '../services/api';
import type { SportsData, WeatherData, SportStats } from '../api/types';
import './Sports.css';

const { Title, Text } = Typography;
const { Header, Content } = Layout;

const SportsPage: React.FC = () => {
  const navigate = useNavigate();
  
  // 状态管理
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [todaySports, setTodaySports] = useState<SportsData | null>(null);
  const [sportsStats, setSportsStats] = useState<SportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [motivationalText, setMotivationalText] = useState<string>(getRandomQuote());

  // 计算进度百分比
  const progressPercent = todaySports ? Math.round((todaySports.steps / todaySports.goal) * 100) : 0;

  // 页面初始化时加载数据
  useEffect(() => {
    loadSportsData();
  }, []);

  // 加载运动数据
  const loadSportsData = async () => {
    try {
      setLoading(true);
      const [todayRes, weatherRes, statsRes] = await Promise.all([
        api.sports.getTodaySports(),
        api.sports.getCurrentWeather(),
        api.sports.getSportsStats()
      ]);

      if (todayRes.success) {
        setTodaySports(todayRes.data);
      }
      if (weatherRes.success) {
        setWeather(weatherRes.data);
      }
      if (statsRes.success) {
        setSportsStats(statsRes.data);
      }
    } catch (error) {
      console.error('加载运动数据失败:', error);
      // 降级到模拟数据
      const { mockTodaySports, mockWeather, mockSportsStats } = await import('../data/mockSportsData');
      setTodaySports(mockTodaySports);
      setWeather(mockWeather);
      setSportsStats(mockSportsStats);
    } finally {
      setLoading(false);
    }
  };

  // 刷新数据
  const refreshData = async () => {
    try {
      setRefreshing(true);
      
      // 使用API刷新运动数据
      const refreshRes = await api.sports.refreshSportsData({
        currentSteps: todaySports?.steps,
        currentDistance: todaySports?.distance,
        currentCalories: todaySports?.calories
      });

      if (refreshRes.success) {
        const updatedSports = {
          ...todaySports!,
          ...refreshRes.data
        };
        setTodaySports(updatedSports);
        
        // 计算增加的数据用于提示
        const addedSteps = refreshRes.data.steps - (todaySports?.steps || 0);
        const addedDistance = Math.round((refreshRes.data.distance - (todaySports?.distance || 0)) * 100) / 100;
        const addedCalories = refreshRes.data.calories - (todaySports?.calories || 0);
        
        message.success(`数据已更新！+${addedSteps}步，+${addedDistance}km，+${addedCalories}卡路里`);
      }

      // 重新获取天气数据
      const weatherRes = await api.sports.getCurrentWeather();
      if (weatherRes.success) {
        setWeather(weatherRes.data);
      }
      
      setMotivationalText(getRandomQuote());
    } catch (error) {
      console.error('刷新数据失败:', error);
      message.error('刷新失败');
    } finally {
      setRefreshing(false);
    }
  };

  // 开始锻炼
  const startWorkout = async () => {
    try {
      // 模拟30分钟锻炼的数据增长
      const currentSteps = todaySports?.steps || 0;
      const currentDistance = todaySports?.distance || 0;
      const currentCalories = todaySports?.calories || 0;
      const currentActiveMinutes = todaySports?.activeMinutes || 0;
      
      // 30分钟锻炼增加的数据
      const addedSteps = 3000; // 30分钟约3000步
      const addedDistance = 2.5; // 约2.5公里
      const addedCalories = 150; // 约150卡路里
      const addedMinutes = 30; // 30分钟活跃时间
      
      const updatedSports: SportsData = {
        ...todaySports!,
        steps: currentSteps + addedSteps,
        distance: Math.round((currentDistance + addedDistance) * 100) / 100,
        calories: currentCalories + addedCalories,
        activeMinutes: currentActiveMinutes + addedMinutes
      };
      
      setTodaySports(updatedSports);
      message.success(`锻炼完成！+${addedSteps}步，+${addedDistance}km，+${addedCalories}卡路里`);
    } catch (error) {
      message.error('记录锻炼失败');
    }
  };

  // 数据已预加载，直接渲染页面

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 12,
        },
      }}
    >
      <Layout style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        {/* 固定顶部导航 */}
        <Affix offsetTop={0}>
          <Header style={{ 
            backgroundColor: 'white',
            borderBottom: '1px solid #f0f0f0',
            padding: '0 16px',
            height: 'auto',
            lineHeight: 'normal',
            paddingTop: 12,
            paddingBottom: 12,
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
          }}>
            <Flex justify="space-between" align="center">
              <Button 
                type="text" 
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(-1)}
                size="large"
                shape="circle"
              />
              
              <Title 
                level={3} 
                style={{ 
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 600
                }}
              >
                全民健身
              </Title>
              
              <div style={{ width: 40 }} />
            </Flex>
          </Header>
        </Affix>

        <Content style={{ padding: '16px' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            
            {/* 天气信息卡片 */}
            <Card 
              className="animate__animated animate__fadeInUp weather-card"
              style={{ 
                background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
                border: 'none',
                color: 'white',
                animationDelay: '0.1s'
              }}
              styles={{ body: { padding: 20 } }}
            >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Flex justify="space-between" align="center">
                  <Space>
                    <CloudOutlined style={{ fontSize: 20, color: 'white' }} />
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: 500 }}>
                      {weather?.temperature || '--'}°C
                    </Text>
                  </Space>
                  <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>
                    {weather?.condition || '--'}
                  </Text>
                </Flex>
                
                <Text style={{ color: 'white', fontSize: 14, lineHeight: 1.4 }}>
                  {todaySports && (todaySports.steps > 0 || todaySports.distance > 0) 
                    ? `今日：${todaySports.distance.toFixed(2)}km，${todaySports.steps}步，继续加油！`
                    : '今天还没有开始运动，点击开始锻炼吧！'
                  }
                </Text>
                
                {/* 智能运动建议 */}
                <div style={{ 
                  marginTop: 8, 
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: 8,
                  backdropFilter: 'blur(10px)'
                }}>
                  <Text style={{ color: 'white', fontSize: 12 }}>
                    💡 {weather?.temperature && weather.temperature > 25 
                      ? '天气较热，建议选择室内运动或傍晚时段锻炼'
                      : weather?.temperature && weather.temperature < 10
                      ? '天气较冷，运动前请充分热身，注意保暖'
                      : '天气不错，适合户外运动！推荐跑步或骑行'
                    }
                  </Text>
                </div>
                
                <Flex justify="flex-end">
                  <Button 
                    type="text" 
                    size="small"
                    style={{ color: 'white', fontSize: 12 }}
                    icon={<ReloadOutlined spin={refreshing} />}
                    onClick={refreshData}
                  >
                    {refreshing ? '刷新中...' : '刷新数据'}
                  </Button>
                </Flex>
              </Space>
            </Card>

            {/* 励志语句 */}
            <Card 
              className="animate__animated animate__fadeInUp"
              style={{ 
                textAlign: 'center',
                animationDelay: '0.2s',
                background: 'linear-gradient(135deg, #a8e6cf 0%, #88d8a3 100%)',
                border: 'none'
              }}
              styles={{ body: { padding: 16 } }}
            >
              <Text style={{ 
                fontSize: 15, 
                fontWeight: 500,
                color: '#2d3436',
                lineHeight: 1.5
              }}>
{motivationalText || "看着镜子里的马甲线，曾经的胖子如今都是倍棒的！"}
              </Text>
            </Card>

            {/* 成就徽章系统 */}
            <Card 
              className="animate__animated animate__fadeInUp achievement-card"
              style={{ 
                animationDelay: '0.25s',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                color: 'white'
              }}
              styles={{ body: { padding: 16 } }}
            >
              <Flex justify="space-between" align="center">
                <div>
                  <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>
                    今日成就
                  </Text>
                  <div style={{ marginTop: 4 }}>
                    {/* 动态徽章显示 */}
                    {(todaySports?.steps || 0) >= 5000 && (
                      <Badge 
                        count="🚶‍♂️ 步行达人" 
                        style={{ 
                          backgroundColor: 'rgba(255,255,255,0.2)', 
                          color: 'white',
                          fontSize: 12,
                          marginRight: 8
                        }} 
                      />
                    )}
                    {(todaySports?.distance || 0) >= 3 && (
                      <Badge 
                        count="🏃‍♂️ 长跑健将" 
                        style={{ 
                          backgroundColor: 'rgba(255,255,255,0.2)', 
                          color: 'white',
                          fontSize: 12,
                          marginRight: 8
                        }} 
                      />
                    )}
                    {progressPercent >= 100 && (
                      <Badge 
                        count="🎯 目标达成" 
                        style={{ 
                          backgroundColor: 'rgba(255,255,255,0.2)', 
                          color: 'white',
                          fontSize: 12
                        }} 
                      />
                    )}
                    {(todaySports?.steps || 0) === 0 && (
                      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                        开始运动，解锁成就！
                      </Text>
                    )}
                  </div>
                </div>
                <TrophyOutlined style={{ fontSize: 32, opacity: 0.8 }} />
              </Flex>
            </Card>

            {/* 今日运动数据 */}
            <Card 
              title={
                <Flex align="center" gap="small">
                  <FireOutlined style={{ color: '#ff7675' }} />
                  <Text strong>今日运动量</Text>
                </Flex>
              }
              className="animate__animated animate__fadeInUp stats-card"
              style={{ animationDelay: '0.3s' }}
            >
              <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
                {/* 主要数据展示 */}
                <Flex justify="space-around" align="center">
                  <div style={{ textAlign: 'center', position: 'relative' }}>
                    {/* 添加动画圆环背景 */}
                    <div style={{
                      position: 'absolute',
                      top: -10,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #74b9ff20, #0984e320)',
                      zIndex: -1
                    }} />
                    <Statistic
                      value={todaySports?.distance || 0}
                      suffix="KM"
                      precision={2}
                      valueStyle={{ 
                        fontSize: 32, 
                        fontWeight: 'bold',
                        color: '#2d3436',
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
                      🏃‍♂️ 距离
                    </Text>
                    {/* 小趋势指示器 */}
                    {todaySports?.distance && todaySports.distance > 2 && (
                      <div style={{ fontSize: 10, color: '#00b894', marginTop: 2 }}>
                        ↗️ 表现不错
                      </div>
                    )}
                  </div>
                  
                  <div style={{ textAlign: 'center', position: 'relative' }}>
                    {/* 添加动画圆环背景 */}
                    <div style={{
                      position: 'absolute',
                      top: -10,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #fd79a820, #fdcb6e20)',
                      zIndex: -1
                    }} />
                    <Statistic
                      value={todaySports?.steps || 0}
                      suffix="步"
                      valueStyle={{ 
                        fontSize: 32, 
                        fontWeight: 'bold',
                        color: '#2d3436',
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
                      👣 步数
                    </Text>
                    {/* 小趋势指示器 */}
                    {todaySports?.steps && todaySports.steps >= 5000 && (
                      <div style={{ fontSize: 10, color: '#00b894', marginTop: 2 }}>
                        ↗️ 目标达成
                      </div>
                    )}
                  </div>
                </Flex>

                {/* 进度条 */}
                <div style={{ width: '100%' }}>
                  <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                    <Text style={{ fontSize: 13, color: '#636e72' }}>
                      消耗{todaySports?.calories || 0}卡路里，相当于一个汉堡
                    </Text>
                    <Text style={{ fontSize: 13, color: '#00b894', fontWeight: 500 }}>
                      {progressPercent}%
                    </Text>
                  </Flex>
                  <Progress 
                    percent={progressPercent} 
                    strokeColor={{
                      '0%': '#74b9ff',
                      '100%': '#0984e3',
                    }}
                    trailColor="#f1f2f6"
                    strokeWidth={8}
                    showInfo={false}
                  />
                  
                  {/* 简单的历史趋势 */}
                  <div style={{ 
                    marginTop: 12, 
                    padding: '8px 12px',
                    background: '#f8f9fa',
                    borderRadius: 6,
                    fontSize: 12
                  }}>
                    <Flex justify="space-between" align="center">
                      <Text style={{ fontSize: 11, color: '#666' }}>
                        📊 本周平均：{Math.round((todaySports?.steps || 0) * 0.8)}步/天
                      </Text>
                      <Text style={{ fontSize: 11, color: progressPercent > 80 ? '#00b894' : '#fdcb6e' }}>
                        {progressPercent > 80 ? '🔥 超越80%用户' : '💪 继续努力'}
                      </Text>
                    </Flex>
                  </div>
                </div>
              </Space>
            </Card>

            {/* 操作按钮区域 */}
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {/* 开始锻炼按钮 */}
              <Button
                type="primary"
                size="large"
                icon={<PlayCircleOutlined />}
                className="animate__animated animate__bounceIn action-button"
                style={{
                  width: '100%',
                  height: 80,
                  borderRadius: 40,
                  fontSize: 18,
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
                  border: 'none',
                  boxShadow: '0 8px 20px rgba(116, 185, 255, 0.4)',
                  animationDelay: '0.5s',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease'
                }}
                onClick={startWorkout}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 25px rgba(116, 185, 255, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(116, 185, 255, 0.4)';
                }}
              >
                <span style={{ position: 'relative', zIndex: 1 }}>
                  {todaySports && todaySports.steps > 0 ? '继续锻炼 💪' : '开始锻炼 🚀'}
                </span>
                {/* 动态光效 */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  animation: 'shine 3s infinite',
                  zIndex: 0
                }} />
              </Button>

              {/* 其他功能按钮 */}
              <Flex gap="middle" style={{ width: '100%' }}>
                <Button
                  icon={<CarOutlined />}
                  className="animate__animated animate__bounceIn secondary-button"
                  style={{
                    flex: 1,
                    height: 50,
                    borderRadius: 25,
                    background: '#fd79a8',
                    color: 'white',
                    border: 'none',
                    fontWeight: 500,
                    animationDelay: '0.6s'
                  }}
                >
                  骑行模式
                </Button>
                
                <Button
                  icon={<TrophyOutlined />}
                  className="animate__animated animate__bounceIn secondary-button"
                  style={{
                    flex: 1,
                    height: 50,
                    borderRadius: 25,
                    background: '#fdcb6e',
                    color: 'white',
                    border: 'none',
                    fontWeight: 500,
                    animationDelay: '0.7s'
                  }}
                >
                  挑战赛
                </Button>
              </Flex>
            </Space>

          </Space>
        </Content>
      </Layout>
    </ConfigProvider>
  );
};

export default SportsPage;