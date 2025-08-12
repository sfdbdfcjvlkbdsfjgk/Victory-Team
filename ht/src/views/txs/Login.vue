<template>
  <div class="login-root">
    <!-- 背景画布挂载点 -->
    <div ref="bgContainer" class="bg-canvas-container" />

    <div class="login-container">
      <!-- 登录框 -->
      <div class="login-box">
        <div class="login-header">
          <!-- 增加系统图标 -->
          <div class="system-icon">
            <el-icon class="icon">身</el-icon>
          </div>
          <h2>全民健身运营管理后台</h2>
          <p class="system-desc">专业的健身机构管理解决方案</p>
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
              class="custom-input"
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
              class="custom-input"
            />
          </el-form-item>

          <el-form-item>
            <div class="login-options">
              <el-checkbox 
                v-model="rememberPassword" 
                @change="handleRememberPasswordChange"
                class="remember-checkbox"
              >
                记住密码
              </el-checkbox>
              
              <el-button 
                type="text" 
                class="forgot-password" 
                @click="handleForgotPassword"
              >
                <el-icon class="key-icon"><Key /></el-icon>
                忘记密码？
              </el-button>
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
              <el-icon class="login-icon" v-if="!loading"><ArrowRight /></el-icon>
              <el-icon class="loading-icon" v-else><Loading /></el-icon>
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 底部版权信息 -->
        <div class="copyright">
          © 2023 全民健身管理系统 版权所有
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
// import { Activity, ArrowRight, Key, Loading, Lock, User } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
// 假设你的 api 模块路径正确，若有调整需对应修改
import { authAPI } from '../../api/txs.js'

import * as THREE from 'three'
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js'

interface LoginFormData {
  username: string
  password: string
}

interface UserInfo {
  userId: string
  userName: string
  realName: string
  email: string
  phone?: string
}

interface TokenPayload {
  userId: string
  userName: string
  realName: string
  email: string
  phone?: string
  exp: number
}

const router = useRouter()
const loginFormRef = ref<FormInstance>()
const loading = ref<boolean>(false)
const rememberPassword = ref<boolean>(false)
const loginForm = reactive<LoginFormData>({
  username: '',
  password: ''
})
const loginRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

let refreshTimeout: number | null = null
const REMEMBER_CREDENTIALS_EXPIRES = 7 * 24 * 60 * 60 * 1000

const getTokenPayload = (): TokenPayload | null => {
  const token = localStorage.getItem('accessToken')
  if (!token) return null
  try {
    if (token.startsWith('mock-')) {
      return {
        userId: 'user_001',
        userName: 'admin',
        realName: '系统管理员',
        email: 'admin@example.com',
        phone: '13800138000',
        exp: Date.now() / 1000 + 3600
      }
    }
    const parts = token.split('.')
    if (parts.length !== 3) return null
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padLength = base64.length % 4
    if (padLength > 0) base64 += '='.repeat(4 - padLength)
    const decoded = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(decoded)
  } catch (error) {
    console.error('Token解析失败:', error)
    return null
  }
}

const getCurrentUser = (): UserInfo | null => {
  const payload = getTokenPayload()
  if (!payload) return null
  return {
    userId: payload.userId,
    userName: payload.userName,
    realName: payload.realName,
    email: payload.email,
    phone: payload.phone
  }
}

const scheduleRefresh = (): void => {
  const payload = getTokenPayload()
  if (!payload) return
  const expirationTime = payload.exp * 1000
  const refreshTime = expirationTime - Date.now() - 5 * 60 * 1000
  if (refreshTime > 0) {
    refreshTimeout = window.setTimeout(() => refreshToken(), refreshTime)
  } else {
    refreshToken()
  }
}

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
    } else logout()
  } catch (error) {
    console.error('Token刷新失败:', error)
    logout()
  }
}

const logout = (): void => {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout)
    refreshTimeout = null
  }
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  if (router.currentRoute.value.path !== '/login') router.push('/login')
}

const handleForgotPassword = (): void => {
  if (!loginForm.username) {
    ElMessage.error('请输入用户名')
    return
  }
  router.push('/resetpwd')
}

const handleRememberPasswordChange = async (value: boolean): Promise<void> => {
  if (value) {
    try {
      await ElMessageBox.confirm(
        '记住密码功能将在浏览器本地存储您的登录凭据，有效期为7天。请确保您在安全的设备上使用此功能。',
        '记住密码授权确认',
        { confirmButtonText: '我同意', cancelButtonText: '取消', type: 'warning', center: true }
      )
    } catch {
      rememberPassword.value = false
    }
  } else {
    if (localStorage.getItem('rememberedCredentials')) localStorage.removeItem('rememberedCredentials')
  }
}

