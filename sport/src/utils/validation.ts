// 表单校验工具函数

// 手机号校验
export const validatePhone = (phone: string): { isValid: boolean; message: string } => {
  if (!phone) {
    return { isValid: false, message: '请输入手机号' };
  }
  
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    return { isValid: false, message: '请输入正确的手机号格式' };
  }
  
  return { isValid: true, message: '' };
};

// 身份证号校验
export const validateIdCard = (idCard: string): { isValid: boolean; message: string } => {
  if (!idCard) {
    return { isValid: false, message: '请输入身份证号' };
  }
  
  // 身份证号正则表达式
  const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
  if (!idCardRegex.test(idCard)) {
    return { isValid: false, message: '请输入正确的身份证号格式' };
  }
  
  // 进一步验证身份证号的合法性
  if (idCard.length === 18) {
    const factor = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    const parity = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
    let sum = 0;
    let ai = 0;
    let wi = 0;
    
    for (let i = 0; i < 17; i++) {
      ai = parseInt(idCard[i]);
      wi = factor[i];
      sum += ai * wi;
    }
    
    const last = parity[sum % 11];
    if (last !== idCard[17].toUpperCase()) {
      return { isValid: false, message: '身份证号校验位错误' };
    }
  }
  
  return { isValid: true, message: '' };
};

// 姓名校验
export const validateName = (name: string): { isValid: boolean; message: string } => {
  if (!name) {
    return { isValid: false, message: '请输入姓名' };
  }
  
  if (name.length < 2) {
    return { isValid: false, message: '姓名至少2个字符' };
  }
  
  if (name.length > 20) {
    return { isValid: false, message: '姓名不能超过20个字符' };
  }
  
  // 检查是否包含特殊字符
  const nameRegex = /^[\u4e00-\u9fa5a-zA-Z\s]+$/;
  if (!nameRegex.test(name)) {
    return { isValid: false, message: '姓名只能包含中文、英文和空格' };
  }
  
  return { isValid: true, message: '' };
};

// 邮箱校验
export const validateEmail = (email: string): { isValid: boolean; message: string } => {
  if (!email) {
    return { isValid: true, message: '' }; // 邮箱可选
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: '请输入正确的邮箱格式' };
  }
  
  return { isValid: true, message: '' };
};

// 年龄校验
export const validateAge = (age: string, minAge: number = 0, maxAge: number = 120): { isValid: boolean; message: string } => {
  if (!age) {
    return { isValid: false, message: '请选择年龄' };
  }
  
  const ageNum = parseInt(age);
  if (isNaN(ageNum)) {
    return { isValid: false, message: '请输入有效的年龄' };
  }
  
  if (ageNum < minAge || ageNum > maxAge) {
    return { isValid: false, message: `年龄必须在${minAge}-${maxAge}岁之间` };
  }
  
  return { isValid: true, message: '' };
};

// 团队名称校验
export const validateTeamName = (teamName: string): { isValid: boolean; message: string } => {
  if (!teamName) {
    return { isValid: false, message: '请输入团队名称' };
  }
  
  if (teamName.length < 2) {
    return { isValid: false, message: '团队名称至少2个字符' };
  }
  
  if (teamName.length > 50) {
    return { isValid: false, message: '团队名称不能超过50个字符' };
  }
  
  return { isValid: true, message: '' };
};

// 团队简介校验
export const validateTeamDescription = (description: string): { isValid: boolean; message: string } => {
  if (!description) {
    return { isValid: true, message: '' }; // 团队简介可选
  }
  
  if (description.length >= 200) {
    return { isValid: false, message: '团队简介不能超过200个字符' };
  }
  
  return { isValid: true, message: '' };
};

// 通用必填项校验
export const validateRequired = (value: string, fieldName: string): { isValid: boolean; message: string } => {
  if (!value || value.trim() === '') {
    return { isValid: false, message: `请输入${fieldName}` };
  }
  
  return { isValid: true, message: '' };
};

