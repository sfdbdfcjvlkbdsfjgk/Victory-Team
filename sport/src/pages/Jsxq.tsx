import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { showToast } from 'vant';
import 'vant/lib/index.css';

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
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    // 从路由状态获取视频数据
    if (location.state?.video) {
      setVideo(location.state.video);
      setLoading(false);
    } else if (videoId) {
      // 如果没有状态数据，则通过API获取
      fetchVideoData();
    }
  }, [videoId, location.state]);

  const fetchVideoData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3000/api/videos/${videoId}`);
      if (response.data.code === 200) {
        setVideo(response.data.data);
      } else {
        showToast({ message: '获取视频信息失败' });
      }
    } catch (error) {
      console.error('获取视频信息失败:', error);
      showToast({ message: '获取视频信息失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleVideoError = () => {
    setVideoError(true);
    showToast({ message: '视频加载失败' });
  };

  // 格式化视频时长
  const formatDuration = (seconds: number): string => {
    if (!seconds || seconds <= 0) return '--:--';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    } else {
      return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
    }
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

  if (!video) {
    return (
      <div style={{
        backgroundColor: '#f7f8fa',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: '16px', color: '#969799' }}>视频不存在</div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#f7f8fa',
      minHeight: '100vh',
      paddingBottom: '80px'
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
          alignItems: 'center',
          justifyContent: 'space-between'
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
          <div style={{
            width: '100%',
            backgroundColor: '#000',
            position: 'relative'
          }}>
            {videoError ? (
              <div style={{
                width: '100%',
                height: '400px',
                backgroundColor: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column'
              }}>
                <div style={{ fontSize: '16px', color: '#999', marginBottom: '10px' }}>
                  视频加载失败
                </div>
                <button
                  onClick={() => setVideoError(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#409eff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  重新加载
                </button>
              </div>
            ) : (
              <video
                controls
                style={{
                  width: '100%',
                  maxHeight: '500px',
                  display: 'block'
                }}
                poster={`http://localhost:3000${video.thumbnail}`}
                onError={handleVideoError}
              >
                <source src={`http://localhost:3000${video.videoUrl}`} type="video/mp4" />
                您的浏览器不支持视频播放
              </video>
            )}
          </div>

          {/* 视频信息 */}
          <div style={{ padding: '20px' }}>
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
              marginBottom: '16px',
              fontSize: '14px',
              color: '#969799',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <span style={{
                backgroundColor: '#e1f3ff',
                color: '#409eff',
                padding: '4px 8px',
                borderRadius: '4px'
              }}>
                {video.category}
              </span>
              <span>发布时间：{new Date(video.createTime).toLocaleString()}</span>
              {video.duration && (
                <span style={{
                  backgroundColor: '#f0f0f0',
                  color: '#666',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}>
                  时长：{formatDuration(video.duration)}
                </span>
              )}
            </div>

            {video.description && (
              <div style={{
                fontSize: '14px',
                color: '#666',
                lineHeight: '1.6',
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <strong>视频描述：</strong>
                <br />
                {video.description}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 