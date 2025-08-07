import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../router/types';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 处理登录/注册逻辑
    navigate(ROUTES.HOME);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>{isLogin ? '登录' : '注册'}</h1>
        
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="手机号" required />
          <input type="password" placeholder="密码" required />
          {!isLogin && (
            <input type="password" placeholder="确认密码" required />
          )}
          
          <button type="submit" className="auth-btn">
            {isLogin ? '登录' : '注册'}
          </button>
        </form>
        
        <p onClick={() => setIsLogin(!isLogin)} className="switch-auth">
          {isLogin ? '没有账号？去注册' : '已有账号？去登录'}
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
