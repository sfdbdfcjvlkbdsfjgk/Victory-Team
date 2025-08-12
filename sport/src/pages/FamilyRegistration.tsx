import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { validateFamilyForm, validateField } from '../utils/validation';

interface FormField {
  fieldName: string;
  required: boolean;
  type: string;
  hintText: string;
  isSystem: boolean;
}

interface RegistrationItem {
  itemName: string;
  cost: number;
  maxPeople: number;
  requireInsurance: boolean;
  consultationPhone: string;
}

interface ActivityData {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
  registrationItems?: RegistrationItem[];
}

interface FamilyMember {
  [key: string]: string; // 动态字段
}

interface FamilyInfo {
  members: FamilyMember[];
}

export default function FamilyRegistration() {
  const navigate = useNavigate();
  const { activityId } = useParams<{ activityId: string }>();
  const [searchParams] = useSearchParams();
  const selectedItem = searchParams.get('itemId');
  
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [formData, setFormData] = useState<FamilyInfo>({
    members: [{}]
  });
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(false);
  const [fieldsLoading, setFieldsLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: { [memberIndex: number]: string } }>({});
  const [maxPeopleMessage, setMaxPeopleMessage] = useState<string>('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const showMessage = (text: string, type: 'success' | 'error' | 'warning') => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage(null);
    }, 3000);
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
        
        const fields = data.formFields || [];
        setFormFields(fields);
        
        // 设置活动数据
        setActivity(data);
        console.log('设置的活动数据:', data);
        console.log('活动数据中的registrationItems:', data.registrationItems);
        
        // 初始化表单数据，设置性别默认值
        const genderField = fields.find((field: FormField) => field.type === 'gender-restriction');
        const defaultGender = genderField?.hintText || '男';
        console.log('后端返回的性别字段:', genderField);
        console.log('设置的默认性别:', defaultGender);
        
        const initialMembers = [{} as FamilyMember];
        fields.forEach((field: FormField) => {
          if (field.type === 'gender-restriction') {
            initialMembers[0][field.fieldName] = defaultGender;
          } else {
            initialMembers[0][field.fieldName] = '';
          }
        });
        setFormData({ members: initialMembers });
      } else {
        // 如果后端没有返回数据，使用默认字段
        const defaultFormFields: FormField[] = [
          {
            fieldName: "姓名",
            required: true,
            type: "text",
            hintText: "必须填写",
            isSystem: true
          },
          {
            fieldName: "手机号",
            required: true,
            type: "text",
            hintText: "必须填写",
            isSystem: true
          },
          {
            fieldName: "证件类型/证件号",
            required: true,
            type: "text",
            hintText: "必须填写",
            isSystem: true
          }
        ];
        
        setFormFields(defaultFormFields);
        
        // 初始化表单数据
        const initialMembers = [{} as FamilyMember];
        defaultFormFields.forEach(field => {
          initialMembers[0][field.fieldName] = '';
        });
        setFormData({ members: initialMembers });
      }
      
    } catch (error) {
      console.error('获取表单字段失败:', error);
      // 出错时使用默认字段
      const defaultFormFields: FormField[] = [
        {
          fieldName: "姓名",
          required: true,
          type: "text",
          hintText: "必须填写",
          isSystem: true
        },
        {
          fieldName: "手机号",
          required: true,
          type: "text",
          hintText: "必须填写",
          isSystem: true
        },
        {
          fieldName: "证件类型/证件号",
          required: true,
          type: "text",
          hintText: "必须填写",
          isSystem: true
        }
      ];
      
      setFormFields(defaultFormFields);
      
      // 初始化表单数据
      const initialMembers = [{} as FamilyMember];
      defaultFormFields.forEach(field => {
        initialMembers[0][field.fieldName] = '';
      });
      setFormData({ members: initialMembers });
    } finally {
      setFieldsLoading(false);
    }
  };

  // 组件加载时获取表单字段
  useEffect(() => {
    fetchFormFields();
  }, []);

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
      setFieldErrors(prev => {
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
      setFieldErrors(prev => ({
        ...prev,
        [field]: {
          ...prev[field],
          [index]: validation.message
        }
      }));
    }
  };

  const addMember = () => {
    // 获取选中项目的最大人数限制
    let selectedItemData = activity?.registrationItems?.find((item: RegistrationItem) => item.itemName === selectedItem);
    
    // 如果没有找到匹配的项目，使用第一个项目
    if (!selectedItemData && activity?.registrationItems && activity.registrationItems.length > 0) {
      selectedItemData = activity.registrationItems[0];
    }
    
    // 检查是否超过最大人数限制
    const maxPeople = selectedItemData?.maxPeople || 10; // 默认10人
    if (formData.members.length >= maxPeople) {
      setMaxPeopleMessage(`最多只能添加${maxPeople}个成员`);
      // 3秒后清除提示信息
      setTimeout(() => {
        setMaxPeopleMessage('');
      }, 3000);
      return;
    }
    
    // 清除之前的提示信息
    setMaxPeopleMessage('');
    
    // 获取当前表单字段中的性别默认值
    const genderField = formFields.find((field: FormField) => field.type === 'gender-restriction');
    const defaultGender = genderField?.hintText || '男';
    
    const newMember = {} as FamilyMember;
    formFields.forEach((field: FormField) => {
      if (field.type === 'gender-restriction') {
        newMember[field.fieldName] = defaultGender;
      } else {
        newMember[field.fieldName] = '';
      }
    });
    
    setFormData(prev => ({
      ...prev,
      members: [
        ...prev.members,
        newMember
      ]
    }));
  };

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
    const validation = validateFamilyForm(formData.members, formFields);
    
    if (!validation.isValid) {
      // 显示错误消息给用户
      showMessage(`表单验证失败: ${validation.errors.join(', ')}`, 'error');
      
      // 将验证错误映射到字段错误状态
      const newFieldErrors: { [key: string]: { [memberIndex: number]: string } } = {};
      validation.errors.forEach(error => {
        // 解析错误消息，提取成员索引和字段信息
        const memberMatch = error.match(/成员(\d+):\s*(.+)/);
        if (memberMatch) {
          const memberIndex = parseInt(memberMatch[1]) - 1; // 转换为0-based索引
          const errorMessage = memberMatch[2];
          
          // 根据错误消息确定字段名
          let fieldName = '';
          if (errorMessage.includes('姓名')) {
            fieldName = formFields.find(f => f.fieldName.includes('姓名'))?.fieldName || '姓名';
          } else if (errorMessage.includes('手机')) {
            fieldName = formFields.find(f => f.fieldName.includes('手机'))?.fieldName || '手机号';
          } else if (errorMessage.includes('身份证') || errorMessage.includes('证件')) {
            fieldName = formFields.find(f => f.fieldName.includes('证件') || f.fieldName.includes('身份证'))?.fieldName || '证件类型/证件号';
          } else if (errorMessage.includes('年龄')) {
            fieldName = formFields.find(f => f.fieldName.includes('年龄'))?.fieldName || '年龄';
          }
          
          if (fieldName) {
            if (!newFieldErrors[fieldName]) {
              newFieldErrors[fieldName] = {};
            }
            newFieldErrors[fieldName][memberIndex] = errorMessage;
          }
        }
      });
      setFieldErrors(newFieldErrors);
      return;
    }

    setLoading(true);
    try {
      // 额外检查：确保所有必填字段都已填写
      const emptyRequiredFields: string[] = [];
      formData.members.forEach((member, memberIndex) => {
        formFields.forEach(field => {
          if (field.required) {
            const value = member[field.fieldName];
            if (!value || value.trim() === '') {
              emptyRequiredFields.push(`成员${memberIndex + 1}的${field.fieldName}`);
            }
          }
        });
      });
      
      if (emptyRequiredFields.length > 0) {
        showMessage(`请填写以下必填字段: ${emptyRequiredFields.join(', ')}`, 'error');
        setLoading(false);
        return;
      }
      
      // 准备提交的数据，确保字段名正确
      console.log('提交前的formData.members:', formData.members);
      console.log('当前的formFields:', formFields);
      
      const processedMembers = formData.members.map((member, index) => {
        console.log(`处理成员${index + 1}:`, member);
        const processedMember: { [key: string]: string } = {};
        
        // 使用formFields来确保处理所有字段，而不是只处理member中存在的字段
        formFields.forEach(field => {
          const value = member[field.fieldName];
          console.log(`字段 ${field.fieldName}: 原始值 = "${value}", 类型 = ${typeof value}`);
          
          // 字段名映射：将中文字段名映射到英文字段名
          let mappedFieldName = field.fieldName;
          if (field.fieldName === '姓名') {
            mappedFieldName = 'name';
          } else if (field.fieldName === '手机号') {
            mappedFieldName = 'phone';
          } else if (field.fieldName === '证件类型/证件号' || field.fieldName === '身份证') {
            mappedFieldName = 'idCard';
          } else if (field.fieldName === '紧急联系人') {
            mappedFieldName = 'emergencyContact';
          } else if (field.fieldName === '年龄' || field.fieldName === '年龄限制') {
            mappedFieldName = 'age';
          } else if (field.fieldName === '性别' || field.fieldName === '性别限制') {
            mappedFieldName = 'gender';
          }
          
          console.log(`字段映射: ${field.fieldName} -> ${mappedFieldName}`);
          
          // 确保值不为undefined或null
          const finalValue = value !== undefined && value !== null ? value : '';
          console.log(`最终值: "${finalValue}"`);
          
          // 对于性别字段，直接使用中文值
          if (field.type === 'gender-restriction') {
            processedMember[mappedFieldName] = finalValue; // 直接使用中文值：男/女
          } else {
            processedMember[mappedFieldName] = finalValue;
          }
        });
        
        // 确保所有必需字段都存在，即使后端没有返回
        if (!processedMember.hasOwnProperty('emergencyContact')) {
          processedMember.emergencyContact = '';
          console.log('添加默认的emergencyContact字段');
        }
        
        console.log(`处理后的成员${index + 1}:`, processedMember);
        return processedMember;
      });
      
      // 获取选中项目的cost值
      let selectedItemData = activity?.registrationItems?.find((item: RegistrationItem) => item.itemName === selectedItem);
      
      // 如果没有找到匹配的项目，使用第一个项目
      if (!selectedItemData && activity?.registrationItems && activity.registrationItems.length > 0) {
        selectedItemData = activity.registrationItems[0];
      }
      
      // 将cost字段添加到每个成员的formData中
      if (selectedItemData && selectedItemData.cost !== null && selectedItemData.cost !== undefined && selectedItemData.cost !== 0) {
        processedMembers.forEach(member => {
          member['cost'] = selectedItemData.cost.toString(); // 映射为后端期望的字段名
        });
        console.log('将cost字段添加到每个成员的formData:', selectedItemData.cost);
      }
      
      // 构建提交数据
      const submitData: any = {
        activityId,
        selectedItem,
        members: processedMembers
      };
      
      console.log('活动数据:', activity);
      console.log('选中的项目名称:', selectedItem);
      console.log('找到的选中项目数据:', selectedItemData);
      
      console.log('提交的家庭报名数据:', submitData);
      console.log('activityId值:', activityId);
      console.log('最终提交的数据结构:', JSON.stringify(submitData, null, 2));
      
      console.log('开始提交家庭报名数据...');
      const response = await axios.post(`http://localhost:3000/wsj/register/family`, submitData, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        timeout: 10000 // 10秒超时
      });
      
      console.log('后端响应:', response.data);
      
      // 检查响应格式，支持多种成功状态
      if (response.data.code === 200 || response.data.code === 0 || response.status === 200) {
        // 检查是否会超过最大值
        const storageKey = `registration_${activityId}`;
        const currentCount = parseInt(localStorage.getItem(storageKey) || '0');
        const newCount = currentCount + formData.members.length;
        
        // 获取最大报名人数（这里需要从活动详情获取，暂时使用固定值10）
        const maxRegistered = 10; // 这里应该从活动详情获取
        
        if (newCount > maxRegistered) {
          showMessage('报名人数已满，无法继续报名！', 'error');
          navigate(`/activity-detail/${activityId}`);
          return;
        }
        
        // 通知活动详情页面更新报名人数
        const event = new CustomEvent('registrationSuccess', {
          detail: {
            activityId,
            count: formData.members.length, // 家庭报名增加成员数量
            type: 'family'
          }
        });
        
        localStorage.setItem(storageKey, newCount.toString());
        
        window.dispatchEvent(event);
        
        showMessage('家庭报名成功！', 'success');
        navigate(`/activity-detail/${activityId}`);
      } else {
        showMessage(response.data.msg || response.data.message || '报名失败', 'error');
      }
    } catch (error: any) {
      console.error('报名失败:', error);
      
      // 详细错误信息
      if (error.response) {
        console.log('错误响应:', error.response.data);
        console.log('错误状态:', error.response.status);
        showMessage(`报名失败: ${error.response.data?.msg || error.response.data?.message || '网络错误'}`, 'error');
      } else if (error.request) {
        console.log('请求错误:', error.request);
        showMessage('报名失败: 网络连接错误，请检查网络', 'error');
      } else {
        console.log('其他错误:', error.message);
        showMessage('报名失败: 请稍后重试', 'error');
      }
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
          家庭报名
        </h2>
        {selectedItem && (
          <div style={{
            marginTop: '8px',
            padding: '8px 12px',
            backgroundColor: '#e1f3ff',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#409eff'
          }}>
            已选择项目：{selectedItem}
          </div>
        )}
      </div>

      {/* 消息提示 */}
      {message && (
        <div style={{
          backgroundColor: message.type === 'success' ? '#f6ffed' : message.type === 'error' ? '#fff2f0' : '#fff7e6',
          border: message.type === 'success' ? '1px solid #b7eb8f' : message.type === 'error' ? '1px solid #ffccc7' : '1px solid #ffd591',
          borderRadius: '6px',
          padding: '8px 12px',
          marginBottom: '15px',
          fontSize: '12px',
          color: message.type === 'success' ? '#52c41a' : message.type === 'error' ? '#ff4d4f' : '#faad14'
        }}>
          {message.text}
        </div>
      )}

      {/* 家庭成员信息 */}
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
            家庭成员信息
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
        
        {/* 最大人数提示信息 */}
        {maxPeopleMessage && (
          <div style={{
            backgroundColor: '#fff2e8',
            border: '1px solid #ffbb96',
            borderRadius: '6px',
            padding: '8px 12px',
            marginBottom: '15px',
            fontSize: '12px',
            color: '#d46b08'
          }}>
            {maxPeopleMessage}
          </div>
        )}

        {fieldsLoading ? (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center'
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
          formData.members.map((member, index) => (
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
                  // 解析年龄限制字符串
                  let minAge = 12;
                  let maxAge = 60;
                  
                  if (field.hintText) {
                    console.log('年龄字段的hintText:', field.hintText);
                    const ageMatch = field.hintText.match(/(\d+)-(\d+)岁/);
                    if (ageMatch) {
                      minAge = parseInt(ageMatch[1]);
                      maxAge = parseInt(ageMatch[2]);
                      console.log('解析出的年龄范围:', { minAge, maxAge });
                    }
                  }
                  
                  const currentAge = parseInt(member[field.fieldName] || minAge.toString());
                  
                  return (
                    <div key={fieldIndex} style={{ marginBottom: '10px' }}>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '5px', 
                        fontSize: '12px', 
                        color: '#666',
                        fontWeight: '500'
                      }}>
                        {field.fieldName} {field.required && <span style={{ color: 'red', fontWeight: 'bold' }}>*</span>}
                        {field.required && <span style={{ fontSize: '10px', color: '#999', marginLeft: '4px' }}>(必填)</span>}
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
                          onChange={(e) => handleMemberChange(index, field.fieldName, e.target.value)}
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
                            // 如果不是时间格式，显示年龄范围
                            return `(${minAge}-${maxAge}岁)`;
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
                        {field.fieldName} {field.required && <span style={{ color: 'red', fontWeight: 'bold' }}>*</span>}
                        {field.required && <span style={{ fontSize: '10px', color: '#999', marginLeft: '4px' }}>(必填)</span>}
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
                            name={`${field.fieldName}-${index}`}
                            value="男"
                            checked={member[field.fieldName] === '男'}
                            onChange={(e) => handleMemberChange(index, field.fieldName, e.target.value)}
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
                            name={`${field.fieldName}-${index}`}
                            value="女"
                            checked={member[field.fieldName] === '女'}
                            onChange={(e) => handleMemberChange(index, field.fieldName, e.target.value)}
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
                        {field.fieldName} {field.required && <span style={{ color: 'red', fontWeight: 'bold' }}>*</span>}
                        {field.required && <span style={{ fontSize: '10px', color: '#999', marginLeft: '4px' }}>(必填)</span>}
                      </label>
                      <input
                        type={field.type}
                        value={member[field.fieldName] || ''}
                        onChange={(e) => handleMemberChange(index, field.fieldName, e.target.value)}
                        placeholder={field.hintText || `请输入${field.fieldName}`}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: fieldErrors[field.fieldName]?.[index] ? '1px solid #f56c6c' : '1px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '12px',
                          boxSizing: 'border-box'
                        }}
                      />
                      {fieldErrors[field.fieldName]?.[index] && (
                        <div style={{
                          fontSize: '10px',
                          color: '#f56c6c',
                          marginTop: '2px'
                        }}>
                          {fieldErrors[field.fieldName][index]}
                        </div>
                      )}
                      {!fieldErrors[field.fieldName]?.[index] && field.hintText && (
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
          ))
        )}
      </div>

      {/* 提交按钮 */}
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
    </div>
  );
} 