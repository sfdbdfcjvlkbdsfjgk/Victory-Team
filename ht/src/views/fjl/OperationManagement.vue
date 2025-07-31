<template>
  <div class="operation-management">
    <h2>运营位置管理</h2>
    <div class="operation-content">
      <p>这里是运营位置管理的主页面内容</p>
      <div class="operation-actions">
        <el-button type="primary" @click="goToBannerCreate">新建banner运营位</el-button>
        <el-button type="success" @click="goToBannerSort">排序banner位</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goToBannerCreate = () => {
  router.push('/dashboard/operation/banner-create')
}

const goToBannerSort = () => {
  router.push('/dashboard/operation/banner-sort')
}
</script>

<style scoped>
.operation-management {
  padding: 20px;
}

.operation-content {
  margin-top: 20px;
}

.operation-actions {
  margin-top: 20px;
}

.operation-actions .el-button {
  margin-right: 10px;
}
</style>