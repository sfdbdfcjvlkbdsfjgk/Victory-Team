const { WebSocketServer } = require('ws');
const http = require('http');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

// 创建HTTP服务器
const server = http.createServer(app);

// 创建WebSocket服务器
const wss = new WebSocketServer({ 
  server,
  perMessageDeflate: false
});

// 存储房间信息
const rooms = new Map();

console.log('🚀 WebSocket信令服务器启动中...');

// WebSocket连接处理
wss.on('connection', (ws, req) => {
  console.log('📡 新的WebSocket连接');
  
  // 为连接分配唯一ID
  ws.peerId = Math.random().toString(36).substring(2, 10);
  ws.roomId = null;
  
  // 消息处理
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log(`📨 收到消息类型: ${data.type} 来自: ${ws.peerId}`);
      
      handleMessage(ws, data);
    } catch (error) {
      console.error('❌ 消息解析错误:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: '消息格式错误'
      }));
    }
  });
  
  // 连接关闭处理
  ws.on('close', () => {
    console.log(`👋 客户端 ${ws.peerId} 断开连接`);
    handleDisconnect(ws);
  });
  
  // 错误处理
  ws.on('error', (error) => {
    console.error(`❌ WebSocket 错误:`, error);
  });
  
  // 发送连接确认
  ws.send(JSON.stringify({
    type: 'connected',
    peerId: ws.peerId
  }));
});

// 处理消息
function handleMessage(ws, data) {
  switch (data.type) {
    case 'join-room':
      handleJoinRoom(ws, data);
      break;
      
    case 'offer':
    case 'answer':
    case 'ice-candidate':
      handleWebRTCMessage(ws, data);
      break;
      
    case 'video-toggle':
    case 'audio-toggle':
      handleMediaToggle(ws, data);
      break;
      
    case 'chat-message':
      handleChatMessage(ws, data);
      break;
      
    // 连麦相关消息
    case 'mic-request':
      handleMicRequest(ws, data);
      break;
      
    case 'mic-approved':
      handleMicApproved(ws, data);
      break;
      
    case 'mic-denied':
      handleMicDenied(ws, data);
      break;
      
    case 'user-stream-updated':
      handleUserStreamUpdated(ws, data);
      break;
      
    // 心跳消息
    case 'heartbeat':
      handleHeartbeat(ws, data);
      break;
      
    default:
      console.log(`⚠️ 未知消息类型: ${data.type}`);
  }
}

// 处理加入房间
function handleJoinRoom(ws, data) {
  const roomId = data.roomId;
  
  if (!roomId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: '房间ID不能为空'
    }));
    return;
  }
  
  // 离开当前房间（如果有）
  if (ws.roomId) {
    leaveRoom(ws);
  }
  
  // 初始化房间
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  
  const room = rooms.get(roomId);
  const isFirstUser = room.size === 0;
  
  // 加入房间
  room.add(ws);
  ws.roomId = roomId;
  
  console.log(`🏠 用户 ${ws.peerId} 加入房间 ${roomId}, 是否主播: ${isFirstUser}, 房间人数: ${room.size}`);
  
  // 通知其他用户有新用户加入
  broadcastToRoom(roomId, {
    type: 'user-joined',
    peerId: ws.peerId
  }, ws);
  
  // 通知新用户已存在的用户
  room.forEach(client => {
    if (client !== ws && client.readyState === 1) { // WebSocket.OPEN = 1
      ws.send(JSON.stringify({
        type: 'user-joined',
        peerId: client.peerId
      }));
    }
  });
  
  // 分配角色
  if (isFirstUser) {
    ws.send(JSON.stringify({
      type: 'become-host'
    }));
  } else {
    // 找到主播（第一个用户）
    const hostPeerId = Array.from(room)[0].peerId;
    ws.send(JSON.stringify({
      type: 'host-info',
      hostId: hostPeerId
    }));
  }
  
  // 通知用户数量
  broadcastToRoom(roomId, {
    type: 'user-count-updated',
    count: room.size
  });
}

// 处理WebRTC消息
function handleWebRTCMessage(ws, data) {
  if (!ws.roomId) {
    console.log('❌ 用户未加入房间，无法转发WebRTC消息');
    return;
  }
  
  // 添加发送者信息
  data.from = ws.peerId;
  
  if (data.target) {
    // 发送给指定用户
    const room = rooms.get(ws.roomId);
    if (room) {
      room.forEach(client => {
        if (client.peerId === data.target && client.readyState === 1) {
          console.log(`🔄 转发 ${data.type} 消息: ${ws.peerId} -> ${data.target}`);
          client.send(JSON.stringify(data));
        }
      });
    }
  } else {
    // 广播给房间内其他用户
    broadcastToRoom(ws.roomId, data, ws);
  }
}

// 处理媒体状态切换
function handleMediaToggle(ws, data) {
  if (!ws.roomId) return;
  
  // 添加用户友好的消息
  let message = '';
  if (data.type === 'video-toggle') {
    message = data.enabled ? 
      `📹 用户 ${ws.peerId.slice(0, 8)} 开启了摄像头` : 
      `📹 用户 ${ws.peerId.slice(0, 8)} 关闭了摄像头`;
  } else if (data.type === 'audio-toggle') {
    message = data.enabled ? 
      `🔊 用户 ${ws.peerId.slice(0, 8)} 开启了麦克风` : 
      `🔇 用户 ${ws.peerId.slice(0, 8)} 关闭了麦克风`;
  }
  
  broadcastToRoom(ws.roomId, {
    type: data.type,
    peerId: ws.peerId,
    enabled: data.enabled,
    message: message,
    username: `用户 ${ws.peerId.slice(0, 8)}`
  }, ws);
}

