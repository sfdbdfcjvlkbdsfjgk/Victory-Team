import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


interface ActivityData {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
  location?: string;
  address?: string;
  date?: string;
  time?: string;
  registrationPeriod?: string;
  registrationTime?: string;
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
  state?: String; // 活动状态：待发布-不显示，已发布-显示
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
}

export default function Sou() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  // 监听报名成功事件，同步更新活动列表中的报名人数
  useEffect(() => {
    const handleRegistrationSuccess = (event: CustomEvent) => {
      const { activityId, count, type } = event.detail;
      console.log('活动列表收到报名成功事件:', { activityId, count, type });
      
      // 更新对应活动的报名人数
      setActivities(prevActivities => {
        return prevActivities.map(activity => {
          const activityIdToCheck = activity._id || activity.id;
          if (activityIdToCheck === activityId) {
            // 从localStorage获取最新的报名人数
            const storageKey = `registration_${activityId}`;
            const currentCount = parseInt(localStorage.getItem(storageKey) || '0');
            
            console.log('更新活动报名人数:', { 
              activityId, 
              oldCount: activity.registeredParticipants || activity.currentParticipants || activity.signupCount || 0,
              newCount: currentCount 
            });
            
            return {
              ...activity,
              registeredParticipants: currentCount,
              currentParticipants: currentCount,
              signupCount: currentCount
            };
          }
          return activity;
        });
      });
    };

    // 添加事件监听器
    window.addEventListener('registrationSuccess', handleRegistrationSuccess as EventListener);

    // 清理事件监听器
    return () => {
      window.removeEventListener('registrationSuccess', handleRegistrationSuccess as EventListener);
    };
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/wsj/ss');
      console.log('活动列表数据:', response.data.data);
      
      if (response.data.code === 200) {
        // 从localStorage同步报名人数
        const activitiesWithUpdatedCounts = response.data.data.map((activity: ActivityData) => {
          const activityId = activity._id || activity.id;
          if (activityId) {
            const storageKey = `registration_${activityId}`;
            const currentCount = parseInt(localStorage.getItem(storageKey) || '0');
            
            console.log('初始化活动报名人数:', { 
              activityId, 
              backendCount: activity.registeredParticipants || activity.currentParticipants || activity.signupCount || 0,
              localStorageCount: currentCount 
            });
            
            return {
              ...activity,
              registeredParticipants: currentCount,
              currentParticipants: currentCount,
              signupCount: currentCount
            };
          }
          return activity;
        });
        
        setActivities(activitiesWithUpdatedCounts);
        setError(null);
      } else {
        throw new Error(response.data.msg || '获取数据失败');
      }
    } catch (err) {
      console.error('获取活动数据失败:', err);
      setError('获取活动数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/hd');
  };

  const handleCardClick = (activity: ActivityData) => {
    navigate(`/activity-detail/${activity._id || activity.id}`);
  };

  const getImageUrl = (activity: ActivityData) => {
    if (activity.coverImage && activity.coverImage.startsWith('http')) {
      return activity.coverImage;
    } else if (activity.coverImage) {
      return `http://localhost:3000${activity.coverImage}`;
    } else if (activity.imageUrl) {
      return activity.imageUrl;
    }
    return 'https://via.placeholder.com/120x80/4A90E2/FFFFFF?text=活动图片';
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ 
          width: '20px', 
          height: '20px', 
          border: '2px solid #f3f3f3',
          borderTop: '2px solid #409eff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 10px'
        }}></div>
        <p>加载中...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        <p>{error}</p>
        <button 
          onClick={fetchActivities}
          style={{
            background: '#409eff',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '0 auto', 
      padding: '15px',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      {/* 头部 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '15px',
        padding: '8px 0',
        borderBottom: '1px solid #e5e5e5'
      }}>
        <button 
          onClick={handleBack}
          style={{ 
            marginRight: '12px',
            background: 'none',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            color: '#409eff'
          }}
        >
          ← 返回
        </button>
        <p style={{ margin: 0, fontSize: '18px', color: '#333',fontWeight: '500'}}>活动赛事列表</p>
      </div>

      {/* 活动列表 */}
      <div style={{ padding: '10px 0' }}>
        {activities.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', padding: '40px 0' }}>
            暂无活动数据
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activities.filter(activity => activity.state === "已发布").map((activity, index) => (
              <div
                key={activity._id || activity.id || index}
                style={{ 
                  background: 'white',
                  borderRadius: '12px',
                  border: '1px solid #e5e5e5',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }}
                onClick={() => handleCardClick(activity)}
              >
                <div style={{ display: 'flex',alignItems: 'center', padding: '16px', gap: '16px'}}>
                  {/* 左侧图片 */}
                  <div style={{
                    width: '120px',
                    height: '88px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    <img
                      src={getImageUrl(activity)}
                      alt={activity.title}
                      style={{ 
                        width: '100%', 
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/120x80/4A90E2/FFFFFF?text=活动图片';
                      }}
                    />
                  </div>

                  {/* 右侧内容 */}
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minWidth: 0
                  }}>
                    <div style={{ flex: 1 }}>
                      {/* 标题 */}
                      <h3 style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#333',
                        margin: '0 0 4px 0',
                        lineHeight: '1.3',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {activity.title || activity.name || '活动标题'}
                      </h3>

                      {/* 分类标签 */}
                      <div style={{ marginBottom: '4px' }}>
                        {/* 运动标签 */}
                        {activity.sportTag && (
                          <span style={{
                            display: 'inline-block',
                            background: '#e1f3ff',
                            color: '#409eff',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            marginRight: '4px'
                          }}>
                            {activity.sportTag}
                          </span>
                        )}
                        
                        {/* 活动类型标签 */}
                        {(activity.sportT || activity.category || activity.type) && (
                          <span style={{
                            display: 'inline-block',
                            background: '#f0f9ff',
                            color: '#0369a1',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            marginRight: '4px'
                          }}>
                            {activity.sportT || activity.category || activity.type}
                          </span>
                        )}
                        
                        {/* 地点标签 */}
                        {activity.location && (
                          <span style={{
                            display: 'inline-block',
                            background: '#fff7e6',
                            color: '#e6a23c',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px'
                          }}>
                            {activity.location}
                          </span>
                        )}
                      </div>

                      {/* 报名人数 */}
                      <p style={{
                        fontSize: '12px',
                        color: '#999',
                        margin: 0,
                        fontWeight: '400'
                      }}>
                        {activity.registeredParticipants || activity.currentParticipants || activity.signupCount || 0}人已报名
                      </p>
                    </div>

                    {/* 按钮 */}
                    <div style={{ marginTop: '8px' }}>
                      <button 
                        style={{
                          background: '#FF6B35',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '11px',
                          padding: '4px 12px',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#E55A2B';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#FF6B35';
                        }}
                      >
                        查看详细
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
