import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Spin, Empty } from 'antd';
import './VirtualList.css';

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  itemHeight?: number;
  threshold?: number;
  className?: string;
  emptyText?: string;
  loadingText?: string;
}

function VirtualList<T>({
  items,
  renderItem,
  hasMore,
  loading,
  onLoadMore,
  itemHeight = 120,
  threshold = 200,
  className = '',
  emptyText = '暂无数据',
  loadingText = '加载中...'
}: VirtualListProps<T>) {
  const [visibleItems, setVisibleItems] = useState<T[]>([]);
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(10);
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 计算可见区域的项目
  const updateVisibleItems = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    
    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(start + visibleCount + 2, items.length); // 添加缓冲

    setStartIndex(start);
    setEndIndex(end);
    setVisibleItems(items.slice(start, end));
  }, [items, itemHeight]);

  // 监听滚动事件
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      updateVisibleItems();
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [updateVisibleItems]);

  // 初始化和items变化时更新
  useEffect(() => {
    updateVisibleItems();
  }, [items, updateVisibleItems]);

  // Intersection Observer for infinite loading
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

  if (items.length === 0 && !loading) {
    return (
      <div className={`virtual-list-empty ${className}`}>
        <Empty description={emptyText} />
      </div>
    );
  }

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return (
    <div 
      ref={containerRef}
      className={`virtual-list-container ${className}`}
    >
      <div 
        className="virtual-list-wrapper"
        style={{ height: totalHeight }}
      >
        <div 
          className="virtual-list-content"
          style={{ transform: `translateY(${offsetY}px)` }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              className="virtual-list-item animate__animated animate__fadeInUp"
              style={{ 
                height: itemHeight,
                animationDelay: `${(index % 5) * 0.1}s`
              }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
      
      {/* 加载更多的哨兵元素 */}
      {hasMore && (
        <div 
          ref={sentinelRef}
          className="virtual-list-sentinel"
        >
          {loading && (
            <div className="virtual-list-loading">
              <Spin size="small" />
              <span style={{ marginLeft: 8 }}>{loadingText}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default VirtualList; 