const { verifyAccessToken } = require('../utils/jwt');

/**
 * JWT验证中间件
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - 下一个中间件函数
 */
const authMiddleware = (req, res, next) => {
  try {
    // 从请求头中获取token
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        code: 401,
        message: '未提供访问令牌'
      });
    }
    
    // 检查token格式 (Bearer token)
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '访问令牌格式错误'
      });
    }
    
    // 验证token
    const decoded = verifyAccessToken(token);
    
    // 将用户信息添加到请求对象中
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: '访问令牌已过期'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        code: 401,
        message: '访问令牌无效'
      });
    }
    
    return res.status(500).json({
      code: 500,
      message: '令牌验证失败',
      error: error.message
    });
  }
};

module.exports = authMiddleware; 