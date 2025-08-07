import { Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../router/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  
  // 这里应该检查用户是否已登录
  // 目前简化处理，可以根据实际需求添加认证逻辑
  const isAuthenticated = localStorage.getItem('user') !== null;
  
  if (!isAuthenticated) {
    // 保存用户尝试访问的页面，登录后可以重定向回来
    return (
      <Navigate 
        to={ROUTES.AUTH} 
        state={{ from: location }} 
        replace 
      />
    );
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
