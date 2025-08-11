import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LeftOutline, UserOutline } from 'antd-mobile-icons';
import { Toast, Modal } from 'antd-mobile';
import axios from 'axios';

interface Association {
  _id: string;
  id: string;
  name: string;
  description: string;
  avatar: string;
  coverImage: string;
  state: number;
  memberCount: number;
  maxMembers: number;
  president: {
    id: string;
    name: string;
    avatar: string;
  };
  needsApproval: boolean;
  activityCount: number;
  createtime: string;
  // 可选的活动列表
  activities?: Array<{
    id: string;
    title: string;
    date: string;
    participants: number;
  }>;
}

const AssociationDetail = () => {
  const { associationId } = useParams();
  const navigate = useNavigate();
  const [association, setAssociation] = useState<Association | null>(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [showMemberList, setShowMemberList] = useState(false);

  useEffect(() => {
    console.log(associationId,41);
    
    if (associationId) {
      fetchAssociationDetail();
    }
  }, [associationId]);

  const fetchAssociationDetail = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3000/association/${associationId}`);
      if (response.data.code === 200) {
        setAssociation(response.data.data);
        console.log(response.data.data, 54);
        
      } else {
        Toast.show('协会不存在');
      }
    } catch (error) {
      console.error('获取协会详情失败:', error);
      Toast.show('获取协会详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取成员列表 - 使用模拟数据
  const fetchMembers = async () => {
    try {
      setMembersLoading(true);
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 生成模拟成员数据
      const mockMembers = [];
      const memberCount = association?.memberCount || 0;
      
      // 预设的成员名字和头像
      const memberNames = [
        '方晓敏', '程雷明', '北晓敏', '张大大', '北晓敏', '程雷明', '张大大', '李小明', 
        '王小红', '刘大强', '陈美丽', '赵小华', '孙大伟', '周小芳', '吴大明', '郑小丽'
      ];
      
      const avatarUrls = [
        'http://localhost:3000/1.jpg', 'http://localhost:3000/2.jpg', 'http://localhost:3000/3.jpg',
        'http://localhost:3000/4.jpg', 'http://localhost:3000/5.jpg', 'http://localhost:3000/6.jpg',
        'http://localhost:3000/7.jpg', 'http://localhost:3000/8.jpg', 'http://localhost:3000/9.jpg',
        'http://localhost:3000/10.jpg'
      ];
      
      // 生成会长信息（第一个成员）
      if (memberCount > 0) {
        mockMembers.push({
          _id: 'president_001',
          name: association?.president?.name || '方晓敏',
          avatar: association?.president?.avatar || '1.jpg',
          joinTime: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 一年前
          role: '会长'
        });
      }
      
      // 生成其他成员
      for (let i = 1; i < memberCount; i++) {
        const randomDays = Math.floor(Math.random() * 300) + 1; // 1-300天前
        const joinTime = new Date(Date.now() - randomDays * 24 * 60 * 60 * 1000);
        
        mockMembers.push({
          _id: `member_${i.toString().padStart(3, '0')}`,
          name: memberNames[i % memberNames.length],
          avatar: avatarUrls[i % avatarUrls.length].split('/').pop() || `${(i % 10) + 1}.jpg`,
          joinTime: joinTime.toISOString(),
          role: i === 1 ? '副会长' : '普通成员'
        });
      }
      
      // 按加入时间排序（会长最早，其他按时间倒序）
      mockMembers.sort((a, b) => {
        if (a.role === '会长') return -1;
        if (b.role === '会长') return 1;
        if (a.role === '副会长' && b.role !== '副会长') return -1;
        if (b.role === '副会长' && a.role !== '副会长') return 1;
        return new Date(b.joinTime).getTime() - new Date(a.joinTime).getTime();
      });
      
      setMembers(mockMembers);
      
    } catch (error) {
      console.error('获取成员列表失败:', error);
      Toast.show('获取成员列表失败');
    } finally {
      setMembersLoading(false);
    }
  };

  // 处理成员数量点击
  const handleMemberCountClick = () => {
    console.log('点击成员数量，当前成员数:', association?.memberCount);
    setShowMemberList(true);
    fetchMembers();
  };

  const handleJoin = async () => {
    if (!association) return;

    if (association.memberCount >= association.maxMembers) {
      Toast.show('该协会成员已满，请选择其他协会加入吧');
      return;
    }

    Modal.confirm({
      content: `确定要加入"${association.name}"吗？`,
      onConfirm: async () => {
        try {
          const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
          const userId = userInfo.id;
          
          const response = await axios.put(`http://localhost:3000/association-join?_id=${association._id}&userId=${userId}`);
          
          if (response.data.code === 200) {
            if (association.needsApproval) {
              Toast.show('加入申请已提交，等待会长审核');
            } else {
              Toast.show('加入成功！');
              // 更新协会信息
              setAssociation(prev => prev ? {...prev, memberCount: prev.memberCount + 1} : null);
            }
            
            // 延迟导航，让用户看到成功提示
            setTimeout(() => {
              // 触发协会页面刷新事件
              const event = new CustomEvent('associationJoinSuccess', {
                detail: { associationId: association._id }
              });
              window.dispatchEvent(event);
              
              // 返回协会页面
              navigate('/community');
            }, 1500);
            
          } else {
            Toast.show(response.data.msg || '加入失败');
          }
        } catch (error) {
          Toast.show('加入失败，请稍后重试');
        }
      }
    });
  };

  const handleBack = () => {
    navigate('/community');
  };

  // 获取头像URL
  const getAvatarUrl = (avatarPath: string) => {
    if (!avatarPath) return '/default-avatar.png';
    if (avatarPath.startsWith('http')) return avatarPath;
    return `http://localhost:3000/${avatarPath}`;
  };

  // 获取封面图片URL
  const getCoverImageUrl = (coverImagePath: string) => {
    if (!coverImagePath) return 'https://via.placeholder.com/400x200/4A90E2/FFFFFF?text=协会封面';
    if (coverImagePath.startsWith('http')) return coverImagePath;
    return `http://localhost:3000/${coverImagePath}`;
  };

  // 格式化创建时间
  const formatCreateTime = (createtime: string) => {
    try {
      return new Date(createtime).toLocaleDateString('zh-CN');
    } catch {
      return '未知';
    }
  };

  // 格式化加入时间
  const formatJoinTime = (joinTime: string) => {
    try {
      return new Date(joinTime).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '未知时间';
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '16px',
        color: '#666'
      }}>
        加载中...
      </div>
    );
  }

  if (!association) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '16px',
        color: '#666'
      }}>
        协会不存在
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* 头部导航 */}
      <div style={{
        background: 'white',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid #f0f0f0',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <LeftOutline onClick={handleBack} style={{ fontSize: '20px', marginRight: '12px', cursor: 'pointer' }} />
        <h1 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>协会详情</h1>
      </div>

      {/* 协会封面图 */}
      {association.coverImage && (
        <div style={{ position: 'relative' }}>
          <img 
            src={getCoverImageUrl(association.coverImage)}
            alt="协会封面"
            style={{
              width: '100%',
              height: '200px',
              objectFit: 'cover'
            }}
          />
        </div>
      )}

      {/* 协会基本信息 */}
      <div style={{
        background: 'white',
        margin: '12px',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <img 
            src={getAvatarUrl(association.avatar)} 
            alt={association.name}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              marginRight: '16px',
              objectFit: 'cover'
            }}
          />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 8px 0' }}>
              {association.name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#666' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <UserOutline fontSize={14} />
                {association.memberCount}/{association.maxMembers}人
              </span>
              <span>活动数: {association.activityCount}</span>
              <span>创建于: {formatCreateTime(association.createtime)}</span>
            </div>
          </div>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0', color: '#333' }}>
            协会介绍
          </h3>
          <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6', margin: 0 }}>
            {association.description || '暂无介绍'}
          </p>
        </div>

        <button
          onClick={handleJoin}
          disabled={association.memberCount >= association.maxMembers}
          style={{
            width: '100%',
            background: association.memberCount >= association.maxMembers ? '#ccc' : '#FF6B35',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: association.memberCount >= association.maxMembers ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s'
          }}
        >
          {association.memberCount >= association.maxMembers ? '成员已满' : 
           association.needsApproval ? '申请加入（需审核）' : '立即加入'}
        </button>
      </div>

      {/* 会长信息 */}
      <div style={{
        background: 'white',
        margin: '0 12px 12px 12px',
        borderRadius: '12px',
        padding: '16px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 12px 0' }}>会长信息</h3>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src={getAvatarUrl(association.president.avatar)}
            alt={association.president.name}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              marginRight: '12px',
              objectFit: 'cover'
            }}
          />
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '2px' }}>
              {association.president.name}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              会长 · ID: {association.president.id}
            </div>
          </div>
        </div>
      </div>

      {/* 协会统计 */}
      <div style={{
        background: 'white',
        margin: '0 12px 12px 12px',
        borderRadius: '12px',
        padding: '16px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 12px 0' }}>协会统计</h3>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-around',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <div 
            onClick={handleMemberCountClick}
            style={{ 
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              transition: 'background-color 0.2s',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ 
              fontSize: '24px', 
              fontWeight: '600', 
              color: '#FF6B35',
              lineHeight: '1.2',
              marginBottom: '4px'
            }}>
              {association.memberCount}
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#666',
              lineHeight: '1'
            }}>
              成员数量
            </div>
          </div>
          
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: '600', 
              color: '#4A90E2',
              lineHeight: '1.2',
              marginBottom: '4px'
            }}>
              {association.activityCount}
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#666',
              lineHeight: '1'
            }}>
              举办活动
            </div>
          </div>
          
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: '600', 
              color: '#50C878',
              lineHeight: '1.2',
              marginBottom: '4px'
            }}>
              {association.maxMembers - association.memberCount}
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#666',
              lineHeight: '1'
            }}>
              剩余名额
            </div>
          </div>
        </div>
      </div>

      {/* 协会活动（如果有的话） */}
      {association.activities && association.activities.length > 0 && (
        <div style={{
          background: 'white',
          margin: '0 12px 12px 12px',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 12px 0' }}>近期活动</h3>
          {association.activities.map(activity => (
            <div key={activity.id} style={{
              padding: '12px 0',
              borderBottom: '1px solid #f0f0f0'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                {activity.title}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {activity.date} · {activity.participants}人参与
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 成员列表弹窗 */}
      {showMemberList && (
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
            maxHeight: '80vh',
            borderRadius: '16px 16px 0 0',
            overflow: 'hidden'
          }}>
            {/* 弹窗头部 */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <LeftOutline 
                  onClick={() => setShowMemberList(false)}
                  style={{ fontSize: '20px', marginRight: '12px', cursor: 'pointer' }}
                />
                <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                  报名人数
                </h3>
              </div>
              <span style={{ fontSize: '14px', color: '#666' }}>
                (共{association.memberCount}人)
              </span>
            </div>

            {/* 成员列表 */}
            <div style={{
              maxHeight: 'calc(80vh - 80px)',
              overflowY: 'auto',
              padding: '0 20px'
            }}>
              {membersLoading ? (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '200px',
                  color: '#666'
                }}>
                  加载中...
                </div>
              ) : members.length > 0 ? (
                members.map((member, index) => (
                  <div key={member._id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: index < members.length - 1 ? '1px solid #f0f0f0' : 'none'
                  }}>
                    <img 
                      src={getAvatarUrl(member.avatar)}
                      alt={member.name}
                      style={{
                        width: '40px',
                        height: '40px',
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
                          {member.name}
                        </span>
                        {member.role && (
                          <span style={{
                            background: member.role === '会长' ? '#FF6B35' : 
                                        member.role === '副会长' ? '#4A90E2' : '#50C878',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px'
                          }}>
                            ({member.role})
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#999'
                      }}>
                        {formatJoinTime(member.joinTime)}
                      </div>
                    </div>
                    {member.role === '会长' && (
                      <span style={{
                        fontSize: '12px',
                        color: '#FF6B35',
                        cursor: 'pointer'
                      }}>
                        联系会长
                      </span>
                    )}
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
                  暂无成员
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssociationDetail;











