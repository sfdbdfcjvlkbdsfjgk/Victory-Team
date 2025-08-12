const nodemailer = require('nodemailer');

// 邮件服务配置
const EMAIL_CONFIG = {
  host: 'smtp.qq.com',  // QQ邮箱SMTP服务器地址
  port: 587,  // QQ邮箱SMTP端口
  secure: false,  // 使用TLS
  auth: {
    user: process.env.EMAIL_USER || '1485260435@qq.com', // 发件人邮箱
    pass: process.env.EMAIL_PASS || 'cevmjpcbzaheiffc'   // QQ邮箱授权码
  },
  tls: {
    rejectUnauthorized: false // 忽略证书错误
  }
};

// 创建邮件传输器
const transporter = nodemailer.createTransport(EMAIL_CONFIG);

/**
 * 发送重置密码验证码邮件
 * @param {string} email - 收件人邮箱
 * @param {string} verificationCode - 验证码
 * @param {string} userName - 用户名
 * @returns {Promise} 发送结果
 */
const sendResetPasswordCode = async (email, verificationCode, userName = '') => {
  try {
    // 邮件HTML模板
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>密码重置验证码</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #e56565;
            margin: 0;
            font-size: 24px;
          }
          .content {
            background: white;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .code {
            background: #f0f0f0;
            padding: 15px;
            border-radius: 5px;
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            color: #e56565;
            letter-spacing: 2px;
            margin: 20px 0;
          }
          .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>密码重置验证码</h1>
          </div>
          
          <div class="content">
            <p>您好${userName ? ' ' + userName : ''}！</p>
            <p>您正在进行密码重置操作，您的验证码是：</p>
            
            <div class="code">
              ${verificationCode}
            </div>
            
            <div class="warning">
              <strong>重要提醒：</strong>
              <ul>
                <li>此验证码有效期为 <strong>6666666666666666666666666666666分钟</strong></li>
                <li>请勿将验证码告诉他人</li>
                <li>如果您没有进行密码重置操作，请忽略此邮件</li>
              </ul>
            </div>
            
            <p>如果您有任何问题，请联系我们的客服团队。</p>
            <p>感谢您的使用！</p>
          </div>
          
          <div class="footer">
            <p>此邮件由系统自动发送，请勿回复</p>
            <p>© 2025 全民健身. 保留所有权利.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // 邮件选项 ： 发件人 收件人 主题 内容
    const fromEmail = process.env.EMAIL_USER || '1485260435@qq.com'; // 发件人邮箱
    const mailOptions = {
      from: `"全民健身" <${fromEmail}>`, // 使用正确的格式：显示名称 <邮箱地址>
      to: email,
      subject: '【全民健身】密码重置验证码',
      html: htmlContent
    };

    // 发送邮件
    const info = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('邮件发送失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 验证邮件服务配置
 * @returns {Promise<boolean>} 验证结果
 */
const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('邮件服务配置验证失败:', error);
    return false;
  }
};

module.exports = {
  sendResetPasswordCode,
  verifyEmailConfig
}; 