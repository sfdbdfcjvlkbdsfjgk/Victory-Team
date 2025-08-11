import React, { useState, useRef, useEffect } from 'react';
import { Skeleton } from 'antd';
import './LazyImage.css';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
  fallback?: string;
  placeholder?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  style = {},
  fallback = '/default-image.jpg',
  placeholder,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // 提前50px开始加载
        threshold: 0.1
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleImageLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleImageError = () => {
    setHasError(true);
    onError?.();
  };

  const containerStyle = {
    width,
    height,
    ...style
  };

  return (
    <div 
      ref={containerRef}
      className={`lazy-image-container ${className}`}
      style={containerStyle}
    >
      {!isInView ? (
        // 未进入视窗时显示占位符
        placeholder || (
          <Skeleton.Image 
            active 
            style={{ 
              width: '100%', 
              height: '100%' 
            }} 
          />
        )
      ) : (
        <>
          {/* 加载中的骨架屏 */}
          {!isLoaded && !hasError && (
            <div className="lazy-image-placeholder">
              <Skeleton.Image 
                active 
                style={{ 
                  width: '100%', 
                  height: '100%' 
                }} 
              />
            </div>
          )}
          
          {/* 实际图片 */}
          <img
            ref={imgRef}
            src={hasError ? fallback : src}
            alt={alt}
            className={`lazy-image ${isLoaded ? 'lazy-image-loaded' : ''} ${hasError ? 'lazy-image-error' : ''}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy" // 浏览器原生懒加载支持
          />
        </>
      )}
    </div>
  );
};

export default LazyImage; 