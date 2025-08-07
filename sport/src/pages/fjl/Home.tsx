import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  Button,
  Space,
  Tag,
  Image,
  Row,
  Col,
  Typography,
  Avatar,
  Skeleton,
  Carousel,
  Badge,
  List,
  Affix,
  Divider,
  Flex,
  Grid,
  Layout,
  theme,
  ConfigProvider,
  Spin,
  Empty,
  Result,
  Statistic,
  Steps,
  Timeline,
  Tabs,
  Collapse,
  Descriptions,
  Progress,
  Alert,
  notification,
  message
} from 'antd';
import {
  ArrowLeftOutlined,
  MoreOutlined,
  BellOutlined,
  PlayCircleOutlined,
  LikeOutlined,
  MessageOutlined,
  ShareAltOutlined,
  EyeOutlined,
  RightOutlined,
  FireOutlined,
  TrophyOutlined,
  UserOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  StarOutlined,
  HeartOutlined,
  TeamOutlined,
  HomeOutlined,
  MenuOutlined,
  ReloadOutlined,
  UpOutlined
} from '@ant-design/icons';

import type { 
  Activity, 
  Banner, 
  Notification as NotificationType, 
  FeatureIntro, 
  QuickAction, 
  CategoryTag,
  Content,
  UserActions
} from '../../api/types';
import {
  getHomeBanner,
  getQuickActions,
  getNotifications,
  getHotActivities,
  getFeatureIntros,
  getCategoryTags,
  joinActivity,
  getUnreadCount,
  clearRedDot
} from '../../api/home';
import { 
  mockBanners,
  mockQuickActions,
  mockNotifications,
  mockActivities,
  mockFeatureIntros,
  mockCategoryTags,
} from '../../data/mockData';
import './Home.css';
import LazyImage from '../../components/LazyImage';
import InfiniteScroll from '../../components/InfiniteScroll';
import ActivitySkeleton from '../../components/ActivitySkeleton';

const { Title, Text, Paragraph } = Typography;
const { Header, Content: LayoutContent, Footer } = Layout;
const { useBreakpoint } = Grid;
const { Panel } = Collapse;

// ============= 组件库化的页面组件 =============

