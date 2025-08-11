import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:3000', // hou后端服务地址
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加token等认证信息
    const token = localStorage.getItem('admin-token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log('🔄 API请求:', config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => {
    console.error('❌ 请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log('✅ API响应:', response.status, response.config.url)
    return response.data
  },
  (error) => {
    console.error('❌ API响应错误:', error.response?.status, error.response?.data)
    
    // 处理常见错误
    if (error.response?.status === 401) {
      localStorage.removeItem('admin-token')
      window.location.href = '/login'
    }
    
    return Promise.reject(error)
  }
)

export default api 