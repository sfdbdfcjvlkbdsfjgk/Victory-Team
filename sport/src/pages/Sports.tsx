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
  mockTodaySports,
  mockWeather,
  mockSportsStats,
  getRandomQuote
} from '../data/mockSportsData';
import type { SportsData, WeatherData, SportStats } from '../api/types';
import './Sports.css';

const { Title, Text } = Typography;
const { Header, Content } = Layout;

const SportsPage: React.FC = () => {
  const navigate = useNavigate();
  
  // 状态管理 - 直接使用默认数据
  const [weather, setWeather] = useState<WeatherData | null>(mockWeather);
  const [todaySports, setTodaySports] = useState<SportsData | null>(mockTodaySports);
  const [sportsStats, setSportsStats] = useState<SportStats | null>(mockSportsStats);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [motivationalText, setMotivationalText] = useState<string>(getRandomQuote());

  // 计算进度百分比
  const progressPercent = todaySports ? Math.round((todaySports.steps / todaySports.goal) * 100) : 0;

  // 页面初始化时数据已经加载完成，无需额外加载
  useEffect(() => {
    console.log('🏃 全民健身页面已加载，数据已就绪');
  }, []);

  // 刷新数据
  const refreshData = async () => {
    try {
      setRefreshing(true);
      
      // 模拟刷新延迟
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 随机增加运动数据
      const currentSteps = todaySports?.steps || 0;
      const currentDistance = todaySports?.distance || 0;
      const currentCalories = todaySports?.calories || 0;
      
      const addedSteps = Math.floor(Math.random() * 500) + 200; // 每次增加200-700步
      const addedDistance = Math.round((Math.random() * 0.5 + 0.2) * 100) / 100; // 增加0.2-0.7km
      const addedCalories = Math.floor(Math.random() * 50) + 30; // 增加30-80卡路里
      
      const newSteps = currentSteps + addedSteps;
      const newDistance = Math.round((currentDistance + addedDistance) * 100) / 100;
      const newCalories = currentCalories + addedCalories;
      
      const updatedSports: SportsData = {
        ...mockTodaySports,
        steps: newSteps,
        distance: newDistance,
        calories: newCalories,
        activeMinutes: (todaySports?.activeMinutes || 0) + Math.floor(Math.random() * 15) + 10 // 增加10-25分钟
      };
      
      // 随机更新天气
      const temperatures = [25, 26, 27, 28, 29, 30, 31, 32];
      const conditions = ['晴', '多云', '晴朗', '微风'];
      const randomTemp = temperatures[Math.floor(Math.random() * temperatures.length)];
      const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
      
      const updatedWeather: WeatherData = {
        ...mockWeather,
        temperature: randomTemp,
        condition: randomCondition
      };
      
      setTodaySports(updatedSports);
      setWeather(updatedWeather);
      setMotivationalText(getRandomQuote());
      message.success(`数据已更新！+${addedSteps}步，+${addedDistance}km，+${addedCalories}卡路里`);
    } catch (error) {
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
        ...mockTodaySports,
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
                  <div>
                    <Statistic
                      value={todaySports?.distance || 0}
                      suffix="KM"
                      precision={2}
                      valueStyle={{ 
                        fontSize: 32, 
                        fontWeight: 'bold',
                        color: '#2d3436'
                      }}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      距离
                    </Text>
          </div>
                  
                  <div>
                    <Statistic
                      value={todaySports?.steps || 0}
                      suffix="步"
                      valueStyle={{ 
                        fontSize: 32, 
                        fontWeight: 'bold',
                        color: '#2d3436'
                      }}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      步数
                    </Text>
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
                  animationDelay: '0.5s'
                }}
                onClick={startWorkout}
              >
                开始锻炼
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