import React from 'react';
import './index.css';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number | string;
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular' | 'card';
  lines?: number;
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 4,
  className = '',
  variant = 'rectangular',
  lines = 1,
  animation = 'pulse'
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'text':
        return { height: 16, borderRadius: 4 };
      case 'circular':
        return { borderRadius: '50%' };
      case 'card':
        return { height: 200, borderRadius: 8 };
      default:
        return {};
    }
  };

  const skeletonStyle = {
    width,
    height,
    borderRadius,
    ...getVariantStyles()
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`skeleton-container ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`skeleton skeleton-${animation}`}
            style={{
              ...skeletonStyle,
              width: index === lines - 1 ? '75%' : '100%',
              marginBottom: index < lines - 1 ? 8 : 0
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`skeleton skeleton-${animation} ${className}`}
      style={skeletonStyle}
    />
  );
};

// 预定义的骨架屏类型
export const BannerSkeleton: React.FC = () => (
  <div className="banner-skeleton">
    <Skeleton variant="card" height={180} />
  </div>
);

export const ActivityCardSkeleton: React.FC = () => (
  <div className="activity-card-skeleton">
    <div className="activity-skeleton-image">
      <Skeleton width={100} height={80} />
    </div>
    <div className="activity-skeleton-content">
      <Skeleton variant="text" width="70%" height={16} />
      <Skeleton variant="text" width="50%" height={12} />
      <div className="activity-skeleton-actions">
        <Skeleton variant="text" width="30%" height={12} />
        <Skeleton width={60} height={24} borderRadius={12} />
      </div>
    </div>
  </div>
);

export const QuickActionSkeleton: React.FC = () => (
  <div className="quick-action-skeleton">
    <Skeleton variant="circular" width={56} height={56} />
    <Skeleton variant="text" width="100%" height={12} />
  </div>
);

export const ModuleCardSkeleton: React.FC = () => (
  <div className="module-card-skeleton">
    <Skeleton variant="text" width="24px" height={24} />
    <Skeleton variant="text" width="80%" height={12} lines={2} />
  </div>
);

export const NotificationSkeleton: React.FC = () => (
  <div className="notification-skeleton">
    <Skeleton variant="circular" width={18} height={18} />
    <Skeleton variant="text" width="70%" height={14} />
    <Skeleton variant="text" width={16} height={16} />
  </div>
);

// 组合骨架屏
export const HomePageSkeleton: React.FC = () => (
  <div className="home-page-skeleton">
    {/* 横幅骨架屏 */}
    <BannerSkeleton />
    
    {/* 快捷功能骨架屏 */}
    <div className="quick-actions-skeleton">
      {Array.from({ length: 5 }).map((_, index) => (
        <QuickActionSkeleton key={index} />
      ))}
    </div>
    
    {/* 通知骨架屏 */}
    <NotificationSkeleton />
    
    {/* 功能模块骨架屏 */}
    <div className="modules-skeleton">
      {Array.from({ length: 3 }).map((_, index) => (
        <ModuleCardSkeleton key={index} />
      ))}
    </div>
    
    {/* 活动列表骨架屏 */}
    <div className="activities-skeleton">
      <Skeleton variant="text" width="30%" height={18} />
      {Array.from({ length: 3 }).map((_, index) => (
        <ActivityCardSkeleton key={index} />
      ))}
    </div>
  </div>
);

export default Skeleton; 