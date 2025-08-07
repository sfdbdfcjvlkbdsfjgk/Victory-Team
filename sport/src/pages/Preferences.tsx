import { useState } from 'react';

const PreferencesPage = () => {
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  
  const sports = ['篮球', '足球', '羽毛球', '乒乓球', '网球', '游泳'];

  const toggleSport = (sport: string) => {
    setSelectedSports(prev => 
      prev.includes(sport) 
        ? prev.filter(s => s !== sport)
        : [...prev, sport]
    );
  };

  return (
    <div className="preferences-page">
      <h1>选择您喜欢的运动</h1>
      
      <div className="sports-grid">
        {sports.map(sport => (
          <button
            key={sport}
            className={`sport-item ${selectedSports.includes(sport) ? 'selected' : ''}`}
            onClick={() => toggleSport(sport)}
          >
            {sport}
          </button>
        ))}
      </div>
      
      <button className="save-btn">保存偏好</button>
    </div>
  );
};

export default PreferencesPage;