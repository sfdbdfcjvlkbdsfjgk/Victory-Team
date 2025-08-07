// 本地 MongoDB 配置（备用方案）
const mongoose = require('mongoose')

// 本地 MongoDB 连接字符串
const LOCAL_MONGODB_URI = 'mongodb://localhost:27017/sport';

// 连接选项
const connectOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
};

// 连接到本地 MongoDB
function connectToLocalMongoDB() {
    return mongoose.connect(LOCAL_MONGODB_URI, connectOptions).then(() => {
        console.log('✅ 本地数据库连接成功')
    }).catch(err => {
        console.log('❌ 本地数据库连接失败:', err.message)
        console.log('💡 请确保已安装并启动本地 MongoDB 服务')
    });
}

module.exports = { connectToLocalMongoDB, LOCAL_MONGODB_URI }; 