const loadRememberedCredentials = (): void => {
  const remembered = localStorage.getItem('rememberedCredentials')
  if (!remembered) return
  try {
    const credentials = JSON.parse(remembered)
    if (credentials.expiresAt && Date.now() > credentials.expiresAt) {
      localStorage.removeItem('rememberedCredentials')
      ElMessage.info('记住的登录凭据已过期，请重新登录')
      return
    }
    loginForm.username = credentials.username || ''
    loginForm.password = credentials.password || ''
    rememberPassword.value = true
  } catch {
    localStorage.removeItem('rememberedCredentials')
  }
}

const saveRememberedCredentials = (): void => {
  if (rememberPassword.value) {
    const expiresAt = Date.now() + REMEMBER_CREDENTIALS_EXPIRES
    localStorage.setItem(
      'rememberedCredentials',
      JSON.stringify({
        username: loginForm.username,
        password: loginForm.password,
        expiresAt,
        createdAt: Date.now()
      })
    )
    ElMessage.success('登录凭据已保存，7天内免输入密码')
  } else {
    localStorage.removeItem('rememberedCredentials')
  }
}

const handleLogin = async (): Promise<void> => {
  if (!loginFormRef.value) return
  try {
    await loginFormRef.value.validate()
    loading.value = true
    const response = await authAPI.login({
      userName: loginForm.username,
      passWord: loginForm.password
    })
    if (response.code === 200) {
      saveRememberedCredentials()
      localStorage.setItem('accessToken', response.data.accessToken)
      localStorage.setItem('refreshToken', response.data.refreshToken)
      scheduleRefresh()
      ElMessage.success('登录成功')
      router.push('/dashboard')
    } else {
      ElMessage.error(response.message || '登录失败')
    }
  } catch (error: any) {
    if (error.response) ElMessage.error(error.response.data?.message || '登录失败')
    else if (error.request) ElMessage.error('服务器无响应，请检查网络连接')
    else ElMessage.error(error.message || '登录失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadRememberedCredentials()
})
onUnmounted(() => {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout)
    refreshTimeout = null
  }
})

/* ----------------- 增强版Three.js背景和泡泡动画 ----------------- */

const bgContainer = ref<HTMLElement | null>(null)

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.OrthographicCamera | null = null
let bgMesh: THREE.Mesh | null = null
let animationId: number | null = null

const noise = new SimplexNoise()
let time = 0

// 泡泡相关
const bubbles: THREE.Mesh[] = []
const bubbleCount = 60

// 创建泡泡纹理
function createBubbleTexture(): THREE.Texture {
  const canvas = document.createElement('canvas')
  const size = 128
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  
  // 绘制带高光效果的泡泡纹理
  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  )
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)')  // 中心高光
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.4)')
  gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
  
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  
  // 添加内部高光
  ctx.beginPath()
  ctx.arc(size * 0.3, size * 0.3, size * 0.1, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.fill()
  
  const texture = new THREE.Texture(canvas)
  texture.needsUpdate = true
  return texture
}

// 初始化泡泡
function initBubbles(scene: THREE.Scene) {
  const bubbleGeometry = new THREE.PlaneGeometry(1, 1)
  const bubbleTexture = createBubbleTexture()
  
  for (let i = 0; i < bubbleCount; i++) {
    const bubbleMaterial = new THREE.MeshBasicMaterial({
      map: bubbleTexture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    })
    
    const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial)
    resetBubble(bubble, true)
    scene.add(bubble)
    bubbles.push(bubble)
  }
}

// 重置泡泡位置和属性
function resetBubble(bubble: THREE.Mesh, initial = false) {
  // 随机位置
  const x = (Math.random() - 0.5) * 2.2  // 稍宽于可视区域
  const y = initial ? (Math.random() - 0.5) * 2 : -1.2  // 初始随机，重置时从底部进入
  const z = (Math.random() - 0.5) * 0.5  // 轻微z轴偏移，增强层次感
  
  bubble.position.set(x, y, z)
  
  // 随机大小
  const size = 0.02 + Math.random() * 0.1
  bubble.scale.set(size, size, size)
  
  // 存储泡泡特性（速度、摇摆幅度等）
  bubble.userData = {
    speed: 0.002 + Math.random() * 0.004,
    swing: (Math.random() - 0.5) * 0.005,
    swingSpeed: 0.02 + Math.random() * 0.05,
    swingOffset: Math.random() * Math.PI * 2
  }
}

