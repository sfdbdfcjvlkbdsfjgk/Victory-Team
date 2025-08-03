import { NavLink } from 'react-router-dom';
import { ROUTES, ROUTE_METADATA } from '../router/types';
import './BottomNavigation.css';

const BottomNavigation = () => {
  const navItems = Object.entries(ROUTE_METADATA)
    .filter(([_, metadata]) => metadata.showInBottomNav)
    .map(([path, metadata]) => ({
      path,
      label: metadata.title,
      icon: metadata.icon || '📄'
    }));

  return (
    <nav className="bottom-navigation">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `nav-item ${isActive ? 'active' : ''}`
          }
        >
          <div className="nav-icon">{item.icon}</div>
          <div className="nav-label">{item.label}</div>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNavigation;
