import React, { useState, useEffect, useRef, useCallback } from 'react';
import LazyImage from '../LazyImage';
import './index.css';

interface CarouselItem {
  _id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  redirectUrl?: string;
}

interface CarouselProps {
  items: CarouselItem[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showIndicators?: boolean;
  showArrows?: boolean;
  height?: number;
  className?: string;
}

const Carousel: React.FC<CarouselProps> = ({
  items,
  autoPlay = true,
  autoPlayInterval = 4000,
  showIndicators = true,
  showArrows = false,
  height = 120,
  className = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const currentXRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);

  // 自动轮播
  const startAutoPlay = useCallback(() => {
    if (!autoPlay || items.length <= 1) return;
    
    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % items.length);
    }, autoPlayInterval);
  }, [autoPlay, autoPlayInterval, items.length]);

  const stopAutoPlay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // 初始化自动轮播
  useEffect(() => {
    if (isAutoPlaying) {
      startAutoPlay();
    }
    return () => stopAutoPlay();
  }, [isAutoPlaying, startAutoPlay, stopAutoPlay]);

  // 暂停/恢复自动轮播
  const handleMouseEnter = () => {
    if (autoPlay) {
      setIsAutoPlaying(false);
      stopAutoPlay();
    }
  };

  const handleMouseLeave = () => {
    if (autoPlay) {
      setIsAutoPlaying(true);
    }
  };

  // 切换到指定索引
  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // 上一张
  const goToPrev = () => {
    setCurrentIndex(prev => (prev - 1 + items.length) % items.length);
  };

  // 下一张
  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % items.length);
  };

  // 触摸事件处理
  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = e.touches[0].clientX;
    isDraggingRef.current = true;
    setIsAutoPlaying(false);
    stopAutoPlay();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    currentXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return;
    
    const deltaX = currentXRef.current - startXRef.current;
    const threshold = 50; // 滑动阈值
    
    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        goToPrev();
      } else {
        goToNext();
      }
    }
    
    isDraggingRef.current = false;
    
    // 恢复自动播放
    if (autoPlay) {
      setTimeout(() => {
        setIsAutoPlaying(true);
      }, 1000);
    }
  };

  // 鼠标事件处理
  const handleMouseDown = (e: React.MouseEvent) => {
    startXRef.current = e.clientX;
    currentXRef.current = e.clientX;
    isDraggingRef.current = true;
    setIsAutoPlaying(false);
    stopAutoPlay();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    currentXRef.current = e.clientX;
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current) return;
    
    const deltaX = currentXRef.current - startXRef.current;
    const threshold = 50;
    
    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        goToPrev();
      } else {
        goToNext();
      }
    }
    
    isDraggingRef.current = false;
    
    if (autoPlay) {
      setTimeout(() => {
        setIsAutoPlaying(true);
      }, 1000);
    }
  };

  // 点击轮播项
  const handleItemClick = (item: CarouselItem) => {
    if (item.redirectUrl) {
      window.open(item.redirectUrl, '_blank');
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className={`carousel ${className}`} style={{ height }}>
        <div className="carousel-placeholder">
          <span>暂无轮播内容</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`carousel ${className}`}
      style={{ height }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={carouselRef}
    >
      <div 
        className="carousel-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div 
          className="carousel-track"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
            transition: isDraggingRef.current ? 'none' : 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          }}
        >
          {items.map((item, index) => (
            <div 
              key={item._id}
              className="carousel-slide"
              onClick={() => handleItemClick(item)}
            >
              <LazyImage
                src={item.imageUrl}
                alt={item.title}
                width="100%"
                height={height}
                className="carousel-image"
              />
              <div className="carousel-overlay">
                <div className="carousel-content">
                  <h3 className="carousel-title">{item.title}</h3>
                  {item.subtitle && (
                    <p className="carousel-subtitle">{item.subtitle}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 左右箭头 */}
      {showArrows && items.length > 1 && (
        <>
          <button 
            className="carousel-arrow carousel-arrow-prev"
            onClick={goToPrev}
            aria-label="上一张"
          >
            ‹
          </button>
          <button 
            className="carousel-arrow carousel-arrow-next"
            onClick={goToNext}
            aria-label="下一张"
          >
            ›
          </button>
        </>
      )}

      {/* 指示器 */}
      {showIndicators && items.length > 1 && (
        <div className="carousel-indicators">
          {items.map((_, index) => (
            <button
              key={index}
              className={`carousel-indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`第${index + 1}张`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Carousel; 