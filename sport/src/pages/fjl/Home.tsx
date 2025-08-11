import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Affix,
  Divider,
  Flex,
  Grid,
  Layout,
  theme,
  ConfigProvider,
  Empty,
  Alert,
  message,
  Modal
} from 'antd';
import {
  ArrowLeftOutlined,
  MoreOutlined,
  BellOutlined,
  RightOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  MenuOutlined,
  CloseOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  SoundOutlined,
  PauseOutlined,
  CaretRightOutlined
} from '@ant-design/icons';

import type { 
  Activity, 
  Banner, 
  Notification as NotificationType, 
  QuickAction, 
  CategoryTag
} from '../../api/types';
import {
  getHomeBanner,
  getQuickActions,
  getNotifications,
  getHotActivities,
  getCategoryTags,
  joinActivity,
  getUnreadCount,
  clearRedDot
} from '../../api/home';
import './Home.css';
import LazyMedia from '../../components/LazyMedia';
import InfiniteScroll from '../../components/InfiniteScroll';
import ActivitySkeleton from '../../components/ActivitySkeleton';

const { Title, Text, Paragraph } = Typography;
const { Header, Content: LayoutContent, Footer } = Layout;
const { useBreakpoint } = Grid;

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
  
  // 视频播放模态框状态
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [currentVideoSrc, setCurrentVideoSrc] = useState<string>('');
  const [currentVideoTitle, setCurrentVideoTitle] = useState<string>('');
  
  // 图片预览模态框状态
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState<string>('');
  const [currentImageTitle, setCurrentImageTitle] = useState<string>('');
  
  // 视频播放器状态
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // 加载数据
  useEffect(() => {
    loadHomeData();
  }, []);

  // 监听视频模态框关闭，确保视频停止
  useEffect(() => {
    if (!videoModalVisible && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      if (videoRef.current.src) {
        videoRef.current.removeAttribute('src');
        videoRef.current.load(); // 重新加载空的视频元素
      }
    }
  }, [videoModalVisible]);

  // 组件卸载时清理视频
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
        videoRef.current.load();
      }
    };
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      
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

  // 检测文件类型
  const getMediaType = (src: string): 'image' | 'video' => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv', '.flv', '.mkv'];
    const extension = src.toLowerCase().substring(src.lastIndexOf('.'));
    return videoExtensions.includes(extension) ? 'video' : 'image';
  };

  // 处理Banner点击
  const handleBannerClick = (banner: Banner) => {
    console.log('🔥 点击Banner:', banner);
    console.log('🔥 Banner图片URL:', banner.imageUrl);
    
    const mediaType = getMediaType(banner.imageUrl);
    console.log('🔥 检测到媒体类型:', mediaType);
    
    if (mediaType === 'video') {
      // 如果是视频，打开模态框播放
      console.log('🎥 打开视频播放模态框');
      setCurrentVideoSrc(banner.imageUrl);
      setCurrentVideoTitle(banner.title);
      setVideoModalVisible(true);
    } else {
      // 如果是图片，打开图片预览模态框
      console.log('🖼️ 打开图片预览模态框');
      setCurrentImageSrc(banner.imageUrl);
      setCurrentImageTitle(banner.title);
      setImagePreviewVisible(true);
    }
  };

  // 关闭视频模态框
  const handleCloseVideoModal = () => {
    console.log('🔄 关闭视频模态框');
    // 先停止视频播放
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      videoRef.current.src = ''; // 清空视频源
    }
    
    setVideoModalVisible(false);
    setCurrentVideoSrc('');
    setCurrentVideoTitle('');
    // 重置视频播放器状态
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setVolume(1);
    setPlaybackRate(1);
    setVideoLoaded(false);
  };

  // 关闭图片预览模态框
  const handleCloseImageModal = () => {
    console.log('🔄 关闭图片模态框');
    setImagePreviewVisible(false);
    setCurrentImageSrc('');
    setCurrentImageTitle('');
  };

  // 视频控制功能
  const togglePlay = () => {
    console.log('🎮 切换播放状态，当前状态:', isPlaying);
    if (videoRef.current) {
      console.log('🎮 视频元素存在，执行播放控制');
      if (isPlaying) {
        console.log('🎮 暂停视频');
        videoRef.current.pause();
      } else {
        console.log('🎮 播放视频');
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error('视频播放失败:', error);
            message.error('视频播放失败');
          });
        }
      }
    } else {
      console.error('❌ 视频元素不存在');
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setVideoLoaded(true);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    if (videoRef.current) {
      try {
        // 直接设置播放速度，不需要暂停
        videoRef.current.playbackRate = rate;
        setPlaybackRate(rate);
        
        // 简单的成功提示
        const speedText = rate === 1 ? '正常' : `${rate}x`;
        message.success(`播放速度: ${speedText}`, 1);
        
      } catch (error) {
        console.error('设置播放速度失败:', error);
        message.error('设置播放速度失败');
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };



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
          <Header 
            className="animate__animated animate__slideInDown"
            style={{ 
            backgroundColor: 'white',
            borderBottom: `1px solid ${token.colorBorder}`,
            padding: '0 16px',
            height: 'auto',
            lineHeight: 'normal',
            paddingTop: 12,
            paddingBottom: 12,
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
              position: 'relative',
              transition: 'all 0.3s ease'
          }}>
            <Flex justify="space-between" align="center">
              <Button 
                type="text" 
                icon={<ArrowLeftOutlined />}
                size="large"
                shape="circle"
                className="animate__animated animate__fadeInLeft"
                style={{
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.backgroundColor = 'rgba(74, 144, 226, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              />
              
              <Title 
                level={3} 
                className="animate__animated animate__fadeInDown"
                style={{ 
                  margin: 0,
                  color: token.colorText,
                  fontSize: 20,
                  fontWeight: 700,
                  animationDelay: '0.2s'
                }}
              >
                全民体育
              </Title>
              
              <Button 
                type="text" 
                icon={<MenuOutlined />}
                size="large"
                shape="circle"
                className="animate__animated animate__fadeInRight"
                style={{
                  transition: 'all 0.3s ease',
                  animationDelay: '0.1s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)';
                  e.currentTarget.style.backgroundColor = 'rgba(74, 144, 226, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
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
                (() => {
                  return banners.length > 0 ? (
                    <Carousel 
                      autoplay 
                      autoplaySpeed={4000}
                      dots={true}
                      infinite={true}
                      effect="fade"
                      dotPosition="bottom"
                    >
                      {banners.map((banner, index) => {
                        return (
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
                              onClick={() => handleBannerClick(banner)}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            >
                                                        <LazyMedia
                            src={banner.imageUrl}
                            alt={banner.title}
                            title={banner.title}
                            width="100%"
                            height={180}
                            style={{ 
                              borderRadius: `${token.borderRadius}px ${token.borderRadius}px 0 0`
                            }}
                            placeholder="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDgwMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzRBOTBFMjtzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM1Q0I4RjI7c3RvcC1vcGFjaXR5OjEiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSIxODAiIGZpbGw9InVybCgjZ3JhZGllbnQpIi8+PHRleHQgeD0iNDAwIiB5PSI5MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJjZW50cmFsIj7lhajmsJHlgaXouqvov5DliqjkuK3lv4M8L3RleHQ+PC9zdmc+"
                            autoPlay={true}
                            muted={true}
                            loop={true}

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
                        );
                      })}
                    </Carousel>
                  ) : (
                    <div className="animate__animated animate__fadeIn">
                      <Skeleton.Image 
                        active 
                        style={{ width: '100%', height: 180 }} 
                        className="animate__animated animate__pulse animate__infinite"
                      />
                      <div 
                        className="animate__animated animate__fadeInUp"
                        style={{ 
                          padding: '16px', 
                          textAlign: 'center', 
                          color: '#999',
                          animationDelay: '0.5s'
                        }}
                      >
                        {loading ? '⏳ 正在加载轮播图...' : '⚠️ 暂无轮播图数据'}
                      </div>
                    </div>
                  );
                })()
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
                            <LazyMedia
                              src={activity.imageUrl}
                              alt={activity.title}
                              title={activity.title}
                              width={80}
                              height={60}
                              style={{ 
                                borderRadius: 8
                              }}
                              placeholder="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA4MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iNjAiIGZpbGw9IiNmNWY1ZjUiLz48Y2lyY2xlIGN4PSI0MCIgY3k9IjMwIiByPSIxNSIgZmlsbD0iIzQ2OWZmMiIgZmlsbC1vcGFjaXR5PSIwLjEiLz48Y2lyY2xlIGN4PSI0MCIgY3k9IjMwIiByPSI4IiBmaWxsPSIjNDY5ZmYyIi8+PC9zdmc+"
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

        {/* 视频播放模态框 */}
        <Modal
          open={videoModalVisible}
          onCancel={handleCloseVideoModal}
          footer={null}
          width="95vw"
          style={{ top: 20 }}
          styles={{
            body: { padding: 0 }
          }}
          keyboard={true}
          closeIcon={
            <CloseOutlined 
              className="animate__animated animate__rotateIn"
              style={{ 
                color: 'white', 
                fontSize: 20,
                backgroundColor: 'rgba(0,0,0,0.5)',
                borderRadius: '50%',
                padding: 8,
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }} 
              onClick={(e) => {
                e.stopPropagation();
                handleCloseVideoModal();
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,0,0,0.7)';
                e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.5)';
                e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
              }}
            />
          }
          destroyOnHidden={true}
          maskClosable={true}
          centered={true}
        >
          <div 
            className="animate__animated animate__zoomIn"
            style={{ 
              position: 'relative',
              backgroundColor: '#000',
              borderRadius: 8,
              overflow: 'hidden',
              minHeight: '50vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animationDuration: '0.3s'
            }}>
            {currentVideoSrc ? (
              <>
                {console.log('🎬 渲染视频元素，视频源:', currentVideoSrc)}
                <video
                  ref={videoRef}
                  key={currentVideoSrc}
                  src={currentVideoSrc}
                  controls={false}
                  autoPlay
                  playsInline
                  preload="auto"
                  style={{
                    width: '100%',
                    maxHeight: '75vh',
                    objectFit: 'contain',
                    pointerEvents: 'auto',
                    backgroundColor: '#000'
                  }}
                  onLoadStart={() => {
                    console.log('🎥 视频开始加载:', currentVideoSrc);
                    setVideoLoaded(false);
                  }}
                  onCanPlay={() => {
                    console.log('🎥 视频可以播放');
                    setVideoLoaded(true);
                  }}
                  onPlay={() => {
                    console.log('🎥 视频开始播放');
                    setIsPlaying(true);
                  }}
                  onPause={() => {
                    console.log('🎥 视频暂停');
                    setIsPlaying(false);
                  }}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onError={(e) => {
                    console.error('🎥 视频播放错误:', e);
                    console.error('视频源:', currentVideoSrc);
                    message.error('视频播放失败，请检查视频文件');
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}
                  onEnded={() => {
                    setIsPlaying(false);
                  }}
                />
                
                {/* 简化的视频控制栏 */}
                <div 
                  className="video-controls animate__animated animate__slideInUp"
                  onClick={(e) => e.stopPropagation()} // 阻止控制栏点击事件冒泡
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                    padding: '16px',
                    color: 'white',
                    animationDelay: '0.2s',
                    opacity: 1
                  }}
                >
                  {/* 进度条 */}
                  <div style={{ marginBottom: '10px' }}>
                    <input
                      type="range"
                      min={0}
                      max={duration || 0}
                      value={currentTime}
                      onChange={(e) => handleSeek(Number(e.target.value))}
                      style={{
                        width: '100%',
                        height: '3px',
                        background: 'rgba(255,255,255,0.3)',
                        borderRadius: '2px',
                        outline: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.height = '6px';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.height = '3px';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                      }}
                    />
                  </div>
                  
                  {/* 主控制行 */}
                  <Flex justify="space-between" align="center" style={{ marginBottom: '8px' }}>
                    <Flex align="center" gap="small">
                      {/* 播放/暂停按钮 */}
                      <Button
                        type="text"
                        icon={isPlaying ? <PauseOutlined /> : <CaretRightOutlined />}
                        onClick={togglePlay}
                        className={isPlaying ? "" : "animate__animated animate__pulse animate__infinite"}
                        style={{ 
                          color: 'white', 
                          fontSize: 16,
                          border: 'none',
                          background: 'rgba(255,255,255,0.15)',
                          borderRadius: '50%',
                          width: 36,
                          height: 36,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease',
                          animationDuration: '2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                          e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      />
                      
                      {/* 时间显示 */}
                      <Text style={{ color: 'white', fontSize: 13, minWidth: '80px' }}>
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </Text>
                    </Flex>
                    
                    <Flex align="center" gap="small">
                      {/* 播放速度 - 更简洁的样式 */}
                      <select
                        value={playbackRate}
                        onChange={(e) => {
                          e.stopPropagation(); // 阻止事件冒泡
                          const rate = Number(e.target.value);
                          handlePlaybackRateChange(rate);
                        }}
                        onClick={(e) => {
                          e.stopPropagation(); // 阻止点击事件冒泡
                        }}
                        style={{
                          background: 'rgba(255,255,255,0.15)',
                          color: 'white',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          fontSize: 13,
                          cursor: 'pointer',
                          outline: 'none',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <option value={0.5} style={{ background: '#333', color: 'white' }}>0.5x</option>
                        <option value={0.75} style={{ background: '#333', color: 'white' }}>0.75x</option>
                        <option value={1} style={{ background: '#333', color: 'white' }}>正常</option>
                        <option value={1.25} style={{ background: '#333', color: 'white' }}>1.25x</option>
                        <option value={1.5} style={{ background: '#333', color: 'white' }}>1.5x</option>
                        <option value={2} style={{ background: '#333', color: 'white' }}>2x</option>
                      </select>
                      
                      {/* 全屏按钮 */}
                      <Button
                        type="text"
                        icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                        onClick={toggleFullscreen}
                        style={{ 
                          color: 'white',
                          fontSize: 14,
                          border: 'none',
                          background: 'rgba(255,255,255,0.15)',
                          borderRadius: '6px',
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease'
                        }}
                        title={isFullscreen ? "退出全屏" : "全屏播放"}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                          e.currentTarget.style.transform = 'scale(1.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      />
                    </Flex>
                  </Flex>
                  
                  {/* 第二行：音量和标题 */}
                  <Flex justify="space-between" align="center">
                    {/* 音量控制 - 更紧凑 */}
                    <Flex align="center" gap="small" style={{ flex: '0 0 auto' }}>
                      <SoundOutlined 
                        className={volume === 0 ? "animate__animated animate__shakeX animate__infinite" : ""}
                        style={{ 
                          color: volume === 0 ? '#ff4d4f' : 'white', 
                          fontSize: 14,
                          transition: 'color 0.3s ease',
                          animationDuration: volume === 0 ? '2s' : ''
                        }} 
                      />
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.1}
                        value={volume}
                        onChange={(e) => handleVolumeChange(Number(e.target.value))}
                        style={{ 
                          width: 60,
                          height: '2px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.height = '4px';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.height = '2px';
                        }}
                      />
                      <Text 
                        className="animate__animated animate__fadeIn"
                        style={{ 
                          color: 'rgba(255,255,255,0.8)', 
                          fontSize: 12, 
                          minWidth: '25px',
                          transition: 'color 0.3s ease'
                        }}
                      >
                        {Math.round(volume * 100)}%
                      </Text>
                    </Flex>
                    
                    {/* 视频标题 */}
                    {currentVideoTitle && (
                      <Text style={{ 
                        color: 'white', 
                        fontSize: 14, 
                        fontWeight: 500,
                        flex: 1,
                        textAlign: 'right',
                        marginLeft: '16px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {currentVideoTitle}
                      </Text>
                    )}
                  </Flex>
                </div>
              </>
            ) : (
              <div 
                className="animate__animated animate__fadeIn animate__infinite"
                style={{
                  color: 'white',
                  fontSize: 16,
                  textAlign: 'center',
                  animationDuration: '1.5s'
                }}
              >
                <div className="animate__animated animate__pulse animate__infinite" style={{ animationDuration: '1s' }}>
                  🎬 视频加载中...
                </div>
              </div>
            )}

          </div>
        </Modal>

        {/* 图片预览模态框 */}
        <Modal
          open={imagePreviewVisible}
          onCancel={handleCloseImageModal}
          footer={null}
          width="90vw"
          style={{ top: 20 }}
          styles={{
            body: { padding: 0 }
          }}
          closeIcon={
            <CloseOutlined 
              className="animate__animated animate__rotateIn"
              style={{ 
                color: 'white', 
                fontSize: 20,
                backgroundColor: 'rgba(0,0,0,0.5)',
                borderRadius: '50%',
                padding: 8,
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }} 
              onClick={(e) => {
                e.stopPropagation();
                handleCloseImageModal();
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,0,0,0.7)';
                e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.5)';
                e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
              }}
            />
          }
          destroyOnHidden={true}
          maskClosable={true}
          centered={true}
        >
          <div 
            className="animate__animated animate__zoomIn"
            style={{ 
              position: 'relative',
              backgroundColor: '#000',
              borderRadius: 8,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '50vh',
              animationDuration: '0.3s'
            }}>
            {currentImageSrc && (
              <Image
                src={currentImageSrc}
                alt={currentImageTitle}
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  objectFit: 'contain'
                }}
                preview={false}
                onError={() => {
                  message.error('图片加载失败');
                  handleCloseImageModal();
                }}
              />
            )}
            
            {/* 图片标题覆盖层 */}
            {currentImageTitle && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                padding: '20px',
                color: 'white'
              }}>
                <Text style={{ 
                  color: 'white', 
                  fontSize: 18, 
                  fontWeight: 600 
                }}>
                  {currentImageTitle}
                </Text>
              </div>
            )}
          </div>
        </Modal>

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
