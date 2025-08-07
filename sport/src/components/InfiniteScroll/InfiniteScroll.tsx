import React, { useRef, useEffect } from 'react';
import { Spin } from 'antd';
import './InfiniteScroll.css';

interface InfiniteScrollProps {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  threshold?: number;
  children: React.ReactNode;
  className?: string;
}

const InfiniteScroll: React.FC<InfiniteScrollProps> = ({
  hasMore,
  loading,
  onLoadMore,
  threshold = 200,
  children,
  className = ''
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      {
        rootMargin: `${threshold}px`,
        threshold: 0.1
      }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore, threshold]);

  return (
    <div className={`infinite-scroll-container ${className}`}>
      {children}
      
      {/* 加载更多的哨兵元素 */}
      {hasMore && (
        <div 
          ref={sentinelRef}
          className="infinite-scroll-sentinel"
        >
          {loading && (
            <div className="infinite-scroll-loading animate__animated animate__fadeIn">
              <Spin size="small" />
              <span style={{ marginLeft: 8 }}>加载更多...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InfiniteScroll; 