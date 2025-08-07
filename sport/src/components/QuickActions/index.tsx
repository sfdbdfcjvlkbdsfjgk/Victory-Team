import React from 'react';
import { Link } from 'react-router-dom';
import type { QuickAction } from '../../api/types';
import './index.css';

interface QuickActionsProps {
  actions: QuickAction[];
}

const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
  return (
    <section className="quick-actions">
      {actions.map((action) => (
        <Link 
          key={action._id} 
          to={action.redirectUrl} 
          className="action-item"
        >
          <div className={`action-icon ${action.type}`}>
            {action.icon}
          </div>
          <span>{action.title}</span>
        </Link>
      ))}
    </section>
  );
};

export default QuickActions; 