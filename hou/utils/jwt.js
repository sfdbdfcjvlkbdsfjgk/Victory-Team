const jwt = require('jsonwebtoken');
// 1. 浏览器向服务器发送登录请求
// 2. 服务器验证用户名和密码
// 3. 服务器生成Access Token和Refresh Token返回给浏览器存储在本地
// 4. 浏览器向服务器发送请求时，将Access Token发送给服务器（headers）
// 5. 服务器验证Access Token是否过期
// 6. 如果Access Token没有过期，则返回200状态码，并返回用户信息；否则返回失效信息
// 7. 如果浏览器收到失效信息，携带Refresh Token发送请求，则服务器验证Refresh Token是否有效，如果有效，则生成新的Access Token，并返回给浏览器
const dotenv = require("dotenv");
dotenv.config();

// JWT配置
const JWT_SECRET = process.env.JWT_SECRET || '123456';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || '123456';

// Token过期时间
const ACCESS_TOKEN_EXPIRES = '15m'; // 15分钟
const REFRESH_TOKEN_EXPIRES = '7d'; // 7天

/**
 * 生成Access Token ：获取用户权限
 * @param {Object} payload - 用户信息
 * @returns {string} access token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
};

/**
 * 生成Refresh Token：获取新的Access Token
 * @param {Object} payload - 用户信息
 * @returns {string} refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES });
};

// 
/**
 * 验证Access Token
 * @param {string} token - access token
 * @returns {Object} 解码后的用户信息
 */
const verifyAccessToken = (token) => {
    // 验证Access Token是否过期
  return jwt.verify(token, JWT_SECRET);
};

/**
 * 验证Refresh Token
 * @param {string} token - refresh token
 * @returns {Object} 解码后的用户信息
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};

/**
 * 生成双token
 * @param {Object} userInfo - 用户信息
 * @param {Array} roles - 用户角色
 * @param {Array} permissions - 用户权限
 * @returns {Object} 包含access token和refresh token的对象
 */
const generateTokens = (userInfo, roles = [], permissions = []) => {
  const payload = {
    userId: userInfo.id,
    userName: userInfo.userName,
    realName: userInfo.realName,
    email: userInfo.email,
    phone: userInfo.phone,
    roles: roles,
    permissions: permissions
  };
  
  // 为refresh token创建简化的payload（不包含角色和权限）
  const refreshPayload = {
    userId: userInfo.id,
    userName: userInfo.userName,
    realName: userInfo.realName,
    email: userInfo.email,
    phone: userInfo.phone
  };
  
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(refreshPayload)
  };
};

module.exports = {
  generateAccessToken, // 生成Access Token
  generateRefreshToken, // 生成Refresh Token
  verifyAccessToken, // 验证Access Token
  verifyRefreshToken, // 验证Refresh Token
  generateTokens // 生成双token
}; 