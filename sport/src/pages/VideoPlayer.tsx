import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { showToast } from 'vant';

interface VideoData {
  _id: string;
  title: string;
  description: string;
  category: string;
  videoUrl: string;
  thumbnail: string;
  createTime: string;
  popularity: number;
  isActive: boolean;
  duration?: number;
  videoLength?: number;
}

export default function VideoPlayer() {
  const { videoId } = useParams<{ videoId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [video, setVideo] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 格式化视频时长
  const formatDuration = (seconds: number): string => {
    if (!seconds || seconds <= 0) return '10:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    } else {
      return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
    }
  };

  // 获取视频时长
  const getVideoDuration = (video: VideoData): string => {
    if (video.duration) return formatDuration(video.duration);
    if (video.videoLength) return formatDuration(video.videoLength);
    return '10:00';
  };

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        
        // 如果location.state中有视频数据，直接使用
        if (location.state?.video) {
          setVideo(location.state.video);
          setLoading(false);
          return;
        }

        // 否则从API获取视频数据
        if (videoId) {
          const response = await axios.get(`http://localhost:3000/api/videos/${videoId}`);
          if (response.data.code === 200) {
            setVideo(response.data.data);
          } else {
            setError('获取视频信息失败');
          }
        } else {
          setError('视频ID不存在');
        }
      } catch (error) {
        console.error('获取视频失败:', error);
        setError('获取视频失败，请检查网络连接');
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [videoId, location.state]);

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div style={{
        backgroundColor: '#f7f8fa',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: '16px', color: '#969799' }}>加载中...</div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div style={{
        backgroundColor: '#f7f8fa',
        minHeight: '100vh',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: '16px', color: '#ff4d4f', marginBottom: '20px' }}>
            {error || '视频不存在'}
          </div>
          <button
            onClick={handleBack}
            style={{
              backgroundColor: '#409eff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#f7f8fa',
      minHeight: '100vh'
    }}>
      {/* 头部导航 */}
      <div style={{
        backgroundColor: 'white',
        padding: '15px',
        borderBottom: '1px solid #e5e5e5',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center'
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
            返回
          </button>
          <h1 style={{ 
            margin: 0, 
            fontSize: '18px', 
            color: '#333',
            fontWeight: '600'
          }}>
            {video.title}
          </h1>
        </div>
      </div>

      {/* 视频播放区域 */}
      <div style={{ padding: '20px' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          marginBottom: '20px'
        }}>
          {/* 视频播放器 */}
          <video
            controls
            preload="metadata"
            crossOrigin="anonymous"
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '400px',
              backgroundColor: '#000'
            }}
            poster={`http://localhost:3000${video.thumbnail}`}
            onError={(e) => {
              console.error('视频播放错误:', e);
              const target = e.target as HTMLVideoElement;
              console.error('视频错误详情:', {
                error: target.error,
                networkState: target.networkState,
                readyState: target.readyState,
                src: target.src
              });
            }}
            onLoadStart={() => console.log('开始加载视频')}
            onCanPlay={() => console.log('视频可以播放')}
            onLoadedMetadata={() => console.log('视频元数据加载完成')}
          >
            <source src={`http://localhost:3000${video.videoUrl}`} type="video/mp4" />
            <source src={`http://localhost:3000/api/videos/play/${video.videoUrl.split('/').pop()}`} type="video/mp4" />
            您的浏览器不支持视频播放。
          </video>
        </div>

        {/* 视频信息 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#323233',
            margin: '0 0 12px 0'
          }}>
            {video.title}
          </h2>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
            fontSize: '14px',
            color: '#969799'
          }}>
            <span style={{
              backgroundColor: '#e1f3ff',
              color: '#409eff',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              {video.category}
            </span>
            <span>时长: {getVideoDuration(video)}</span>
            <span>发布时间: {new Date(video.createTime).toLocaleDateString()}</span>
          </div>

          {video.description && (
            <div style={{
              fontSize: '14px',
              color: '#646566',
              lineHeight: '1.6',
              borderTop: '1px solid #f5f5f5',
              paddingTop: '16px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#323233',
                margin: '0 0 8px 0'
              }}>
                视频描述
              </h3>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {video.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 