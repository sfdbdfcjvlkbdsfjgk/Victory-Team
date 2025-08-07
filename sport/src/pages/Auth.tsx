import { useState } from 'react';
import '../css/AuthPage.css';

const LoginPage = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ phone, password });
    // 登录逻辑（API 调用）
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">你好，</h1>
        <p className="login-subtitle">欢迎来到全民健身！</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div>
            <label className="login-label">手机号</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="仅支持中国大陆手机号"
              className="login-input"
              required
            />
          </div>

          <div>
            <label className="login-label">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入全民健身密码"
              className="login-input"
              required
            />
            <div className="sms-login-wrapper">
              <button type="button" className="sms-login-button">
                短信验证码登录
              </button>
            </div>
          </div>

          <button type="submit" className="login-submit">
            登录
          </button>
        </form>

        <div className="login-footer">
          <button type="button">注册</button>
          <button type="button">忘记密码？</button>
        </div>

        <div className="agreement">
          <input type="checkbox" />
          <span>
            登录即表示同意全民健身
            <a href="#">《服务条款》</a>
            和
            <a href="#">《隐私政策》</a>
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