// 根据字段类型进行校验
export const validateField = (fieldName: string, value: string, fieldType?: string, options?: any): { isValid: boolean; message: string } => {
  // 根据字段名称进行校验
  if (fieldName.includes('手机') || fieldName.includes('电话') || fieldName.includes('手机号')) {
    return validatePhone(value);
  }
  
  if (fieldName.includes('身份证') || fieldName.includes('证件号')) {
    return validateIdCard(value);
  }
  
  if (fieldName.includes('姓名')) {
    return validateName(value);
  }
  
  if (fieldName.includes('邮箱') || fieldName.includes('email')) {
    return validateEmail(value);
  }
  
  if (fieldName.includes('年龄')) {
    const minAge = options?.minAge || 0;
    const maxAge = options?.maxAge || 120;
    return validateAge(value, minAge, maxAge);
  }
  
  if (fieldName.includes('团队名称')) {
    return validateTeamName(value);
  }
  
  if (fieldName.includes('团队简介')) {
    return validateTeamDescription(value);
  }
  
  // 默认必填项校验
  if (!value || value.trim() === '') {
    return { isValid: false, message: `请填写${fieldName}` };
  }
  return validateRequired(value, fieldName);
};

// 表单整体校验
export const validateForm = (formData: any, formFields: any[], options?: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // 校验所有必填字段
  formFields.forEach(field => {
    if (field.required) {
      const value = formData[field.fieldName];
      const validation = validateField(field.fieldName, value, field.type, options);
      
      if (!validation.isValid) {
        errors.push(validation.message);
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// 家庭成员表单校验
export const validateFamilyForm = (members: any[], formFields: any[], options?: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  members.forEach((member, index) => {
    formFields.forEach(field => {
      if (field.required) {
        const value = member[field.fieldName];
        // 检查字段是否为空
        if (!value || value.trim() === '') {
          errors.push(`成员${index + 1}: 请填写${field.fieldName}`);
        } else {
          const validation = validateField(field.fieldName, value, field.type, options);
          
          if (!validation.isValid) {
            errors.push(`成员${index + 1}: ${validation.message}`);
          }
        }
      }
    });
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// 团队表单校验
export const validateTeamForm = (teamData: any, members: any[], formFields: any[], options?: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // 校验团队基本信息 - 必填字段
  if (!teamData.teamLeader || teamData.teamLeader.trim() === '') {
    errors.push('请填写团队负责人');
  } else {
    const nameValidation = validateName(teamData.teamLeader);
    if (!nameValidation.isValid) {
      errors.push(`团队负责人: ${nameValidation.message}`);
    }
  }
  
  if (!teamData.teamLeaderPhone || teamData.teamLeaderPhone.trim() === '') {
    errors.push('请填写负责人电话');
  } else {
    const phoneValidation = validatePhone(teamData.teamLeaderPhone);
    if (!phoneValidation.isValid) {
      errors.push(`负责人电话: ${phoneValidation.message}`);
    }
  }
  
  // 校验团队名称 - 可选字段
  if (teamData.teamName && teamData.teamName.trim() !== '') {
    const teamNameValidation = validateTeamName(teamData.teamName);
    if (!teamNameValidation.isValid) {
      errors.push(`团队名称: ${teamNameValidation.message}`);
    }
  }
  
  // 校验联系邮箱 - 可选字段
  if (teamData.contactEmail && teamData.contactEmail.trim() !== '') {
    const emailValidation = validateEmail(teamData.contactEmail);
    if (!emailValidation.isValid) {
      errors.push(`联系邮箱: ${emailValidation.message}`);
    }
  }
  
  // 校验团队简介 - 可选字段
  if (teamData.teamDescription && teamData.teamDescription.trim() !== '') {
    const descriptionValidation = validateTeamDescription(teamData.teamDescription);
    if (!descriptionValidation.isValid) {
      errors.push(`团队简介: ${descriptionValidation.message}`);
    }
  }
  
  // 校验团队成员
  members.forEach((member, index) => {
    formFields.forEach(field => {
      if (field.required) {
        const value = member[field.fieldName];
        // 检查字段是否为空
        if (!value || value.trim() === '') {
          errors.push(`成员${index + 1}: 请填写${field.fieldName}`);
        } else {
          const validation = validateField(field.fieldName, value, field.type, options);
          
          if (!validation.isValid) {
            errors.push(`成员${index + 1}: ${validation.message}`);
          }
        }
      }
    });
  });
  
  // 校验年龄限制
  if (options?.ageRestrictions && options.ageRestrictions.length > 0) {
    const ageRestriction = options.ageRestrictions[0];
    members.forEach((member, index) => {
      const age = parseInt(member['年龄'] || '0');
      if (age < ageRestriction.minAge || age > ageRestriction.maxAge) {
        errors.push(`成员${index + 1}: 年龄必须在${ageRestriction.minAge}-${ageRestriction.maxAge}岁之间`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}; 