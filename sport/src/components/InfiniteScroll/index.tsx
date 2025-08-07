import React, { useRef, useEffect, useCallback, useState } from 'react';
import Skeleton from '../Skeleton';
import './index.css';

interface InfiniteScrollProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  loading: boolean;
  threshold?: number;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  className?: string;
  itemHeight?: number;
  containerHeight?: number;
  enableVirtualization?: boolean;
}

function InfiniteScroll<T extends { _id?: string }>({
  items,
  renderItem,
  onLoadMore,
  hasMore,
  loading,
  threshold = 200,
  loadingComponent,
  errorComponent,
  emptyComponent,
  className = '',
  itemHeight = 100,
  containerHeight = 600,
  enableVirtualization = false
}: InfiniteScrollProps<T>) {
  const [error, setError] = useState<string | null>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver>();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 虚拟滚动计算
  const calculateVisibleRange = useCallback(() => {
    if (!enableVirtualization || !containerRef.current) return;

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const containerHeightValue = container.clientHeight;

    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeightValue / itemHeight);
    const end = Math.min(start + visibleCount + 2, items.length); // +2 for buffer

    setVisibleRange({ start: Math.max(0, start - 1), end });
  }, [itemHeight, items.length, enableVirtualization]);

  // 处理滚动事件
  const handleScroll = useCallback(() => {
    if (enableVirtualization) {
      calculateVisibleRange();
    }
  }, [calculateVisibleRange, enableVirtualization]);

  // 加载更多数据
  const handleLoadMore = useCallback(async () => {
    if (loading || !hasMore || error) return;

    try {
      setError(null);
      await onLoadMore();
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    }
  }, [loading, hasMore, error, onLoadMore]);

  // 设置Intersection Observer
  useEffect(() => {
    if (!loadMoreRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          handleLoadMore();
        }
      },
      {
        rootMargin: `${threshold}px`,
        threshold: 0.1
      }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleLoadMore, threshold]);

  // 处理容器滚动
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enableVirtualization) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    calculateVisibleRange(); // 初始计算

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll, calculateVisibleRange, enableVirtualization]);

  // 渲染虚拟列表
  const renderVirtualizedList = () => {
    const { start, end } = visibleRange;
    const visibleItems = items.slice(start, end);
    const offsetTop = start * itemHeight;

    return (
      <div className="virtual-list-container" style={{ height: containerHeight }}>
        <div
          className="virtual-list-content"
          style={{
            height: items.length * itemHeight,
            position: 'relative'
          }}
        >
          <div
            className="virtual-list-items"
            style={{
              transform: `translateY(${offsetTop}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0
            }}
          >
            {visibleItems.map((item, index) => (
              <div
                key={item._id || `item-${start + index}`}
                className="virtual-list-item"
                style={{ height: itemHeight }}
              >
                {renderItem(item, start + index)}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 渲染普通列表
  const renderNormalList = () => (
    <div className="normal-list">
      {items.map((item, index) => (
        <div key={item._id || `item-${index}`} className="list-item">
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );

  // 空状态
  if (items.length === 0 && !loading && !error) {
    return (
      <div className={`infinite-scroll-empty ${className}`}>
        {emptyComponent || (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <div className="empty-text">暂无数据</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`infinite-scroll ${className}`} ref={containerRef}>
      {enableVirtualization ? renderVirtualizedList() : renderNormalList()}
      
      {/* 加载更多触发器 */}
      {hasMore && (
        <div ref={loadMoreRef} className="load-more-trigger">
          {loading && (
            <div className="loading-more">
              {loadingComponent || (
                <div className="loading-content">
                  <div className="loading-spinner-small"></div>
                  <span>加载中...</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div className="load-error">
          {errorComponent || (
            <div className="error-content">
              <div className="error-text">加载失败：{error}</div>
              <button className="retry-button" onClick={handleLoadMore}>
                重试
              </button>
            </div>
          )}
        </div>
      )}

      {/* 到底提示 */}
      {!hasMore && items.length > 0 && !loading && (
        <div className="load-end">
          <div className="end-line"></div>
          <span className="end-text">已显示全部内容</span>
          <div className="end-line"></div>
        </div>
      )}
    </div>
  );
}

export default InfiniteScroll; 