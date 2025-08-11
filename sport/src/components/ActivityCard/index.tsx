import React from 'react';
import type { Activity } from '../../api/types';
import './index.css';

interface ActivityCardProps {
  activity: Activity;
  isLarge?: boolean;
  onJoin: (activityId: string) => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ 
  activity, 
  isLarge = false, 
  onJoin 
}) => {
  const handleJoinClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onJoin(activity._id);
  };

  return (
    <div className={`activity-card ${isLarge ? 'large' : ''}`}>
      <div className="activity-image">
        <img src={activity.imageUrl} alt={activity.title} />
        <div className="activity-status">
          <span className={`status-badge ${activity.status}`}>
            {activity.status === 'active' ? '进行中' : 
             activity.status === 'upcoming' ? '即将开始' : '已结束'}
          </span>
        </div>
      </div>
      <div className="activity-info">
        <h4>{activity.title}</h4>
        {activity.description && (
          <p className="activity-description">{activity.description}</p>
        )}
        <div className="activity-details">
          {activity.location && (
            <span className="location">📍 {activity.location}</span>
          )}
          <span className="time">⏰ {new Date(activity.startTime).toLocaleDateString()}</span>
        </div>
        <div className="activity-meta">
          <span className="participants">{activity.participants}人报名</span>
          <button 
            className={`join-btn ${isLarge ? 'primary' : ''}`}
            onClick={handleJoinClick}
            disabled={activity.status === 'ended'}
          >
            {activity.status === 'ended' ? '已结束' : '立即报名'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityCard; 