import { Link } from 'react-router-dom';
import { ROUTES } from '../router/types';

const HomePage = () => {
  return (
    <div className="home-page">
      <header className="home-header">
        <h1>全民体育</h1>
        <Link to={ROUTES.GUIDE} className="guide-link">
          📖 基础规范说明
        </Link>
      </header>

      <section className="quick-actions">
        <Link to={ROUTES.BOOKING} className="action-card">
          <span>🏟️</span>
          <h3>场地预约</h3>
        </Link>
        <Link to={ROUTES.COMMUNITY} className="action-card">
          <span>🏃‍♂️</span>
          <h3>运动圈</h3>
        </Link>
        <Link to={ROUTES.PREFERENCES} className="action-card">
          <span>⚙️</span>
          <h3>喜好选择</h3>
        </Link>
      </section>
    </div>
  );
};

export default HomePage;