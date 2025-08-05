import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface ActivityData {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
  location?: string;
  address?: string;
  province?: string;
  city?: string;
  district?: string;
  detailAddress?: string;
  activityAddress?: Array<{
    province: string;
    city: string;
    district: string;
    detailAddress: string;
  }>;
  date?: string;
  time?: string;
  activityTime?: string | string[];
  registrationPeriod?: string;
  registrationTime?: string | string[];
  totalParticipants?: number;
  maxParticipants?: number;
  registeredParticipants?: number;
  currentParticipants?: number;
  signupCount?: number;
  videoUrl?: string;
  imageUrl?: string;
  coverImage?: string;
  category?: string;
  type?: string;
  description?: string;
  sportT?: string;
  sportTag?: string; // 运动标签
  categories?: Array<{
    id: string;
    name: string;
    distance: string;
    remainingSpots: number;
    registeredCount: number;
    price: number;
    isFull: boolean;
  }>;
  registrationItems?: Array<{
    itemName: string;
    cost: number;
    maxPeople: number;
    requireInsurance: boolean;
    consultationPhone: string;
  }>;
  introduction?: {
    eventName: string;
    guidingUnit: string;
    organizer: string;
    coOrganizer: string;
    eventLocation: string;
  };
  // 新增权限配置
  registrationMethod?: Array<{
    individualRegistration: boolean;
    familyRegistration: boolean;
    teamRegistration: boolean;
    teamMinSize?: number;
    teamMaxSize?: number;
  }>;
}

