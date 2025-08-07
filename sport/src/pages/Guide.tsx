import { useNavigate } from 'react-router-dom';

const GuidePage = () => {
  const navigate = useNavigate();

  return (
    <div className="guide-page">
      <header className="page-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          ← 返回
        </button>
        <h1>基础规范说明</h1>
      </header>
      
      <div className="guide-content">
        <section>
          <h2>使用指南</h2>
          <p>欢迎使用全名体育应用...</p>
        </section>
        
        <section>
          <h2>运动规则</h2>
          <p>请遵守以下运动规则...</p>
        </section>
      </div>
    </div>
  );
};

export default GuidePage;