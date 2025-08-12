<template>
  <div class="forgot-password-container">
    <!-- 背景画布挂载点 -->
    <div ref="bgContainer" class="bg-canvas-container" />
    
    <div class="form-wrapper">
      <h2 class="title">重置密码</h2>
      <p class="email-tip">请输入您的注册邮箱，我们将发送验证码</p>

      <el-steps :active="currentStep" align-center>
        <el-step title="验证邮箱" />
        <el-step title="重置密码" />
      </el-steps>

      <!-- 步骤1：验证邮箱 -->
      <el-form
        v-if="currentStep === 1"
        ref="emailFormRef"
        :model="emailForm"
        :rules="emailRules"
        @submit.prevent="handleSendCode"
      >
        <el-form-item prop="email">
          <el-input
            v-model="emailForm.email"
            placeholder="邮箱地址"
            prefix-icon="Message"
            size="large"
            class="custom-input"
          />
        </el-form-item>

        <el-button
          type="primary"
          native-type="submit"
          :loading="sendCodeLoading"
          size="large"
          class="submit-btn"
        >
          获取验证码
        </el-button>
      </el-form>

      <!-- 步骤2：重置密码 -->
      <el-form
        v-if="currentStep === 2"
        ref="resetFormRef"
        :model="resetForm"
        :rules="resetRules"
        @submit.prevent="handleResetPassword"
      >
        <div class="email-tip">
          验证码已发送至：<span class="email">{{ maskedEmail }}</span>
        </div>

        <el-form-item prop="verificationCode">
          <el-input
            v-model="resetForm.verificationCode"
            placeholder="6位验证码"
            prefix-icon="Key"
            maxlength="6"
            size="large"
            class="custom-input"
          />
        </el-form-item>

        <el-form-item prop="newPassword">
          <el-input
            v-model="resetForm.newPassword"
            type="password"
            placeholder="新密码"
            prefix-icon="Lock"
            show-password
            size="large"
            class="custom-input"
          />
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input
            v-model="resetForm.confirmPassword"
            type="password"
            placeholder="确认密码"
            prefix-icon="Lock"
            show-password
            size="large"
            class="custom-input"
          />
        </el-form-item>

        <el-button
          type="primary"
          native-type="submit"
          :loading="resetLoading"
          size="large"
          class="submit-btn"
        >
          确认重置
        </el-button>

        <div class="resend-tip">
          <span v-if="countdown > 0">{{ countdown }} 秒后可重新发送</span>
          <el-link v-else type="primary" @click="handleResendCode">重新发送</el-link>
        </div>
      </el-form>

      <div class="back-login">
        <el-link type="primary" @click="goBack">
          <el-icon><ArrowLeft /></el-icon> 返回登录
        </el-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { authAPI } from '@/api/txs' // 根据实际路径调整

import * as THREE from 'three'
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js'

interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

interface SendCodeResponseData {
  success: boolean
}

interface ResetPasswordResponseData {
  success: boolean
}

const router = useRouter()
const currentStep = ref(1)

const emailFormRef = ref()
const resetFormRef = ref()
const bgContainer = ref<HTMLElement | null>(null)

const emailForm = reactive({
  email: ''
})

const resetForm = reactive({
  verificationCode: '',
  newPassword: '',
  confirmPassword: ''
})

const sendCodeLoading = ref(false)
const resetLoading = ref(false)
const countdown = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null

const emailRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
}

const resetRules = {
  verificationCode: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码必须是6位', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: any) => {
        if (value !== resetForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const maskedEmail = computed(() => {
  const email = emailForm.email
  if (!email) return ''
  const [name, domain] = email.split('@')
  return name.slice(0, 2) + '***@' + domain
})

const startCountdown = () => {
  countdown.value = 60
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) clearCountdown()
  }, 1000)
}

const clearCountdown = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
    countdown.value = 0
  }
}

const handleSendCode = async () => {
  if (!emailFormRef.value) return

  try {
    await emailFormRef.value.validate()
    sendCodeLoading.value = true

    const response: ApiResponse<SendCodeResponseData> = await authAPI.sendResetCode(emailForm.email)

    if (response.code === 200) {
      ElMessage.success('验证码已发送，请查收邮件')
      currentStep.value = 2
      startCountdown()
    } else {
      ElMessage.error(response.message)
    }
  } catch (error) {
    ElMessage.error('发送失败')
  } finally {
    sendCodeLoading.value = false
  }
}

const handleResendCode = async () => {
  try {
    sendCodeLoading.value = true
    const response: ApiResponse<SendCodeResponseData> = await authAPI.sendResetCode(emailForm.email)

    if (response.code === 200) {
      ElMessage.success('验证码已重新发送')
      startCountdown()
    } else {
      ElMessage.error(response.message)
    }
  } catch (error) {
    ElMessage.error('发送失败')
  } finally {
    sendCodeLoading.value = false
  }
}

const handleResetPassword = async () => {
  if (!resetFormRef.value) return

  try {
    await resetFormRef.value.validate()
    resetLoading.value = true

    const payload = {
      email: emailForm.email,
      verificationCode: resetForm.verificationCode,
      newPassword: resetForm.newPassword
    }

    const response: ApiResponse<ResetPasswordResponseData> = await authAPI.resetPassword(payload)

    if (response.code === 200) {
      ElMessage.success('密码重置成功，请登录')
      router.push('/login')
    } else {
      ElMessage.error(response.message)
    }
  } catch (error) {
    ElMessage.error('重置失败')
  } finally {
    resetLoading.value = false
  }
}

const goBack = () => {
  router.push('/login')
}

onUnmounted(() => {
  clearCountdown()
})