export default function ActivityDetail() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [currentRegisteredCount, setCurrentRegisteredCount] = useState<number>(0);
  const [selectedVideoType, setSelectedVideoType] = useState<string>('');
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (activityId) {
      fetchActivityDetail();
    }
  }, [activityId]);

  // 监听报名成功事件
  useEffect(() => {
    const handleRegistrationSuccess = (event: CustomEvent) => {
      const { activityId: eventActivityId, count, type } = event.detail;
      
      // 只处理当前活动的报名成功事件
      if (eventActivityId === activityId) {
        console.log('报名成功，更新人数:', { activityId: eventActivityId, count, type });
        incrementRegistrationCount(count);
      }
    };

    // 添加事件监听器
    window.addEventListener('registrationSuccess', handleRegistrationSuccess as EventListener);

    // 清理事件监听器
    return () => {
      window.removeEventListener('registrationSuccess', handleRegistrationSuccess as EventListener);
    };
  }, [activityId]);

  // 更新视频类型状态
  useEffect(() => {
    if (activity) {
      const activityType = activity.sportT || activity.category || activity.sportTag || 'default';
      
      console.log('当前活动类型信息:', {
        sportT: activity.sportT,
        category: activity.category,
        sportTag: activity.sportTag,
        finalType: activityType
      });
      
      // 使用不同类型的演示视频（1分钟版本）
      const videoMap: { [key: string]: string } = {
        '跑步': 'https://haokan.baidu.com/v?pd=wisenatural&vid=8161320414611590051',
        '游泳': 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
        '健身': 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
        '瑜伽': 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
        '的风格': 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
        '赛事': 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
        '开心快乐': 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
        '爬山': 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
        '比赛': 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
        '骑行': 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
        '徒步': 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
        '滑雪': 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
        '滑板': 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
        '攀岩': 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
        '体操': 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
        '篮球': 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
        '足球': 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
        '排球': 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
        '乒乓球': 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
        '羽毛球': 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
        '网球': 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
        'default': 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4'
      };

      // 查找匹配的视频类型
      for (const [type, url] of Object.entries(videoMap)) {
        if (activityType.includes(type)) {
          console.log(`根据活动类型"${activityType}"选择视频: ${type}`);
          setSelectedVideoType(type);
          return;
        }
      }

      // 如果没有匹配的类型，使用默认视频
      console.log(`未找到匹配的活动类型"${activityType}"，使用默认视频`);
      setSelectedVideoType('default');
    }
  }, [activity]);

  const fetchActivityDetail = async () => {
    try {
      setLoading(true);
      setVideoLoading(true);
      setVideoError(false);
      // 获取活动详情数据
      const response = await axios.get(`http://localhost:3000/wsj/ss/${activityId}`);
      console.log('活动详情数据:', response.data);
      
      if (response.data.code === 200) {
        const activityData = response.data.data;
        console.log('获取到的活动详情:', activityData);
        console.log('活动标题:', activityData.title || activityData.name);
        console.log('运动标签:', activityData.sportTag);
        console.log('活动类型:', activityData.sportT || activityData.category);
        console.log('地址字段:', activityData.address);
        console.log('省份字段:', activityData.province);
        console.log('城市字段:', activityData.city);
        console.log('区县字段:', activityData.district);
        console.log('详细地址字段:', activityData.detailAddress);
        console.log('活动地址数组:', activityData.activityAddress);
        console.log('时间字段:', activityData.date);
        console.log('报名时间字段:', activityData.registrationTime);
        console.log('活动时间字段:', activityData.activityTime);
        console.log('报名项目字段:', activityData.registrationItems);
        console.log('报名权限配置:', activityData.registrationMethod);
        
        // 初始化当前报名人数
        const storageKey = `registration_${activityId}`;
        const storedCount = parseInt(localStorage.getItem(storageKey) || '0');
        const backendCount = activityData.registeredParticipants || activityData.currentParticipants || activityData.signupCount || 0;
        const initialCount = Math.max(storedCount, backendCount);
        
        setCurrentRegisteredCount(initialCount);
        console.log('初始化报名人数:', { storedCount, backendCount, initialCount });
        
        setActivity(activityData);
        setError(null);
      } else {
        throw new Error(response.data.msg || '获取数据失败');
      }
    } catch (err) {
      console.error('获取活动详情失败:', err);
      setError('获取活动详情失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/sou');
  };

  const handleRegisterClick = () => {
    setShowRegistrationModal(true);
  };

  const handleRegistrationOption = (option: string) => {
    console.log('选择报名方式:', option);
    setShowRegistrationModal(false);
    
    if (option === '个人报名') {
      navigate(`/registration-selection/${activityId}?type=personal`);
    } else if (option === '家庭报名') {
      navigate(`/registration-selection/${activityId}?type=family`);
    } else if (option === '团队报名') {
      navigate(`/registration-selection/${activityId}?type=team`);
    }
  };

  // 增加报名人数的函数
  const incrementRegistrationCount = (count: number = 1) => {
    setCurrentRegisteredCount(prev => {
      // 计算最大报名人数
      const maxRegistered = activity?.registrationItems && activity.registrationItems.length > 0 ? 
        activity.registrationItems.reduce((total, item) => total + item.maxPeople, 0) :
        activity?.maxParticipants || activity?.totalParticipants || 0;
      
      // 检查是否会超过最大值
      const newCount = prev + count;
      const finalCount = Math.min(newCount, maxRegistered);
      
      console.log('报名人数增加:', { prev, count, newCount, maxRegistered, finalCount });
      
      // 同时更新localStorage
      const storageKey = `registration_${activityId}`;
      const storedCount = parseInt(localStorage.getItem(storageKey) || '0');
      const updatedCount = Math.min(storedCount + count, maxRegistered);
      localStorage.setItem(storageKey, updatedCount.toString());
      console.log('localStorage更新:', { storageKey, storedCount, updatedCount, maxRegistered });
      
      return finalCount;
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleVideoError = (e: any) => {
    console.error('视频加载失败:', e);
    setVideoLoading(false);
    setVideoError(true);
    
    // 隐藏视频元素
    if (videoRef.current) {
      videoRef.current.style.display = 'none';
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setVideoLoading(false);
      setVideoError(false);
      // 自动开始播放
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((error) => {
        console.log('自动播放失败，需要用户交互:', error);
      });
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const getImageUrl = (activity: ActivityData) => {
    if (activity.coverImage && activity.coverImage.startsWith('http')) {
      return activity.coverImage;
    } else if (activity.coverImage) {
      return `http://localhost:3000${activity.coverImage}`;
    } else if (activity.imageUrl) {
      return activity.imageUrl;
    }
    return 'https://via.placeholder.com/400x250/4A90E2/FFFFFF?text=活动图片';
  };

  // 根据活动类型生成动态视频URL
  const getDynamicVideoUrl = (activity: ActivityData) => {
    // 如果有原始视频URL，优先使用
    if (activity.videoUrl) {
      return activity.videoUrl;
    }

    // 根据活动类型生成不同的演示视频
    const activityType = activity.sportT || activity.category || activity.sportTag || 'default';
    
    // 根据运动类型匹配对应的视频片段
    const videoMap: { [key: string]: string } = {
      '跑步': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      '游泳': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      '健身': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      '瑜伽': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      '的风格': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      '赛事': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      '开心快乐': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      '爬山': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      '比赛': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      '骑行': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      '徒步': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      '滑雪': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      '滑板': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      '攀岩': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      '体操': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      '篮球': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      '足球': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      '排球': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      '乒乓球': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      '羽毛球': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      '网球': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      'default': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    };

    // 查找匹配的视频类型
    for (const [type, url] of Object.entries(videoMap)) {
      if (activityType.includes(type)) {
        console.log(`根据活动类型"${activityType}"选择视频: ${type}`);
        return url;
      }
    }

    // 如果没有匹配的类型，使用默认视频
    console.log(`未找到匹配的活动类型"${activityType}"，使用默认视频`);
    return videoMap.default;
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '16px',
        color: '#666'
      }}>
        加载中...
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '16px',
        color: '#dc3545'
      }}>
        {error || '未找到活动详情'}
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '100%', 
      margin: '0 auto', 
      backgroundColor: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* 头部导航 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '15px 20px',
        background: '#fff',
        borderBottom: '1px solid #eee',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <button 
          onClick={handleBack}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '5px',
            marginRight: '15px'
          }}
        >
          ←
        </button>
        <h1 style={{
          flex: 1,
          textAlign: 'center',
          fontSize: '18px',
          fontWeight: '600',
          margin: 0
        }}>
          活动赛事详情
        </h1>
      </div>

      {/* 主视觉区域 - 视频播放器 */}
      {selectedVideoType && (
        <div style={{
          padding: '8px 20px',
          background: '#f8f9fa',
          borderBottom: '1px solid #e9ecef',
          fontSize: '12px',
          color: '#666',
          textAlign: 'center'
        }}>
          正在播放: {selectedVideoType === 'default' ? '默认演示视频' : `${selectedVideoType}相关视频`} (30秒精彩片段)
        </div>
      )}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '250px',
        background: '#000',
        overflow: 'hidden'
      }}>
        {/* 视频播放器 */}
        <video 
          ref={videoRef}
          src={getDynamicVideoUrl(activity)}
          controls={false}
          poster={getImageUrl(activity)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: videoLoading || videoError ? 'none' : 'block'
          }}
          onTimeUpdate={(e) => {
            // 限制视频播放时长为30秒精彩片段
            const video = e.target as HTMLVideoElement;
            if (video.currentTime >= 30) {
              video.pause();
              setIsPlaying(false);
              setCurrentTime(30);
            } else {
              setCurrentTime(video.currentTime);
            }
          }}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onError={handleVideoError}
        />
        
        {/* 视频加载状态 */}
        {videoLoading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            color: 'white',
            zIndex: 5
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(255, 255, 255, 0.3)',
              borderTop: '3px solid #ff6b35',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '10px'
            }}></div>
            <span style={{ fontSize: '14px' }}>视频加载中...</span>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}
        
        {/* 视频加载失败状态 */}
        {videoError && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            color: 'white',
            zIndex: 5
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '10px',
              opacity: 0.7
            }}>
              🎬
            </div>
            <span style={{ fontSize: '14px', textAlign: 'center' }}>
              精彩视频预览<br/>
              <span style={{ fontSize: '12px', opacity: 0.8 }}>
                点击播放按钮开始观看
              </span>
            </span>
            <button
              onClick={() => {
                setVideoError(false);
                setVideoLoading(true);
                if (videoRef.current) {
                  videoRef.current.load();
                  videoRef.current.play().catch(() => {
                    setVideoError(true);
                    setVideoLoading(false);
                  });
                }
              }}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                background: '#ff6b35',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              重新加载
            </button>
          </div>
        )}
        
        {/* 播放/暂停按钮 */}
        <button
          onClick={handlePlayPause}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0, 0, 0, 0.7)',
            border: 'none',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            display: isPlaying ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}
        >
          ▶
        </button>
        
        {/* 自定义视频控制栏 */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          padding: '10px 15px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          fontSize: '12px'
        }}>
          <span>{formatTime(currentTime)}</span>
          <div 
            style={{
              flex: 1,
              height: '3px',
              background: 'rgba(255, 255, 255, 0.3)',
              margin: '0 10px',
              borderRadius: '2px',
              position: 'relative',
              cursor: 'pointer'
            }}
            onClick={handleProgressClick}
          >
            <div style={{
              height: '100%',
              background: '#ff6b35',
              borderRadius: '2px',
              width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                right: '-4px',
                top: '-1px',
                width: '8px',
                height: '8px',
                background: '#ff6b35',
                borderRadius: '50%',
                border: '1px solid white'
              }}></div>
            </div>
          </div>
          <span>{formatTime(duration)}</span>
          <button 
            onClick={handlePlayPause}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '16px',
              cursor: 'pointer',
              padding: '5px',
              marginLeft: '10px'
            }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '16px',
            cursor: 'pointer',
            padding: '5px',
            marginLeft: '10px'
          }}>
            ⛶
          </button>
        </div>
      </div>

      {/* 活动标题 */}
      <div style={{
        padding: '20px',
        background: '#fff'
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: '600',
          margin: '0 0 15px 0',
          color: '#333'
        }}>
          {activity.title || activity.name || '活动标题'}
        </h2>
        
        {/* 赛事标签 - 类似图片一中的蓝色标签 */}
        <div style={{
          display: 'inline-block',
          background: '#409eff',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          marginBottom: '15px'
        }}>
          赛事
        </div>
        
        {/* 运动标签 */}
        {activity.sportTag && (
          <div style={{
            display: 'inline-block',
            background: '#e1f3ff',
            color: '#409eff',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            marginBottom: '15px',
            marginLeft: '8px'
          }}>
            {activity.sportTag}
          </div>
        )}
        
        {/* 活动类型标签 */}
        {(activity.sportT || activity.category) && (
          <div style={{
            display: 'inline-block',
            background: '#f0f9ff',
            color: '#0369a1',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            marginBottom: '15px',
            marginLeft: '8px'
          }}>
            {activity.sportT || activity.category}
          </div>
        )}
      </div>

      {/* 活动信息 */}
      <div style={{
        padding: '0 20px 20px',
        background: '#fff'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '10px',
          fontSize: '14px'
        }}>
          <span style={{ color: '#666', minWidth: '80px' }}>地址:</span>
          <span style={{ color: '#333', flex: 1 }}>
            {activity.activityAddress && activity.activityAddress.length > 0 ? 
              `${activity.activityAddress[0].province}${activity.activityAddress[0].city}${activity.activityAddress[0].district}${activity.activityAddress[0].detailAddress}` :
              activity.province && activity.city && activity.district ? 
                `${activity.province}${activity.city}${activity.district}${activity.detailAddress ? activity.detailAddress : ''}` :
                activity.address || activity.location || '活动地址'
            }
          </span>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '10px',
          fontSize: '14px'
        }}>
          <span style={{ color: '#666', minWidth: '80px' }}>报名时间:</span>
          <span style={{ color: '#333', flex: 1 }}>
            {activity.registrationTime ? 
              (Array.isArray(activity.registrationTime) ? 
                activity.registrationTime.join(' - ') : 
                activity.registrationTime
              ) : 
              activity.registrationPeriod || '报名时间'
            }
          </span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '10px',
          fontSize: '14px'
        }}>
          <span style={{ color: '#666', minWidth: '80px' }}>开始时间:</span>
          <span style={{ color: '#333', flex: 1 }}>
            {activity.activityTime ? 
              (Array.isArray(activity.activityTime) ? 
                activity.activityTime.join(' - ') : 
                activity.activityTime
              ) : 
              activity.date || activity.time || '活动时间'
            }
          </span>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '10px',
          fontSize: '14px'
        }}>
          <span style={{ color: '#666', minWidth: '80px' }}>最大报名人数:</span>
          <span style={{ color: '#333', flex: 1 }}>
            {activity.registrationItems && activity.registrationItems.length > 0 ? 
              activity.registrationItems.reduce((total, item) => total + item.maxPeople, 0) :
              activity.maxParticipants || activity.totalParticipants || 0
            }人
          </span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '10px',
          fontSize: '14px'
        }}>
          <span style={{ color: '#666', minWidth: '80px' }}>报名人数:</span>
          <span style={{ color: '#333', flex: 1 }}>
            {activity.registrationItems && activity.registrationItems.length > 0 ? 
              activity.registrationItems.reduce((total, item) => total + item.maxPeople, 0) :
              activity.totalParticipants || activity.maxParticipants || 0
            }
          </span>

        </div>
      </div>

      {/* 报名选项 */}
      <div style={{
        padding: '0 20px 20px'
      }}>
        {activity.registrationItems && activity.registrationItems.length > 0 ? (
          // 使用后端返回的registrationItems数据
          activity.registrationItems.map((item, index) => (
            <div key={index} style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '15px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ marginBottom: '10px' }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  margin: 0,
                  color: '#333'
                }}>
                  {item.itemName}
                </h3>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  最大报名人数: {item.maxPeople}人
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#ff6b35'
                }}>
                  {item.cost === 0 || item.cost === null || item.cost === undefined ? '免费' : `¥${(item.cost || 0).toFixed(2)}`}
                </div>
              </div>

            </div>
          ))
        ) : activity.categories && activity.categories.length > 0 ? (
          // 回退到categories数据
          activity.categories.map(category => (
            <div key={category.id} style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '15px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ marginBottom: '10px' }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  margin: 0,
                  color: '#333'
                }}>
                  {category.name} ({category.distance})
                </h3>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  剩余名额:{category.remainingSpots}人 已报名: {category.registeredCount}人
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#ff6b35'
                }}>
                  {category.price === 0 || category.price === null || category.price === undefined ? '免费' : `¥${(category.price || 0).toFixed(2)}`}
                </div>
              </div>

            </div>
          ))
        ) : (
          // 默认的报名选项（如果没有数据）
          <div style={{
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '15px',
            border: '1px solid #e9ecef'
          }}>
            <div style={{ marginBottom: '10px' }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                margin: 0,
                color: '#333'
              }}>
                暂无报名选项
              </h3>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <div style={{ fontSize: '12px', color: '#666' }}>
                请稍后查看
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 活动介绍 */}
      <div style={{
        padding: '20px',
        background: '#fff',
        borderTop: '1px solid #eee'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          margin: '0 0 15px 0',
          color: '#333'
        }}>
          活动介绍
        </h3>
        <div style={{ fontSize: '14px' }}>
          <div style={{ display: 'flex', marginBottom: '8px' }}>
            <span style={{ color: '#666', minWidth: '80px' }}>赛事名称:</span>
            <span style={{ color: '#333', flex: 1 }}>
              {activity.introduction?.eventName || activity.title || activity.name || '暂无'}
              {activity.sportTag && (
                <span style={{
                  display: 'inline-block',
                  background: '#409eff',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  marginLeft: '8px',
                  fontWeight: '500'
                }}>
                  {activity.sportTag}
                </span>
              )}
            </span>
          </div>
          <div style={{ display: 'flex', marginBottom: '8px' }}>
            <span style={{ color: '#666', minWidth: '80px' }}>指导单位:</span>
            <span style={{ color: '#333', flex: 1 }}>{activity.introduction?.guidingUnit || '厦门市体育局、同安区人民政府'}</span>
          </div>
          <div style={{ display: 'flex', marginBottom: '8px' }}>
            <span style={{ color: '#666', minWidth: '80px' }}>主办单位:</span>
            <span style={{ color: '#333', flex: 1 }}>{activity.introduction?.organizer || '厦门文化广播集团有限公司'}</span>
          </div>
          <div style={{ display: 'flex', marginBottom: '8px' }}>
            <span style={{ color: '#666', minWidth: '80px' }}>协办单位:</span>
            <span style={{ color: '#333', flex: 1 }}>{activity.introduction?.coOrganizer || '北辰山风景区管委会'}</span>
          </div>
          <div style={{ display: 'flex', marginBottom: '8px' }}>
            <span style={{ color: '#666', minWidth: '80px' }}>赛事地点:</span>
            <span style={{ color: '#333', flex: 1 }}>
              {activity.activityAddress && activity.activityAddress.length > 0 ? 
                `${activity.activityAddress[0].province}${activity.activityAddress[0].city}${activity.activityAddress[0].district}${activity.activityAddress[0].detailAddress}` :
                activity.introduction?.eventLocation || activity.location || activity.address || '同安北辰山风景区'
              }
            </span>
          </div>
        </div>
      </div>

      {/* 底部图形 */}
      <div style={{
        background: 'linear-gradient(135deg, #87ceeb 0%, #ffffff 100%)',
        padding: '30px 20px',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '20px', color: 'white', margin: '0 15px' }}>❤</div>
          <div style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#1e3a8a',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)'
          }}>
            奔在路
          </div>
          <div style={{ fontSize: '20px', color: 'white', margin: '0 15px' }}>🕊</div>
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '15px',
          textAlign: 'right',
          fontSize: '10px',
          color: '#666'
        }}>
          <div style={{ marginBottom: '5px', lineHeight: '1.2' }}>
            <div>CULTURE</div>
            <div>CORPORATE</div>
            <div>DESIGN</div>
          </div>
          <div style={{ fontSize: '8px', color: '#999' }}>
            sowantong_1240 No:20180509213650825038
          </div>
        </div>
      </div>

      {/* 社交互动栏 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 20px',
        background: '#fff',
        borderTop: '1px solid #eee'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <button style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '5px'
          }}>
            📤
          </button>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '14px',
            color: '#666'
          }}>
            <span>👍</span>
            <span>113</span>
          </div>
        </div>
        {activity && activity.registrationMethod && activity.registrationMethod.length > 0 && 
         (activity.registrationMethod[0].individualRegistration || 
          activity.registrationMethod[0].familyRegistration || 
          activity.registrationMethod[0].teamRegistration) && (
          (() => {
            // 使用前端状态中的当前已报名人数
            const currentRegistered = currentRegisteredCount;
            
            // 计算最大报名人数
            const maxRegistered = activity.registrationItems && activity.registrationItems.length > 0 ? 
              activity.registrationItems.reduce((total, item) => total + item.maxPeople, 0) :
              activity.maxParticipants || activity.totalParticipants || 0;
            
            // 判断是否已满员
            const isFull = currentRegistered >= maxRegistered;
            
            console.log('报名状态检查:', {
              currentRegistered,
              maxRegistered,
              isFull,
              activityId: activity._id || activity.id
            });
            
            return (
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#666', 
                  marginBottom: '8px',
                  padding: '4px 8px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '4px'
                }}>
                  报名进度: {currentRegistered}/{maxRegistered}
                </div>
                <button 
                  onClick={isFull ? undefined : handleRegisterClick}
                  disabled={isFull}
                  style={{
                    background: isFull ? '#ccc' : '#ff6b35',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: isFull ? 'not-allowed' : 'pointer',
                    opacity: isFull ? 0.6 : 1
                  }}
                >
                  {isFull ? '报名结束' : '立即报名'}
                </button>
              </div>
            );
          })()
        )}
      </div>

      {/* 报名模态框 */}
      {showRegistrationModal && (
        <div 
          onClick={() => setShowRegistrationModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'flex-end'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              backgroundColor: 'white',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              padding: '20px',
              maxHeight: '40%',
              overflow: 'auto'
            }}
          >
            <div style={{ 
              textAlign: 'center', 
              fontSize: '18px', 
              fontWeight: 'bold', 
              marginBottom: '20px',
              color: '#333'
            }}>
              选择报名方式
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              {activity.registrationMethod && activity.registrationMethod.length > 0 && activity.registrationMethod[0].individualRegistration && (
                <div 
                  onClick={() => handleRegistrationOption('个人报名')}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    fontSize: '16px',
                    color: '#333',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span>个人报名</span>
                  <span style={{ color: '#999' }}>›</span>
                </div>
              )}
              
              {activity.registrationMethod && activity.registrationMethod.length > 0 && activity.registrationMethod[0].familyRegistration && (
                <div 
                  onClick={() => handleRegistrationOption('家庭报名')}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    fontSize: '16px',
                    color: '#333',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span>家庭报名</span>
                  <span style={{ color: '#999' }}>›</span>
                </div>
              )}
              
              {activity.registrationMethod && activity.registrationMethod.length > 0 && activity.registrationMethod[0].teamRegistration && (
                <div 
                  onClick={() => handleRegistrationOption('团队报名')}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    fontSize: '16px',
                    color: '#333',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span>团队报名</span>
                  <span style={{ color: '#999' }}>›</span>
                </div>
              )}
              
              {(!activity.registrationMethod || activity.registrationMethod.length === 0 || 
                (!activity.registrationMethod[0].individualRegistration && 
                 !activity.registrationMethod[0].familyRegistration && 
                 !activity.registrationMethod[0].teamRegistration)) && (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: '#999',
                  fontSize: '14px'
                }}>
                  暂无可用的报名方式
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setShowRegistrationModal(false)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#f5f5f5',
                color: '#666',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 