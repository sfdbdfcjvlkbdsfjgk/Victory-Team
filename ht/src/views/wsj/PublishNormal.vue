<template>
  <div class="publish-normal">
    <h2>发布活动（普通活动）</h2>
    <div class="publish-content">
      <el-form :model="normalForm" label-width="120px" :rules="rules" ref="formRef">
        <el-form-item label="活动标题" prop="title">
          <el-input v-model="normalForm.title" placeholder="请输入活动标题"></el-input>
        </el-form-item>
        
        <el-form-item label="活动时间" prop="time">
          <el-date-picker
            v-model="normalForm.time"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        
        <el-form-item label="活动地点" prop="location">
          <el-input v-model="normalForm.location" placeholder="请输入活动地点"></el-input>
        </el-form-item>
        
        <el-form-item label="参与人数" prop="maxParticipants">
          <el-input-number v-model="normalForm.maxParticipants" :min="1" placeholder="最大参与人数"></el-input-number>
        </el-form-item>
        
        <el-form-item label="活动描述" prop="description">
          <el-input 
            type="textarea" 
            v-model="normalForm.description" 
            :rows="4"
            placeholder="请输入活动详细描述"
          ></el-input>
        </el-form-item>
        
        <el-form-item label="报名要求">
          <el-input 
            type="textarea" 
            v-model="normalForm.requirements" 
            :rows="3"
            placeholder="请输入报名要求（可选）"
          ></el-input>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitForm">发布活动</el-button>
          <el-button @click="resetForm">重置</el-button>
          <el-button @click="saveDraft">保存草稿</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

const formRef = ref()

const normalForm = reactive({
  title: '',
  time: [],
  location: '',
  maxParticipants: 50,
  description: '',
  requirements: ''
})

const rules = {
  title: [
    { required: true, message: '请输入活动标题', trigger: 'blur' }
  ],
  time: [
    { required: true, message: '请选择活动时间', trigger: 'change' }
  ],
  location: [
    { required: true, message: '请输入活动地点', trigger: 'blur' }
  ],
  maxParticipants: [
    { required: true, message: '请输入参与人数', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入活动描述', trigger: 'blur' }
  ]
}

const submitForm = () => {
  formRef.value.validate((valid: boolean) => {
    if (valid) {
      console.log('发布普通活动:', normalForm)
      ElMessage.success('活动发布成功！')
      // 这里添加发布活动的API调用
    } else {
      ElMessage.error('请完善必填信息')
    }
  })
}

const resetForm = () => {
  formRef.value.resetFields()
}

const saveDraft = () => {
  console.log('保存草稿:', normalForm)
  ElMessage.success('草稿保存成功！')
  // 这里添加保存草稿的逻辑
}
</script>

<style scoped>
.publish-normal {
  padding: 20px;
}

.publish-content {
  margin-top: 20px;
  max-width: 800px;
}
</style>