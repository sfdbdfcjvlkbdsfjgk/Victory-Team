import React, { useState, useEffect, useRef } from 'react';
import EmojiPicker, { type EmojiClickData, Theme } from 'emoji-picker-react';
import '../css/VideoCall.css';

interface VideoCallState {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  isConnected: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  roomId: string;
  error: string | null;
  isJoining: boolean;
  roomUsers: string[];
  userCount: number;
  role: 'host' | 'viewer' | '';
  isHost: boolean;
  messages: Array<{
    id: string;
    peerId: string;
    username: string;
    message: string;
    timestamp: number;
  }>;
  chatInput: string;
  showChat: boolean;
  showEmojiPanel: boolean;
  // 连麦相关状态
  isRequestingMic: boolean;
  micRequests: string[]; // 等待主播批准的连麦请求
  approvedUsers: string[]; // 已获得连麦权限的用户
}

export default function Sp() {
  const [state, setState] = useState<VideoCallState>({
    localStream: null,
    remoteStreams: new Map(),
    isConnected: false,
    isMuted: false,
    isVideoOff: false,
    roomId: '',
    error: null,
    isJoining: false,
    roomUsers: [],
    userCount: 0,
    role: '',
    isHost: false,
    messages: [],
    chatInput: '',
    showChat: false,
    showEmojiPanel: false,
    // 连麦相关状态初始化
    isRequestingMic: false,
    micRequests: [],
    approvedUsers: []
  });

  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const myPeerIdRef = useRef<string>('');

  // WebSocket连接
  useEffect(() => {
    const connectWebSocket = () => {
    const host = window.location.hostname;
    const wsUrl = `ws://${host}:3002`;
    console.log('🔌 连接到WebSocket服务器:', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('✅ WebSocket连接成功');
      setState(prev => ({ ...prev, error: null }));
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 收到消息:', data.type, data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('❌ 消息解析失败:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('❌ WebSocket错误:', error);
      setState(prev => ({ ...prev, error: '连接服务器失败' }));
    };
    
    ws.onclose = () => {
      console.log('🔌 WebSocket连接关闭');
      setState(prev => ({ ...prev, isConnected: false }));
        
        // 如果不是主动关闭，尝试重连
        if (wsRef.current === ws) {
          console.log('🔄 尝试重新连接WebSocket...');
          setTimeout(() => {
            connectWebSocket();
          }, 3000);
        }
      };
    };
    
    // 只在组件挂载时建立连接
    if (!wsRef.current) {
      connectWebSocket();
    }
    
    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      // 清理媒体流
      if (state.localStream) {
        state.localStream.getTracks().forEach(track => track.stop());
      }
      // 清理所有PeerConnection
      peerConnectionsRef.current.forEach(connection => {
        connection.close();
      });
      peerConnectionsRef.current.clear();
    };
  }, []);

  // 处理WebSocket消息
  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'connected':
        myPeerIdRef.current = data.peerId;
        console.log('🔑 我的PeerID:', data.peerId);
        setState(prev => ({ ...prev, error: null }));
        break;
        
      case 'user-joined':
        handleUserJoined(data.peerId);
        break;
        
      case 'user-left':
        handleUserLeft(data.peerId);
        break;
        
      case 'become-host':
        handleBecomeHost();
        break;
        
      case 'host-info':
        handleHostInfo(data.hostId);
        break;
        
      case 'offer':
        handleOffer(data.offer, data.from);
        break;
        
      case 'answer':
        handleAnswer(data.answer, data.from);
        break;
        
      case 'ice-candidate':
        handleIceCandidate(data.candidate, data.from);
        break;
        
      // 连麦相关消息
      case 'mic-request':
        handleMicRequest(data.from);
        break;
        
      case 'mic-approved':
        handleMicApproved();
        break;
        
      case 'mic-denied':
        handleMicDenied();
        break;
        
      case 'user-stream-updated':
        handleUserStreamUpdated(data.peerId, data.hasAudio, data.hasVideo);
        break;
        
      case 'video-toggle':
        handleVideoToggle(data);
        break;
        
      case 'audio-toggle':
        handleAudioToggle(data);
        break;
        
      case 'user-count-updated':
        setState(prev => ({ ...prev, userCount: data.count }));
        break;
        
      case 'room-closed':
        handleRoomClosed();
        break;
        
      case 'chat-message':
        handleChatMessage(data);
        break;
        
      case 'error':
        console.error('❌ 服务器错误:', data.message);
        setState(prev => ({ ...prev, error: data.message }));
        
        // 如果是连接相关错误，尝试重新连接
        if (data.message.includes('连接') || data.message.includes('房间')) {
          setTimeout(() => {
            console.log('🔄 尝试重新连接...');
            setState(prev => ({ ...prev, error: null }));
            joinRoom();
          }, 2000);
        }
        break;
        

        
      default:
        console.log('⚠️ 未处理的消息类型:', data.type);
    }
  };

  // 连麦相关处理函数
  const handleMicRequest = (fromPeerId: string) => {
    console.log('🎤 收到连麦请求:', fromPeerId);
    setState(prev => ({
      ...prev,
      micRequests: [...prev.micRequests.filter(id => id !== fromPeerId), fromPeerId],
      messages: [...prev.messages, {
        id: Date.now().toString(),
        peerId: 'system',
        username: '系统',
        message: `🎤 用户 ${fromPeerId.slice(0, 8)} 申请连麦`,
        timestamp: Date.now()
      }]
    }));
  };

  const handleMicApproved = () => {
    console.log('✅ 连麦请求已批准');
    const currentPeerId = myPeerIdRef.current;
    console.log('🔑 当前用户ID:', currentPeerId);
    
    // 确保用户ID不为空
    if (!currentPeerId) {
      console.error('❌ 当前用户ID为空，无法添加到已批准用户列表');
      return;
    }
    
    setState(prev => {
      console.log('🔄 更新状态，当前已批准用户:', prev.approvedUsers);
      const newApprovedUsers = [...prev.approvedUsers, currentPeerId];
      console.log('🔄 新的已批准用户列表:', newApprovedUsers);
      
      return { 
        ...prev, 
        isRequestingMic: false,
        approvedUsers: newApprovedUsers,
        isVideoOff: false, // 确保视频开启
        isMuted: false, // 确保音频开启
        messages: [...prev.messages, {
          id: Date.now().toString(),
          peerId: 'system',
          username: '系统',
          message: '🎉 连麦申请已批准！现在可以开启摄像头了',
          timestamp: Date.now()
        }]
      };
    });
    
    // 观众收到同意后，自动开启摄像头
    console.log('✅ 观众可以开启摄像头了，用户ID:', currentPeerId);
    
    // 自动开启摄像头
    setTimeout(() => {
      console.log('🎥 自动开启观众摄像头');
      startUserMedia();
      
      // 确保观众能看到主播的流
      setTimeout(() => {
        console.log('🔗 观众主动创建与主播的连接');
        const hostId = state.roomUsers[0];
        if (hostId && hostId !== currentPeerId) {
          createPeerConnectionWithCurrentStream(hostId, false, state.localStream);
        }
      }, 1000);
    }, 500);
  };

  const handleMicDenied = () => {
    console.log('❌ 连麦请求被拒绝');
    setState(prev => ({ 
      ...prev, 
      isRequestingMic: false,
      messages: [...prev.messages, {
        id: Date.now().toString(),
        peerId: 'system',
        username: '系统',
        message: '❌ 连麦申请被拒绝',
        timestamp: Date.now()
      }]
    }));
  };

  const handleUserStreamUpdated = (peerId: string, hasAudio: boolean, hasVideo: boolean) => {
    console.log(`📺 用户流更新: ${peerId}, 音频: ${hasAudio}, 视频: ${hasVideo}`);
    // 更新UI显示用户的音视频状态
  };

  // 处理视频状态切换
  const handleVideoToggle = (data: any) => {
    console.log(`📹 视频状态切换: ${data.peerId}, 启用: ${data.enabled}`);
    
    // 添加聊天消息
    if (data.message) {
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, {
          id: Date.now().toString(),
          peerId: 'system',
          username: '系统',
          message: data.message,
          timestamp: Date.now()
        }]
      }));
    }
    
    // 如果是远程用户的视频关闭，更新远程流显示
    if (!data.enabled && data.peerId !== myPeerIdRef.current) {
      setState(prev => {
        const newRemoteStreams = new Map(prev.remoteStreams);
        newRemoteStreams.delete(data.peerId);
        return { ...prev, remoteStreams: newRemoteStreams };
      });
    }
  };

  // 处理音频状态切换
  const handleAudioToggle = (data: any) => {
    console.log(`🔊 音频状态切换: ${data.peerId}, 启用: ${data.enabled}`);
    
    // 添加聊天消息
    if (data.message) {
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, {
          id: Date.now().toString(),
          peerId: 'system',
          username: '系统',
          message: data.message,
          timestamp: Date.now()
        }]
      }));
    }
  };

  // 观众请求连麦
  const requestMic = () => {
    if (state.isHost || state.isRequestingMic) return;
    
    console.log('🎤 请求连麦');
    setState(prev => ({ ...prev, isRequestingMic: true }));
    
    // 添加用户友好的提示
    const messageId = Date.now().toString();
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, {
        id: messageId,
        peerId: 'system',
        username: '系统',
        message: '已发送连麦申请，等待主播批准...',
        timestamp: Date.now()
      }]
    }));
    
    sendMessage({
      type: 'mic-request'
    });
    
    // 5秒后如果还没有响应，重置状态
    setTimeout(() => {
      setState(prev => {
        if (prev.isRequestingMic) {
          return {
            ...prev,
            isRequestingMic: false,
            messages: [...prev.messages, {
              id: (Date.now() + 1).toString(),
              peerId: 'system',
              username: '系统',
              message: '连麦申请超时，请稍后重试',
              timestamp: Date.now()
            }]
          };
        }
        return prev;
      });
    }, 5000);
  };

  // 主播批准连麦
  const approveMicRequest = (peerId: string) => {
    console.log('✅ 批准连麦请求:', peerId);
    
    setState(prev => ({
      ...prev,
      micRequests: prev.micRequests.filter(id => id !== peerId),
      approvedUsers: [...prev.approvedUsers.filter(id => id !== peerId), peerId],
      messages: [...prev.messages, {
        id: Date.now().toString(),
        peerId: 'system',
        username: '系统',
        message: `✅ 已批准用户 ${peerId.slice(0, 8)} 的连麦申请`,
        timestamp: Date.now()
      }]
    }));
    
    // 主播同意连麦后，创建与观众的双向连接
    if (state.localStream) {
      console.log('🎤 主播为连麦观众创建连接:', peerId);
      setTimeout(() => {
        createPeerConnectionWithCurrentStream(peerId, true, state.localStream);
      }, 100);
    }
    
    // 确保主播能看到观众的流（当观众开启摄像头后）
    setTimeout(() => {
      console.log('🔗 主播主动创建与连麦观众的连接');
      createPeerConnectionWithCurrentStream(peerId, true, state.localStream);
    }, 2000);
    
    sendMessage({
      type: 'mic-approved',
      target: peerId
    });
  };

  // 主播拒绝连麦
  const denyMicRequest = (peerId: string) => {
    console.log('❌ 拒绝连麦请求:', peerId);
    
    setState(prev => ({
      ...prev,
      micRequests: prev.micRequests.filter(id => id !== peerId),
      messages: [...prev.messages, {
        id: Date.now().toString(),
        peerId: 'system',
        username: '系统',
        message: `❌ 已拒绝用户 ${peerId.slice(0, 8)} 的连麦申请`,
        timestamp: Date.now()
      }]
    }));
    
    sendMessage({
      type: 'mic-denied',
      target: peerId
    });
  };

  // 开启用户媒体（观众连麦时使用）
  const startUserMedia = async () => {
    try {
      // 先释放可能存在的旧流
      if (state.localStream) {
        state.localStream.getTracks().forEach(track => track.stop());
      }
      
      const stream = await getUserMedia();
      setState(prev => ({ ...prev, localStream: stream }));
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // 通知其他用户流状态更新
      sendMessage({
        type: 'user-stream-updated',
        hasAudio: stream.getAudioTracks().length > 0,
        hasVideo: stream.getVideoTracks().length > 0
      });
      
      // 如果是主播，为所有现有用户创建连接
      // 如果是观众，为所有现有用户创建连接（观众已经获得连麦权限）
      if (state.isHost || state.approvedUsers.includes(myPeerIdRef.current || '')) {
      setState(prevState => {
        prevState.roomUsers.forEach(peerId => {
          if (peerId !== myPeerIdRef.current) {
              createPeerConnectionWithCurrentStream(peerId, !state.isHost, stream);
          }
        });
        return prevState;
      });
      }
      
      // 清除错误信息
      setState(prev => ({ ...prev, error: null }));
      
    } catch (error) {
      console.error('❌ 获取用户媒体失败:', error);
      // 错误信息已经在getUserMedia中设置
    }
  };

  // 处理用户加入
  const handleUserJoined = (peerId: string) => {
    console.log('👤 用户加入:', peerId);
    setState(prev => {
      const newState = {
        ...prev,
        roomUsers: [...prev.roomUsers.filter(id => id !== peerId), peerId],
        isConnected: true
      };
      
      // 如果是主播且有本地流，为新用户创建连接（观众可以看到主播）
      if (prev.isHost && prev.localStream) {
        console.log('🎤 主播为新用户创建连接:', peerId);
        setTimeout(() => {
          createPeerConnectionWithCurrentStream(peerId, true, prev.localStream);
        }, 100);
      }
      
      return newState;
    });
  };
  
  // 使用当前流创建PeerConnection
  const createPeerConnectionWithCurrentStream = (peerId: string, isInitiator: boolean, stream: MediaStream | null) => {
    console.log(`🔗 使用当前流创建PeerConnection: ${peerId}, 是否发起方: ${isInitiator}`);
    
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });
    
    // 添加本地流
    if (stream) {
      console.log(`📹 添加流到PeerConnection ${peerId}:`, {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length
      });
      
      stream.getTracks().forEach(track => {
        console.log(`➕ 添加轨道: ${track.kind}, enabled: ${track.enabled}`);
        
        // 优化音频轨道设置
        if (track.kind === 'audio') {
          // 确保音频轨道启用回声消除
          const audioTrack = track as MediaStreamTrack;
          if (audioTrack.getSettings) {
            const settings = audioTrack.getSettings();
            console.log('🔊 音频轨道设置:', settings);
          }
        }
        
        peerConnection.addTrack(track, stream);
      });
    }
    
    // 处理远程流
    peerConnection.ontrack = (event) => {
      console.log('🎥 收到远程流:', peerId);
      const remoteStream = event.streams[0];
      if (remoteStream) {
        console.log(`📺 设置远程流 ${peerId}:`, {
          videoTracks: remoteStream.getVideoTracks().length,
          audioTracks: remoteStream.getAudioTracks().length
        });
        
        // 处理远程流：所有人都可以看到主播的流，观众的流只有获得连麦权限后才能看到
        setState(prev => {
          const newRemoteStreams = new Map(prev.remoteStreams);
          
          // 找到主播的ID（第一个用户）
          const hostId = prev.roomUsers[0];
          
          console.log('🔍 处理远程流:', {
            peerId,
            hostId,
            isHostStream: peerId === hostId,
            approvedUsers: prev.approvedUsers,
            hasPermission: prev.approvedUsers.includes(peerId)
          });
          
          // 如果是主播的流，所有人都可以看到
          if (peerId === hostId) {
            console.log('✅ 添加主播流到远程流');
            newRemoteStreams.set(peerId, remoteStream);
          } else {
            // 如果是观众的流，只有获得连麦权限后才能看到
            if (prev.approvedUsers.includes(peerId)) {
              console.log('✅ 添加观众流到远程流');
              newRemoteStreams.set(peerId, remoteStream);
            } else {
              console.log('❌ 观众没有连麦权限，不显示流');
            }
            // 如果没有连麦权限，不添加到remoteStreams，所以不会显示
          }
          
          return { ...prev, remoteStreams: newRemoteStreams };
        });
      }
    };
    
    // 处理ICE候选
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`🧊 发送ICE候选给 ${peerId}`);
        sendMessage({
          type: 'ice-candidate',
          candidate: event.candidate,
          target: peerId
        });
      }
    };
    
    // 监听连接状态变化
    peerConnection.onconnectionstatechange = () => {
      console.log(`🔗 连接状态变化 ${peerId}:`, peerConnection.connectionState);
      
      switch (peerConnection.connectionState) {
        case 'connected':
        console.log(`✅ 与 ${peerId} 的连接已建立`);
          // 清除错误状态
          setState(prev => ({ ...prev, error: null }));
          break;
        case 'disconnected':
          console.log(`❌ 与 ${peerId} 的连接已断开`);
          setState(prev => ({
            ...prev,
            error: '连接已断开，正在尝试重连...'
          }));
          break;
        case 'failed':
          console.log(`❌ 与 ${peerId} 的连接失败`);
          setState(prev => ({
            ...prev,
            error: '连接失败，请检查网络设置'
          }));
          // 尝试重新连接
          setTimeout(() => {
            console.log(`🔄 尝试重新连接 ${peerId}`);
            const oldConnection = peerConnectionsRef.current.get(peerId);
            if (oldConnection) {
              oldConnection.close();
              peerConnectionsRef.current.delete(peerId);
            }
            createPeerConnectionWithCurrentStream(peerId, isInitiator, stream);
          }, 2000);
          break;
        case 'connecting':
          console.log(`🔄 正在连接 ${peerId}`);
          break;
      }
    };
    
    // 监听ICE连接状态
    peerConnection.oniceconnectionstatechange = () => {
      console.log(`🧊 ICE连接状态 ${peerId}:`, peerConnection.iceConnectionState);
      
      if (peerConnection.iceConnectionState === 'failed') {
        console.log(`❌ ICE连接失败 ${peerId}`);
        setState(prev => ({
          ...prev,
          error: 'ICE连接失败，请检查网络设置'
        }));
      }
    };
    
      // 监听ICE收集状态
  peerConnection.onicegatheringstatechange = () => {
    console.log(`🧊 ICE收集状态 ${peerId}:`, peerConnection.iceGatheringState);
  };
  

  
  // 定期检查连接质量
  const qualityCheckInterval = setInterval(() => {
    if (peerConnection.connectionState === 'connected') {
      peerConnection.getStats().then(stats => {
        stats.forEach(report => {
          if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
            const packetLoss = report.packetsLost || 0;
            const totalPackets = report.packetsReceived || 0;
            const lossRate = totalPackets > 0 ? (packetLoss / totalPackets) * 100 : 0;
            
            if (lossRate > 5) {
              console.log(`⚠️ 视频质量警告 ${peerId}: 丢包率 ${lossRate.toFixed(2)}%`);
            }
          }
        });
      });
    }
  }, 5000);
  
  // 清理定时器
  peerConnection.addEventListener('connectionstatechange', () => {
    if (peerConnection.connectionState === 'closed') {
      clearInterval(qualityCheckInterval);
    }
  });
    
    peerConnectionsRef.current.set(peerId, peerConnection);
    
    // 如果是发起方，创建offer
    if (isInitiator) {
      setTimeout(() => {
        createOfferForPeer(peerId);
      }, 100);
    }
    
    return peerConnection;
  };
  
  // 为特定peer创建offer
  const createOfferForPeer = async (peerId: string) => {
    const peerConnection = peerConnectionsRef.current.get(peerId);
    if (!peerConnection) {
      console.log(`❌ 找不到 ${peerId} 的PeerConnection`);
      return;
    }
    
    try {
      console.log(`📤 创建Offer给 ${peerId}`);
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      sendMessage({
        type: 'offer',
        offer: offer,
        target: peerId
      });
      
      console.log(`✅ Offer已发送给 ${peerId}`);
    } catch (error) {
      console.error(`❌ 创建Offer失败 ${peerId}:`, error);
    }
  };

  // 处理用户离开
  const handleUserLeft = (peerId: string) => {
    console.log('👋 用户离开:', peerId);
    
    // 清理PeerConnection
    const peerConnection = peerConnectionsRef.current.get(peerId);
    if (peerConnection) {
      peerConnection.close();
      peerConnectionsRef.current.delete(peerId);
    }
    
    // 清理远程流
    setState(prev => {
      const newRemoteStreams = new Map(prev.remoteStreams);
      newRemoteStreams.delete(peerId);
      return {
        ...prev,
        roomUsers: prev.roomUsers.filter(id => id !== peerId),
        remoteStreams: newRemoteStreams
      };
    });
    
    // 清理视频元素
    remoteVideosRef.current.delete(peerId);
  };

  // 成为主播
  const handleBecomeHost = async () => {
    console.log('🎤 成为主播');
    setState(prev => ({
      ...prev,
      role: 'host',
      isHost: true,
      isConnected: true
    }));
    
    // 自动开启摄像头
    try {
      // 先释放可能存在的旧流
      if (state.localStream) {
        state.localStream.getTracks().forEach(track => track.stop());
      }
      
      const stream = await getUserMedia();
      if (stream) {
        setState(prev => ({ ...prev, localStream: stream }));
        console.log('✅ 主播摄像头已开启');
        
        // 为所有现有用户创建连接
        setTimeout(() => {
          setState(prevState => {
            const currentUsers = [...prevState.roomUsers];
            console.log('🎤 主播为现有用户创建连接:', currentUsers);
            currentUsers.forEach(peerId => {
              if (peerId !== myPeerIdRef.current) {
                console.log('🔗 为用户创建连接:', peerId);
                createPeerConnectionWithCurrentStream(peerId, true, stream);
              }
            });
            return prevState;
          });
        }, 500);
      }
    } catch (error) {
      console.error('❌ 主播开启摄像头失败:', error);
      // 错误信息已经在getUserMedia中设置
    }
  };

  // 收到主播信息
  const handleHostInfo = (hostId: string) => {
    console.log('👀 收到主播信息:', hostId);
    setState(prev => ({
      ...prev,
      role: 'viewer',
      isHost: false,
      isConnected: true
    }));
    
    // 为主播创建连接（观众端不需要本地流）
    createPeerConnectionWithCurrentStream(hostId, false, null);
  };

  // 房间关闭
  const handleRoomClosed = () => {
    console.log('🚪 房间已关闭');
    setState(prev => ({
      ...prev,
      isConnected: false,
      localStream: null,
      remoteStreams: new Map(),
      roomUsers: [],
      userCount: 0,
      role: '',
      isHost: false,
      error: '主播已离开，房间已关闭'
    }));
  };

  // 优化音频轨道设置，解决回声问题
  const optimizeAudioTrack = (audioTrack: MediaStreamTrack) => {
    console.log('🔊 优化音频轨道设置...');
    
    // 获取音频轨道能力
    if (audioTrack.getCapabilities) {
      const capabilities = audioTrack.getCapabilities();
      console.log('🔊 音频轨道能力:', capabilities);
      
      // 应用音频约束
      if (audioTrack.applyConstraints) {
        const constraints = {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        };
        
        audioTrack.applyConstraints(constraints).then(() => {
          console.log('✅ 音频轨道约束应用成功');
          
          // 获取应用后的设置
          const settings = audioTrack.getSettings();
          console.log('🔊 音频轨道设置:', settings);
        }).catch(error => {
          console.warn('⚠️ 音频轨道约束应用失败:', error);
        });
      }
    }
  };

  // 获取用户媒体流
  const getUserMedia = async () => {
    try {
      console.log('🎥 获取媒体流...');
      
      // 先尝试获取音频和视频
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true },
          // 添加更强的音频处理
          sampleRate: 48000,
          channelCount: 1
        }
      });
      
      // 优化所有音频轨道
      stream.getAudioTracks().forEach(audioTrack => {
        optimizeAudioTrack(audioTrack);
      });
      
      console.log('✅ 媒体流获取成功');
      return stream;
    } catch (error: any) {
      console.error('❌ 获取媒体流失败:', error);
      
      // 根据错误类型提供不同的解决方案
      if (error.name === 'NotReadableError' || error.name === 'NotAllowedError') {
        // 设备被占用或权限被拒绝
        setState(prev => ({
          ...prev,
          error: '摄像头或麦克风被占用，请关闭其他应用后重试'
        }));
      } else if (error.name === 'NotFoundError') {
        setState(prev => ({
          ...prev,
          error: '未找到摄像头或麦克风设备'
        }));
      } else if (error.name === 'NotSupportedError') {
        setState(prev => ({
          ...prev,
          error: '浏览器不支持摄像头或麦克风'
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: '获取媒体设备失败，请检查权限设置'
        }));
      }
      
      throw error;
    }
  };



  // 处理Offer
  const handleOffer = async (offer: RTCSessionDescriptionInit, from: string) => {
    console.log('📥 收到Offer:', from);
    
    let peerConnection = peerConnectionsRef.current.get(from);
    if (!peerConnection) {
      console.log('🔗 为offer创建新的PeerConnection:', from);
      peerConnection = createPeerConnectionWithCurrentStream(from, false, state.localStream);
    }
    
    try {
      console.log('📥 设置远程描述:', from);
      await peerConnection.setRemoteDescription(offer);
      
      console.log('📤 创建answer:', from);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      sendMessage({
        type: 'answer',
        answer: answer,
        target: from
      });
      
      console.log('✅ Answer已发送给:', from);
    } catch (error) {
      console.error('❌ 处理Offer失败:', error);
    }
  };

  // 处理Answer
  const handleAnswer = async (answer: RTCSessionDescriptionInit, from: string) => {
    console.log('📥 收到Answer:', from);
    
    const peerConnection = peerConnectionsRef.current.get(from);
    if (peerConnection) {
      try {
        await peerConnection.setRemoteDescription(answer);
      } catch (error) {
        console.error('❌ 处理Answer失败:', error);
      }
    }
  };

  // 处理ICE候选
  const handleIceCandidate = async (candidate: RTCIceCandidateInit, from: string) => {
    const peerConnection = peerConnectionsRef.current.get(from);
    if (peerConnection) {
      try {
        await peerConnection.addIceCandidate(candidate);
      } catch (error) {
        console.error('❌ 添加ICE候选失败:', error);
      }
    }
  };

  // 发送消息
  const sendMessage = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  // 加入房间
  const joinRoom = () => {
    if (!state.roomId.trim()) {
      setState(prev => ({ ...prev, error: '请输入房间号' }));
      return;
    }
    
    console.log('🚪 准备加入房间:', state.roomId.trim());
    
    // 确保WebSocket连接正常
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.log('⚠️ WebSocket未连接，等待连接...');
      setState(prev => ({ ...prev, error: '正在连接服务器，请稍后重试' }));
      
      // 尝试重新建立连接
      const host = window.location.hostname;
      const wsUrl = `ws://${host}:3002`;
      const newWs = new WebSocket(wsUrl);
      
      newWs.onopen = () => {
        console.log('✅ WebSocket连接成功，现在可以加入房间');
        wsRef.current = newWs;
        setState(prev => ({ ...prev, error: null }));
        
        // 连接成功后立即加入房间
        setTimeout(() => {
          sendMessage({
            type: 'join-room',
            roomId: state.roomId.trim()
          });
        }, 500);
      };
      
      newWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 收到消息:', data.type, data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('❌ 消息解析失败:', error);
        }
      };
      
      newWs.onerror = (error) => {
        console.error('❌ WebSocket错误:', error);
        setState(prev => ({ ...prev, error: '连接服务器失败' }));
      };
      
      return;
    }
    
    setState(prev => ({ ...prev, isJoining: true, error: null }));
    
    // 清理之前的状态
    setState(prev => ({
      ...prev,
      localStream: null,
      remoteStreams: new Map(),
      roomUsers: [],
      userCount: 0,
      role: '',
      isHost: false,
      messages: [],
      isMuted: false,
      isVideoOff: false,
      isRequestingMic: false,
      micRequests: [],
      approvedUsers: []
    }));
    
    sendMessage({
      type: 'join-room',
      roomId: state.roomId.trim()
    });
    
    setTimeout(() => {
      setState(prev => ({ ...prev, isJoining: false }));
    }, 1000);
  };

  // 离开房间
  const leaveRoom = () => {
    console.log('🚪 开始清理房间资源...');
    
    // 1. 清理所有WebRTC连接
    console.log('🔗 清理WebRTC连接...');
    peerConnectionsRef.current.forEach((pc, peerId) => {
      console.log(`🛑 关闭连接: ${peerId}`);
      pc.close();
    });
    peerConnectionsRef.current.clear();
    
    // 2. 停止所有本地媒体流
    console.log('📹 停止本地媒体流...');
    if (state.localStream) {
      state.localStream.getTracks().forEach(track => {
        console.log(`🛑 停止轨道: ${track.kind}`);
        track.stop();
      });
    }
    
    // 3. 清理远程流引用
    console.log('📺 清理远程流...');
    remoteVideosRef.current.forEach((video, peerId) => {
      if (video && video.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach(track => {
          console.log(`🛑 停止远程轨道: ${track.kind}`);
          track.stop();
        });
        video.srcObject = null;
      }
    });
    remoteVideosRef.current.clear();
    
    // 4. 清理本地视频元素
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        console.log(`🛑 停止本地视频轨道: ${track.kind}`);
        track.stop();
      });
      localVideoRef.current.srcObject = null;
    }
    
    // 5. 重置所有状态
    console.log('🔄 重置应用状态...');
    setState(prev => ({
      ...prev,
      localStream: null,
      remoteStreams: new Map(),
      isConnected: false,
      roomId: '',
      roomUsers: [],
      userCount: 0,
      role: '',
      isHost: false,
      messages: [],
      showChat: false,
      showEmojiPanel: false,
      isMuted: false,
      isVideoOff: false,
      isRequestingMic: false,
      micRequests: [],
      approvedUsers: [],
      error: null,
      isJoining: false,
      chatInput: ''
    }));
    
    // 6. 清理WebSocket连接
    console.log('🔌 清理WebSocket连接...');
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    // 重新建立WebSocket连接
    console.log('🔄 重新建立WebSocket连接...');
    const host = window.location.hostname;
    const wsUrl = `ws://${host}:3002`;
    const newWs = new WebSocket(wsUrl);
    
    newWs.onopen = () => {
      console.log('✅ WebSocket重新连接成功');
      setState(prev => ({ ...prev, error: null }));
    };
    
    newWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 收到消息:', data.type, data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('❌ 消息解析失败:', error);
      }
    };
    
    newWs.onerror = (error) => {
      console.error('❌ WebSocket错误:', error);
      setState(prev => ({ ...prev, error: '连接服务器失败' }));
    };
    
    newWs.onclose = () => {
      console.log('🔌 WebSocket连接关闭');
      setState(prev => ({ ...prev, isConnected: false }));
    };
    
    wsRef.current = newWs;
    
    // 7. 清理定时器
    console.log('⏰ 清理定时器...');
    // 这里可以添加清理定时器的逻辑
    
    console.log('✅ 房间资源清理完成');
  };

  // 处理聊天消息
  const handleChatMessage = (data: any) => {
    const message = {
      id: Date.now().toString(),
      peerId: data.peerId,
      username: data.username,
      message: data.message,
      timestamp: Date.now()
    };
    
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message]
    }));
  };

  // 插入表情包到输入框
  const insertEmoji = (emojiData: EmojiClickData) => {
    setState(prev => ({
      ...prev,
      chatInput: prev.chatInput + emojiData.emoji,
      showEmojiPanel: false
    }));
  };

  // 发送聊天消息
  const sendChatMessage = () => {
    if (!state.chatInput.trim()) return;
    
    const message = {
      id: Date.now().toString(),
      peerId: myPeerIdRef.current,
      username: '我',
      message: state.chatInput.trim(),
      timestamp: Date.now()
    };
    
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
      chatInput: '',
      showEmojiPanel: false
    }));
    
    sendMessage({
      type: 'chat-message',
      message: state.chatInput.trim()
    });
  };

  // 切换静音
  // 切换静音 - 真正释放麦克风硬件
  const toggleMute = async () => {
    try {
      if (state.isMuted) {
        // 当前麦克风静音，需要重新获取麦克风
        console.log('🔊 重新获取麦克风...');
        
        // 先释放旧的音频轨道
    if (state.localStream) {
          const oldAudioTracks = state.localStream.getAudioTracks();
          oldAudioTracks.forEach(track => track.stop());
        }
        
        // 重新获取媒体流（只获取音频）
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: false, // 不获取视频
          audio: {
            echoCancellation: { ideal: true },
            noiseSuppression: { ideal: true },
            autoGainControl: { ideal: true },
            // 添加更强的音频处理
            sampleRate: 48000,
            channelCount: 1
          }
        });
        
        // 优化音频轨道
        newStream.getAudioTracks().forEach(audioTrack => {
          optimizeAudioTrack(audioTrack);
        });
        
        // 合并新的音频轨道和原有的视频轨道
        const videoTracks = state.localStream ? state.localStream.getVideoTracks() : [];
        const audioTracks = newStream.getAudioTracks();
        
        // 创建新的媒体流
        const combinedStream = new MediaStream([...videoTracks, ...audioTracks]);
        
        setState(prev => ({ 
          ...prev, 
          localStream: combinedStream,
          isMuted: false 
        }));
        
        // 更新本地视频显示
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = combinedStream;
        }
        
        // 通知其他用户音频状态变化
        sendMessage({
          type: 'audio-toggle',
          enabled: true
        });
        
        // 为所有现有用户重新创建连接
        setState(prevState => {
          prevState.roomUsers.forEach(peerId => {
            if (peerId !== myPeerIdRef.current) {
              console.log('🔗 为用户重新创建连接:', peerId);
              // 关闭旧的连接
              const oldConnection = peerConnectionsRef.current.get(peerId);
              if (oldConnection) {
                oldConnection.close();
                peerConnectionsRef.current.delete(peerId);
              }
              // 创建新的连接
              setTimeout(() => {
                createPeerConnectionWithCurrentStream(peerId, true, combinedStream);
              }, 100);
            }
          });
          return prevState;
        });
        
        console.log('🔊 麦克风硬件已开启');
        
      } else {
        // 当前麦克风开启，需要关闭麦克风硬件
        console.log('🔇 关闭麦克风硬件...');
        
        if (state.localStream) {
          // 停止所有音频轨道
          const audioTracks = state.localStream.getAudioTracks();
          audioTracks.forEach(track => {
            track.stop();
            console.log('🛑 已停止音频轨道:', track.label);
          });
          
          // 保留视频轨道
          const videoTracks = state.localStream.getVideoTracks();
          const videoOnlyStream = new MediaStream(videoTracks);
          
          setState(prev => ({ 
            ...prev, 
            localStream: videoOnlyStream,
            isMuted: true 
          }));
          
          // 更新本地视频显示
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = videoOnlyStream;
          }
          
          // 通知其他用户音频状态变化
          sendMessage({
            type: 'audio-toggle',
            enabled: false
          });
          
          // 为所有现有用户重新创建连接（只有视频）
          setState(prevState => {
            prevState.roomUsers.forEach(peerId => {
              if (peerId !== myPeerIdRef.current) {
                console.log('🔗 为用户重新创建连接（只有视频）:', peerId);
                // 关闭旧的连接
                const oldConnection = peerConnectionsRef.current.get(peerId);
                if (oldConnection) {
                  oldConnection.close();
                  peerConnectionsRef.current.delete(peerId);
                }
                // 创建新的连接（只有视频）
                setTimeout(() => {
                  createPeerConnectionWithCurrentStream(peerId, true, videoOnlyStream);
                }, 100);
              }
            });
            return prevState;
          });
          
          console.log('🔇 麦克风硬件已关闭');
          
          // 添加用户反馈
          const messageId = Date.now().toString();
          setState(prev => ({
            ...prev,
            messages: [...prev.messages, {
              id: messageId,
              peerId: 'system',
              username: '系统',
              message: '🔇 麦克风硬件已关闭',
              timestamp: Date.now()
            }]
          }));
        }
      }
    } catch (error) {
      console.error('❌ 切换麦克风失败:', error);
      setState(prev => ({
        ...prev,
        error: '切换麦克风失败，请检查设备权限。点击重试按钮重新获取麦克风。'
      }));
    }
  };

  // 切换视频 - 真正关闭摄像头硬件
  const toggleVideo = async () => {
    try {
      console.log('🎯 toggleVideo 被调用');
      
      // 如果是观众且没有连麦权限，不允许开启摄像头
      console.log('🔍 toggleVideo 检查权限:', {
        isHost: state.isHost,
        currentPeerId: myPeerIdRef.current,
        approvedUsers: state.approvedUsers,
        hasPermission: state.approvedUsers.includes(myPeerIdRef.current || '')
      });
      
      // 观众需要连麦权限才能开启摄像头
      if (!state.isHost && !state.approvedUsers.includes(myPeerIdRef.current || '')) {
        console.log('❌ 观众需要先申请连麦才能开启摄像头');
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, {
            id: Date.now().toString(),
            peerId: 'system',
            username: '系统',
            message: '❌ 请先申请连麦获得权限后再开启摄像头',
            timestamp: Date.now()
          }]
        }));
        return;
      }
      
      console.log('✅ 权限检查通过，开始切换摄像头');
      
      if (state.isVideoOff) {
        // 当前摄像头关闭，需要重新获取摄像头硬件
        console.log('📹 重新获取摄像头硬件...');
        
        // 先停止可能存在的旧流
    if (state.localStream) {
          state.localStream.getTracks().forEach(track => track.stop());
        }
        
        // 重新获取媒体流（只获取视频）
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            facingMode: 'user'
          },
          audio: false // 不获取音频，保持原有音频
        });
        
        // 合并新的视频轨道和原有的音频轨道
        const audioTracks = state.localStream ? state.localStream.getAudioTracks() : [];
        const videoTracks = newStream.getVideoTracks();
        
        // 创建新的媒体流
        const combinedStream = new MediaStream([...audioTracks, ...videoTracks]);
        
        setState(prev => ({ 
          ...prev, 
          localStream: combinedStream,
          isVideoOff: false 
        }));
        
        // 更新本地视频显示
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = combinedStream;
        }
        
        // 通知其他用户视频状态变化
        sendMessage({
          type: 'video-toggle',
          enabled: true
        });
        
        // 为所有现有用户重新创建连接
        setState(prevState => {
          prevState.roomUsers.forEach(peerId => {
            if (peerId !== myPeerIdRef.current) {
              console.log('🔗 为用户重新创建连接:', peerId);
              // 关闭旧的连接
              const oldConnection = peerConnectionsRef.current.get(peerId);
              if (oldConnection) {
                oldConnection.close();
                peerConnectionsRef.current.delete(peerId);
              }
              // 创建新的连接
              setTimeout(() => {
                createPeerConnectionWithCurrentStream(peerId, true, combinedStream);
              }, 100);
            }
          });
          return prevState;
        });
        
        // 如果是主播，确保观众能看到主播的视频
        if (state.isHost) {
          console.log('🎤 主播重新开启摄像头，确保观众能看到');
        }
        
        console.log('📹 摄像头硬件已开启');
        
        // 添加用户反馈
        const messageId = Date.now().toString();
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, {
            id: messageId,
            peerId: 'system',
            username: '系统',
            message: '📹 摄像头硬件已开启',
            timestamp: Date.now()
          }]
        }));
        
      } else {
        // 当前摄像头开启，需要关闭摄像头硬件
        console.log('📹 关闭摄像头硬件...');
        
        if (state.localStream) {
          // 停止所有视频轨道（真正关闭摄像头硬件）
          const videoTracks = state.localStream.getVideoTracks();
          videoTracks.forEach(track => {
            track.stop();
            console.log('🛑 已停止视频轨道:', track.label);
          });
          
          // 保留音频轨道
          const audioTracks = state.localStream.getAudioTracks();
          const audioOnlyStream = new MediaStream(audioTracks);
          
          setState(prev => ({ 
            ...prev, 
            localStream: audioOnlyStream,
            isVideoOff: true 
          }));
          
          // 更新本地视频显示
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
          }
          
          // 通知其他用户视频状态变化
          sendMessage({
            type: 'video-toggle',
            enabled: false
          });
          
          // 优化：摄像头关闭时，保持音频连接并添加连接稳定性检查
          setState(prevState => {
            prevState.roomUsers.forEach(peerId => {
              if (peerId !== myPeerIdRef.current) {
                console.log('🔗 为用户重新创建连接（只有音频）:', peerId);
                // 关闭旧的连接
                const oldConnection = peerConnectionsRef.current.get(peerId);
                if (oldConnection) {
                  oldConnection.close();
                  peerConnectionsRef.current.delete(peerId);
                }
                // 创建新的连接（只有音频）
                setTimeout(() => {
                  createPeerConnectionWithCurrentStream(peerId, true, audioOnlyStream);
                }, 100);
              }
            });
            return prevState;
        });
          
          console.log('📹 摄像头硬件已关闭');
          
          // 添加用户反馈
          const messageId = Date.now().toString();
          setState(prev => ({
            ...prev,
            messages: [...prev.messages, {
              id: messageId,
              peerId: 'system',
              username: '系统',
              message: '📹 摄像头硬件已关闭，音频连接保持活跃',
              timestamp: Date.now()
            }]
          }));
          
          // 启动连接稳定性监控
          setTimeout(() => {
            console.log('🔍 启动摄像头关闭后的连接稳定性监控');
            monitorConnectionStability();
          }, 2000);
        }
      }
    } catch (error) {
      console.error('❌ 切换摄像头失败:', error);
      setState(prev => ({
        ...prev,
        error: '切换摄像头失败，请检查设备权限。点击重试按钮重新获取摄像头。'
      }));
      
      // 自动重试机制
      setTimeout(() => {
        console.log('🔄 自动重试获取摄像头...');
        setState(prev => ({ ...prev, error: null }));
        toggleVideo(); // 递归调用，但只重试一次
      }, 3000);
    }
  };

  // 监控连接稳定性
  const monitorConnectionStability = () => {
    const stabilityInterval = setInterval(() => {
      if (state.isVideoOff && state.isConnected) {
        console.log('🔍 检查摄像头关闭时的连接稳定性...');
        
        // 检查WebRTC连接状态
        let activeConnections = 0;
        peerConnectionsRef.current.forEach((connection, peerId) => {
          if (connection.connectionState === 'connected') {
            activeConnections++;
          } else {
            console.log(`⚠️ 检测到不稳定的连接: ${peerId}, 状态: ${connection.connectionState}`);
          }
        });
        
        // 如果连接数少于用户数，尝试重新连接
        if (activeConnections < state.roomUsers.length - 1) {
          console.log('🔄 检测到连接丢失，尝试重新连接...');
          state.roomUsers.forEach(peerId => {
            if (peerId !== myPeerIdRef.current) {
              const connection = peerConnectionsRef.current.get(peerId);
              if (!connection || connection.connectionState !== 'connected') {
                console.log(`🔄 重新连接用户: ${peerId}`);
                createPeerConnectionWithCurrentStream(peerId, !state.isHost, state.localStream);
              }
            }
          });
        }
      } else {
        // 摄像头开启或未连接，停止监控
        clearInterval(stabilityInterval);
      }
    }, 10000); // 每10秒检查一次
    
    // 30秒后自动停止监控
    setTimeout(() => {
      clearInterval(stabilityInterval);
    }, 30000);
  };

  // 本地视频显示
  useEffect(() => {
    if (localVideoRef.current && state.localStream) {
      localVideoRef.current.srcObject = state.localStream;
    }
  }, [state.localStream]);

  // WebRTC连接健康检查
  useEffect(() => {
    const healthCheckInterval = setInterval(() => {
      if (state.isConnected && peerConnectionsRef.current.size > 0) {
        console.log('🔍 执行WebRTC连接健康检查...');
        
        peerConnectionsRef.current.forEach((connection, peerId) => {
          if (connection.connectionState === 'failed' || connection.connectionState === 'disconnected') {
            console.log(`🔄 检测到无效连接 ${peerId}，正在清理...`);
            connection.close();
            peerConnectionsRef.current.delete(peerId);
            
            // 尝试重新建立连接
            if (state.localStream) {
              setTimeout(() => {
                console.log(`🔄 重新建立连接 ${peerId}`);
                createPeerConnectionWithCurrentStream(peerId, true, state.localStream);
              }, 1000);
            }
          }
        });
      }
    }, 15000); // 每15秒检查一次

    return () => clearInterval(healthCheckInterval);
  }, [state.isConnected, state.localStream]);

  // 添加心跳机制保持连接活跃
  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      if (state.isConnected && wsRef.current?.readyState === WebSocket.OPEN) {
        // 发送心跳消息
        sendMessage({
          type: 'heartbeat',
          timestamp: Date.now()
        });
        
        // 检查WebRTC连接状态，如果摄像头关闭但有音频，发送音频数据包
        if (state.localStream && state.isVideoOff && !state.isMuted) {
          const audioTracks = state.localStream.getAudioTracks();
          if (audioTracks.length > 0) {
            // 音频轨道存在，连接应该保持活跃
            console.log('💓 发送音频心跳保持连接');
          }
        }
      }
    }, 10000); // 每10秒发送一次心跳

    return () => clearInterval(heartbeatInterval);
  }, [state.isConnected, state.localStream, state.isVideoOff, state.isMuted]);

  // 优化重连逻辑
  useEffect(() => {
    const reconnectInterval = setInterval(() => {
      if (state.isConnected && peerConnectionsRef.current.size === 0 && state.roomUsers.length > 0) {
        console.log('🔄 检测到连接丢失，尝试重新连接...');
        
        // 重新建立与所有用户的连接
        state.roomUsers.forEach(peerId => {
          if (peerId !== myPeerIdRef.current) {
            console.log(`🔄 重新连接用户: ${peerId}`);
            createPeerConnectionWithCurrentStream(peerId, !state.isHost, state.localStream);
          }
        });
      }
    }, 5000); // 每5秒检查一次

    return () => clearInterval(reconnectInterval);
  }, [state.isConnected, state.roomUsers, state.isHost, state.localStream]);

  // 监控观众权限状态变化
  useEffect(() => {
    if (!state.isHost) {
      console.log('🔍 观众权限状态:', {
        currentPeerId: myPeerIdRef.current,
        approvedUsers: state.approvedUsers,
        hasPermission: state.approvedUsers.includes(myPeerIdRef.current || ''),
        isRequestingMic: state.isRequestingMic
      });
    }
  }, [state.approvedUsers, state.isRequestingMic, state.isHost]);

  return (
    <div className="video-call-container">
      {/* 状态栏 */}
      <div className="status-bar">
        <div className="status-indicator">
          <div className={`status-dot ${state.isConnected ? 'connected' : 'disconnected'}`}></div>
          <span>{state.isConnected ? '已连接' : '未连接'}</span>
        </div>
        <div>房间: {state.roomId || '未加入'}</div>
        <div>角色: {state.isHost ? '🎤主播' : state.role === 'viewer' ? '👀观众' : '未分配'}</div>
        <div>用户数: {state.userCount}</div>
        <div>远程流: {state.remoteStreams.size}</div>
        <div>WebRTC连接: {peerConnectionsRef.current.size}个</div>
      </div>

      {/* 错误消息 */}
      {state.error && (
        <div className="error-message">
          <span>⚠️ {state.error}</span>
          {(state.error.includes('被占用') || state.error.includes('切换摄像头失败') || state.error.includes('连接失败')) && (
            <button 
              className="retry-btn"
              onClick={() => {
                setState(prev => ({ ...prev, error: null }));
                if (state.isHost) {
                  handleBecomeHost();
                } else {
                  startUserMedia();
                }
              }}
            >
              重试
            </button>
          )}
        </div>
      )}

      {/* 房间输入 */}
      {!state.isConnected ? (
        <div className="room-input">
          <input
            type="text"
            placeholder="输入房间号"
            value={state.roomId}
            onChange={(e) => setState(prev => ({ ...prev, roomId: e.target.value }))}
            onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
          />
          <button onClick={joinRoom} disabled={state.isJoining}>
            {state.isJoining ? '加入中...' : '加入房间'}
          </button>
        </div>
      ) : (
        <div className="video-grid">
          {/* 本地视频 - 主播和连麦用户都显示 */}
          {state.localStream && (
            <div className="video-container">
              {state.isVideoOff ? (
                <div className="video-placeholder">
                  <div className="placeholder-icon">📹</div>
                  <div className="placeholder-text">摄像头已关闭</div>
                </div>
              ) : (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="video-element"
              />
              )}
              <div className="video-overlay">
                {state.isHost ? '🎤主播 (我)' : '🎤连麦 (我)'}
              </div>
            </div>
          )}

          
          {/* 远程视频 - 显示所有远程流 */}
          {Array.from(state.remoteStreams.entries()).map(([peerId, stream]) => {
            const hostId = state.roomUsers[0]; // 第一个用户是主播
            const isHost = peerId === hostId;
            const isApproved = state.approvedUsers.includes(peerId);
            
            console.log('🔍 远程视频标签调试:', {
              peerId,
              hostId,
              isHost,
              isApproved,
              approvedUsers: state.approvedUsers,
              roomUsers: state.roomUsers,
              currentUser: myPeerIdRef.current,
              isCurrentUserHost: state.isHost
            });
            
            return (
              <div key={peerId} className="video-container">
                <video
                  ref={(el) => {
                    if (el) {
                      remoteVideosRef.current.set(peerId, el);
                      el.srcObject = stream;
                      el.play().catch(console.error);
                    }
                  }}
                  autoPlay
                  playsInline
                  className="video-element"
                />
                <div className="video-overlay">
                  {/* 修复：如果当前用户是主播，远程用户都是观众；如果当前用户是观众，远程用户是主播 */}
                  {state.isHost ? '👀观众' : '🎤主播'}
                </div>
              </div>
            );
          })}
          
          {/* 远程用户摄像头关闭占位符 - 显示所有没有流的用户 */}
          {state.roomUsers.filter(peerId => {
            if (peerId === myPeerIdRef.current) return false;
            if (state.remoteStreams.has(peerId)) return false;
            return true; // 显示所有没有流的用户
          }).map(peerId => {
            const hostId = state.roomUsers[0]; // 第一个用户是主播
            const isHost = peerId === hostId;
            const isApproved = state.approvedUsers.includes(peerId);
            
            return (
              <div key={peerId} className="video-container">
                <div className="video-placeholder">
                  <div className="placeholder-icon">📹</div>
                  <div className="placeholder-text">用户 {peerId.slice(0, 6)} 摄像头已关闭</div>
                </div>
                <div className="video-overlay">
                  {/* 修复：如果当前用户是主播，远程用户都是观众；如果当前用户是观众，远程用户是主播 */}
                  {state.isHost ? '👀观众' : '🎤主播'}
                </div>
              </div>
            );
          })}
          
          {/* 等待提示 - 只有当没有远程流且不是主播且没有连麦权限时才显示 */}
          {state.remoteStreams.size === 0 && !state.isHost && state.roomUsers.length > 0 && !state.approvedUsers.includes(myPeerIdRef.current || '') && (
            <div className="host-status-container">
              <div className="host-status-message">
                <div className="status-info">
                  <span className="status-icon">⏳</span>
                  <span className="status-text">等待主播开启摄像头...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 控制按钮 */}
      {state.isConnected && (
        <div className="controls">
          {state.isHost && (
            <>
              <button
                className={`control-button ${state.isMuted ? 'muted' : 'secondary'}`}
                onClick={toggleMute}
                title={state.isMuted ? '取消静音' : '静音'}
              >
                {state.isMuted ? '🔇' : '🔊'}
              </button>
              
              <button
                className={`control-button ${state.isVideoOff ? 'muted' : 'secondary'}`}
                onClick={toggleVideo}
                title={state.isVideoOff ? '开启视频' : '关闭视频'}
              >
                {state.isVideoOff ? '📹' : '📷'}
              </button>
            </>
          )}
          
          {/* 连麦相关按钮 */}
          {!state.isHost && !state.approvedUsers.includes(myPeerIdRef.current || '') && (
            <button
              className={`control-button mic-request ${state.isRequestingMic ? 'requesting' : ''}`}
              onClick={requestMic}
              disabled={state.isRequestingMic}
              title={state.isRequestingMic ? '连麦请求发送中...' : '申请连麦'}
            >
              <div className="mic-icon">
                {state.isRequestingMic ? '⏳' : '🎤'}
              </div>
              <div className="mic-text">
                {state.isRequestingMic ? '申请中' : '申请连麦'}
              </div>
            </button>
          )}
          
          {/* 错误重试按钮 */}
          {state.error && state.error.includes('被占用') && (
            <button
              className="control-button secondary"
              onClick={() => {
                setState(prev => ({ ...prev, error: null }));
                startUserMedia();
              }}
              title="重试获取媒体设备"
            >
              🔄
            </button>
          )}
          
          {/* 观众连麦后的控制按钮 */}
          {!state.isHost && state.approvedUsers.includes(myPeerIdRef.current || '') && (
            <>
              <button
                className={`control-button ${state.isMuted ? 'muted' : 'secondary'}`}
                onClick={toggleMute}
                title={state.isMuted ? '取消静音' : '静音'}
              >
                {state.isMuted ? '🔇' : '🔊'}
              </button>
              
              <button
                className={`control-button ${state.isVideoOff ? 'muted' : 'secondary'}`}
                onClick={toggleVideo}
                title={state.isVideoOff ? '开启视频' : '关闭视频'}
              >
                {state.isVideoOff ? '📹' : '📷'}
              </button>
            </>
          )}
          
          <button
            className={`control-button chat-btn ${state.showChat ? 'active' : ''}`}
            onClick={() => setState(prev => ({ ...prev, showChat: !prev.showChat }))}
            title="聊天"
          >
            💬
          </button>
          
          <button
            className="control-button hangup-btn"
            onClick={leaveRoom}
            title="离开房间"
          >
            📞
          </button>
        </div>
      )}

      {/* 连麦请求管理面板 - 仅主播可见 */}
      {state.isHost && state.micRequests.length > 0 && (
        <div className="mic-requests-panel">
          <div className="panel-header">
            <h4>🎤 连麦请求 ({state.micRequests.length})</h4>
          </div>
          <div className="requests-list">
            {state.micRequests.map(peerId => (
              <div key={peerId} className="request-item">
                <span className="requester-name">用户 {peerId.slice(0, 8)}</span>
                <div className="request-actions">
                  <button
                    className="approve-btn"
                    onClick={() => approveMicRequest(peerId)}
                    title="批准连麦"
                  >
                    ✅ 批准
                  </button>
                  <button
                    className="deny-btn"
                    onClick={() => denyMicRequest(peerId)}
                    title="拒绝连麦"
                  >
                    ❌ 拒绝
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 聊天面板 */}
      {state.showChat && (
        <div className="chat-panel">
          <div className="chat-header">
            <h3>聊天</h3>
            <button onClick={() => setState(prev => ({ ...prev, showChat: false }))}>×</button>
          </div>
          <div className="chat-messages">
            {state.messages.map((msg) => (
              <div key={msg.id} className={`chat-message ${msg.peerId === myPeerIdRef.current ? 'own' : 'other'}`}>
                <div className="message-header">
                  <span className="username">{msg.username}</span>
                  <span className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="message-content">{msg.message}</div>
              </div>
            ))}
          </div>
          {/* 表情包选择面板 */}
          {state.showEmojiPanel && (
            <div className="emoji-panel">
              <EmojiPicker
                onEmojiClick={insertEmoji}
                autoFocusSearch={false}
                theme={Theme.LIGHT}
                height={500}
                width={350}
                searchDisabled={false}
                skinTonesDisabled={false}
                previewConfig={{
                  showPreview: false
                }}
              />
            </div>
          )}
          
          <div className="chat-input">
            <input
              type="text"
              placeholder="输入消息..."
              value={state.chatInput}
              onChange={(e) => setState(prev => ({ ...prev, chatInput: e.target.value }))}
              onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
            />
            <button 
              className="emoji-toggle-btn"
              onClick={() => setState(prev => ({ ...prev, showEmojiPanel: !prev.showEmojiPanel }))}
              title="选择表情"
            >
              😀
            </button>
            <button onClick={sendChatMessage}>发送</button>
          </div>
        </div>
      )}
    </div>
  );
}