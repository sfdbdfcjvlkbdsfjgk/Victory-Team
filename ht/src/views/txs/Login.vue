<template>
  <div class="login-container">
    <!-- 登录框 -->
    <div class="login-box">
      <div class="login-header">
        <h2>全民健身运营管理后台</h2>
      </div>
      
      <el-form 
        ref="loginFormRef"
        :model="loginForm" 
        :rules="loginRules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input 
            v-model="loginForm.username" 
            placeholder="请输入用户名"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
            size="large"
          />
        </el-form-item>
        
        <el-form-item>
          <div class="login-options">
            <el-checkbox 
              v-model="rememberPassword"
              @change="handleRememberPasswordChange"
            >
              记住密码
            </el-checkbox>
            <el-link class="forgot-password" type="primary" @click="handleForgotPassword">忘记密码?</el-link>
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            @click="handleLogin" 
            :loading="loading"
            size="large"
            class="login-button"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElCheckbox, ElLink, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { authAPI } from '../../api/txs.js'

// 类型定义
interface LoginFormData {
  username: string
  password: string
}

// 用户信息接口
interface UserInfo {
  userId: string;
  userName: string;
  realName: string;
  email: string;
  phone?: string;
}

// Token载荷接口
interface TokenPayload {
  userId: string;
  userName: string;
  realName: string;
  email: string;
  phone?: string;
  exp: number;
}
  
const router = useRouter()

// 表单引用
const loginFormRef = ref<FormInstance>()

// 加载状态
const loading = ref<boolean>(false)

// 记住密码状态
const rememberPassword = ref<boolean>(false)

// 登录表单数据
const loginForm = reactive<LoginFormData>({
  username: '',
  password: ''
})

// 表单验证规则
const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

// Token管理相关变量
let refreshTimeout: any = null

// 记住密码过期时间（7天，与RefreshToken过期时间一致）
const REMEMBER_CREDENTIALS_EXPIRES = 7 * 24 * 60 * 60 * 1000 // 7天的毫秒数

// ===== Token解析相关函数 =====

/**
 * 获取token payload
 */
const getTokenPayload = (): TokenPayload | null => {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;
  
  try {
    // 对于模拟的token，我们返回一个模拟的payload
    if (token.startsWith('mock-')) {
      return {
        userId: 'user_001',
        userName: 'admin',
        realName: '系统管理员',
        email: 'admin@example.com',
        phone: '13800138000',
        exp: Date.now() / 1000 + 3600 // 1小时后过期
      };
    }
    
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // 处理base64url编码
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    
    // 补齐padding
    const padLength = 4 - (base64.length % 4);
    if (padLength < 4) {
      base64 += '='.repeat(padLength);
    }
    
    // 解码base64并正确处理UTF-8字符
    const decoded = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Token解析失败:', error);
    return null;
  }
}

/**
 * 获取当前用户信息
 */
const getCurrentUser = (): UserInfo | null => {
  const payload = getTokenPayload();
  if (!payload) return null;
  
  return {
    userId: payload.userId,
    userName: payload.userName,
    realName: payload.realName,
    email: payload.email,
    phone: payload.phone
  };
}

// ===== Token管理相关函数 =====

/**
 * 安排token刷新
 */
const scheduleRefresh = (): void => {
  const payload = getTokenPayload()
  if (!payload) return // 如果payload不存在，直接返回
  
  const expirationTime = payload.exp * 1000 // 过期时间，转换为毫秒
  const refreshTime = expirationTime - Date.now() - 5 * 60 * 1000 // 提前5分钟刷新
  
  console.log(`Token将在${new Date(expirationTime).toLocaleString()}过期，计划在${new Date(Date.now() + refreshTime).toLocaleString()}刷新`)
  
  if (refreshTime > 0) {
    refreshTimeout = setTimeout(() => refreshToken(), refreshTime) // 设置定时器，定时刷新token
  } else {
    refreshToken() // 立即刷新token
  }
}

/**
 * 刷新token
 */
const refreshToken = async (): Promise<void> => {
  try {
    const refreshTokenValue = localStorage.getItem('refreshToken')
    if (!refreshTokenValue) {
      logout()
      return
    }
    
    const response = await authAPI.refreshToken(refreshTokenValue)
    
    if (response.code === 200) {
      const { accessToken, refreshToken: newRefreshToken } = response.data
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', newRefreshToken)
      
      scheduleRefresh()
      console.log('Token刷新成功')
    } else {
      logout()
    }
  } catch (error) {
    console.error('Token刷新失败:', error)
    logout()
  }
}

/**
 * 登出
 */
const logout = (): void => {
  // 清除到达自动刷新时间的token刷新定时器
  if (refreshTimeout) {
    clearTimeout(refreshTimeout)
    refreshTimeout = null
  }
  
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  
  if (router.currentRoute.value.path !== '/login') {
    router.push('/login')
  }
}

// ===== 登录相关函数 =====

// 处理忘记密码
const handleForgotPassword = (): void => {
  if(!loginForm.username){
    ElMessage.error('请输入用户名')
    return

  }
  router.push('/resetpwd')
}

