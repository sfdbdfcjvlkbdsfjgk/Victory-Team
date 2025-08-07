import React from 'react';
import type { Banner } from '../../api/types';
import './index.css';

interface BannerProps {
  banner: Banner;
}

const BannerComponent: React.FC<BannerProps> = ({ banner }) => {
  return (
    <section className="main-banner">
      <div className="banner-card">
        <div className="banner-content">
          <div className="banner-text">
            <h2>{banner.title}</h2>
            {banner.subtitle && <p>{banner.subtitle}</p>}
            <span className="date">
              {new Date(banner.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="banner-image">
            <div 
              className="character-image"
              style={{ backgroundImage: `url(${banner.imageUrl})` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default BannerComponent; 