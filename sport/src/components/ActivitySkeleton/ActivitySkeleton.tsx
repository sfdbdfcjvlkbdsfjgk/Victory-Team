import React from 'react';
import { Card, Skeleton, Row, Col } from 'antd';
import './ActivitySkeleton.css';

interface ActivitySkeletonProps {
  count?: number;
  className?: string;
}

const ActivitySkeleton: React.FC<ActivitySkeletonProps> = ({
  count = 3,
  className = ''
}) => {
  return (
    <div className={`activity-skeleton-container ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <Card
          key={index}
          size="small"
          className="activity-skeleton-card"
          style={{
            borderRadius: 12,
            marginBottom: 16
          }}
          styles={{ body: { padding: 16 } }}
        >
          <Row gutter={16} align="middle">
            <Col flex="none">
              <Skeleton.Image
                active
                style={{
                  width: 80,
                  height: 60,
                  borderRadius: 8
                }}
              />
            </Col>
            <Col flex="auto">
              <div className="activity-skeleton-content">
                <Skeleton
                  active
                  title={{ width: '70%' }}
                  paragraph={{
                    rows: 2,
                    width: ['100%', '60%']
                  }}
                />
                <div className="activity-skeleton-footer">
                  <Skeleton.Button
                    active
                    size="small"
                    style={{ width: 80, height: 24 }}
                  />
                  <Skeleton.Button
                    active
                    size="small"
                    style={{ width: 60, height: 24 }}
                  />
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      ))}
    </div>
  );
};

export default ActivitySkeleton; 