// 初始化Three.js背景
function initThreeBg(container: HTMLElement) {
  scene = new THREE.Scene()
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100)
  camera.position.z = 1

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  })
  renderer.setPixelRatio(window.devicePixelRatio || 1)
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  container.appendChild(renderer.domElement)

  // 自定义着色器材质 - 健身主题的渐变背景
  const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      resolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
      mouse: { value: new THREE.Vector2(0.5, 0.5) }
    },
    vertexShader: `
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform float time;
      uniform vec2 resolution;
      uniform vec2 mouse;

      // 噪声函数
      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453123);
      }

      // 平滑噪声
      float smoothNoise(vec2 p) {
        return noise(p)*0.5 + noise(p*2.0)*0.25 + noise(p*4.0)*0.125;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        
        // 创建健身主题的蓝绿色渐变背景
        vec3 color = mix(
          vec3(0.8, 0.95, 0.95),  // 底部淡青绿色
          vec3(0.9, 0.98, 1.0),   // 顶部浅蓝色
          uv.y
        );
        
        // 鼠标跟随光效
        float mouseLight = 0.1 / length(uv - mouse);
        color += vec3(0.7, 0.9, 0.95) * mouseLight * 0.05;
        
        // 流体波纹效果 - 模拟运动感
        float flow = smoothNoise(uv * 4.0 + time * 0.2) * 0.5;
        float wave = sin(uv.y * 10.0 + time * 0.5 + flow) * 0.03;
        
        // 应用波纹到颜色
        color += wave * vec3(0.2, 0.4, 0.4);
        
        // 添加网格光效 - 增强运动感
        float grid = (sin(uv.x * 20.0 + time * 0.3) * 0.5 + 0.5) * 0.03;
        grid += (sin(uv.y * 20.0 + time * 0.4) * 0.5 + 0.5) * 0.03;
        color += grid * vec3(0.3, 0.5, 0.5);
        
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    transparent: true
  })

  const planeGeo = new THREE.PlaneGeometry(2, 2)
  bgMesh = new THREE.Mesh(planeGeo, shaderMaterial)
  scene.add(bgMesh)

  // 初始化泡泡
  initBubbles(scene)

  // 鼠标移动效果
  window.addEventListener('mousemove', (e) => {
    if (!bgMesh || !(bgMesh.material instanceof THREE.ShaderMaterial)) return
    const rect = container.getBoundingClientRect()
    const mouseX = (e.clientX - rect.left) / rect.width
    const mouseY = 1.0 - (e.clientY - rect.top) / rect.height  // 翻转Y轴
    bgMesh.material.uniforms.mouse.value.set(mouseX, mouseY)
  })

  window.addEventListener('resize', onWindowResize)
  animate()
}

function onWindowResize() {
  if (!renderer || !camera) return
  const container = bgContainer.value
  if (!container) return

  renderer.setSize(container.clientWidth, container.clientHeight)
  if (bgMesh && bgMesh.material instanceof THREE.ShaderMaterial) {
    bgMesh.material.uniforms.resolution.value.set(container.clientWidth, container.clientHeight)
  }
}

function animate() {
  animationId = requestAnimationFrame(animate)
  if (!bgMesh || !(bgMesh.material instanceof THREE.ShaderMaterial)) return

  time += 0.01
  bgMesh.material.uniforms.time.value = time

  // 更新泡泡动画
  bubbles.forEach(bubble => {
    // 上升运动
    bubble.position.y += bubble.userData.speed
    
    // 左右摇摆（使用正弦函数使运动更自然）
    const swing = Math.sin(time * bubble.userData.swingSpeed + bubble.userData.swingOffset) * bubble.userData.swing
    bubble.position.x += swing
    
    // 超出顶部边界后重置
    if (bubble.position.y > 1.2) {
      resetBubble(bubble)
    }
    
    // 轻微旋转增加真实感
    bubble.rotation.z += 0.005
  })

  renderer?.render(scene as THREE.Scene, camera as THREE.Camera)
}

onMounted(() => {
  if (bgContainer.value) {
    initThreeBg(bgContainer.value)
  }
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  window.removeEventListener('resize', onWindowResize)
  window.removeEventListener('mousemove', () => {})
  if (renderer && bgContainer.value) {
    bgContainer.value.removeChild(renderer.domElement)
    renderer.dispose()
    renderer = null
    scene = null
    camera = null
    bgMesh = null
  }
})
</script>
<style scoped>
.login-root {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #e6f7ff 0%, #f0f9f9 100%);
}

.bg-canvas-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.login-container {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 420px;
  margin: auto;
  top: 15vh;
  padding: 2.5rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 15px 40px rgba(100, 180, 180, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: all 0.3s ease;
}

.login-container:hover {
  box-shadow: 0 20px 50px rgba(100, 180, 180, 0.2);
  transform: translateY(-3px);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.system-icon {
  width: 60px;
  height: 60px;
  margin: 0 auto 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4dd0e1 0%, #4fc3f7 100%);
  border-radius: 50%;
  box-shadow: 0 4px 15px rgba(77, 208, 225, 0.3);
}

.icon {
  font-size: 28px;
  color: white;
}

.login-header h2 {
  margin-bottom: 0.5rem;
  font-weight: 700;
  color: #263238;
  font-size: 1.8rem;
  letter-spacing: 0.5px;
}

.system-desc {
  color: #78909c;
  font-size: 0.9rem;
  margin: 0;
}

.login-form {
  width: 100%;
}

.custom-input {
  border-radius: 10px;
  border: 1px solid #e0f2f1;
  transition: all 0.3s ease;
  height: 50px;
}

.custom-input:focus-within {
  border-color: #80deea;
  box-shadow: 0 0 0 3px rgba(128, 222, 234, 0.2);
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  width: 100%;
}

.remember-checkbox .el-checkbox__label {
  color: #607d8b;
  font-size: 0.9rem;
}

.forgot-password {
  cursor: pointer;
  font-size: 0.9rem;
  color: #00acc1 !important;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  background-color: rgba(0, 172, 193, 0.08);
  transition: all 0.25s ease;
}

.forgot-password:hover {
  background-color: rgba(0, 172, 193, 0.15);
  color: #00838f !important;
}

.key-icon {
  font-size: 14px;
}

.login-button {
  width: 100%;
  height: 50px;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  background: linear-gradient(90deg, #4dd0e1 0%, #4fc3f7 100%);
  border: none;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.login-button:hover {
  background: linear-gradient(90deg, #4fc3f7 0%, #00acc1 100%);
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(77, 208, 225, 0.25);
}

.login-button:active {
  transform: translateY(0);
}

.login-icon, .loading-icon {
  font-size: 16px;
}

.copyright {
  text-align: center;
  margin-top: 2rem;
  color: #b0bec5;
  font-size: 0.8rem;
  padding-top: 1rem;
  border-top: 1px solid #f1f8e9;
}

/* 输入框图标颜色 */
:deep(.el-input__prefix-icon) {
  color: #90a4ae;
}

/* 复选框样式优化 */
:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #4dd0e1;
  border-color: #4dd0e1;
}

:deep(.el-checkbox__inner:hover) {
  border-color: #4dd0e1;
}

.custom-input:focus-within {
  border-color: #80deea;
  box-shadow: 0 0 0 3px rgba(128, 222, 234, 0.2);
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  width: 100%;
}

.remember-checkbox .el-checkbox__label {
  color: #607d8b;
  font-size: 0.9rem;
}

.forgot-password {
  cursor: pointer;
  font-size: 0.9rem;
  color: #00acc1 !important;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  background-color: rgba(0, 172, 193, 0.08);
  transition: all 0.25s ease;
}

.forgot-password:hover {
  background-color: rgba(0, 172, 193, 0.15);
  color: #00838f !important;
}

.key-icon {
  font-size: 14px;
}

.login-button {
  width: 100%;
  height: 50px;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  background: linear-gradient(90deg, #4dd0e1 0%, #4fc3f7 100%);
  border: none;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.login-button:hover {
  background: linear-gradient(90deg, #4fc3f7 0%, #00acc1 100%);
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(77, 208, 225, 0.25);
}

.login-button:active {
  transform: translateY(0);
}

.login-icon, .loading-icon {
  font-size: 16px;
}

.copyright {
  text-align: center;
  margin-top: 2rem;
  color: #b0bec5;
  font-size: 0.8rem;
  padding-top: 1rem;
  border-top: 1px solid #f1f8e9;
}

/* 输入框图标颜色 */
:deep(.el-input__prefix-icon) {
  color: #90a4ae;
}

/* 复选框样式优化 */
:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #4dd0e1;
  border-color: #4dd0e1;
}

:deep(.el-checkbox__inner:hover) {
  border-color: #4dd0e1;
}
</style>
