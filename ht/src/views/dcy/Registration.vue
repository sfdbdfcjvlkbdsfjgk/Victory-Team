<template>
  <div class="registration">
    <h2>报名信息查看</h2>
    <div class="registration-content">
      <div class="search-bar">
        <el-input 
          v-model="searchText" 
          placeholder="搜索活动名称或报名者姓名"
          style="width: 300px; margin-right: 10px;"
        ></el-input>
        <el-button type="primary" @click="searchRegistration">搜索</el-button>
      </div>
      
      <el-table :data="registrationData" style="width: 100%; margin-top: 20px;">
        <el-table-column prop="activityName" label="活动名称" width="200"></el-table-column>
        <el-table-column prop="userName" label="报名者姓名" width="150"></el-table-column>
        <el-table-column prop="phone" label="联系电话" width="150"></el-table-column>
        <el-table-column prop="registrationTime" label="报名时间" width="180"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === '已确认' ? 'success' : 'warning'">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button size="small" @click="viewDetail(scope.row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const searchText = ref('')

const registrationData = ref([
  {
    activityName: '全民健身跑步活动',
    userName: '张三',
    phone: '13800138000',
    registrationTime: '2024-01-15 10:30:00',
    status: '已确认'
  },
  {
    activityName: '篮球比赛',
    userName: '李四',
    phone: '13900139000',
    registrationTime: '2024-01-16 14:20:00',
    status: '待确认'
  }
])

const searchRegistration = () => {
  console.log('搜索:', searchText.value)
  // 这里添加搜索逻辑
}

const viewDetail = (row: any) => {
  console.log('查看详情:', row)
  // 这里添加查看详情逻辑
}
</script>

<style scoped>
.registration {
  padding: 20px;
}

.registration-content {
  margin-top: 20px;
}

.search-bar {
  display: flex;
  align-items: center;
}
</style>