import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { validateTeamForm, validateField, validateName, validatePhone, validateTeamName, validateEmail, validateTeamDescription } from '../utils/validation';

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
  
  const [activity, setActivity] = useState<ActivityData | null>(null);
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
  const [maxPeopleMessage, setMaxPeopleMessage] = useState<string>('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const showMessage = (text: string, type: 'success' | 'error' | 'warning') => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage(null);
    }, 3000);
  };

  const handleInputChange = (field: keyof Omit<TeamInfo, 'members'>, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 实时校验字段
    let validation;
    if (field === 'teamLeader') {
      validation = validateName(value);
    } else if (field === 'teamLeaderPhone') {
      validation = validatePhone(value);
    } else if (field === 'teamName') {
      validation = validateTeamName(value);
    } else if (field === 'contactEmail') {
      validation = validateEmail(value);
    } else if (field === 'teamDescription') {
      validation = validateTeamDescription(value);
    } else {
      validation = validateField(field, value);
    }
    
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
    
    // 创建新成员，为每个字段设置默认值
    const newMember: TeamMember = {};
    formFields.forEach((field: FormField) => {
      if (field.type === 'gender-restriction') {
        newMember[field.fieldName] = defaultGender;
      } else if (field.type === 'age-restriction') {
        const minAge = ageRestrictions.length > 0 ? ageRestrictions[0].minAge : 18;
        newMember[field.fieldName] = minAge.toString();
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
        
        // 详细检查后端返回的字段配置
        if (data.formFields) {
          data.formFields.forEach((field: any, index: number) => {
            console.log(`后端字段${index + 1}:`, {
              fieldName: field.fieldName,
              type: field.type,
              required: field.required,
              hintText: field.hintText
            });
          });
        }
        
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
        
        // 如果后端没有返回formFields或为空，使用默认字段
        let fields = data.formFields || [];
        if (fields.length === 0) {
          fields = [
            {
              fieldName: "姓名",
              required: true,
              type: "text",
              hintText: "请输入姓名",
              isSystem: true
            },
            {
              fieldName: "手机号",
              required: true,
              type: "text",
              hintText: "请输入手机号",
              isSystem: true
            },
            {
              fieldName: "证件类型/证件号",
              required: true,
              type: "text",
              hintText: "请输入证件号",
              isSystem: true
            },
            {
              fieldName: "紧急联系人",
              required: false,
              type: "text",
              hintText: "紧急电话",
              isSystem: false
            },
            {
              fieldName: "年龄",
              required: true,
              type: "age-restriction",
              hintText: "18-60岁",
              isSystem: true
            },
            {
              fieldName: "性别",
              required: true,
              type: "gender-restriction",
              hintText: "男",
              isSystem: true
            }
          ];
        }
        
        setFormFields(fields);
        setAgeRestrictions(parsedAgeRestrictions);
        
        // 设置活动数据
        setActivity(data);
        console.log('设置的活动数据:', data);
        console.log('活动数据中的registrationItems:', data.registrationItems);
        
        // 初始化团队成员数据，设置性别默认值
        const genderField = fields.find((field: FormField) => field.type === 'gender-restriction');
        const defaultGender = genderField?.hintText || '男';
        console.log('后端返回的性别字段:', genderField);
        console.log('设置的默认性别:', defaultGender);
        
        // 初始化成员数据，为每个字段设置默认值
        console.log('初始化成员数据，字段配置:', fields);
        const initialMembers: TeamMember[] = [{}];
        fields.forEach((field: FormField) => {
          console.log(`初始化字段: ${field.fieldName}, 类型: ${field.type}, 必填: ${field.required}`);
          if (field.type === 'gender-restriction') {
            initialMembers[0][field.fieldName] = defaultGender;
            console.log(`设置性别字段 ${field.fieldName} = "${defaultGender}"`);
          } else if (field.type === 'age-restriction') {
            const minAge = parsedAgeRestrictions.length > 0 ? parsedAgeRestrictions[0].minAge : 18;
            initialMembers[0][field.fieldName] = minAge.toString();
            console.log(`设置年龄字段 ${field.fieldName} = "${minAge}"`);
          } else {
            initialMembers[0][field.fieldName] = '';
            console.log(`设置文本字段 ${field.fieldName} = ""`);
          }
        });
        console.log('初始化后的成员数据:', initialMembers);
        
        setFormData(prev => ({
          ...prev,
          members: initialMembers
        }));
      } else {
        // 如果后端没有返回数据，使用默认字段
        const defaultFormFields: FormField[] = [
          {
            fieldName: "姓名",
            required: true,
            type: "text",
            hintText: "请输入姓名",
            isSystem: true
          },
          {
            fieldName: "手机号",
            required: true,
            type: "text",
            hintText: "请输入手机号",
            isSystem: true
          },
          {
            fieldName: "证件类型/证件号",
            required: true,
            type: "text",
            hintText: "请输入证件号",
            isSystem: true
          },
          {
            fieldName: "紧急联系人",
            required: false,
            type: "text",
            hintText: "紧急电话",
            isSystem: false
          },
          {
            fieldName: "年龄",
            required: true,
            type: "age-restriction",
            hintText: "18-60岁",
            isSystem: true
          },
          {
            fieldName: "性别",
            required: true,
            type: "gender-restriction",
            hintText: "男",
            isSystem: true
          }
        ];
        
        setFormFields(defaultFormFields);
        setAgeRestrictions([]);
        
        // 初始化团队成员数据，设置性别默认值
        const initialMembers = [{
          '姓名': '',
          '手机号': '',
          '证件类型/证件号': '',
          '紧急联系人': '',
          '年龄': '18',
          '性别': '男'
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
        {
          fieldName: "姓名",
          required: true,
          type: "text",
          hintText: "请输入姓名",
          isSystem: true
        },
        {
          fieldName: "手机号",
          required: true,
          type: "text",
          hintText: "请输入手机号",
          isSystem: true
        },
        {
          fieldName: "证件类型/证件号",
          required: true,
          type: "text",
          hintText: "请输入证件号",
          isSystem: true
        },
        {
          fieldName: "紧急联系人",
          required: false,
          type: "text",
          hintText: "紧急电话",
          isSystem: false
        },
        {
          fieldName: "年龄",
          required: true,
          type: "age-restriction",
          hintText: "18-60岁",
          isSystem: true
        },
        {
          fieldName: "性别",
          required: true,
          type: "gender-restriction",
          hintText: "男",
          isSystem: true
        }
      ];
      
      setFormFields(defaultFormFields);
      setAgeRestrictions([]);
      
      // 初始化团队成员数据，设置性别默认值
      const initialMembers = [{
        '姓名': '',
        '手机号': '',
        '证件类型/证件号': '',
        '紧急联系人': '',
        '年龄': '18',
        '性别': '男'
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
    console.log('handleSubmit 被调用');
    console.log('当前表单数据:', formData);
    console.log('当前表单字段:', formFields);
    
    // 使用新的校验函数
    const validation = validateTeamForm(formData, formData.members, formFields, {
      ageRestrictions
    });
    
    console.log('验证结果:', validation);
    
    if (!validation.isValid) {
      console.log('表单验证失败，错误信息:', validation.errors);
      // 显示错误消息给用户
      showMessage(`表单验证失败: ${validation.errors.join(', ')}`, 'error');
      
      // 将验证错误映射到字段错误状态
      const newFieldErrors: { [key: string]: string } = {};
      const newMemberErrors: { [key: string]: { [memberIndex: number]: string } } = {};
      
      validation.errors.forEach(error => {
        console.log('处理错误:', error);
        // 处理团队基本信息字段错误
        if (error.includes('团队负责人')) {
          newFieldErrors['teamLeader'] = '请填写团队负责人';
        } else if (error.includes('负责人电话')) {
          newFieldErrors['teamLeaderPhone'] = '请填写负责人电话';
        } else if (error.includes('团队名称')) {
          newFieldErrors['teamName'] = error.replace('团队名称: ', '');
        } else if (error.includes('联系邮箱')) {
          newFieldErrors['contactEmail'] = error.replace('联系邮箱: ', '');
        } else if (error.includes('团队简介')) {
          newFieldErrors['teamDescription'] = error.replace('团队简介: ', '');
        } else if (error.includes('成员')) {
          // 处理成员错误
          const memberMatch = error.match(/成员(\d+):\s*(.+)/);
          if (memberMatch) {
            const memberIndex = parseInt(memberMatch[1]) - 1;
            const errorMessage = memberMatch[2];
            
            // 根据错误消息确定字段名
            let fieldName = '';
            if (errorMessage.includes('姓名')) {
              fieldName = formFields.find(f => f.fieldName.includes('姓名'))?.fieldName || '姓名';
            } else if (errorMessage.includes('手机')) {
              fieldName = formFields.find(f => f.fieldName.includes('手机'))?.fieldName || '手机号';
            } else if (errorMessage.includes('证件')) {
              fieldName = formFields.find(f => f.fieldName.includes('证件') || f.fieldName.includes('身份证'))?.fieldName || '证件类型/证件号';
            } else if (errorMessage.includes('年龄')) {
              fieldName = formFields.find(f => f.fieldName.includes('年龄'))?.fieldName || '年龄';
            } else if (errorMessage.includes('性别')) {
              fieldName = formFields.find(f => f.fieldName.includes('性别'))?.fieldName || '性别';
            }
            
            if (fieldName) {
              if (!newMemberErrors[fieldName]) {
                newMemberErrors[fieldName] = {};
              }
              newMemberErrors[fieldName][memberIndex] = errorMessage;
            }
          }
        }
      });
      
      console.log('设置的字段错误:', newFieldErrors);
      console.log('设置的成员错误:', newMemberErrors);
      
      setFieldErrors(newFieldErrors);
      setMemberErrors(newMemberErrors);
      return;
    }

    setLoading(true);
    try {
      console.log('开始处理提交数据');
      
      // 额外检查：确保所有必填字段都已填写
      const emptyRequiredFields: string[] = [];
      formData.members.forEach((member, memberIndex) => {
        console.log(`检查成员${memberIndex + 1}的必填字段:`);
        formFields.forEach(field => {
          if (field.required) {
            const value = member[field.fieldName];
            console.log(`  ${field.fieldName}: "${value}" (必填: ${field.required})`);
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
      
      // 处理团队成员数据，确保字段名正确
      console.log('提交前的formData.members:', formData.members);
      console.log('当前的formFields:', formFields);
      
      // 详细检查每个成员的字段值
      formData.members.forEach((member, memberIndex) => {
        console.log(`=== 成员${memberIndex + 1} 详细数据 ===`);
        Object.keys(member).forEach(key => {
          console.log(`${key}: "${member[key]}" (类型: ${typeof member[key]})`);
        });
      });
      
      const processedMembers = formData.members.map((member, index) => {
        console.log(`处理成员${index + 1}:`, member);
        const processedMember: any = {};
        
        // 动态处理所有字段
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
      
      console.log('处理后的成员数据:', processedMembers);

      // 获取选中项目的cost值
      let selectedItemData = activity?.registrationItems?.find((item: RegistrationItem) => item.itemName === selectedItem);
      
      // 如果没有找到匹配的项目，使用第一个项目
      if (!selectedItemData && activity?.registrationItems && activity.registrationItems.length > 0) {
        selectedItemData = activity.registrationItems[0];
      }

      // 构建提交数据
      const submitData: any = {
        activityId,
        selectedItem,
        teamName: formData.teamName,
        teamLeader: formData.teamLeader,
        teamLeaderPhone: formData.teamLeaderPhone,
        teamDescription: formData.teamDescription,
        contactEmail: formData.contactEmail,
        members: processedMembers
      };
      
              // 添加报名费到每个成员
        if (selectedItemData && selectedItemData.cost !== null && selectedItemData.cost !== undefined && selectedItemData.cost !== 0) {
          submitData.members.forEach((member: any) => {
            member['cost'] = selectedItemData.cost.toString(); // 映射为后端期望的字段名
          });
          console.log('将cost字段添加到每个成员的formData:', selectedItemData.cost);
        }
      
      console.log('活动数据:', activity);
      console.log('选中的项目名称:', selectedItem);
      console.log('找到的选中项目数据:', selectedItemData);

      console.log('提交的数据:', submitData);
      console.log('最终提交的数据结构:', JSON.stringify(submitData, null, 2));
      
      // 特别检查members数组的数据
      console.log('Members数组详情:');
      submitData.members.forEach((member: any, index: number) => {
        console.log(`成员${index + 1}:`, {
          name: member.name,
          phone: member.phone,
          idCard: member.idCard,
          emergencyContact: member.emergencyContact,
          age: member.age,
          gender: member.gender,
          cost: member.cost
        });
      });

      console.log('开始发送网络请求...');
      const response = await axios.post(`http://localhost:3000/wsj/register/team`, submitData);
      console.log('网络请求响应:', response.data);
      
      if (response.data.code === 200) {
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
            count: formData.members.length, // 团队报名增加成员数量
            type: 'team'
          }
        });
        
        localStorage.setItem(storageKey, newCount.toString());
        
        window.dispatchEvent(event);
        
        showMessage('团队报名成功！', 'success');
        navigate(`/activity-detail/${activityId}`);
      } else {
        showMessage(response.data.msg || '报名失败', 'error');
      }
    } catch (error: any) {
      console.error('报名失败:', error);
      console.error('错误详情:', error);
      if (error.response) {
        console.error('错误响应:', error.response.data);
        console.error('错误状态:', error.response.status);
        showMessage(`报名失败: ${error.response.data?.msg || error.response.data?.message || '网络错误'}`, 'error');
      } else if (error.request) {
        console.error('请求错误:', error.request);
        showMessage('报名失败: 网络连接错误，请检查网络', 'error');
      } else {
        console.error('其他错误:', error.message);
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
          团队报名
        </h2>
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
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <button
          onClick={(e) => {
            console.log('按钮被点击');
            e.preventDefault();
            handleSubmit();
          }}
          disabled={loading || fieldsLoading}
          style={{
            width: '100%',
            padding: '15px',
            backgroundColor: (loading || fieldsLoading) ? '#ccc' : '#ff6b35',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: (loading || fieldsLoading) ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {loading ? '提交中...' : fieldsLoading ? '加载中...' : `确认报名 (${formData.members.length}人)`}
        </button>
      </div>
    </div>
  );
} 