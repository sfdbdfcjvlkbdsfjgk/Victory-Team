<template>
  <div class="publish-event">
    <h2>发布活动（赛事活动）</h2>
    <div class="publish-content">
      <el-form :model="eventForm" label-width="120px" :rules="rules" ref="formRef">
        <el-form-item label="赛事名称" prop="title">
          <el-input v-model="eventForm.title" placeholder="请输入赛事名称"></el-input>
        </el-form-item>
        
        <el-form-item label="赛事类型" prop="eventType">
          <el-select v-model="eventForm.eventType" placeholder="请选择赛事类型">
            <el-option label="篮球比赛" value="basketball"></el-option>
            <el-option label="足球比赛" value="football"></el-option>
            <el-option label="跑步比赛" value="running"></el-option>
            <el-option label="游泳比赛" value="swimming"></el-option>
            <el-option label="其他" value="other"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="比赛时间" prop="time">
          <el-date-picker
            v-model="eventForm.time"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        
        <el-form-item label="比赛地点" prop="location">
          <el-input v-model="eventForm.location" placeholder="请输入比赛地点"></el-input>
        </el-form-item>
        
        <el-form-item label="参赛人数" prop="maxParticipants">
          <el-input-number v-model="eventForm.maxParticipants" :min="2" placeholder="最大参赛人数"></el-input-number>
        </el-form-item>
        
        <el-form-item label="报名截止时间" prop="registrationDeadline">
          <el-date-picker
            v-model="eventForm.registrationDeadline"
            type="datetime"
            placeholder="选择报名截止时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        
        <el-form-item label="奖项设置" prop="prizes">
          <el-input 
            type="textarea" 
            v-model="eventForm.prizes" 
            :rows="3"
            placeholder="请输入奖项设置（如：第一名奖金1000元，第二名奖金500元...）"
          ></el-input>
        </el-form-item>
        
        <el-form-item label="比赛规则" prop="rules">
          <el-input 
            type="textarea" 
            v-model="eventForm.competitionRules" 
            :rows="4"
            placeholder="请输入详细的比赛规则"
          ></el-input>
        </el-form-item>
        
        <el-form-item label="参赛要求" prop="requirements">
          <el-input 
            type="textarea" 
            v-model="eventForm.requirements" 
            :rows="3"
            placeholder="请输入参赛要求（如：年龄限制、技能要求等）"
          ></el-input>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitForm">发布赛事</el-button>
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

const eventForm = reactive({
  title: '',
  eventType: '',
  time: [],
  location: '',
  maxParticipants: 20,
  registrationDeadline: '',
  prizes: '',
  competitionRules: '',
  requirements: ''
})

const rules = {
  title: [
    { required: true, message: '请输入赛事名称', trigger: 'blur' }
  ],
  eventType: [
    { required: true, message: '请选择赛事类型', trigger: 'change' }
  ],
  time: [
    { required: true, message: '请选择比赛时间', trigger: 'change' }
  ],
  location: [
    { required: true, message: '请输入比赛地点', trigger: 'blur' }
  ],
  maxParticipants: [
    { required: true, message: '请输入参赛人数', trigger: 'blur' }
  ],
  registrationDeadline: [
    { required: true, message: '请选择报名截止时间', trigger: 'change' }
  ],
  competitionRules: [
    { required: true, message: '请输入比赛规则', trigger: 'blur' }
  ]
}

const submitForm = () => {
  formRef.value.validate((valid: boolean) => {
    if (valid) {
      console.log('发布赛事活动:', eventForm)
      ElMessage.success('赛事发布成功！')
      // 这里添加发布赛事的API调用
    } else {
      ElMessage.error('请完善必填信息')
    }
  })
}

const resetForm = () => {
  formRef.value.resetFields()
}

const saveDraft = () => {
  console.log('保存草稿:', eventForm)
  ElMessage.success('草稿保存成功！')
  // 这里添加保存草稿的逻辑
}
</script>

<style scoped>
.publish-event {
  padding: 20px;
}

.publish-content {
  margin-top: 20px;
  max-width: 800px;
}
</style>