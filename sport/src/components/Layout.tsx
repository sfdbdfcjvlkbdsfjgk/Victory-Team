import { Outlet } from 'react-router-dom';
import BottomNavigation from './BottomNavigation.tsx';

const Layout = () => {
  return (
    <div className="app-layout">
      <main className="main-content">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  );
};

export default Layout;