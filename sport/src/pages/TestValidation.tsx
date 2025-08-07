import React, { useState } from 'react';
import { validatePhone, validateIdCard, validateName, validateEmail } from '../utils/validation';

export default function TestValidation() {
  const [phone, setPhone] = useState('');
  const [idCard, setIdCard] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const [phoneError, setPhoneError] = useState('');
  const [idCardError, setIdCardError] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    const validation = validatePhone(value);
    setPhoneError(validation.isValid ? '' : validation.message);
  };

  const handleIdCardChange = (value: string) => {
    setIdCard(value);
    const validation = validateIdCard(value);
    setIdCardError(validation.isValid ? '' : validation.message);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    const validation = validateName(value);
    setNameError(validation.isValid ? '' : validation.message);
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    const validation = validateEmail(value);
    setEmailError(validation.isValid ? '' : validation.message);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>表单校验测试</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label>手机号:</label>
        <input
          type="text"
          value={phone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          placeholder="请输入手机号"
          style={{
            width: '100%',
            padding: '10px',
            border: phoneError ? '1px solid #f56c6c' : '1px solid #ddd',
            borderRadius: '4px',
            marginTop: '5px'
          }}
        />
        {phoneError && (
          <div style={{ color: '#f56c6c', fontSize: '12px', marginTop: '5px' }}>
            {phoneError}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>身份证号:</label>
        <input
          type="text"
          value={idCard}
          onChange={(e) => handleIdCardChange(e.target.value)}
          placeholder="请输入身份证号"
          style={{
            width: '100%',
            padding: '10px',
            border: idCardError ? '1px solid #f56c6c' : '1px solid #ddd',
            borderRadius: '4px',
            marginTop: '5px'
          }}
        />
        {idCardError && (
          <div style={{ color: '#f56c6c', fontSize: '12px', marginTop: '5px' }}>
            {idCardError}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>姓名:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="请输入姓名"
          style={{
            width: '100%',
            padding: '10px',
            border: nameError ? '1px solid #f56c6c' : '1px solid #ddd',
            borderRadius: '4px',
            marginTop: '5px'
          }}
        />
        {nameError && (
          <div style={{ color: '#f56c6c', fontSize: '12px', marginTop: '5px' }}>
            {nameError}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>邮箱:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          placeholder="请输入邮箱"
          style={{
            width: '100%',
            padding: '10px',
            border: emailError ? '1px solid #f56c6c' : '1px solid #ddd',
            borderRadius: '4px',
            marginTop: '5px'
          }}
        />
        {emailError && (
          <div style={{ color: '#f56c6c', fontSize: '12px', marginTop: '5px' }}>
            {emailError}
          </div>
        )}
      </div>

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
        <h3>校验说明:</h3>
        <ul style={{ fontSize: '14px', lineHeight: '1.6' }}>
          <li><strong>手机号:</strong> 必须是11位数字，以1开头，第二位是3-9</li>
          <li><strong>身份证号:</strong> 支持15位和18位格式，18位会校验最后一位校验码</li>
          <li><strong>姓名:</strong> 2-20个字符，只能包含中文、英文和空格</li>
          <li><strong>邮箱:</strong> 标准邮箱格式，包含@和域名</li>
        </ul>
      </div>
    </div>
  );
} 