// 处理聊天消息
function handleChatMessage(ws, data) {
  if (!ws.roomId) return;
  
  broadcastToRoom(ws.roomId, {
    type: 'chat-message',
    peerId: ws.peerId,
    message: data.message,
    username: `用户 ${ws.peerId.slice(0, 6)}`
  }, ws);
}

// 处理断开连接
function handleDisconnect(ws) {
  if (ws.roomId) {
    leaveRoom(ws);
  }
}

// 离开房间
function leaveRoom(ws) {
  const room = rooms.get(ws.roomId);
  if (!room) return;
  
  const wasHost = Array.from(room)[0] === ws; // 是否是主播
  room.delete(ws);
  
  // 通知其他用户有用户离开
  broadcastToRoom(ws.roomId, {
    type: 'user-left',
    peerId: ws.peerId
  });
  
  // 更新用户数量
  if (room.size > 0) {
    broadcastToRoom(ws.roomId, {
      type: 'user-count-updated',
      count: room.size
    });
  }
  
  // 如果主播离开，关闭房间
  if (wasHost) {
    console.log(`🎤 主播离开，关闭房间 ${ws.roomId}`);
    broadcastToRoom(ws.roomId, {
      type: 'room-closed'
    });
    rooms.delete(ws.roomId);
  } else if (room.size === 0) {
    // 房间为空，删除房间
    rooms.delete(ws.roomId);
    console.log(`🗑️ 房间 ${ws.roomId} 已删除`);
  }
  
  ws.roomId = null;
}

// 向房间广播消息
function broadcastToRoom(roomId, message, excludeWs = null) {
  const room = rooms.get(roomId);
  if (!room) return;
  
  let sentCount = 0;
  room.forEach(client => {
    if (client !== excludeWs && client.readyState === 1) { // WebSocket.OPEN = 1
      client.send(JSON.stringify(message));
      sentCount++;
    }
  });
  
  if (sentCount > 0) {
    console.log(`📡 广播消息 ${message.type} 到房间 ${roomId}, 接收者: ${sentCount}个`);
  }
}

// 连麦相关处理函数
function handleMicRequest(ws, data) {
  if (!ws.roomId) return;
  
  console.log(`🎤 ${ws.peerId} 请求连麦`);
  
  const room = rooms.get(ws.roomId);
  if (!room) return;
  
  // 找到主播（第一个用户）
  const host = Array.from(room)[0];
  if (host && host.readyState === 1) {
    host.send(JSON.stringify({
      type: 'mic-request',
      from: ws.peerId
    }));
  }
}

function handleMicApproved(ws, data) {
  if (!ws.roomId) return;
  
  console.log(`✅ 主播批准 ${data.target} 的连麦请求`);
  
  const room = rooms.get(ws.roomId);
  if (!room) return;
  
  // 找到目标用户
  const targetClient = Array.from(room).find(client => client.peerId === data.target);
  if (targetClient && targetClient.readyState === 1) {
    targetClient.send(JSON.stringify({
      type: 'mic-approved'
    }));
  }
}

function handleMicDenied(ws, data) {
  if (!ws.roomId) return;
  
  console.log(`❌ 主播拒绝 ${data.target} 的连麦请求`);
  
  const room = rooms.get(ws.roomId);
  if (!room) return;
  
  // 找到目标用户
  const targetClient = Array.from(room).find(client => client.peerId === data.target);
  if (targetClient && targetClient.readyState === 1) {
    targetClient.send(JSON.stringify({
      type: 'mic-denied'
    }));
  }
}

function handleUserStreamUpdated(ws, data) {
  if (!ws.roomId) return;
  
  console.log(`📺 ${ws.peerId} 更新流状态: 音频:${data.hasAudio}, 视频:${data.hasVideo}`);
  
  // 广播给房间内其他用户
  broadcastToRoom(ws.roomId, {
    type: 'user-stream-updated',
    peerId: ws.peerId,
    hasAudio: data.hasAudio,
    hasVideo: data.hasVideo
  }, ws);
}

// 处理心跳消息
function handleHeartbeat(ws, data) {
  // 心跳消息不需要特殊处理，只是确认连接正常
  // 如果需要，可以在这里添加心跳超时逻辑
  console.log(`💓 收到心跳消息 from ${ws.peerId}`);
}

// 定期清理无效连接
setInterval(() => {
  wss.clients.forEach(ws => {
    if (ws.readyState !== 1) { // WebSocket.OPEN = 1
      handleDisconnect(ws);
    }
  });
}, 30000);

// 启动服务器
const PORT = process.env.PORT || 3002;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 WebSocket信令服务器运行在端口 ${PORT}`);
  console.log(`📡 WebSocket端点: ws://localhost:${PORT}`);
  console.log(`🌐 支持跨域访问`);
  console.log(`⏰ 服务启动时间: ${new Date().toLocaleString()}`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('🛑 正在关闭服务器...');
  wss.close(() => {
    server.close(() => {
      console.log('✅ 服务器已关闭');
      process.exit(0);
    });
  });
}); 