/* ----------------- 美化后的Three.js背景和泡泡动画 ----------------- */
let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.OrthographicCamera | null = null
let bgMesh: THREE.Mesh | null = null
let animationId: number | null = null

const noise = new SimplexNoise()
let time = 0

// 泡泡相关
const bubbles: THREE.Mesh[] = []
const bubbleCount = 80

// 创建泡泡纹理
function createBubbleTexture(): THREE.Texture {
  const canvas = document.createElement('canvas')
  const size = 128
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  
  // 绘制更真实的泡泡纹理（带高光效果）
  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  )
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)')  // 中心高光
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.5)')
  gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
  
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  
  // 添加内部高光
  ctx.beginPath()
  ctx.arc(size * 0.3, size * 0.3, size * 0.1, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
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
    // 使用MeshBasicMaterial确保泡泡颜色与背景融合
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
  
  // 随机大小和透明度
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

  // 自定义着色器材质 - 增强版流体渐变效果
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
        
        // 创建柔和的蓝紫色渐变背景
        vec3 color = mix(
          vec3(0.85, 0.92, 1.0),  // 底部浅蓝色
          vec3(0.9, 0.9, 1.0),   // 顶部淡紫色
          uv.y
        );
        
        // 鼠标跟随光效
        float mouseLight = 0.1 / length(uv - mouse);
        color += vec3(0.8, 0.9, 1.0) * mouseLight * 0.05;
        
        // 流体波纹效果
        float flow = smoothNoise(uv * 4.0 + time * 0.2) * 0.5;
        float wave = sin(uv.y * 10.0 + time * 0.5 + flow) * 0.03;
        
        // 应用波纹到颜色
        color += wave * vec3(0.2, 0.3, 0.5);
        
        // 添加网格光效
        float grid = (sin(uv.x * 20.0 + time * 0.3) * 0.5 + 0.5) * 0.03;
        grid += (sin(uv.y * 20.0 + time * 0.4) * 0.5 + 0.5) * 0.03;
        color += grid * vec3(0.3, 0.5, 0.8);
        
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
    bgMesh.material.uniforms.resolution.value.set(container.clientWidth, container.clientHeight);
}
}

function animate() {
animationId = requestAnimationFrame(animate);
if (!bgMesh || !(bgMesh.material instanceof THREE.ShaderMaterial)) return;

time += 0.01;
bgMesh.material.uniforms.time.value = time;

// 更新泡泡动画
bubbles.forEach (bubble => {
// 上升运动
bubble.position.y += bubble.userData.speed;

// 左右摇摆（使用正弦函数使运动更自然）
const swing = Math.sin (time * bubble.userData.swingSpeed + bubble.userData.swingOffset) * bubble.userData.swing;
bubble.position.x += swing;

// 超出顶部边界后重置
if (bubble.position.y> 1.2) {
resetBubble (bubble);
}

// 轻微旋转增加真实感
bubble.rotation.z += 0.005;
});

renderer?.render(scene as THREE.Scene, camera as THREE.Camera);
}

onMounted(() => {
if (bgContainer.value) {
initThreeBg(bgContainer.value);
}
});

onUnmounted(() => {
if (animationId) {
cancelAnimationFrame(animationId);
animationId = null;
}
window.removeEventListener('resize', onWindowResize);
window.removeEventListener('mousemove', () => {});
if (renderer && bgContainer.value) {
bgContainer.value.removeChild(renderer.domElement);
renderer.dispose();
renderer = null;
scene = null;
camera = null;
bgMesh = null;
}
});
</script>

<style scoped>
.forgot-password-container {
position: relative;
display: flex;
justify-content: center;
align-items: center;
min-height: 100vh;
overflow: hidden;
}

.bg-canvas-container {
position: absolute;
top: 0;
left: 0;
width: 100%;
height: 100%;
pointer-events: none;
z-index: 0;
}

.form-wrapper {
position: relative;
z-index: 10;
width: 420px;
padding: 40px;
background: rgba(255, 255, 255, 0.95);
border-radius: 16px;
box-shadow: 0 15px 40px rgba(100, 140, 255, 0.15);
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
transition: all 0.3s ease;
}

.form-wrapper:hover {
box-shadow: 0 20px 50px rgba(100, 140, 255, 0.2);
}

.title {
text-align: center;
font-size: 24px;
font-weight: 700;
margin-bottom: 10px;
color: #1e293b;
}

.email-tip {
text-align: center;
margin-bottom: 20px;
color: #64748b;
}

.email {
color: #3b82f6;
font-weight: 500;
}

.resend-tip {
text-align: center;
margin-top: 10px;
font-size: 13px;
color: #64748b;
}

.submit-btn {
width: 100%;
margin-top: 10px;
height: 50px;
border-radius: 10px;
font-size: 1rem;
font-weight: 600;
background: linear-gradient(90deg, #4f95f6 0%, #3b82f6 100%);
border: none;
transition: all 0.3s ease;
}

.submit-btn:hover {
background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
transform: translateY(-2px);
box-shadow: 0 10px 20px rgba(59, 130, 246, 0.2);
}

.submit-btn:active {
transform: translateY(0);
}

.back-login {
text-align: center;
margin-top: 20px;
}

.custom-input {
border-radius: 10px;
border: 1px solid #e2e8f0;
transition: all 0.3s ease;
}

.custom-input:focus-within {
border-color: #93c5fd;
box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
}

/* 步骤条样式优化 */
:deep(.el-steps) {
margin: 25px 0;
}

:deep(.el-step__title) {
font-size: 14px;
}

/* 输入框图标颜色 */
:deep(.el-input__prefix-icon) {
color: #94a3b8;
}
</style>