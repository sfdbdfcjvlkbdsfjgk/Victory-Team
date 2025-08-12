import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { validateForm, validateField } from '../utils/validation';

interface FormField {
  fieldName: string;
  required: boolean;
  type: string;
  hintText: string;
  isSystem: boolean;
  placeholder: string;
}

interface PersonalInfo {
  [key: string]: string; // 动态字段
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

export default function PersonalRegistration() {
  const navigate = useNavigate();
  const { activityId } = useParams<{ activityId: string }>();
  const [searchParams] = useSearchParams();
  const selectedItem = searchParams.get('itemId');
  
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [formData, setFormData] = useState<PersonalInfo>({});
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(false);
  const [fieldsLoading, setFieldsLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const showMessage = (text: string, type: 'success' | 'error' | 'warning') => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage(null);
    }, 3000);
  };

  const handleInputChange = (field: string, value: string) => {
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
            } else {
              console.log('年龄字符串格式不匹配，使用默认范围');
            }
          } else {
            console.log('未找到年龄字段或hintText为空');
          }
        }
        
        console.log('解析后的年龄限制:', parsedAgeRestrictions);
        
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
        
        const initialData: PersonalInfo = {};
        fields.forEach((field: FormField) => {
          if (field.type === 'gender-restriction') {
            initialData[field.fieldName] = defaultGender;
          } else {
            initialData[field.fieldName] = '';
          }
        });
        setFormData(initialData);
      } else {
        // 如果后端没有返回数据，使用默认字段
        const defaultFormFields: FormField[] = [
          {
            fieldName: "姓名",
            required: true,
            type: "text",
            hintText: "必须填写",
            isSystem: true,
            placeholder: "姓名"
          },
          {
            fieldName: "手机号",
            required: true,
            type: "text",
            hintText: "必须填写",
            isSystem: true,
            placeholder: "手机号"
          },
          {
            fieldName: "证件类型/证件号",
            required: true,
            type: "text",
            hintText: "必须填写",
            isSystem: true,
            placeholder: "证件类型/证件号"
          }
        ];
        
        setFormFields(defaultFormFields);
        
        // 初始化表单数据
        const initialData: PersonalInfo = {};
        defaultFormFields.forEach(field => {
          initialData[field.fieldName] = '';
        });
        setFormData(initialData);
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
          isSystem: true,
          placeholder: "姓名"
        },
        {
          fieldName: "手机号",
          required: true,
          type: "text",
          hintText: "必须填写",
          isSystem: true,
          placeholder: "手机号"
        },
        {
          fieldName: "证件类型/证件号",
          required: true,
          type: "text",
          hintText: "必须填写",
          isSystem: true,
          placeholder: "证件类型/证件号"
        }
      ];
      
      setFormFields(defaultFormFields);
      
      // 初始化表单数据
      const initialData: PersonalInfo = {};
      defaultFormFields.forEach(field => {
        initialData[field.fieldName] = '';
      });
      setFormData(initialData);
    } finally {
      setFieldsLoading(false);
    }
  };

  // 组件加载时获取表单字段
  useEffect(() => {
    fetchFormFields();
  }, []);

  const handleSubmit = async () => {
    // 使用新的校验函数
    const validation = validateForm(formData, formFields);
    
    if (!validation.isValid) {
      // 将验证错误映射到字段错误状态，不使用弹窗
      const newFieldErrors: { [key: string]: string } = {};
      validation.errors.forEach(error => {
        // 从错误信息中提取字段名
        const fieldName = formFields.find(field => error.includes(field.fieldName))?.fieldName;
        if (fieldName) {
          newFieldErrors[fieldName] = error;
        } else {
          // 如果无法匹配字段名，尝试从错误消息推断
          if (error.includes('姓名')) {
            const nameField = formFields.find(f => f.fieldName.includes('姓名'));
            if (nameField) newFieldErrors[nameField.fieldName] = error;
          } else if (error.includes('手机')) {
            const phoneField = formFields.find(f => f.fieldName.includes('手机'));
            if (phoneField) newFieldErrors[phoneField.fieldName] = error;
          } else if (error.includes('身份证') || error.includes('证件')) {
            const idField = formFields.find(f => f.fieldName.includes('证件') || f.fieldName.includes('身份证'));
            if (idField) newFieldErrors[idField.fieldName] = error;
          } else if (error.includes('年龄')) {
            const ageField = formFields.find(f => f.fieldName.includes('年龄'));
            if (ageField) newFieldErrors[ageField.fieldName] = error;
          }
        }
      });
      setFieldErrors(newFieldErrors);
      return;
    }

    setLoading(true);
    try {
      // 准备提交的数据，确保字段名正确
      const processedFormData: { [key: string]: string } = {};
      
      // 处理表单数据，确保字段名不被拆分
      Object.keys(formData).forEach(key => {
        const value = formData[key];
        if (value !== undefined && value !== null) {
          processedFormData[key] = value;
        }
      });
      
      // 获取选中项目的cost值并添加到formData中
      let selectedItemData = activity?.registrationItems?.find((item: RegistrationItem) => item.itemName === selectedItem);
      
      // 如果没有找到匹配的项目，使用第一个项目
      if (!selectedItemData && activity?.registrationItems && activity.registrationItems.length > 0) {
        selectedItemData = activity.registrationItems[0];
      }
      
      // 将cost字段添加到formData中
      if (selectedItemData && selectedItemData.cost !== null && selectedItemData.cost !== undefined && selectedItemData.cost !== 0) {
        processedFormData['报名费'] = selectedItemData.cost.toString();
        console.log('将cost字段添加到formData:', selectedItemData.cost);
      }
      
      // 构建提交数据
      const submitData: any = {
        activityId,
        selectedItem,
        formData: processedFormData
      };
      
      console.log('活动数据:', activity);
      console.log('选中的项目名称:', selectedItem);
      console.log('找到的选中项目数据:', selectedItemData);
      
      console.log('原始表单数据:', formData);
      console.log('处理后的表单数据:', processedFormData);
      console.log('提交的个人报名数据:', submitData);
      console.log('最终提交的数据结构:', JSON.stringify(submitData, null, 2));
      
      // 提交报名信息
      const response = await axios.post(`http://localhost:3000/wsj/register/individual`, submitData, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      });
      
      if (response.data.code === 200) {
        // 检查是否会超过最大值
        const storageKey = `registration_${activityId}`;
        const currentCount = parseInt(localStorage.getItem(storageKey) || '0');
        const newCount = currentCount + 1;
        
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
            count: 1, // 个人报名增加1人
            type: 'personal'
          }
        });
        
        localStorage.setItem(storageKey, newCount.toString());
        
        window.dispatchEvent(event);
        
        showMessage('报名成功！', 'success');
        navigate(`/activity-detail/${activityId}`);
      } else {
        showMessage(response.data.msg || '报名失败', 'error');
      }
    } catch (error) {
      console.error('报名失败:', error);
      showMessage('报名失败，请稍后重试', 'error');
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
          个人报名
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

      {/* 表单内容 */}
      {fieldsLoading ? (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '40px 20px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
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
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ 
              fontSize: '16px', 
              color: '#333', 
              marginBottom: '15px',
              fontWeight: '600'
            }}>
              基本信息
            </h3>

            {/* 动态渲染表单字段 */}
            {formFields.map((field, index) => {
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
                
                const currentAge = parseInt(formData[field.fieldName] || minAge.toString());
                
                return (
                  <div key={index} style={{ marginBottom: '15px' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '5px', 
                      fontSize: '14px', 
                      color: '#666',
                      fontWeight: '500'
                    }}>
                      {field.fieldName} {field.required && <span style={{ color: 'red' }}>*</span>}
                    </label>
                    
                    {/* 年龄选择器 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      backgroundColor: '#f8f9fa'
                    }}>
                      <span style={{ fontSize: '14px', color: '#666' }}>年龄:</span>
                      <select
                        value={currentAge}
                        onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                        style={{
                          padding: '8px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px',
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
                      <span style={{ fontSize: '12px', color: '#999' }}>
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
                          return `(${minAge}-${maxAge}岁)`;
                        })()}
                      </span>
                    </div>
                  </div>
                );
              } else if (field.type === 'gender-restriction') {
                return (
                  <div key={index} style={{ marginBottom: '15px' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontSize: '14px', 
                      color: '#666',
                      fontWeight: '500'
                    }}>
                      {field.fieldName} {field.required && <span style={{ color: 'red' }}>*</span>}
                    </label>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: field.hintText === '女' ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        color: field.hintText === '女' ? '#ccc' : '#333',
                        opacity: field.hintText === '女' ? 0.5 : 1
                      }}>
                        <input
                          type="radio"
                          name="gender"
                          value="男"
                          checked={formData[field.fieldName] === '男'}
                          onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                          disabled={field.hintText === '女'}
                          style={{
                            marginRight: '6px',
                            width: '16px',
                            height: '16px',
                            cursor: field.hintText === '女' ? 'not-allowed' : 'pointer'
                          }}
                        />
                        男
                      </label>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: field.hintText === '男' ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        color: field.hintText === '男' ? '#ccc' : '#333',
                        opacity: field.hintText === '男' ? 0.5 : 1
                      }}>
                        <input
                          type="radio"
                          name="gender"
                          value="女"
                          checked={formData[field.fieldName] === '女'}
                          onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                          disabled={field.hintText === '男'}
                          style={{
                            marginRight: '6px',
                            width: '16px',
                            height: '16px',
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
                  <div key={index} style={{ marginBottom: '15px' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '5px', 
                      fontSize: '14px', 
                      color: '#666',
                      fontWeight: '500'
                    }}>
                      {field.fieldName} {field.required && <span style={{ color: 'red' }}>*</span>}
                    </label>
                    <input
                      type={field.type}
                      value={formData[field.fieldName] || ''}
                      onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                      placeholder={field.placeholder || `请输入${field.fieldName}`}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: fieldErrors[field.fieldName] ? '1px solid #f56c6c' : '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                    {fieldErrors[field.fieldName] && (
                      <div style={{
                        fontSize: '12px',
                        color: '#f56c6c',
                        marginTop: '4px'
                      }}>
                        {fieldErrors[field.fieldName]}
                      </div>
                    )}
                    {!fieldErrors[field.fieldName] && field.hintText && (
                      <div style={{
                        fontSize: '12px',
                        color: '#999',
                        marginTop: '4px'
                      }}>
                        {field.hintText}
                      </div>
                    )}
                  </div>
                );
              }
            })}
          </div>
        </div>
      )}

      {/* 提交按钮 */}
      {!fieldsLoading && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginTop: '20px'
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
            {loading ? '提交中...' : '确认报名'}
          </button>
        </div>
      )}
    </div>
  );
} 