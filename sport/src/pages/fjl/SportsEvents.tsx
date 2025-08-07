import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Typography,
  Card,
  Button,
  Space,
  Row,
  Col,
  Tag,
  Avatar,
  Flex,
  Badge,
  ConfigProvider,
  Affix,
  Statistic
} from 'antd';
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  FireOutlined,
  UserOutlined,
  CalendarOutlined,
  TrophyOutlined,
  StarOutlined
} from '@ant-design/icons';
import LazyImage from '../../components/LazyImage';
import './SportsEvents.css';

const { Title, Text } = Typography;
const { Header, Content } = Layout;

interface ExamItem {
  id: string;
  name: string;
  icon: string;
  category: string;
  difficulty: string;
  status: 'available' | 'completed' | 'locked';
  score?: number;
}

interface TrainingCourse {
  id: string;
  title: string;
  instructor: string;
  price: number;
  originalPrice?: number;
  duration: string;
  level: string;
  students: number;
  rating: number;
  image: string;
  tags: string[];
  isHot?: boolean;
}

interface Question {
  questionId: string;
  question: string;
  type: 'single-choice' | 'multiple-choice' | 'text' | 'scale';
  options: Array<{
    optionId: string;
    text: string;
    value: any;
  }>;
  required: boolean;
  order: number;
}

interface Questionnaire {
  _id: string;
  title: string;
  description: string;
  questions: Question[];
}

