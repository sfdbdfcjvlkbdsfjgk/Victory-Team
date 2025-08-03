import { Link } from 'react-router-dom';

const ProfilePage = () => {
  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="avatar">👤</div>
        <h2>用户昵称</h2>
        <p>运动爱好者</p>
      </div>
      
      <div className="profile-menu">
        <Link to="/preferences" className="menu-item">
          <span>🎯</span>
          <span>运动偏好</span>
          <span>→</span>
        </Link>
        
        <div className="menu-item">
          <span>📊</span>
          <span>运动记录</span>
          <span>→</span>
        </div>
        
        <div className="menu-item">
          <span>⚙️</span>
          <span>设置</span>
          <span>→</span>
        </div>
        
        <div className="menu-item">
          <span>🚪</span>
          <span>退出登录</span>
          <span>→</span>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;