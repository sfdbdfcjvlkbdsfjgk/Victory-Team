import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';

interface RegistrationItem {
  itemName: string;
  cost: number;
  maxPeople: number;
  requireInsurance: boolean;
  consultationPhone: string;
  currentParticipants?: number; // 当前已报名人数
}

interface ActivityData {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
  registrationItems?: RegistrationItem[];
}

export default function RegistrationSelection() {
  const navigate = useNavigate();
  const { activityId } = useParams<{ activityId: string }>();
  const [searchParams] = useSearchParams();
  const registrationType = searchParams.get('type'); // 个人、家庭、团队
  
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [selectedItem, setSelectedItem] = useState<RegistrationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activityId) {
      fetchActivityData();
    }
  }, [activityId]);

  const fetchActivityData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3000/wsj/ss/${activityId}`);
      console.log('活动数据:', response.data);
      
      if (response.data.code === 200) {
        setActivity(response.data.data);
        setError(null);
      } else {
        throw new Error(response.data.msg || '获取数据失败');
      }
    } catch (err) {
      console.error('获取活动数据失败:', err);
      setError('获取活动数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/activity-detail/${activityId}`);
  };

  const handleItemSelect = (item: RegistrationItem) => {
    setSelectedItem(item);
  };

  const handleContinue = () => {
    if (!selectedItem) {
      alert('请选择一个报名项目');
      return;
    }

    // 根据报名类型跳转到对应的报名页面
    switch (registrationType) {
      case 'personal':
        navigate(`/personal-registration/${activityId}?itemId=${selectedItem.itemName}`);
        break;
      case 'family':
        navigate(`/family-registration/${activityId}?itemId=${selectedItem.itemName}`);
        break;
      case 'team':
        navigate(`/team-registration/${activityId}?itemId=${selectedItem.itemName}`);
        break;
      default:
        navigate(`/personal-registration/${activityId}?itemId=${selectedItem.itemName}`);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ 
          width: '20px', 
          height: '20px', 
          border: '2px solid #f3f3f3',
          borderTop: '2px solid #409eff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 10px'
        }}></div>
        <p>加载中...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        <p>{error}</p>
        <button 
          onClick={fetchActivityData}
          style={{
            background: '#409eff',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          重试
        </button>
      </div>
    );
  }

  if (!activity || !activity.registrationItems || activity.registrationItems.length === 0) {
    return (
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        minHeight: '100vh'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '20px',
          padding: '10px 0',
          borderBottom: '1px solid #e5e5e5'
        }}>
          <button 
            onClick={handleBack}
            style={{ 
              marginRight: '12px',
              background: 'none',
              border: 'none',
              fontSize: '16px',
              cursor: 'pointer',
              color: '#409eff'
            }}
          >
            ← 返回
          </button>
          <h2 style={{ 
            margin: 0, 
            fontSize: '18px', 
            color: '#333',
            fontWeight: '600'
          }}>
            选择报名项目
          </h2>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '40px 20px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <p style={{ color: '#666', fontSize: '16px' }}>
            暂无报名项目
          </p>
        </div>
      </div>
    );
  }

  const getRegistrationTypeText = () => {
    switch (registrationType) {
      case 'personal':
        return '个人报名';
      case 'family':
        return '家庭报名';
      case 'team':
        return '团队报名';
      default:
        return '报名';
    }
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '15px',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      {/* 头部 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '10px 0',
        borderBottom: '1px solid #e5e5e5'
      }}>
        <button 
          onClick={handleBack}
          style={{ 
            marginRight: '12px',
            background: 'none',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            color: '#409eff'
          }}
        >
          ← 返回
        </button>
        <h2 style={{ 
          margin: 0, 
          fontSize: '18px', 
          color: '#333',
          fontWeight: '600'
        }}>
          {getRegistrationTypeText()}
        </h2>
      </div>

      {/* 选择提示 */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <p style={{
          fontSize: '16px',
          color: '#333',
          margin: '0 0 15px 0',
          fontWeight: '500'
        }}>
          * 选择报名项目
        </p>
        
        {/* 项目选择卡片 */}
        <div style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '10px'
        }}>
          {activity.registrationItems.map((item, index) => (
            <div
              key={index}
              onClick={() => handleItemSelect(item)}
              style={{
                minWidth: '120px',
                height: '80px',
                backgroundColor: selectedItem === item ? '#ff4757' : 'white',
                border: selectedItem === item ? 'none' : '1px solid #e5e5e5',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: selectedItem === item ? '0 2px 8px rgba(255, 71, 87, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: selectedItem === item ? 'white' : '#333',
                marginBottom: '4px'
              }}>
                {item.itemName}
              </div>
              <div style={{
                fontSize: '12px',
                color: selectedItem === item ? '#ffd700' : '#ff6b35',
                fontWeight: '500'
              }}>
                {item.cost === 0 || item.cost === null || item.cost === undefined ? '免费' : `¥${(item.cost || 0).toFixed(2)}`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 项目详情 */}
      {selectedItem && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            fontSize: '16px',
            color: '#333',
            margin: '0 0 15px 0',
            fontWeight: '600'
          }}>
            项目详情
          </h3>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            marginBottom: '10px'
          }}>
            <span style={{ fontSize: '14px', color: '#666' }}>项目名称</span>
            <span style={{ fontSize: '14px', color: '#333', fontWeight: '500' }}>
              {selectedItem.itemName}
            </span>
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            marginBottom: '10px'
          }}>
            <span style={{ fontSize: '14px', color: '#666' }}>报名费用</span>
            <span style={{ fontSize: '14px', color: '#ff6b35', fontWeight: '500' }}>
              {selectedItem.cost === 0 || selectedItem.cost === null || selectedItem.cost === undefined ? '免费' : `¥${(selectedItem.cost || 0).toFixed(2)}`}
            </span>
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            marginBottom: '10px'
          }}>
            <span style={{ fontSize: '14px', color: '#666' }}>最大报名人数</span>
            <span style={{ fontSize: '14px', color: '#333', fontWeight: '500' }}>
              {selectedItem.maxPeople}人
            </span>
          </div>
          
          {selectedItem.currentParticipants !== undefined && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <span style={{ fontSize: '14px', color: '#666' }}>已报名</span>
              <span style={{ fontSize: '14px', color: '#333', fontWeight: '500' }}>
                {selectedItem.currentParticipants}人
              </span>
            </div>
          )}
        </div>
      )}

      {/* 继续按钮 */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <button
          onClick={handleContinue}
          disabled={!selectedItem}
          style={{
            width: '100%',
            padding: '15px',
            backgroundColor: selectedItem ? '#ff6b35' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: selectedItem ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.2s'
          }}
        >
          {selectedItem ? '继续报名' : '请选择报名项目'}
        </button>
      </div>
    </div>
  );
} 