const SportsEvents: React.FC = () => {
  const navigate = useNavigate();
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // 获取问卷数据
  useEffect(() => {
    fetchQuestionnaire();
  }, []);

  const fetchQuestionnaire = async () => {
    try {
      // 使用模拟数据替代真实 API 请求
      const { mockSportsEventsApi } = await import('../../data/mockSportsEventsData');
      const response = await mockSportsEventsApi.getQuestionnaire();
      
      if (response.success) {
        setQuestionnaire(response.data);
      }
    } catch (error) {
      console.error('获取问卷失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 提交答案并跳转到下一题
  const handleAnswer = async (questionId: string, answer: any) => {
    // 保存答案
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);

    // 提交到后端
    try {
      console.log('📝 提交答案:', { questionId, answer });
      const { mockSportsEventsApi } = await import('../../data/mockSportsEventsData');
      const response = await mockSportsEventsApi.submitQuestionnaireResponse({
        questionnaireId: questionnaire?._id,
        userId: 'current_user', // 实际应用中应该是真实用户ID
        questionId,
        answer
      });
      
      console.log('📤 答案提交结果:', response);
    } catch (error) {
      console.error('❌ 提交答案失败:', error);
    }

    // 延迟跳转到下一题，让用户看到选择效果
    setTimeout(() => {
      if (questionnaire && currentQuestionIndex < questionnaire.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // 完成问卷
        completeQuestionnaire();
      }
    }, 800);
  };

  const completeQuestionnaire = async () => {
    try {
      const { mockSportsEventsApi } = await import('../../data/mockSportsEventsData');
      await mockSportsEventsApi.completeQuestionnaire({
        questionnaireId: questionnaire?._id,
        userId: 'current_user'
      });
      
      setIsCompleted(true);
    } catch (error) {
      console.error('完成问卷失败:', error);
    }
  };

  // 获取推荐结果
  const fetchRecommendations = async () => {
    try {
      console.log('🔍 开始获取推荐结果...');
      const { mockSportsEventsApi } = await import('../../data/mockSportsEventsData');
      const response = await mockSportsEventsApi.getRecommendations('current_user');
      console.log('📊 API返回数据:', response);
      
      if (response.success) {
        setRecommendations(response.data);
        setShowRecommendations(true);
        console.log('✅ 推荐数据设置成功');
      } else {
        console.error('❌ API返回失败:', response.message);
        // 如果没有问卷数据，使用本地模拟推荐
        const mockRecommendations = generateMockRecommendations();
        setRecommendations(mockRecommendations);
        setShowRecommendations(true);
        console.log('🎯 使用模拟推荐数据');
      }
    } catch (error) {
      console.error('❌ 获取推荐失败:', error);
      // 错误时也使用模拟数据
      const mockRecommendations = generateMockRecommendations();
      setRecommendations(mockRecommendations);
      setShowRecommendations(true);
      console.log('🎯 错误时使用模拟推荐数据');
    }
  };

  // 生成模拟推荐数据
  const generateMockRecommendations = () => {
    return {
      examItems: [
        {
          _id: '1',
          name: '1000米跑步',
          icon: '🏃‍♂️',
          category: '耐力',
          difficulty: '中等',
          priority: 'high',
          reason: '必考项目，建议优先训练',
          trainingTips: [
            '每周至少3次有氧训练',
            '循序渐进增加跑步距离',
            '注意跑步姿势和呼吸节奏'
          ]
        },
        {
          _id: '4',
          name: '引体向上',
          icon: '🤸‍♂️',
          category: '力量',
          difficulty: '中等',
          priority: 'medium',
          reason: '上肢力量训练，提高综合体能',
          trainingTips: [
            '先从悬挂开始练习',
            '逐步增加引体向上次数',
            '配合其他上肢力量训练'
          ]
        }
      ],
      trainingCourses: [
        {
          _id: '1',
          title: '中考体育冲刺班',
          instructor: '双十名师团队',
          price: 1980,
          originalPrice: 2980,
          duration: '60天',
          level: '中级',
          rating: 4.9,
          priority: 'high',
          reason: '全面系统的中考体育训练',
          features: ['基础动作教学', '体能循序渐进', '专业指导']
        }
      ],
      personalizedPlan: {
        title: '个性化中考体育训练计划',
        description: '根据您的情况制定的专属训练方案',
        weeklySchedule: [
          { day: '周一', activity: '跑步训练30分钟', intensity: '中等' },
          { day: '周三', activity: '力量训练', intensity: '中等' },
          { day: '周五', activity: '技能练习', intensity: '轻松' }
        ],
        tips: [
          '每次运动前充分热身',
          '注意训练强度的渐进增加',
          '运动后注意拉伸放松'
        ]
      }
    };
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: 16
      }}>
        <div style={{ fontSize: 24 }}>📋</div>
        <Text>正在加载问卷...</Text>
      </div>
    );
  }

  if (!questionnaire) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Text>问卷加载失败</Text>
      </div>
    );
  }

  const currentQuestion = questionnaire.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questionnaire.questions.length) * 100;

  // 考试项目数据
  const examItems: ExamItem[] = [
    {
      id: '1',
      name: '1000米跑步',
      icon: '🏃‍♂️',
      category: '耐力',
      difficulty: '中等',
      status: 'available',
      score: 22
    },
    {
      id: '2',
      name: '1000米游泳',
      icon: '🏊‍♂️',
      category: '耐力',
      difficulty: '困难',
      status: 'available',
      score: 23
    },
    {
      id: '3',
      name: '引体向上',
      icon: '🤸‍♂️',
      category: '力量',
      difficulty: '中等',
      status: 'completed',
      score: 22
    },
    {
      id: '4',
      name: '仰卧起坐',
      icon: '💪',
      category: '力量',
      difficulty: '简单',
      status: 'available',
      score: 23
    },
    {
      id: '5',
      name: '前滚实心球',
      icon: '⚽',
      category: '技巧',
      difficulty: '中等',
      status: 'available',
      score: 22
    },
    {
      id: '6',
      name: '足球',
      icon: '⚽',
      category: '球类',
      difficulty: '中等',
      status: 'available',
      score: 23
    }
  ];

  // 培训课程数据
  const trainingCourses: TrainingCourse[] = [
    {
      id: '1',
      title: '超跑培训营',
      instructor: '双十名师教学，男生女生，限时特惠',
      price: 230.00,
      originalPrice: 380.00,
      duration: '30天',
      level: '初级',
      students: 1234,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=300&h=200&fit=crop',
      tags: ['限时优惠'],
      isHot: true
    },
    {
      id: '2',
      title: '中考体育培训营',
      instructor: '双十名师教学，男生女生，限时特惠',
      price: 230.00,
      originalPrice: 380.00,
      duration: '45天',
      level: '中级',
      students: 2156,
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop',
      tags: ['王牌'],
      isHot: false
    },
    {
      id: '3',
      title: '超哥篮球考试培训',
      instructor: '双十名师教学，男生女生',
      price: 280.00,
      duration: '60天',
      level: '高级',
      students: 987,
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=300&h=200&fit=crop',
      tags: ['篮球'],
      isHot: false
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case '简单': return 'green';
      case '中等': return 'orange';
      case '困难': return 'red';
      default: return 'blue';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'blue';
      case 'completed': return 'green';
      case 'locked': return 'gray';
      default: return 'blue';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return '可考试';
      case 'completed': return '已完成';
      case 'locked': return '未解锁';
      default: return '可考试';
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4A90E2',
          borderRadius: 12,
        },
      }}
    >
      <Layout style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        {/* 固定顶部导航 */}
        <Affix offsetTop={0}>
          <Header style={{ 
            backgroundColor: 'white',
            borderBottom: '1px solid #f0f0f0',
            padding: '0 16px',
            height: 'auto',
            lineHeight: 'normal',
            paddingTop: 12,
            paddingBottom: 12,
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
          }}>
            <Flex justify="space-between" align="center">
              <Button 
                type="text" 
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(-1)}
                size="large"
                shape="circle"
              />
              
              <Title 
                level={3} 
                style={{ 
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 600
                }}
              >
                体育中考
              </Title>
              
              <div style={{ width: 40 }} />
            </Flex>
          </Header>
        </Affix>

        <Content style={{ padding: '16px' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            
            {/* 倒计时卡片 */}
            <Card 
              className="animate__animated animate__fadeInUp"
              style={{ 
                background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
                border: 'none',
                color: 'white',
                animationDelay: '0.1s'
              }}
              styles={{ body: { padding: 20 } }}
            >
              <Flex justify="space-between" align="center">
                <div>
                  <Text style={{ color: 'white', fontSize: 14, opacity: 0.9 }}>
                    距离体育中考还剩
                  </Text>
                  <div style={{ marginTop: 8 }}>
                    <Statistic
                      value={90}
                      suffix="天"
                      valueStyle={{ 
                        color: 'white', 
                        fontSize: 32, 
                        fontWeight: 'bold' 
                      }}
                    />
                  </div>
                </div>
                <ClockCircleOutlined style={{ fontSize: 40, opacity: 0.8 }} />
              </Flex>
            </Card>

            {/* 推荐结果展示 */}
            {showRecommendations && recommendations ? (
              <div>
                {/* 返回按钮 */}
                <Card style={{ marginBottom: 16 }}>
                  <Button 
                    icon={<ArrowLeftOutlined />}
                    onClick={() => setShowRecommendations(false)}
                    type="text"
                  >
                    返回问卷结果
                  </Button>
                </Card>

                {/* 个性化训练计划 */}
            <Card 
              className="animate__animated animate__fadeInUp"
                  title={
                    <Flex align="center" gap="small">
                      <span style={{ fontSize: 20 }}>🎯</span>
                      <span>{recommendations.personalizedPlan.title}</span>
                    </Flex>
                  }
                  style={{ marginBottom: 16 }}
            >
                  <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    {recommendations.personalizedPlan.description}
                  </Text>
                  
                  <Title level={5} style={{ marginBottom: 12 }}>📅 每周训练安排</Title>
                  <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
                    {recommendations.personalizedPlan.weeklySchedule.map((schedule: any, index: number) => (
                      <Col span={12} key={index}>
                        <Card size="small" style={{ textAlign: 'center', backgroundColor: '#f8f9ff' }}>
                          <Text strong style={{ display: 'block', fontSize: 12 }}>{schedule.day}</Text>
                          <Text style={{ fontSize: 11, color: '#666' }}>{schedule.activity}</Text>
                          <div>
                            <Tag 
                              color={
                                schedule.intensity === '高' ? 'red' : 
                                schedule.intensity === '中高' ? 'orange' :
                                schedule.intensity === '中等' ? 'blue' : 'green'
                              }
                              style={{ fontSize: 10, marginTop: 4 }}
                            >
                              {schedule.intensity}
                            </Tag>
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>

                  <Title level={5} style={{ marginBottom: 12 }}>💡 训练建议</Title>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    {recommendations.personalizedPlan.tips.map((tip: string, index: number) => (
                      <div key={index} style={{ 
                        padding: '8px 12px', 
                        backgroundColor: '#f6ffed', 
                        borderLeft: '3px solid #52c41a',
                        borderRadius: 4
                      }}>
                        <Text style={{ fontSize: 13 }}>{tip}</Text>
                      </div>
                    ))}
                  </Space>
                </Card>

                {/* 推荐考试项目 */}
                <Card 
                  className="animate__animated animate__fadeInUp"
                  title={
                    <Flex align="center" gap="small">
                      <span style={{ fontSize: 20 }}>🏆</span>
                      <span>推荐考试项目</span>
                    </Flex>
                  }
                  style={{ marginBottom: 16, animationDelay: '0.1s' }}
                >
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    {recommendations.examItems.map((item: any, index: number) => (
                      <Card
                        key={item._id}
                        size="small"
                        style={{ 
                          border: `2px solid ${item.priority === 'high' ? '#ff4d4f' : item.priority === 'medium' ? '#faad14' : '#d9d9d9'}`,
                          borderRadius: 12
                        }}
                      >
                        <Flex justify="space-between" align="flex-start">
                          <Flex gap="middle" align="flex-start" style={{ flex: 1 }}>
                            <div style={{ fontSize: 32, lineHeight: 1 }}>{item.icon}</div>
                            <div style={{ flex: 1 }}>
                              <Flex align="center" gap="small" style={{ marginBottom: 8 }}>
                                <Text strong style={{ fontSize: 16 }}>{item.name}</Text>
                                <Tag color={item.priority === 'high' ? 'red' : item.priority === 'medium' ? 'orange' : 'default'}>
                                  {item.priority === 'high' ? '强烈推荐' : item.priority === 'medium' ? '推荐' : '可选'}
                                </Tag>
                              </Flex>
                              <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
                                {item.reason}
                              </Text>
                              <div>
                                <Text strong style={{ fontSize: 12, color: '#666' }}>训练要点：</Text>
                                <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                                  {item.trainingTips.map((tip: string, tipIndex: number) => (
                                    <li key={tipIndex} style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>
                                      {tip}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </Flex>
                        </Flex>
                      </Card>
                    ))}
                  </Space>
                </Card>

                {/* 推荐培训课程 */}
                <Card 
                  className="animate__animated animate__fadeInUp"
                  title={
                    <Flex align="center" gap="small">
                      <span style={{ fontSize: 20 }}>📚</span>
                      <span>推荐培训课程</span>
                    </Flex>
                  }
                  style={{ animationDelay: '0.2s' }}
                >
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    {recommendations.trainingCourses.map((course: any, index: number) => (
                      <Card
                        key={course._id}
                        size="small"
                        style={{ 
                          border: `1px solid ${course.priority === 'high' ? '#ff4d4f' : '#d9d9d9'}`,
                          borderRadius: 12
                        }}
                      >
                        <Flex justify="space-between" align="flex-start">
                          <div style={{ flex: 1 }}>
                            <Flex align="center" gap="small" style={{ marginBottom: 8 }}>
                              <Text strong style={{ fontSize: 16 }}>{course.title}</Text>
                              {course.priority === 'high' && <Tag color="red">优先推荐</Tag>}
                            </Flex>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
                              {course.reason}
                            </Text>
                            <Flex wrap="wrap" gap="small" style={{ marginBottom: 8 }}>
                              {course.features.map((feature: string, featureIndex: number) => (
                                <Tag key={featureIndex} color="blue" style={{ fontSize: 11 }}>
                                  {feature}
                                </Tag>
                              ))}
                            </Flex>
                            <Flex justify="space-between" align="center">
                              <Space>
                                <Text strong style={{ color: '#ff4d4f', fontSize: 16 }}>
                                  ¥{course.price.toFixed(0)}
                                </Text>
                                {course.originalPrice && (
                                  <Text delete type="secondary" style={{ fontSize: 12 }}>
                                    ¥{course.originalPrice.toFixed(0)}
                                  </Text>
                                )}
                              </Space>
                              <Button type="primary" size="small" style={{ borderRadius: 8 }}>
                                立即报名
                </Button>
                            </Flex>
                          </div>
                        </Flex>
                      </Card>
                    ))}
              </Space>
            </Card>
              </div>
                         ) : 
             
             /* 问卷调查 */
             !isCompleted ? (
              <Card 
                className="animate__animated animate__fadeInUp"
                style={{ animationDelay: '0.2s' }}
              >
                {/* 进度条 */}
                <div style={{ marginBottom: 24 }}>
                  <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                    <Text strong>{questionnaire.title}</Text>
                    <Text type="secondary">
                      {currentQuestionIndex + 1}/{questionnaire.questions.length}
                    </Text>
                  </Flex>
                  <div style={{ 
                    width: '100%', 
                    height: 4, 
                    backgroundColor: '#f0f0f0', 
                    borderRadius: 2,
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: `${progress}%`, 
                      height: '100%', 
                      backgroundColor: '#4A90E2',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                {/* 当前问题 */}
                <div style={{ marginBottom: 24 }}>
                  <Title level={4} style={{ marginBottom: 16, fontSize: 18 }}>
                    {currentQuestion.question}
                  </Title>
                  
                  {/* 单选题 */}
                  {currentQuestion.type === 'single-choice' && (
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      {currentQuestion.options.map((option) => (
                        <Button
                          key={option.optionId}
                          type={answers[currentQuestion.questionId] === option.value ? 'primary' : 'default'}
                          size="large"
                          onClick={() => handleAnswer(currentQuestion.questionId, option.value)}
                          style={{ 
                            width: '100%',
                            textAlign: 'left',
                            height: 'auto',
                            padding: '12px 20px',
                            borderRadius: 12,
                            transition: 'all 0.3s ease'
                          }}
                          className={answers[currentQuestion.questionId] === option.value ? 'selected-option' : ''}
                        >
                          <Flex align="center" gap="small">
                            <div style={{ 
                              width: 20, 
                              height: 20, 
                              borderRadius: '50%',
                              border: `2px solid ${answers[currentQuestion.questionId] === option.value ? '#fff' : '#d9d9d9'}`,
                              backgroundColor: answers[currentQuestion.questionId] === option.value ? '#fff' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {answers[currentQuestion.questionId] === option.value && (
                                <div style={{ 
                                  width: 8, 
                                  height: 8, 
                                  borderRadius: '50%', 
                                  backgroundColor: '#4A90E2' 
                                }} />
                              )}
                            </div>
                            <span>{option.text}</span>
                          </Flex>
                        </Button>
                      ))}
                    </Space>
                  )}

                  {/* 多选题 */}
                  {currentQuestion.type === 'multiple-choice' && (
                    <div>
                      <Space direction="vertical" size="middle" style={{ width: '100%', marginBottom: 16 }}>
                        {currentQuestion.options.map((option) => {
                          const currentAnswers = answers[currentQuestion.questionId] || [];
                          const isSelected = currentAnswers.includes(option.value);
                          
                          return (
                            <Button
                              key={option.optionId}
                              type={isSelected ? 'primary' : 'default'}
                              size="large"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                const currentSelectedAnswers: any[] = answers[currentQuestion.questionId] || [];
                                let newAnswers: any[];
                                
                                if (currentSelectedAnswers.includes(option.value)) {
                                  // 如果已选中，则取消选择
                                  newAnswers = currentSelectedAnswers.filter((a: any) => a !== option.value);
                                } else {
                                  // 如果未选中，则添加到选择中
                                  newAnswers = [...currentSelectedAnswers, option.value];
                                }
                                
                                setAnswers(prev => ({ 
                                  ...prev, 
                                  [currentQuestion.questionId]: newAnswers 
                                }));
                              }}
                              style={{ 
                                width: '100%',
                                textAlign: 'left',
                                height: 'auto',
                                padding: '12px 20px',
                                borderRadius: 12,
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <Flex align="center" gap="small">
                                <div style={{ 
                                  width: 20, 
                                  height: 20, 
                                  borderRadius: 4,
                                  border: `2px solid ${isSelected ? '#fff' : '#d9d9d9'}`,
                                  backgroundColor: isSelected ? '#fff' : 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  {isSelected && (
                                    <div style={{ 
                                      color: '#4A90E2', 
                                      fontSize: 14, 
                                      fontWeight: 'bold',
                                      lineHeight: 1
                                    }}>✓</div>
                                  )}
                                </div>
                                <span>{option.text}</span>
                              </Flex>
                            </Button>
                          );
                        })}
                      </Space>
                      
                      <Button
                        type="primary"
                        size="large"
                        onClick={() => {
                          const selectedAnswers = answers[currentQuestion.questionId] || [];
                          handleAnswer(currentQuestion.questionId, selectedAnswers);
                        }}
                        disabled={!answers[currentQuestion.questionId] || answers[currentQuestion.questionId].length === 0}
                        style={{ 
                          width: '100%', 
                          borderRadius: 12,
                          marginTop: 8
                        }}
                      >
                        下一题 ({(answers[currentQuestion.questionId] || []).length} 项已选)
                      </Button>
                    </div>
                  )}

                  {/* 量表题 */}
                  {currentQuestion.type === 'scale' && (
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      <div style={{ textAlign: 'center', marginBottom: 16 }}>
                        <Text type="secondary" style={{ fontSize: 14 }}>
                          请选择您的偏好程度
                        </Text>
                      </div>
                      
                      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        {currentQuestion.options.map((option, index) => (
                          <Button
                            key={option.optionId}
                            type={answers[currentQuestion.questionId] === option.value ? 'primary' : 'default'}
                            size="large"
                            onClick={() => handleAnswer(currentQuestion.questionId, option.value)}
                            style={{ 
                              width: '100%',
                              textAlign: 'center',
                              height: 'auto',
                              padding: '16px 20px',
                              borderRadius: 12,
                              transition: 'all 0.3s ease',
                              background: answers[currentQuestion.questionId] === option.value 
                                ? `linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)` 
                                : 'white',
                              border: `2px solid ${answers[currentQuestion.questionId] === option.value ? '#4A90E2' : '#f0f0f0'}`,
                              boxShadow: answers[currentQuestion.questionId] === option.value 
                                ? '0 4px 12px rgba(74, 144, 226, 0.3)' 
                                : '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                          >
                            <Flex align="center" justify="space-between" style={{ width: '100%' }}>
                              <div style={{ 
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                background: answers[currentQuestion.questionId] === option.value 
                                  ? 'rgba(255,255,255,0.2)' 
                                  : '#f8f9fa',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 16,
                                fontWeight: 'bold',
                                color: answers[currentQuestion.questionId] === option.value ? 'white' : '#666'
                              }}>
                                {option.value}
                              </div>
                              <span style={{ 
                                flex: 1, 
                                textAlign: 'center',
                                fontSize: 16,
                                color: answers[currentQuestion.questionId] === option.value ? 'white' : '#333'
                              }}>
                                {option.text}
                              </span>
                              <div style={{ width: 32 }} />
                            </Flex>
                          </Button>
                        ))}
                      </Space>
                      
                      <div style={{ 
                        textAlign: 'center', 
                        marginTop: 16,
                        padding: '12px',
                        background: '#f8f9fa',
                        borderRadius: 8
                      }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          1分表示强度最低，5分表示强度最高
                        </Text>
                      </div>
                    </Space>
                  )}
                </div>
              </Card>
            ) : (
              // 完成问卷后显示
              <Card 
                className="animate__animated animate__fadeInUp"
                style={{ 
                  textAlign: 'center',
                  animationDelay: '0.2s'
                }}
              >
                <div style={{ padding: '20px 0' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                  <Title level={3} style={{ marginBottom: 8 }}>问卷完成！</Title>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                    感谢您的配合，我们会根据您的回答为您推荐合适的训练项目
                  </Text>
                  <Button 
                    type="primary" 
                    size="large"
                    onClick={fetchRecommendations}
                    style={{ borderRadius: 12 }}
                  >
                    查看推荐项目
                  </Button>
                </div>
              </Card>
            )}

            {/* 考试通知 */}
            <Card 
              className="animate__animated animate__fadeInLeft"
              style={{ 
                borderLeft: '4px solid #4A90E2',
                animationDelay: '0.3s'
              }}
            >
              <Flex align="center" justify="space-between">
                <Flex align="center" gap="small">
                  <CalendarOutlined style={{ color: '#4A90E2', fontSize: 16 }} />
                  <Text strong>2020年厦门体育中考报名须知</Text>
                </Flex>
                <Button type="text" size="small">
                  详情 →
                </Button>
              </Flex>
            </Card>

            {/* 考试项目 */}
            <Card 
              title="考试项目教程"
              extra={<Text type="secondary">全部项目 &gt;</Text>}
              className="animate__animated animate__fadeInUp"
              style={{ animationDelay: '0.4s' }}
            >
              <Row gutter={[16, 16]}>
                {examItems.map((item, index) => (
                  <Col span={12} key={item.id}>
                    <Card
                      size="small"
                      className="exam-item-card animate__animated animate__bounceIn"
                      style={{
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        animationDelay: `${0.5 + index * 0.1}s`
                      }}
                      styles={{ body: { padding: 16 } }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                      }}
                    >
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <div style={{ fontSize: 32 }}>{item.icon}</div>
                        <Text strong style={{ fontSize: 14 }}>{item.name}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {item.score}个教程
                        </Text>
                        <Space size="small">
                          <Tag color={getDifficultyColor(item.difficulty)}>
                            {item.difficulty}
                          </Tag>
                          <Tag color={getStatusColor(item.status)}>
                            {getStatusText(item.status)}
                          </Tag>
                        </Space>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>

            {/* 考试培训 */}
            <Card 
              title="考试培训"
              className="animate__animated animate__fadeInUp"
              style={{ animationDelay: '0.6s' }}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {trainingCourses.map((course, index) => (
                  <Card
                    key={course.id}
                    size="small"
                    className="training-course-card animate__animated animate__fadeInRight"
                    style={{
                      borderRadius: 12,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      animationDelay: `${0.7 + index * 0.1}s`
                    }}
                    styles={{ body: { padding: 12 } }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateX(4px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                    }}
                  >
                    <Row gutter={12} align="middle">
                      <Col flex="none">
                        <div style={{ position: 'relative' }}>
                          <LazyImage
                            src={course.image}
                            alt={course.title}
                            width={80}
                            height={60}
                            style={{ borderRadius: 8 }}
                          />
                          {course.isHot && (
                            <Badge.Ribbon text="HOT" color="red" style={{ top: -8, right: -8 }} />
                          )}
                        </div>
                      </Col>
                      <Col flex="auto">
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <Flex justify="space-between" align="flex-start">
                            <div style={{ flex: 1 }}>
                              <Space size="small" wrap>
                                {course.tags.map(tag => (
                                  <Tag 
                                    key={tag} 
                                    color={tag === '限时优惠' ? 'red' : 'blue'} 
                                  >
                                    {tag}
                                  </Tag>
                                ))}
                              </Space>
                              <div>
                                <Text strong style={{ fontSize: 14, display: 'block' }}>
                                  {course.title}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {course.instructor}
                                </Text>
                              </div>
                            </div>
                          </Flex>
                          
                          <Flex justify="space-between" align="center">
                            <Space size="small">
                              <Text strong style={{ color: '#FF4D4F', fontSize: 16 }}>
                                ¥{course.price.toFixed(2)}
                              </Text>
                              {course.originalPrice && (
                                <Text delete type="secondary" style={{ fontSize: 12 }}>
                                  ¥{course.originalPrice.toFixed(2)}
                                </Text>
                              )}
                            </Space>
                            <Button 
                              type="primary" 
                              size="small"
                              style={{ borderRadius: 16 }}
                            >
                              立即报名
                            </Button>
                          </Flex>
                        </Space>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </Space>
            </Card>

          </Space>
        </Content>
      </Layout>
    </ConfigProvider>
  );
};

export default SportsEvents; 