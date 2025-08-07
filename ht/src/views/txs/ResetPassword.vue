<template>
  <div class="forgot-password-container">
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
import { ref, reactive, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { authAPI } from '@/api/txs' // 根据实际路径调整

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
</script>

<style scoped>
.forgot-password-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.form-wrapper {
  width: 420px;
  padding: 40px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.title {
  text-align: center;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 10px;
}

.email-tip {
  text-align: center;
  margin-bottom: 20px;
  color: #909399;
}

.resend-tip {
  text-align: center;
  margin-top: 10px;
  font-size: 13px;
  color: #909399;
}

.submit-btn {
  width: 100%;
  margin-top: 10px;
}

.back-login {
  text-align: center;
  margin-top: 20px;
}
</style>
