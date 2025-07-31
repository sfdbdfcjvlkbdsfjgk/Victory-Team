<template>
  <div class="activity-management">
    <h2>活动管理</h2>
    <div class="activity-content">
      <p>这里是活动管理的主页面内容</p>
      <div class="activity-actions">
        <el-button type="primary" @click="goToCreate">新增活动</el-button>
        <el-button type="success" @click="goToRegistration">报名信息查看</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goToCreate = () => {
  router.push('/dashboard/activity/create')
}

const goToRegistration = () => {
  router.push('/dashboard/activity/registration')
}
</script>

<style scoped>
.activity-management {
  padding: 20px;
}

.activity-content {
  margin-top: 20px;
}

.activity-actions {
  margin-top: 20px;
}

.activity-actions .el-button {
  margin-right: 10px;
}
</style>