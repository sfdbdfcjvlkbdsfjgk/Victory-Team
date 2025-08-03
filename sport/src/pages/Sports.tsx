const SportsPage = () => {
  const sportsCategories = [
    { id: 1, name: '篮球', icon: '🏀', participants: '1.2万人' },
    { id: 2, name: '足球', icon: '⚽', participants: '8千人' },
    { id: 3, name: '羽毛球', icon: '🏸', participants: '6千人' },
    { id: 4, name: '乒乓球', icon: '🏓', participants: '4千人' },
    { id: 5, name: '网球', icon: '🎾', participants: '3千人' },
    { id: 6, name: '游泳', icon: '🏊', participants: '5千人' }
  ];

  return (
    <div className="sports-page">
      <header className="page-header">
        <h1>运动</h1>
      </header>
      
      <div className="sports-grid">
        {sportsCategories.map(sport => (
          <div key={sport.id} className="sport-card">
            <div className="sport-icon">{sport.icon}</div>
            <h3>{sport.name}</h3>
            <p>{sport.participants}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SportsPage;