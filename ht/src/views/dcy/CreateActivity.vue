<template>
  <div class="create-activity">
    <h2>新增活动</h2>
    <div class="create-content">
      <el-form :model="activityForm" label-width="120px">
        <el-form-item label="活动名称">
          <el-input v-model="activityForm.name" placeholder="请输入活动名称"></el-input>
        </el-form-item>
        <el-form-item label="活动类型">
          <el-select v-model="activityForm.type" placeholder="请选择活动类型">
            <el-option label="普通活动" value="normal"></el-option>
            <el-option label="赛事活动" value="event"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="活动描述">
          <el-input type="textarea" v-model="activityForm.description" placeholder="请输入活动描述"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitForm">创建活动</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const activityForm = ref({
  name: '',
  type: '',
  description: ''
})

const submitForm = () => {
  console.log('创建活动:', activityForm.value)
  // 这里添加创建活动的逻辑
}

const resetForm = () => {
  activityForm.value = {
    name: '',
    type: '',
    description: ''
  }
}
</script>

<style scoped>
.create-activity {
  padding: 20px;
}

.create-content {
  margin-top: 20px;
  max-width: 600px;
}
</style>