const HomePage: React.FC = () => {
  const { token } = theme.useToken();
  const screens = useBreakpoint();
  
  // 状态管理
  const [banners, setBanners] = useState<Banner[]>([]);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categoryTags, setCategoryTags] = useState<CategoryTag[]>([]);
  const [unreadCount, setUnreadCount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<string>('跑步');
  const [activitiesPage, setActivitiesPage] = useState(1);
  const [hasMoreActivities, setHasMoreActivities] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // 加载数据
  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      
      try {
        const [
          bannerRes,
          actionsRes,
          notificationsRes,
          activitiesRes,
          tagsRes,
          unreadCountRes
        ] = await Promise.all([
          getHomeBanner(),
          getQuickActions(),
          getNotifications({ limit: 5 }),
          getHotActivities({ limit: 10 }),
          getCategoryTags(),
          getUnreadCount()
        ]);

        if (bannerRes.success && bannerRes.data.length > 0) {
          setBanners(bannerRes.data);
        }
        if (actionsRes.success) {
          setQuickActions(actionsRes.data);
        }
        if (notificationsRes.success) {
          setNotifications(notificationsRes.data);
        }
        if (activitiesRes.success) {
          setActivities(activitiesRes.data);
        }
        if (tagsRes.success) {
          setCategoryTags(tagsRes.data);
          const activeTagItem = tagsRes.data.find(tag => tag.isActive);
          if (activeTagItem) {
            setActiveTag(activeTagItem.name);
          }
        }
        if (unreadCountRes.success) {
          setUnreadCount(unreadCountRes.data);
        }
      } catch (apiError) {
        console.log('API连接失败，使用模拟数据:', apiError);
        // 使用模拟数据
        setBanners(mockBanners);
        setQuickActions(mockQuickActions);
        setNotifications(mockNotifications);
        setActivities(mockActivities);
        setCategoryTags(mockCategoryTags);
        const activeTagItem = mockCategoryTags.find(tag => tag.isActive);
        if (activeTagItem) {
          setActiveTag(activeTagItem.name);
        }
      }
    } catch (error) {
      console.error('加载首页数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理活动报名
  const handleJoinActivity = async (activityId: string) => {
    try {
      const result = await joinActivity(activityId);
      if (result.success) {
        setActivities(prev => 
          prev.map(activity => 
            activity._id === activityId 
              ? { ...activity, participants: activity.participants + 1 }
              : activity
          )
        );
        message.success('报名成功！');
      }
    } catch (error) {
      setActivities(prev => 
        prev.map(activity => 
          activity._id === activityId 
            ? { ...activity, participants: activity.participants + 1 }
            : activity
        )
      );
      message.success('报名成功！（模拟）');
    }
  };

  // 处理标签切换
  const handleTagClick = (tagName: string) => {
    setActiveTag(tagName);
  };

  // 处理红点消除
  const handleClearRedDot = async () => {
    try {
      await clearRedDot('all');
      const unreadResponse = await getUnreadCount();
      if (unreadResponse.success) {
        setUnreadCount(unreadResponse.data);
      }
    } catch (error) {
      console.warn('清除红点失败:', error);
    }
  };

  // 加载更多活动
  const loadMoreActivities = useCallback(async () => {
    if (activitiesLoading || !hasMoreActivities) return;

    try {
      setActivitiesLoading(true);
      const nextPage = activitiesPage + 1;
      
      const response = await getHotActivities({ 
        limit: 5, 
        page: nextPage 
      });
      
      if (response.success && response.data.length > 0) {
        setActivities(prev => [...prev, ...response.data]);
        setActivitiesPage(nextPage);
        
        if (response.data.length < 5) {
          setHasMoreActivities(false);
        }
      } else {
        setHasMoreActivities(false);
      }
    } catch (error) {
      console.warn('加载更多活动失败:', error);
    } finally {
      setActivitiesLoading(false);
    }
  }, [activitiesPage, activitiesLoading, hasMoreActivities]);

  // 取消加载状态，直接显示内容
  // if (loading) {
  //   return (
  //     <div>加载中...</div>
  //   );
  // }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4A90E2',
          borderRadius: 12,
        },
      }}
    >
      <Layout style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        {/* 固定顶部导航 */}
        <Affix offsetTop={0}>
          <Header style={{ 
            backgroundColor: 'white',
            borderBottom: `1px solid ${token.colorBorder}`,
            padding: '0 16px',
            height: 'auto',
            lineHeight: 'normal',
            paddingTop: 12,
            paddingBottom: 12,
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            position: 'relative'
          }}>
            <Flex justify="space-between" align="center">
              <Button 
                type="text" 
                icon={<ArrowLeftOutlined />}
                size="large"
                shape="circle"
              />
              
              <Title 
                level={3} 
                style={{ 
                  margin: 0,
                  color: token.colorText,
                  fontSize: 20,
                  fontWeight: 700
                }}
              >
                全民体育
              </Title>
              
              <Button 
                type="text" 
                icon={<MenuOutlined />}
                size="large"
                shape="circle"
              />
            </Flex>
          </Header>
        </Affix>

        {/* 主要内容区域 */}
        <LayoutContent style={{ padding: '16px' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            
            {/* 轮播横幅区域 */}
            <Card 
              className="animate__animated animate__fadeInUp"
              style={{ 
                borderRadius: token.borderRadius,
                animationDelay: '0.1s'
              }}
              styles={{ body: { padding: 0 } }}
              cover={
                banners.length > 0 ? (
                  <Carousel 
                    autoplay 
                    autoplaySpeed={4000}
                    dots={true}
                    infinite={true}
                    effect="fade"
                    dotPosition="bottom"
                  >
                    {banners.map((banner, index) => (
                      <div key={banner._id}>
                        <div 
                          className="animate__animated animate__fadeIn"
                          style={{ 
                            position: 'relative', 
                            height: 180,
                            cursor: 'pointer',
                            animationDelay: `${index * 0.2}s`,
                            overflow: 'hidden',
                            transition: 'transform 0.5s ease-in-out'
                          }}
                          onClick={() => {
                            // 点击跳转逻辑
                            if (banner.redirectUrl) {
                              if (banner.redirectType === '外部' || banner.redirectUrl.startsWith('http')) {
                                // 外部链接
                                window.open(banner.redirectUrl, '_blank');
                              } else {
                                // 内部路由跳转
                                window.location.href = banner.redirectUrl;
                              }
                            }
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          <LazyImage
                            src={banner.imageUrl}
                            alt={banner.title}
                            width="100%"
                            height={180}
                            style={{ 
                              borderRadius: `${token.borderRadius}px ${token.borderRadius}px 0 0`
                            }}
                            fallback="/default-banner.jpg"
                          />
                          
                          {/* 轻微的渐变遮罩，确保内容可读性 */}
                          {banner.title && (
                            <div 
                              className="animate__animated animate__slideInUp"
                              style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
                                padding: '20px 16px 16px 16px',
                                color: 'white',
                                animationDelay: '0.3s'
                              }}
                            >
                              <Text 
                                style={{ 
                                  color: 'white', 
                                  fontSize: 18, 
                                  fontWeight: 700,
                                  textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                                  display: 'block',
                                  marginBottom: banner.subtitle ? 4 : 0
                                }}
                              >
                                {banner.title}
                              </Text>
                              {banner.subtitle && (
                                <Text 
                                  style={{ 
                                    color: 'rgba(255,255,255,0.9)', 
                                    fontSize: 14, 
                                    fontWeight: 400,
                                    textShadow: '0 1px 3px rgba(0,0,0,0.7)'
                                  }}
                                >
                                  {banner.subtitle}
                                </Text>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </Carousel>
                ) : (
                  <Skeleton.Image active style={{ width: '100%', height: 180 }} />
                )
              }
            />

            {/* 快捷功能区域 */}
            <Card 
              title="快捷功能" 
              className="animate__animated animate__fadeInUp"
              style={{ 
                borderRadius: token.borderRadius,
                animationDelay: '0.2s'
              }}
            >
              {/* 第一行：前5个功能 */}
              <Row gutter={[16, 16]} justify="space-around">
                {quickActions.slice(0, 5).map((action, index) => (
                  <Col span={4.8} key={action._id}>
                    <Link 
                      to={action.redirectUrl}
                      onClick={(e) => {
                        console.log(`🔗 点击跳转到: ${action.title} -> ${action.redirectUrl}`);
                        // 如果是体育赛事，强制跳转到正确页面
                        if (action.title === '体育赛事') {
                          e.preventDefault();
                          window.location.href = '/sports-events';
                        }
                      }}
                    >
                      <Flex 
                        vertical 
                        align="center" 
                        gap="small"
                        className="animate__animated animate__bounceIn"
                        style={{
                          animationDelay: `${index * 0.1}s`,
                          transition: 'transform 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <Avatar
                          size={screens.xs ? 48 : 56}
                          style={{
                            background: `linear-gradient(135deg, ${getActionColor(action.type)})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <span style={{ fontSize: screens.xs ? 20 : 24 }}>
                            {action.icon}
                          </span>
                        </Avatar>
                        <Text 
                          style={{ 
                            fontSize: screens.xs ? 11 : 12, 
                            textAlign: 'center',
                            lineHeight: 1.2 
                          }}
                        >
                          {action.title}
                        </Text>
                      </Flex>
                    </Link>
                  </Col>
                ))}
              </Row>
              
              {/* 第二行：6-10个功能或更多服务 */}
              {quickActions.length > 5 && (
                <>
                  <Divider style={{ margin: '16px 0' }} />
                  <Row gutter={[16, 16]} justify="space-around">
                    {/* 显示第6-9个功能 */}
                    {quickActions.slice(5, 9).map((action, index) => (
                      <Col span={4.8} key={action._id}>
                        <Link 
                          to={action.redirectUrl}
                          onClick={(e) => {
                            console.log(`🔗 点击跳转到: ${action.title} -> ${action.redirectUrl}`);
                            // 如果是体育赛事，强制跳转到正确页面
                            if (action.title === '体育赛事') {
                              e.preventDefault();
                              window.location.href = '/sports-events';
                            }
                          }}
                        >
                          <Flex 
                            vertical 
                            align="center" 
                            gap="small"
                            className="animate__animated animate__bounceIn"
                            style={{
                              animationDelay: `${(index + 5) * 0.1}s`,
                              transition: 'transform 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            <Avatar
                              size={screens.xs ? 48 : 56}
                              style={{
                                background: `linear-gradient(135deg, ${getActionColor(action.type)})`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <span style={{ fontSize: screens.xs ? 20 : 24 }}>
                                {action.icon}
                              </span>
                            </Avatar>
                            <Text 
                              style={{ 
                                fontSize: screens.xs ? 11 : 12, 
                                textAlign: 'center',
                                lineHeight: 1.2 
                              }}
                            >
                              {action.title}
                            </Text>
                          </Flex>
                        </Link>
                      </Col>
                    ))}
                    
                    {/* 第10个位置：如果有第10个功能就显示，如果超过10个就显示更多服务 */}
                    {quickActions.length >= 10 && (
                      <Col span={4.8}>
                        {quickActions.length === 10 ? (
                          // 正好10个，显示第10个功能
                          <Link to={quickActions[9].redirectUrl}>
                            <Flex vertical align="center" gap="small">
                              <Avatar
                                size={screens.xs ? 48 : 56}
                                style={{
                                  background: `linear-gradient(135deg, ${getActionColor(quickActions[9].type)})`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <span style={{ fontSize: screens.xs ? 20 : 24 }}>
                                  {quickActions[9].icon}
                                </span>
                              </Avatar>
                              <Text 
                                style={{ 
                                  fontSize: screens.xs ? 11 : 12, 
                                  textAlign: 'center',
                                  lineHeight: 1.2 
                                }}
                              >
                                {quickActions[9].title}
                              </Text>
                            </Flex>
                          </Link>
                        ) : (
                          // 超过10个，显示更多服务
                          <Link to="/more-services">
                            <Flex vertical align="center" gap="small">
                              <Avatar
                                size={screens.xs ? 48 : 56}
                                style={{
                                  background: 'linear-gradient(135deg, #E0E0E0, #BDBDBD)',
                                  border: '2px dashed #999',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <MoreOutlined style={{ fontSize: screens.xs ? 16 : 20 }} />
                              </Avatar>
                              <Text 
                                style={{ 
                                  fontSize: screens.xs ? 11 : 12, 
                                  textAlign: 'center',
                                  lineHeight: 1.2 
                                }}
                              >
                                更多服务
                              </Text>
                            </Flex>
                          </Link>
                        )}
                      </Col>
                    )}
                    
                    {/* 如果只有6-9个功能，补充空位保持布局对齐 */}
                    {quickActions.length > 5 && quickActions.length < 10 && (
                      Array.from({ length: 10 - quickActions.length }).map((_, index) => (
                        <Col span={4.8} key={`empty-${index}`}>
                          <div style={{ height: screens.xs ? 60 : 72 }}></div>
                        </Col>
                      ))
                    )}
                  </Row>
                </>
              )}
            </Card>

            {/* 消息通知 */}
            {(notifications.length > 0 || true) && (
              <Alert
                banner
                showIcon={false}
                className="animate__animated animate__fadeInLeft"
                style={{ 
                  borderRadius: token.borderRadius,
                  backgroundColor: '#fff',
                  border: '1px solid #f0f0f0',
                  padding: '12px 16px',
                  animationDelay: '0.3s'
                }}
                message={
                  <Flex justify="space-between" align="center" style={{ width: '100%' }}>
                    <Flex align="center" gap="small" style={{ flex: 1 }}>
                      <BellOutlined 
                        style={{ 
                          fontSize: 16, 
                          color: '#ff4d4f',
                          flexShrink: 0
                        }} 
                      />
                      <Text 
                        style={{ 
                          fontSize: 14, 
                          color: token.colorText,
                          lineHeight: 1.4,
                          flex: 1
                        }}
                      >
                        你的"第一届山跑活动"报名通过申核！厦门第一届山跑比赛开始报名啦！
                      </Text>
                    </Flex>
                    <Flex align="center" gap="small" style={{ flexShrink: 0 }}>
                      <Badge 
                        dot 
                        style={{ 
                          backgroundColor: '#ff4d4f'
                        }}
                      />
                      <Button 
                        type="text" 
                        size="small"
                        icon={<RightOutlined />}
                        onClick={handleClearRedDot}
                        style={{ 
                          fontSize: 12, 
                          color: token.colorTextSecondary,
                          padding: 0,
                          height: 'auto',
                          lineHeight: 1
                        }}
                      />
                    </Flex>
                  </Flex>
                }
              />
            )}

            {/* 精选活动区域 */}
            <Card 
              title="精选活动" 
              className="animate__animated animate__fadeInUp"
              style={{ 
                borderRadius: token.borderRadius,
                animationDelay: '0.4s'
              }}
            >
              <div 
                className="hide-scrollbar"
                style={{ 
                  overflowX: 'auto', 
                  paddingBottom: 8,
                  margin: '0 -16px',
                  padding: '0 16px',
                  scrollbarWidth: 'none', // Firefox
                  msOverflowStyle: 'none', // IE/Edge
                }}
              >
                <Flex gap="middle" style={{ minWidth: 'max-content' }}>
                  {[
                    { title: '蓝卡级数能力赛', subtitle: '对其自有场地参与式法定对象', color: '#4A90E2' },
                    { title: '中级线上赛', subtitle: '参与线上各种集体赛，获得各种人气', color: '#E74C3C' },
                    { title: '高级挑战赛', subtitle: '面向专业选手的高难度挑战赛事', color: '#27AE60' },
                    { title: '团队协作赛', subtitle: '培养团队合作精神与默契配合', color: '#9B59B6' },
                    { title: '青少年特训', subtitle: '专为青少年设计的专业训练课程', color: '#F39C12' }
                  ].map((module, index) => (
                    <Card
                      key={index}
                      size="small"
                      style={{
                        minWidth: screens.xs ? 240 : 280,
                        background: `linear-gradient(135deg, ${module.color}, ${module.color}DD)`,
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer'
                      }}
                      styles={{
                        body: {
                          padding: screens.xs ? 16 : 20,
                          height: screens.xs ? 100 : 120,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }
                      }}
                      hoverable
                    >
                      <div>
                        <Title 
                          level={5} 
                          style={{ 
                            color: 'white', 
                            margin: '0 0 4px 0',
                            fontSize: screens.xs ? 14 : 16
                          }}
                        >
                          {module.title}
                        </Title>
                        <Text 
                          style={{ 
                            color: 'rgba(255,255,255,0.9)', 
                            fontSize: screens.xs ? 11 : 12,
                            lineHeight: 1.3
                          }}
                        >
                          {module.subtitle}
                        </Text>
                      </div>
                    </Card>
                  ))}
                </Flex>
              </div>
            </Card>



            {/* 热门活动列表（带筛选） */}
            <Card 
              className="animate__animated animate__fadeInUp"
              style={{ 
                borderRadius: token.borderRadius,
                animationDelay: '0.5s'
              }}
            >
              {/* 分类标签筛选区域 */}
              <div 
                className="hide-scrollbar"
                style={{ 
                  overflowX: 'auto',
                  margin: '0 -16px 16px -16px',
                  padding: '0 16px',
                  scrollbarWidth: 'none', // Firefox
                  msOverflowStyle: 'none', // IE/Edge
                }}
              >
                <Space size="small" style={{ minWidth: 'max-content' }}>
                  {categoryTags.map((tag) => (
                    <Tag
                      key={tag._id}
                      color={activeTag === tag.name ? 'blue' : 'default'}
                      style={{
                        cursor: 'pointer',
                        borderRadius: 16,
                        padding: '4px 12px',
                        fontSize: 13
                      }}
                      onClick={() => handleTagClick(tag.name)}
                    >
                      {tag.name}
                    </Tag>
                  ))}
                </Space>
              </div>

              {/* 活动列表区域 */}
              <InfiniteScroll
                hasMore={hasMoreActivities}
                loading={activitiesLoading}
                onLoadMore={loadMoreActivities}
                threshold={150}
              >
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {activitiesLoading && activities.length === 0 ? (
                    <ActivitySkeleton count={3} />
                  ) : activities.filter(activity => activeTag === '全部' || activity.category === activeTag).length === 0 ? (
                    <Empty description={activities.length === 0 ? "暂无活动" : `暂无"${activeTag}"类型的活动`} />
                  ) : (
                    activities
                      .filter(activity => activeTag === '全部' || activity.category === activeTag)
                      .map((activity, index) => (
                      <Card 
                        key={activity._id}
                        size="small"
                        className="animate__animated animate__fadeInUp"
                        style={{ 
                          borderRadius: 12,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                          transition: 'all 0.3s ease',
                          animationDelay: `${(index % 3) * 0.1}s`
                        }}
                        styles={{ body: { padding: 16 } }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                        }}
                      >
                        <Row gutter={16} align="middle">
                          <Col flex="none">
                            <LazyImage
                              src={activity.imageUrl}
                              alt={activity.title}
                              width={80}
                              height={60}
                              style={{ 
                                borderRadius: 8
                              }}
                              fallback="/default-activity.jpg"
                            />
                          </Col>
                          <Col flex="auto">
                            <Space direction="vertical" size="small" style={{ width: '100%' }}>
                              <Text strong style={{ fontSize: 14, lineHeight: 1.4 }}>
                                {activity.title}
                              </Text>
                              <Row gutter={[16, 4]}>
                                <Col>
                                  <Space size="small">
                                    <EnvironmentOutlined style={{ color: token.colorTextSecondary, fontSize: 12 }} />
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                      {activity.location}
                                    </Text>
                                  </Space>
                                </Col>
                                <Col>
                                  <Space size="small">
                                    <CalendarOutlined style={{ color: token.colorTextSecondary, fontSize: 12 }} />
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                      {activity.category}
                                    </Text>
                                  </Space>
                                </Col>
                              </Row>
                              <Flex justify="space-between" align="center">
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {activity.participants} 人已报名
                                </Text>
                                <Button
                                  type="primary"
                                  size="small"
                                  onClick={() => handleJoinActivity(activity._id)}
                                  style={{ borderRadius: 16, fontSize: 12 }}
                                >
                                  立即报名
                                </Button>
                              </Flex>
                            </Space>
                          </Col>
                        </Row>
                      </Card>
                    ))
                  )}
                </Space>
              </InfiniteScroll>
            </Card>

          </Space>
        </LayoutContent>



      </Layout>
    </ConfigProvider>
  );
};

// 辅助函数
const getActionColor = (type: string) => {
  const colors = {
    booking: '#FF6B6B, #FF8E53',
    activity: '#4ECDC4, #44A08D',
    event: '#45B7D1, #96C93D',
    preference: '#F7DC6F, #F39C12',
    youth: '#BB6BD9, #C44569',
    default: '#E0E0E0, #BDBDBD'
  };
  return colors[type as keyof typeof colors] || colors.default;
};

export default HomePage;
