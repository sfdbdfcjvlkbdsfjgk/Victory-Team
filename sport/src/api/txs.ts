// 这个文件是对axios的二次封装
// 通过创建 axios 实例并添加拦截器，它提供了统一的请求配置、错误处理和模块化的 API 接口，方便在组件中使用。
import axios from 'axios'

// 定义接口类型
interface LoginRequest {
  userName: string
  passWord: string
}

interface LoginResponse {
  code: number
  message: string
  user: {
    id: string
    username: string
    [key: string]: any
  }
  roles: string[]
  permissions: string[]
  token: string
}

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:3000/txs', // 恢复原来的后端服务地址
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json' // 请求头：告诉服务器发送的数据格式是对象的JSON格式
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加access token到请求头
    const accessToken = localStorage.getItem('accessToken')
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // 返回响应数据
    return response.data
  },
  async (error) => {
    const originalRequest = error.config
    // 如果返回401且不是登录请求，尝试刷新token
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/login')) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post('http://localhost:3000/hy/refresh-token', { refreshToken })
          if (response.data.code === 200) {
            const { accessToken, refreshToken: newRefreshToken } = response.data.data
            // 更新本地存储的token
            localStorage.setItem('accessToken', accessToken)
            localStorage.setItem('refreshToken', newRefreshToken)
            // 重新发送原始请求
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
            return api(originalRequest)
          }
        }
      } catch (refreshError) {
        // 刷新token失败，清除本地存储并跳转到登录页
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        // 跳转到登录页
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)



// 用户认证API
export const authAPI = {
  // 用户登录
  login: (data: any) => api.post('/login', data),
  // 刷新访问令牌
  refreshToken: (refreshToken: string) => api.post('/refresh-token', { refreshToken }),
  // 发送重置密码验证码
  sendResetCode: (email: string) => api.post('/send-reset-code', { email }),
  // 重置密码
  resetPassword: (data: any) => api.post('/reset-password', data)
}

export default api 