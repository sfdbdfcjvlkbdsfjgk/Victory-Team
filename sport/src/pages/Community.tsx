import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LeftOutline, ChatAddOutline, StarOutline, UserOutline, HeartOutline } from 'antd-mobile-icons';
import { Toast, Modal, ActionSheet } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import './Community.css';

interface ActivityPost {
  id: string;
  _id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    isPresident: boolean;
  };
  publishTime: string;
  association: {
    id: string;
    name: string;
  };
  content: {
    title: string;
    description: string;
    registrationDeadline: string;
    activityTime: string;
    location: string;
    maxParticipants: number;
  };
  images: string[];
  likes: number;
  comments: number;
  shares: number;
  registeredCount: number;
  registrationStatus: 'not_registered' | 'registered' | 'in_progress' | 'ended';
  registrationStartTime: string;
  registrationEndTime: string;
  activityStartTime: string;
  activityEndTime: string;
  isLiked: boolean;
  isUserMember: boolean;
}

interface Association {
  _id: string;
  id: string;
  name: string;
  avatar: string;
  description: string;
  sportType: string;
  location: string;
  memberCount: number;
  maxMembers: number;
  isJoined: boolean;
  needsApproval: boolean;
  latestContent?: {
    type: 'activity' | 'post';
    title: string;
    date: string;
    isNew: boolean;
  };
}

const CommunityPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('活动');
  const [activityPosts, setActivityPosts] = useState<ActivityPost[]>([]);
  const [associationPosts, setAssociationPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareVisible, setShareVisible] = useState(false);
  const [commentVisible, setCommentVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ActivityPost | null>(null);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [myAssociations, setMyAssociations] = useState<Association[]>([]);
  const [discoverAssociations, setDiscoverAssociations] = useState<Association[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchData();
    fetchAssociations();
    
    // 监听协会加入成功事件
    const handleAssociationJoinSuccess = () => {
      console.log('检测到协会加入成功，刷新数据');
      fetchAssociations(); // 重新获取协会数据
    };

    window.addEventListener('associationJoinSuccess', handleAssociationJoinSuccess);

    return () => {
      window.removeEventListener('associationJoinSuccess', handleAssociationJoinSuccess);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // 获取团活动数据
      const activityResponse = await axios.get('http://localhost:3000/activitypost');
      const activityData = activityResponse.data;

      // 确保数据是数组格式
      const postsArray = Array.isArray(activityData) ? activityData :
        (activityData?.data && Array.isArray(activityData.data)) ? activityData.data : [];

      setActivityPosts(postsArray);

    } catch (error) {
      console.error('获取数据失败:', error);
      setActivityPosts([]); // 错误时设置为空数组
    } finally {
      setLoading(false);
    }
  };

  const fetchAssociations = async () => {
    try {
      // 获取我的协会（只返回state=1且已加入的）
      const myResponse = await axios.get('http://localhost:3000/association');
      const myAssociations = myResponse.data.data || [];

      // 按最新内容时间排序
      const sortedMyAssociations = myAssociations.sort((a, b) => {
        const timeA = a.latestContent?.date ? new Date(a.latestContent.date) : new Date(0);
        const timeB = b.latestContent?.date ? new Date(b.latestContent.date) : new Date(0);
        return timeB.getTime() - timeA.getTime();
      });

      setMyAssociations(sortedMyAssociations);

      // 获取发现协会（只返回state=1且未加入的）
      const discoverResponse = await axios.get('http://localhost:3000/association-discover');
      setDiscoverAssociations(discoverResponse.data.data || []);

    } catch (error) {
      console.error('获取协会数据失败:', error);
      setMyAssociations([]);
      setDiscoverAssociations([]);
    }
  };

  const handleJoinAssociation = async (association: Association) => {
    console.log(association, 127);
    //console.log('axios baseURL:', axios.defaults.baseURL);
    //console.log('完整请求URL:', axios.defaults.baseURL + '/association-join?_id=' + association._id);
    if (association.memberCount >= association.maxMembers) {
      Toast.show('该协会成员已满，请选择其他协会加入吧');
      return;
    }

    try {
      const res = await axios.put(`http://localhost:3000/association-join?_id=` + association._id);
      console.log(res, 132);

      if (res.data.code === 200) {
        Toast.show('加入成功！');
        // 刷新协会列表
        fetchAssociations();
      }
    } catch (error) {
      Toast.show('加入失败，请稍后重试');
    }
  };

  const handleContentClick = (association: Association) => {
    if (association.latestContent?.isNew) {
      // 标记为已读
      setMyAssociations(prev => prev.map(assoc =>
        assoc.id === association.id
          ? { ...assoc, latestContent: { ...assoc.latestContent!, isNew: false } }
          : assoc
      ));
    }
  };

  const formatTime = (timeString: string) => {
    // 基础规范说明页时间格式A
    const date = new Date(timeString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString();
  };

  const getRegistrationStatus = (post: ActivityPost) => {
    const now = new Date();
    const regStart = new Date(post.registrationStartTime);
    const regEnd = new Date(post.registrationEndTime);
    const actStart = new Date(post.activityStartTime);
    const actEnd = new Date(post.activityEndTime);

    if (now < regStart || now > actEnd) return 'ended';
    if (now >= actStart && now <= actEnd) return 'in_progress';
    if (now >= regStart && now <= regEnd) {
      return post.registrationStatus === 'registered' ? 'registered' : 'not_registered';
    }
    return 'ended';
  };

  const handleLike = async (postId: string) => {
    try {
      const res = await axios.post(`http://localhost:3000/community/like/${postId}`);
      console.log('点赞响应:', res.data);
      
      if (res.data.code === 200) {
        Toast.show('点赞成功');
        
        // 使用后端返回的数据更新状态
        const updatedData = res.data.data;
        setActivityPosts(prev => prev.map(post => {
          const currentPostId = post._id || post.id;
          if (currentPostId === postId) {
            return { 
              ...post, 
              likes: updatedData.likes,
              isLiked: updatedData.isLiked
            };
          }
          return post;
        }));
      } else {
        Toast.show(res.data.message || '点赞失败');
      }
    } catch (error) {
      console.error('点赞请求失败:', error);
      Toast.show('点赞失败');
    }
  };

  const handleShare = (post: ActivityPost) => {
    setSelectedPost(post);
    setShareVisible(true);
  };

  // 生成模拟评论数据
  const generateMockComments = (commentCount: number) => {
    const mockUsers = [
      { name: '张三', avatar: 'http://localhost:3000/1.jpg' },
      { name: '李四', avatar: 'http://localhost:3000/2.jpg' },
      { name: '王五', avatar: 'http://localhost:3000/3.jpg' },
      { name: '赵六', avatar: 'http://localhost:3000/4.jpg' },
      { name: '钱七', avatar: 'http://localhost:3000/5.jpg' },
      { name: '孙八', avatar: 'http://localhost:3000/6.jpg' },
      { name: '周九', avatar: 'http://localhost:3000/7.jpg' },
      { name: '吴十', avatar: 'http://localhost:3000/8.jpg' }
    ];

    const mockComments = [
      '这个活动看起来很有趣！',
      '我想参加，什么时候开始报名？',
      '地点在哪里呀？',
      '费用是多少呢？',
      '需要带什么装备吗？',
      '有年龄限制吗？',
      '期待参与！',
      '上次活动很棒，这次一定参加',
      '可以带朋友一起吗？',
      '活动时间会不会冲突？',
      '报名截止时间是什么时候？',
      '有没有雨天备案？'
    ];

    const comments = [];
    for (let i = 0; i < commentCount; i++) {
      const randomUser = mockUsers[i % mockUsers.length];
      const randomComment = mockComments[i % mockComments.length];
      const randomMinutes = Math.floor(Math.random() * 1440); // 24小时内
      const commentTime = new Date(Date.now() - randomMinutes * 60 * 1000);

      comments.push({
        id: `comment_${i + 1}`,
        user: randomUser,
        content: randomComment,
        time: commentTime.toISOString(),
        likes: Math.floor(Math.random() * 20)
      });
    }

    // 按时间倒序排列
    return comments.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  };

  const handleComment = (post: ActivityPost) => {
    setSelectedPost(post);
    // 生成模拟评论数据
    const mockComments = generateMockComments(post.comments);
    setComments(mockComments);
    setCommentVisible(true);
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedPost) return;

    const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
    const newCommentObj = {
      id: `comment_${Date.now()}`,
      user: {
        name: userInfo.name || '我',
        avatar: userInfo.avatar || 'http://localhost:3000/1.jpg'
      },
      content: newComment.trim(),
      time: new Date().toISOString(),
      likes: 0
    };

    setComments(prev => [newCommentObj, ...prev]);
    
    // 更新帖子的评论数
    setActivityPosts(prev => prev.map(post => {
      const currentPostId = post._id || post.id;
      const selectedPostId = selectedPost._id || selectedPost.id;
      if (currentPostId === selectedPostId) {
        return { ...post, comments: post.comments + 1 };
      }
      return post;
    }));

    setNewComment('');
    Toast.show('评论成功');
  };

  const handleRegistration = async (post: ActivityPost) => {
    const status = getRegistrationStatus(post);
    
    if (status === 'not_registered') {
      if (post.isUserMember) {
        Modal.confirm({
          content: '确定报名该活动？',
          onConfirm: async () => {
            try {
              const postId = post._id || post.id;
              await axios.post(`/api/community/register/${postId}`);
              
              setActivityPosts(prev => prev.map(p => {
                const currentPostId = p._id || p.id;
                if (currentPostId === postId) {
                  return { 
                    ...p, 
                    registrationStatus: 'registered', 
                    registeredCount: p.registeredCount + 1 
                  };
                }
                return p;
              }));
              Toast.show('报名成功');
            } catch (error) {
              Toast.show('报名失败');
            }
          }
        });
      } else {
        Modal.confirm({
          content: '成为会员后才能参与活动，确定要加入本协会吗？',
          onConfirm: async () => {
            try {
              await axios.post(`/api/association/join/${post.association.id}`);
              Toast.show('申请已提交，审核通过后可参与活动');
            } catch (error) {
              Toast.show('申请失败');
            }
          }
        });
      }
    }
  };

  const getButtonText = (post: ActivityPost) => {
    const status = getRegistrationStatus(post);
    switch (status) {
      case 'not_registered': return '报名 👋';
      case 'registered': return '已报名';
      case 'in_progress': return '活动中';
      case 'ended': return '已结束';
      default: return '报名 👋';
    }
  };

  const getButtonClass = (post: ActivityPost) => {
    const status = getRegistrationStatus(post);
    return status === 'registered' ? 'report-btn disabled' : 'report-btn';
  };

  const toggleExpanded = (postId: string) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const renderActivityContent = (post: ActivityPost) => {
    const expanded = expandedPosts.has(post.id);

    return (
      <div className="post-content">
        <div className="activity-tag">活动</div>
        <div className={`content-text ${expanded ? 'expanded' : 'collapsed'}`}>
          <div>报名截止时间：{post.content.registrationDeadline}</div>
          <div>活动内容：{post.content.description}</div>
          <div>活动时间：{post.content.activityTime}</div>
          <div>活动地址：{post.content.location}</div>
          <div>活动人数：{post.content.maxParticipants}人</div>
        </div>
        {!expanded && (
          <button className="expand-btn" onClick={() => toggleExpanded(post.id)}>
            展开
          </button>
        )}

        {post.images && post.images.length > 0 && (
          <div className="images-grid">
            {post.images.slice(0, 9).map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`图片${index + 1}`}
                className="post-image"
                onClick={() => {/* 查看大图 */ }}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleAssociationClick = (association: Association) => {
    navigate(`/association-detail/${association._id}`);
  };

  const renderAssociationContent = () => (
    <div className="association-content">
      {/* 我的协会 */}
      <div className="my-associations">
        <div className="section-header">
          <h3>我的协会</h3>
          <button className="create-btn">+创建协会⚡</button>
        </div>

        {myAssociations.length > 0 ? (
          <div className="associations-list">
            {myAssociations.map(association => (
              <div key={association.id} className="association-card my-card">
                <img src={association.avatar} alt={association.name} className="association-avatar" />
                <div className="association-info">
                  <h4>{association.name}</h4>
                  {association.latestContent && (
                    <div
                      className="latest-content"
                      onClick={() => handleContentClick(association)}
                    >
                      <span className="content-tag">
                        {association.latestContent.type === 'activity' ? '活动' : '动态'}
                      </span>
                      <span className="content-title">{association.latestContent.title}</span>
                      <span className="content-date">{association.latestContent.date}</span>
                      {association.latestContent.isNew && <span className="new-badge">new</span>}
                    </div>
                  )}
                </div>
                <div className="member-count">
                  <UserOutline fontSize={16} />
                  <span>{association.memberCount}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            您还未加入任何协会，快去找你感兴趣的协会加入吧
          </div>
        )}
      </div>

      {/* 发现协会 */}
      <div className="discover-associations">
        <h3>发现协会</h3>
        <div className="associations-list">
          {discoverAssociations.map(association => (
            <div key={association.id} className="association-card discover-card">
              <div 
                style={{ display: 'flex', alignItems: 'center', flex: 1, cursor: 'pointer' }}
                onClick={() => handleAssociationClick(association)}
              >
                <img src={association.avatar} alt={association.name} className="association-avatar" />
                <div className="association-info">
                  <h4>{association.name}</h4>
                  <p className="description">{association.description}</p>
                  <div className="meta-info">
                    <span className="sport-type">{association.sportType}</span>
                    <span className="location">{association.location}</span>
                    <span className="member-count">{association.memberCount}人</span>
                  </div>
                </div>
              </div>
              <button
                className="join-btn"
                onClick={(e) => {
                  e.stopPropagation(); // 阻止事件冒泡
                  handleJoinAssociation(association);
                }}
              >
                加入⚡
              </button>
            </div>
          ))}
        </div>

        <div className="create-association">
          <button className="create-btn-bottom">+创建协会 ⚡</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="community-container">
      {/* 顶部导航 */}
      <div className="community-header">
        <LeftOutline className="back-icon" fontSize={20} />
        <h1 className="page-title">全民健身</h1>
      </div>

      {/* 标签页 */}
      <div className="tabs-container">
        <div className="tabs">
          <div
            className={`tab ${activeTab === '活动' ? 'active' : ''}`}
            onClick={() => setActiveTab('活动')}
          >
            活动
          </div>
          <div
            className={`tab ${activeTab === '协会' ? 'active' : ''}`}
            onClick={() => setActiveTab('协会')}
          >
            协会
            <span className="tab-badge">🏆</span>
          </div>
        </div>
        <div className={`tab-indicator ${activeTab === '协会' ? 'right' : ''}`}></div>
      </div>

      {/* 内容区域 */}
      <div className="posts-list">
        {activeTab === '活动' && activityPosts.map(post => (
          <div key={post._id || post.id} className="post-item">
            {/* 用户信息 */}
            <div className="post-header">
              <div className="user-info">
                <img src={post.user.avatar} alt={post.user.name} className="user-avatar" />
                <div className="user-details">
                  <div className="username-container">
                    <span className="username">{post.user.name}</span>
                    {post.user.isPresident && <span className="hot-badge">会长</span>}
                  </div>
                  <span className="post-time">{formatTime(post.publishTime)}</span>
                  <div className="association-name" onClick={() => {/* 进入协会页面 */ }}>
                    {post.association.name}
                  </div>
                </div>
              </div>
            </div>

            {/* 活动内容 */}
            {renderActivityContent(post)}

            {/* 互动按钮 */}
            <div className="post-actions">
              <div className="action-group">
                <button
                  className={`action-btn ${post.isLiked ? 'liked' : ''}`}
                  onClick={() => handleLike(post._id || post.id)}
                >
                  <span className="heart-icon"></span>
                  <span>{post.likes}</span>
                </button>
                <button className="action-btn" onClick={() => handleComment(post)}>
                  <ChatAddOutline fontSize={16} />
                  <span>{post.comments}</span>
                </button>
                <button className="action-btn" onClick={() => handleShare(post)}>
                  <StarOutline fontSize={16} />
                  <span>{post.shares}</span>
                </button>
                <button className="action-btn">
                  <UserOutline fontSize={16} />
                  <span>{post.registeredCount}</span>
                </button>
              </div>
              <button
                className={getButtonClass(post)}
                onClick={() => handleRegistration(post)}
              >
                {getButtonText(post)}
              </button>
            </div>
          </div>
        ))}

        {activeTab === '协会' && renderAssociationContent()}
      </div>

      {/* 分享弹窗 */}
      <ActionSheet
        visible={shareVisible}
        actions={[
          { text: '分享到微信好友', key: 'wechat' },
          { text: '分享到朋友圈', key: 'moments' }
        ]}
        onClose={() => setShareVisible(false)}
        onAction={(action) => {
          console.log('分享到:', action.key);
          setShareVisible(false);
        }}
      />

      {/* 评论弹窗 */}
      {commentVisible && selectedPost && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end'
        }}>
          <div style={{
            background: 'white',
            width: '100%',
            height: '80vh',
            borderRadius: '16px 16px 0 0',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* 头部 */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button
                  onClick={() => setCommentVisible(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    marginRight: '12px'
                  }}
                >
                  ←
                </button>
                <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                  评论 ({comments.length})
                </h3>
              </div>
            </div>

            {/* 评论列表 */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0 20px'
            }}>
              {comments.length > 0 ? (
                comments.map((comment, index) => (
                  <div key={comment.id} style={{
                    display: 'flex',
                    padding: '16px 0',
                    borderBottom: index < comments.length - 1 ? '1px solid #f0f0f0' : 'none'
                  }}>
                    <img 
                      src={comment.user.avatar}
                      alt={comment.user.name}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        marginRight: '12px',
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '4px'
                      }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          marginRight: '8px'
                        }}>
                          {comment.user.name}
                        </span>
                        <span style={{
                          fontSize: '12px',
                          color: '#999'
                        }}>
                          {formatTime(comment.time)}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '14px',
                        lineHeight: '1.4',
                        marginBottom: '8px'
                      }}>
                        {comment.content}
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                      }}>
                        <button style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '12px',
                          color: '#666',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          👍 {comment.likes}
                        </button>
                        <button style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '12px',
                          color: '#666',
                          cursor: 'pointer'
                        }}>
                          回复
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '200px',
                  color: '#666'
                }}>
                  暂无评论，快来抢沙发吧~
                </div>
              )}
            </div>

            {/* 评论输入框 */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <input
                type="text"
                placeholder="写评论..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '20px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddComment();
                  }
                }}
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                style={{
                  background: newComment.trim() ? '#FF6B35' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  cursor: newComment.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                发送
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityPage;