// 处理记住密码选择变化
const handleRememberPasswordChange = async (value: boolean): Promise<void> => {
  if (value) {
    // 用户选择记住密码，显示授权确认对话框
    try {
      await ElMessageBox.confirm(
        '记住密码功能将在浏览器本地存储您的登录凭据，有效期为7天。请确保您在安全的设备上使用此功能。',
        '记住密码授权确认',
        {
          confirmButtonText: '我同意',
          cancelButtonText: '取消',
          type: 'warning',
          center: true
        }
      )
      // 用户确认授权，保持记住密码为true
      console.log('用户已授权记住密码功能')
    } catch {
      // 用户取消授权，重置记住密码为false
      rememberPassword.value = false
      console.log('用户取消记住密码授权')
    }
  } else {
    // 用户取消记住密码，清除已存储的凭据
    if (localStorage.getItem('rememberedCredentials')) {
      localStorage.removeItem('rememberedCredentials')
      console.log('已清除记住的凭据')
    }
  }
}

// 从本地存储加载记住的用户名和密码
const loadRememberedCredentials = (): void => {
  const remembered = localStorage.getItem('rememberedCredentials')
  if (remembered) {
    try {
      const credentials = JSON.parse(remembered)
      
      // 检查是否已过期（7天）
      if (credentials.expiresAt && Date.now() > credentials.expiresAt) {
        // 已过期，清除存储的凭据
        localStorage.removeItem('rememberedCredentials')
        console.log('记住的凭据已过期，已自动清除')
        ElMessage.info('记住的登录凭据已过期，请重新登录')
        return
      }
      
      // 未过期，加载凭据
      loginForm.username = credentials.username || ''
      loginForm.password = credentials.password || ''
      rememberPassword.value = true
      
      // 显示剩余有效时间
      const remainingTime = Math.ceil((credentials.expiresAt - Date.now()) / (24 * 60 * 60 * 1000))
      console.log(`已加载记住的凭据，还有 ${remainingTime} 天有效期`)
    } catch (error) {
      // 解析失败，清除无效数据
      localStorage.removeItem('rememberedCredentials')
      console.error('记住凭据数据格式错误，已清除:', error)
    }
  }
}

// 保存或清除记住的用户名和密码
const saveRememberedCredentials = (): void => {
  if (rememberPassword.value) {
    // 设置过期时间为7天后（与RefreshToken过期时间一致）
    const expiresAt = Date.now() + REMEMBER_CREDENTIALS_EXPIRES
    const expiresDate = new Date(expiresAt).toLocaleString()
    
    localStorage.setItem('rememberedCredentials', JSON.stringify({
      username: loginForm.username,
      password: loginForm.password,
      expiresAt: expiresAt,
      createdAt: Date.now() // 记录创建时间，便于调试
    }))
    
    console.log(`已保存记住的凭据，将在 ${expiresDate} 过期`)
    ElMessage.success(`登录凭据已保存，7天内免输入密码`)
  } else {
    localStorage.removeItem('rememberedCredentials')
    console.log('已清除记住的凭据')
  }
}

// 处理登录
const handleLogin = async (): Promise<void> => {
  if (!loginFormRef.value) return
  
  try {
    await loginFormRef.value.validate()
    loading.value = true
    
    console.log('开始登录请求，用户名:', loginForm.username)
    
    // 调用登录API
    const response = await authAPI.login({
      userName: loginForm.username,
      passWord: loginForm.password
    })
    
    console.log('登录响应:', response)
    
    if (response.code === 200) {
      // 保存记住的凭据
      saveRememberedCredentials()
      
      // 保存token
      localStorage.setItem('accessToken', response.data.accessToken)
      localStorage.setItem('refreshToken', response.data.refreshToken)
      
      // 从token中解析用户信息
      const userInfo = getCurrentUser()
      console.log('用户登录成功:', userInfo)
      
      // 开始token自动刷新
      scheduleRefresh()
      
      ElMessage.success('登录成功')
      router.push('/dashboard')
    } else {
      ElMessage.error(response.message || '登录失败')
    }
  } catch (error: any) {
    console.error('登录错误详情:', error);
    if (error !== false) { // 表单验证失败不显示错误
      if (error.response) {
        console.error('错误响应数据:', error.response.data);
        ElMessage.error(error.response.data?.message || '登录失败');
      } else if (error.request) {
        console.error('请求已发送但没有收到响应');
        ElMessage.error('服务器无响应，请检查网络连接');
      } else {
        console.error('请求设置时发生错误:', error.message);
        ElMessage.error(error.message || '登录失败');
      }
    }
  } finally {
    loading.value = false
  }
}

// 组件挂载时加载记住的凭据
onMounted(() => {
  loadRememberedCredentials()
})

// 组件卸载时清理定时器
onUnmounted(() => {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout)
    refreshTimeout = null
  }
})
</script>

<style lang="scss" scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.login-box {
  width: 400px;
  padding: 30px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.login-header {
  margin-bottom: 30px;
  text-align: center;
  
  h2 {
    font-size: 24px;
    color: #39a3d8;
    margin: 0;
  }
}

.login-form {
  .login-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .forgot-password{
    margin-left: 250px;
  }
  .login-button {
    width: 100%;
    margin-top: 10px;
  }
}
</style>