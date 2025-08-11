import React, { useState, useRef, useEffect } from 'react';
import { PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import './index.css';

interface LazyMediaProps {
  src: string;
  alt?: string;
  title?: string;
  className?: string;
  placeholder?: string;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  poster?: string; // 视频封面图
}

// 检测文件类型
const getMediaType = (src: string): 'image' | 'video' => {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv', '.flv', '.mkv'];
  const extension = src.toLowerCase().substring(src.lastIndexOf('.'));
  return videoExtensions.includes(extension) ? 'video' : 'image';
};

// 获取视频MIME类型
const getVideoMimeType = (src: string): string => {
  const extension = src.toLowerCase().substring(src.lastIndexOf('.'));
  const mimeTypes: { [key: string]: string } = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'video/ogg',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.wmv': 'video/x-ms-wmv'
  };
  return mimeTypes[extension] || 'video/mp4';
};

const LazyMedia: React.FC<LazyMediaProps> = ({
  src,
  alt = '',
  title = '',
  className = '',
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2NjYyI+5Yqg6L295LitLi4uPC90ZXh0Pjwvc3ZnPg==',
  width,
  height,
  style,
  onLoad,
  onError,
  autoPlay = false,
  loop = true,
  muted = true,
  controls = false,
  poster
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const observerRef = useRef<IntersectionObserver>();

  const mediaType = getMediaType(src);
  const isVideo = mediaType === 'video';

  useEffect(() => {
    if (!containerRef.current) return;

    // 创建Intersection Observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            // 一旦进入视口就停止观察
            if (observerRef.current && containerRef.current) {
              observerRef.current.unobserve(containerRef.current);
            }
          }
        });
      },
      {
        rootMargin: '50px', // 提前50px开始加载
        threshold: 0.1
      }
    );

    observerRef.current.observe(containerRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // 处理视频自动播放
  useEffect(() => {
    if (isVideo && isLoaded && autoPlay && videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsPlaying(true);
        }).catch((error) => {
          console.log('自动播放失败:', error);
          setIsPlaying(false);
        });
      }
    }
  }, [isLoaded, autoPlay, isVideo]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
    console.log(`✅ ${isVideo ? '视频' : '图片'}加载成功:`, src);
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
    console.log(`❌ ${isVideo ? '视频' : '图片'}加载失败:`, src);
  };

  const handleVideoClick = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsPlaying(true);
        }).catch((error) => {
          console.error('播放失败:', error);
        });
      }
    }
  };

  const handleVideoPlay = () => {
    setIsPlaying(true);
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
  };

  return (
    <div 
      ref={containerRef}
      className={`lazy-media-container ${className} ${isVideo ? 'video-container' : 'image-container'}`} 
      style={{ width, height, ...style }}
      onMouseEnter={() => isVideo && setShowControls(true)}
      onMouseLeave={() => isVideo && setShowControls(false)}
    >
      {/* 占位符 */}
      {!isInView && (
        <div 
          className="lazy-media-placeholder"
          style={{ width, height }}
        >
          <img
            src={placeholder}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {isVideo && (
            <div className="media-type-indicator">
              <PlayCircleOutlined style={{ fontSize: 24, color: 'rgba(255,255,255,0.8)' }} />
              <span style={{ marginLeft: 8, color: 'rgba(255,255,255,0.8)' }}>视频</span>
            </div>
          )}
        </div>
      )}
      
      {/* 实际媒体内容 */}
      {isInView && !hasError && (
        <>
          {isVideo ? (
            <video
              ref={videoRef}
              className={`lazy-video ${isLoaded ? 'fade-in' : ''}`}
              style={{ width, height }}
              poster={poster}
              loop={loop}
              muted={muted}
              playsInline
              controls={controls}
              preload="metadata"
              onLoadedData={handleLoad}
              onError={handleError}
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              onClick={!controls ? handleVideoClick : undefined}
            >
              <source src={src} type={getVideoMimeType(src)} />
              您的浏览器不支持视频播放
            </video>
          ) : (
            <img
              src={src}
              alt={alt}
              title={title}
              className={`lazy-image ${isLoaded ? 'fade-in' : ''}`}
              style={{ width, height, objectFit: 'cover' }}
              onLoad={handleLoad}
              onError={handleError}
            />
          )}

          {/* 视频播放控制器 */}
          {isVideo && !controls && (showControls || !isPlaying) && (
            <div 
              className="video-play-overlay"
              onClick={handleVideoClick}
            >
              {isPlaying ? (
                <PauseCircleOutlined className="play-button" />
              ) : (
                <PlayCircleOutlined className="play-button" />
              )}
            </div>
          )}

          {/* 视频信息标识 */}
          {isVideo && title && (
            <div className="video-info">
              <span className="video-title">{title}</span>
            </div>
          )}
        </>
      )}

      {/* 错误状态 */}
      {hasError && (
        <div 
          className="lazy-media-error"
          style={{ width, height }}
        >
          <img
            src={placeholder}
            alt="加载失败"
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }}
          />
          <div className="error-message">
            {isVideo ? '视频加载失败' : '图片加载失败'}
          </div>
        </div>
      )}
      
      {/* 加载指示器 */}
      {isInView && !isLoaded && !hasError && (
        <div className="lazy-media-loading">
          <div className="loading-spinner"></div>
          <div className="loading-text">
            {isVideo ? '视频加载中...' : '图片加载中...'}
          </div>
        </div>
      )}
    </div>
  );
};

export default LazyMedia; 