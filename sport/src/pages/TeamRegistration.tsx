import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { validateTeamForm, validateField } from '../utils/validation';

interface FormField {
  fieldName: string;
  required: boolean;
  type: string;
  hintText: string;
  isSystem: boolean;
}

interface AgeRestriction {
  birthStart: string;
  birthEnd: string;
  maxAge: number;
  minAge: number;
  type: string;
}

interface TeamMember {
  [key: string]: string; // 动态字段
}

interface TeamInfo {
  teamName: string;
  teamLeader: string;
  teamLeaderPhone: string;
  teamDescription: string;
  contactEmail: string;
  members: TeamMember[];
}

export default function TeamRegistration() {
  const navigate = useNavigate();
  const { activityId } = useParams<{ activityId: string }>();
  const [searchParams] = useSearchParams();
  const selectedItem = searchParams.get('itemId');
  
  const [formData, setFormData] = useState<TeamInfo>({
    teamName: '',
    teamLeader: '',
    teamLeaderPhone: '',
    teamDescription: '',
    contactEmail: '',
    members: [{}]
  });
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [ageRestrictions, setAgeRestrictions] = useState<AgeRestriction[]>([]);
  const [loading, setLoading] = useState(false);
  const [fieldsLoading, setFieldsLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [memberErrors, setMemberErrors] = useState<{ [key: string]: { [memberIndex: number]: string } }>({});

  const handleInputChange = (field: keyof Omit<TeamInfo, 'members'>, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 实时校验字段
    const validation = validateField(field, value);
    if (validation.isValid) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    } else {
      setFieldErrors(prev => ({
        ...prev,
        [field]: validation.message
      }));
    }
  };

  const handleMemberChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.map((member, i) => 
        i === index ? { ...member, [field]: value } : member
      )
    }));
    
    // 实时校验字段
    const validation = validateField(field, value);
    if (validation.isValid) {
      setMemberErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors[field]) {
          delete newErrors[field][index];
          if (Object.keys(newErrors[field]).length === 0) {
            delete newErrors[field];
          }
        }
        return newErrors;
      });
    } else {
      setMemberErrors(prev => ({
        ...prev,
        [field]: {
          ...prev[field],
          [index]: validation.message
        }
      }));
    }
  };

  const addMember = () => {
    // 获取当前表单字段中的性别默认值
    const genderField = formFields.find((field: FormField) => field.type === 'gender-restriction');
    const defaultGender = genderField?.hintText || '男';
    
    setFormData(prev => ({
      ...prev,
      members: [
        ...prev.members,
        {
          '性别': defaultGender // 使用后端返回的默认性别
        }
      ]
    }));
  };

  // 获取表单字段配置
  const fetchFormFields = async () => {
    try {
      setFieldsLoading(true);
      
      // 从活动详情接口获取表单字段配置
      const response = await axios.get(`http://localhost:3000/wsj/ss/${activityId}`);
      console.log('活动详情数据:', response.data);
      
      if (response.data.code === 200) {
        const data = response.data.data;
        console.log('后端返回的表单字段:', data.formFields);
        console.log('后端返回的年龄限制:', data.registrantAgeRestriction);
        
        // 解析年龄限制字符串
        let parsedAgeRestrictions = data.registrantAgeRestriction || [];
        if (data.formFields) {
          const ageField = data.formFields.find((field: FormField) => field.type === 'age-restriction');
          if (ageField && ageField.hintText) {
            console.log('找到年龄字段的hintText:', ageField.hintText);
            // 解析 "18-20岁" 格式的字符串
            const ageMatch = ageField.hintText.match(/(\d+)-(\d+)岁/);
            if (ageMatch) {
              const minAge = parseInt(ageMatch[1]);
              const maxAge = parseInt(ageMatch[2]);
              console.log('解析出的年龄范围:', { minAge, maxAge });
              parsedAgeRestrictions = [{
                minAge,
                maxAge,
                type: 'age-restriction'
              }];
            }
          }
        }
        
        console.log('解析后的年龄限制:', parsedAgeRestrictions);
        console.log('完整的后端数据:', data);
        setFormFields(data.formFields || []);
        setAgeRestrictions(parsedAgeRestrictions);
        
        // 初始化团队成员数据，设置性别默认值
        const genderField = data.formFields?.find((field: FormField) => field.type === 'gender-restriction');
        const defaultGender = genderField?.hintText || '男';
        console.log('后端返回的性别字段:', genderField);
        console.log('设置的默认性别:', defaultGender);
        const initialMembers = [{
          '性别': defaultGender
        }];
        setFormData(prev => ({
          ...prev,
          members: initialMembers
        }));
      } else {
        // 如果后端没有返回数据，使用默认字段
        const defaultFormFields: FormField[] = [
          // {
          //   fieldName: "姓名",
          //   required: true,
          //   type: "text",
          //   hintText: "请输入姓名",
          //   isSystem: true
          // },
          // {
          //   fieldName: "手机号",
          //   required: true,
          //   type: "text",
          //   hintText: "请输入手机号",
          //   isSystem: true
          // },
          // {
          //   fieldName: "证件类型/证件号",
          //   required: true,
          //   type: "text",
          //   hintText: "请输入证件号",
          //   isSystem: true
          // },
          // {
          //   fieldName: "紧急联系人",
          //   required: true,
          //   type: "text",
          //   hintText: "紧急电话",
          //   isSystem: false
          // },
          // {
          //   fieldName: "年龄限制",
          //   required: true,
          //   type: "age-restriction",
          //   hintText: "",
          //   isSystem: true
          // },
          // {
          //   fieldName: "性别限制",
          //   required: true,
          //   type: "gender-restriction",
          //   hintText: "",
          //   isSystem: true
          // }
        ];
        
        setFormFields(defaultFormFields);
        setAgeRestrictions([]);
        
        // 初始化团队成员数据，设置性别默认值
        const initialMembers = [{
          '性别': '男' // 默认值
        }];
        setFormData(prev => ({
          ...prev,
          members: initialMembers
        }));
      }
      
    } catch (error) {
      console.error('获取表单字段失败:', error);
      // 出错时使用默认字段
      const defaultFormFields: FormField[] = [
        // {
        //   fieldName: "姓名",
        //   required: true,
        //   type: "text",
        //   hintText: "请输入姓名",
        //   isSystem: true
        // },
        // {
        //   fieldName: "手机号",
        //   required: true,
        //   type: "text",
        //   hintText: "请输入手机号",
        //   isSystem: true
        // },
        // {
        //   fieldName: "证件类型/证件号",
        //   required: true,
        //   type: "text",
        //   hintText: "请输入证件号",
        //   isSystem: true
        // },
        // {
        //   fieldName: "紧急联系人",
        //   required: true,
        //   type: "text",
        //   hintText: "紧急电话",
        //   isSystem: false
        // },
        // {
        //   fieldName: "年龄限制",
        //   required: true,
        //   type: "age-restriction",
        //   hintText: "",
        //   isSystem: true
        // },
        // {
        //   fieldName: "性别限制",
        //   required: true,
        //   type: "gender-restriction",
        //   hintText: "",
        //   isSystem: true
        // }
      ];
      
      setFormFields(defaultFormFields);
      setAgeRestrictions([]);
      
      // 初始化团队成员数据，设置性别默认值
      const initialMembers = [{
        '性别': '男' // 默认值
      }];
      setFormData(prev => ({
        ...prev,
        members: initialMembers
      }));
    } finally {
      setFieldsLoading(false);
    }
  };

  // 组件加载时获取表单字段
  useEffect(() => {
    console.log('组件加载，开始获取表单字段');
    fetchFormFields();
  }, []);

  // 监听formFields变化
  useEffect(() => {
    console.log('formFields状态更新:', formFields);
  }, [formFields]);

  const removeMember = (index: number) => {
    if (formData.members.length > 1) {
      setFormData(prev => ({
        ...prev,
        members: prev.members.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async () => {
    // 使用新的校验函数
    const validation = validateTeamForm(formData, formData.members, formFields, {
      ageRestrictions
    });
    
    if (!validation.isValid) {
      // 将验证错误映射到字段错误状态，不使用弹窗
      const newFieldErrors: { [key: string]: string } = {};
      validation.errors.forEach(error => {
        // 处理团队基本信息字段错误
        if (error.includes('团队负责人') || error.includes('teamLeader')) {
          newFieldErrors['teamLeader'] = error;
        } else if (error.includes('负责人电话') || error.includes('teamLeaderPhone')) {
          newFieldErrors['teamLeaderPhone'] = error;
        } else if (error.includes('团队名称') || error.includes('teamName')) {
          newFieldErrors['teamName'] = error;
        } else if (error.includes('联系邮箱') || error.includes('contactEmail')) {
          newFieldErrors['contactEmail'] = error;
        } else if (error.includes('团队简介') || error.includes('teamDescription')) {
          newFieldErrors['teamDescription'] = error;
        }
        // 团队成员错误会在成员部分单独处理
      });
      setFieldErrors(newFieldErrors);
      return;
    }

    setLoading(true);
    try {
      // 处理团队成员数据，确保字段名正确
      const processedMembers = formData.members.map(member => {
        const processedMember = {
          name: member['姓名'] || '',
          phone: member['手机号'] || '',
          idCard: member['证件类型/证件号'] || '',
          emergencyContact: member['紧急联系人'] || '',
          age: member['年龄'] || '',
          gender: member['性别'] || ''
        };
        return processedMember;
      });

      const submitData = {
        activityId,
        selectedItem,
        teamName: formData.teamName,
        teamLeader: formData.teamLeader,
        teamLeaderPhone: formData.teamLeaderPhone,
        teamDescription: formData.teamDescription,
        contactEmail: formData.contactEmail,
        members: processedMembers
      };

      console.log('提交的数据:', submitData);

      const response = await axios.post(`http://localhost:3000/wsj/register/team`, submitData);
      
      if (response.data.code === 200) {
        // 检查是否会超过最大值
        const storageKey = `registration_${activityId}`;
        const currentCount = parseInt(localStorage.getItem(storageKey) || '0');
        const newCount = currentCount + formData.members.length;
        
        // 获取最大报名人数（这里需要从活动详情获取，暂时使用固定值10）
        const maxRegistered = 10; // 这里应该从活动详情获取
        
        if (newCount > maxRegistered) {
          alert('报名人数已满，无法继续报名！');
          navigate(`/activity-detail/${activityId}`);
          return;
        }
        
        // 通知活动详情页面更新报名人数
        const event = new CustomEvent('registrationSuccess', {
          detail: {
            activityId,
            count: formData.members.length, // 团队报名增加成员数量
            type: 'team'
          }
        });
        
        localStorage.setItem(storageKey, newCount.toString());
        
        window.dispatchEvent(event);
        
        alert('团队报名成功！');
        navigate(`/activity-detail/${activityId}`);
      } else {
        alert(response.data.msg || '报名失败');
      }
    } catch (error) {
      console.error('报名失败:', error);
      alert('报名失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/activity-detail/${activityId}`);
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
          团队报名
        </h2>
      </div>

      {/* 已选择项目提示 */}
      {selectedItem && (
        <div style={{
          marginBottom: '15px',
          padding: '8px 12px',
          backgroundColor: '#e1f3ff',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#409eff'
        }}>
          已选择项目：{selectedItem}
        </div>
      )}

      {/* 团队基本信息 */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h3 style={{ 
          fontSize: '16px', 
          color: '#333', 
          margin: '0 0 15px 0',
          fontWeight: '600'
        }}>
          团队基本信息
        </h3>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '5px', 
            fontSize: '14px', 
            color: '#666',
            fontWeight: '500'
          }}>
            团队名称
          </label>
          <input
            type="text"
            value={formData.teamName}
            onChange={(e) => handleInputChange('teamName', e.target.value)}
            placeholder="请输入团队名称"
            style={{
              width: '100%',
              padding: '12px',
              border: fieldErrors.teamName ? '1px solid #f56c6c' : '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
          {fieldErrors.teamName && (
            <div style={{
              fontSize: '12px',
              color: '#f56c6c',
              marginTop: '4px'
            }}>
              {fieldErrors.teamName}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '5px', 
            fontSize: '14px', 
            color: '#666',
            fontWeight: '500'
          }}>
            团队负责人 <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="text"
            value={formData.teamLeader}
            onChange={(e) => handleInputChange('teamLeader', e.target.value)}
            placeholder="请输入团队负责人姓名"
            style={{
              width: '100%',
              padding: '12px',
              border: fieldErrors.teamLeader ? '1px solid #f56c6c' : '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
          {fieldErrors.teamLeader && (
            <div style={{
              fontSize: '12px',
              color: '#f56c6c',
              marginTop: '4px'
            }}>
              {fieldErrors.teamLeader}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '5px', 
            fontSize: '14px', 
            color: '#666',
            fontWeight: '500'
          }}>
            负责人电话 <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="tel"
            value={formData.teamLeaderPhone}
            onChange={(e) => handleInputChange('teamLeaderPhone', e.target.value)}
            placeholder="请输入负责人联系电话"
            style={{
              width: '100%',
              padding: '12px',
              border: fieldErrors.teamLeaderPhone ? '1px solid #f56c6c' : '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
          {fieldErrors.teamLeaderPhone && (
            <div style={{
              fontSize: '12px',
              color: '#f56c6c',
              marginTop: '4px'
            }}>
              {fieldErrors.teamLeaderPhone}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '5px', 
            fontSize: '14px', 
            color: '#666',
            fontWeight: '500'
          }}>
            联系邮箱
          </label>
          <input
            type="email"
            value={formData.contactEmail}
            onChange={(e) => handleInputChange('contactEmail', e.target.value)}
            placeholder="请输入联系邮箱"
            style={{
              width: '100%',
              padding: '12px',
              border: fieldErrors.contactEmail ? '1px solid #f56c6c' : '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
          {fieldErrors.contactEmail && (
            <div style={{
              fontSize: '12px',
              color: '#f56c6c',
              marginTop: '4px'
            }}>
              {fieldErrors.contactEmail}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '5px', 
            fontSize: '14px', 
            color: '#666',
            fontWeight: '500'
          }}>
            团队简介
          </label>
          <textarea
            value={formData.teamDescription}
            onChange={(e) => handleInputChange('teamDescription', e.target.value)}
            placeholder="请简要介绍您的团队"
            rows={3}
            style={{
              width: '100%',
              padding: '12px',
              border: fieldErrors.teamDescription ? '1px solid #f56c6c' : '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box',
              resize: 'vertical'
            }}
          />
          {fieldErrors.teamDescription && (
            <div style={{
              fontSize: '12px',
              color: '#f56c6c',
              marginTop: '4px'
            }}>
              {fieldErrors.teamDescription}
            </div>
          )}
        </div>
      </div>

      {/* 团队成员信息 */}
      {fieldsLoading ? (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '40px 20px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <div style={{ 
            width: '20px', 
            height: '20px', 
            border: '2px solid #f3f3f3',
            borderTop: '2px solid #409eff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 10px'
          }}></div>
          <p>加载表单中...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h3 style={{ 
              fontSize: '16px', 
              color: '#333', 
              margin: 0,
              fontWeight: '600'
            }}>
              团队成员信息
            </h3>
            <button
              onClick={addMember}
              style={{
                background: '#409eff',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              + 添加成员
            </button>
          </div>

          {/* 年龄限制提示 - 只在有年龄限制且不在表单字段中时显示 */}
          {ageRestrictions.length > 0 && !formFields.some(field => field.type === 'age-restriction') && (
            <div style={{
              padding: '10px',
              backgroundColor: '#fff7e6',
              border: '1px solid #ffd591',
              borderRadius: '6px',
              marginBottom: '15px'
            }}>
              <div style={{ fontSize: '12px', color: '#d46b08' }}>
                年龄限制：{ageRestrictions[0].minAge}-{ageRestrictions[0].maxAge}岁
              </div>
            </div>
          )}

          {formData.members.map((member, index) => (
            <div key={index} style={{
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '15px',
              backgroundColor: '#fafafa'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px'
              }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                  成员 {index + 1}
                </span>
                {formData.members.length > 1 && (
                  <button
                    onClick={() => removeMember(index)}
                    style={{
                      background: '#f56c6c',
                      color: 'white',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    删除
                  </button>
                )}
              </div>

              {/* 动态渲染表单字段 */}
              {formFields.map((field, fieldIndex) => {
                // 根据字段类型渲染不同的组件
                if (field.type === 'age-restriction') {
                  const minAge = ageRestrictions.length > 0 ? ageRestrictions[0].minAge : 12;
                  const maxAge = ageRestrictions.length > 0 ? ageRestrictions[0].maxAge : 60;
                  const currentAge = parseInt(member['年龄'] || minAge.toString());
                  
                  return (
                    <div key={fieldIndex} style={{ marginBottom: '10px' }}>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '5px', 
                        fontSize: '12px', 
                        color: '#666',
                        fontWeight: '500'
                      }}>
                        年龄 {field.required && <span style={{ color: 'red' }}>*</span>}
                      </label>
                      
                      {/* 年龄选择器 */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        backgroundColor: '#f8f9fa'
                      }}>
                        <span style={{ fontSize: '12px', color: '#666' }}>年龄:</span>
                        <select
                          value={currentAge}
                          onChange={(e) => handleMemberChange(index, '年龄', e.target.value)}
                          style={{
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '12px',
                            backgroundColor: 'white',
                            minWidth: '80px'
                          }}
                        >
                          {Array.from({ length: maxAge - minAge + 1 }, (_, i) => minAge + i).map(age => (
                            <option key={age} value={age}>
                              {age}岁
                            </option>
                          ))}
                        </select>
                        <span style={{ fontSize: '10px', color: '#999' }}>
                          {(() => {
                            // 检查hintText是否是时间格式
                            if (field.hintText && field.hintText.includes('GMT') && field.hintText.includes('至')) {
                              try {
                                // 解析时间格式
                                const timeMatch = field.hintText.match(/(.+?)至(.+)/);
                                if (timeMatch) {
                                  const startTime = new Date(timeMatch[1].trim());
                                  const endTime = new Date(timeMatch[2].trim());
                                  
                                  // 格式化时间显示
                                  const formatTime = (date: Date) => {
                                    const year = date.getFullYear();
                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                    const day = String(date.getDate()).padStart(2, '0');
                                    const hours = String(date.getHours()).padStart(2, '0');
                                    const minutes = String(date.getMinutes()).padStart(2, '0');
                                    return `${year}-${month}-${day} ${hours}:${minutes}`;
                                  };
                                  
                                  return `(${formatTime(startTime)} 至 ${formatTime(endTime)})`;
                                }
                              } catch (error) {
                                console.log('时间解析失败:', error);
                              }
                            }
                            // 如果不是时间格式，显示原有的年龄范围
                            return `(${ageRestrictions.length > 0 ? `${ageRestrictions[0].minAge}-${ageRestrictions[0].maxAge}` : `${minAge}-${maxAge}`}岁)`;
                          })()}
                        </span>
                      </div>
                    </div>
                  );
                } else if (field.type === 'gender-restriction') {
                  return (
                    <div key={fieldIndex} style={{ marginBottom: '10px' }}>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '8px', 
                        fontSize: '12px', 
                        color: '#666',
                        fontWeight: '500'
                      }}>
                        性别 {field.required && <span style={{ color: 'red' }}>*</span>}
                      </label>
                      <div style={{ display: 'flex', gap: '20px' }}>
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          cursor: field.hintText === '女' ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          color: field.hintText === '女' ? '#ccc' : '#333',
                          opacity: field.hintText === '女' ? 0.5 : 1
                        }}>
                          <input
                            type="radio"
                            name={`gender-${index}`}
                            value="男"
                            checked={member['性别'] === '男'}
                            onChange={(e) => handleMemberChange(index, '性别', e.target.value)}
                            disabled={field.hintText === '女'}
                            style={{
                              marginRight: '6px',
                              width: '14px',
                              height: '14px',
                              cursor: field.hintText === '女' ? 'not-allowed' : 'pointer'
                            }}
                          />
                          男
                        </label>
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          cursor: field.hintText === '男' ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          color: field.hintText === '男' ? '#ccc' : '#333',
                          opacity: field.hintText === '男' ? 0.5 : 1
                        }}>
                          <input
                            type="radio"
                            name={`gender-${index}`}
                            value="女"
                            checked={member['性别'] === '女'}
                            onChange={(e) => handleMemberChange(index, '性别', e.target.value)}
                            disabled={field.hintText === '男'}
                            style={{
                              marginRight: '6px',
                              width: '14px',
                              height: '14px',
                              cursor: field.hintText === '男' ? 'not-allowed' : 'pointer'
                            }}
                          />
                          女
                        </label>
                      </div>
                      {/* 性别字段不需要额外提示文本 */}
                    </div>
                  );
                } else {
                  // 普通文本字段
                  return (
                    <div key={fieldIndex} style={{ marginBottom: '10px' }}>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '5px', 
                        fontSize: '12px', 
                        color: '#666',
                        fontWeight: '500'
                      }}>
                        {field.fieldName} {field.required && <span style={{ color: 'red' }}>*</span>}
                      </label>
                      <input
                        type={field.type}
                        value={member[field.fieldName] || ''}
                        onChange={(e) => handleMemberChange(index, field.fieldName, e.target.value)}
                        placeholder={field.hintText || `请输入${field.fieldName}`}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: memberErrors[field.fieldName]?.[index] ? '1px solid #f56c6c' : '1px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '12px',
                          boxSizing: 'border-box'
                        }}
                      />
                      {memberErrors[field.fieldName]?.[index] && (
                        <div style={{
                          fontSize: '10px',
                          color: '#f56c6c',
                          marginTop: '2px'
                        }}>
                          {memberErrors[field.fieldName][index]}
                        </div>
                      )}
                      {!memberErrors[field.fieldName]?.[index] && field.hintText && field.hintText !== `请输入${field.fieldName}` && (
                        <div style={{
                          fontSize: '10px',
                          color: '#999',
                          marginTop: '2px'
                        }}>
                          {field.hintText}
                        </div>
                      )}
                    </div>
                  );
                }
              })}
            </div>
          ))}
        </div>
      )}

      {/* 提交按钮 */}
      {!fieldsLoading && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%',
              padding: '15px',
              backgroundColor: loading ? '#ccc' : '#ff6b35',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {loading ? '提交中...' : `确认报名 (${formData.members.length}人)`}
          </button>
        </div>
      )}
    </div>
  );
} 