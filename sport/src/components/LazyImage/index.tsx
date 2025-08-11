import React, { useState, useRef, useEffect } from 'react';
import './index.css';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2NjYyI+5Yqg6L295LitLi4uPC90ZXh0Pjwvc3ZnPg==',
  width,
  height,
  style,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver>();

  useEffect(() => {
    if (!imgRef.current) return;

    // 创建Intersection Observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            // 一旦进入视口就停止观察
            if (observerRef.current && imgRef.current) {
              observerRef.current.unobserve(imgRef.current);
            }
          }
        });
      },
      {
        rootMargin: '50px', // 提前50px开始加载
        threshold: 0.1
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div 
      className={`lazy-image-container ${className}`} 
      style={{ width, height, ...style }}
    >
      {/* 占位符图片 */}
      <img
        ref={imgRef}
        src={placeholder}
        alt=""
        className={`lazy-image-placeholder ${isLoaded ? 'fade-out' : ''}`}
        style={{ width, height }}
      />
      
      {/* 实际图片 */}
      {isInView && (
        <img
          src={hasError ? placeholder : src}
          alt={alt}
          className={`lazy-image ${isLoaded ? 'fade-in' : ''}`}
          style={{ width, height }}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
      
      {/* 加载指示器 */}
      {isInView && !isLoaded && !hasError && (
        <div className="lazy-image-loading">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default LazyImage; 