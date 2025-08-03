<template>
  <div class="activity-management">
    <!-- 搜索筛选区域 -->
    <div class="search-section">
      <div class="search-row">
        <div class="search-item">
          <label>标题:</label>
          <el-input 
            v-model="searchForm.title" 
            placeholder="请输入活动标题" 
            style="width: 200px;"
            clearable
          ></el-input>
        </div>
        <div class="search-item">
          <label>类型:</label>
          <el-select v-model="searchForm.type" placeholder="不限" style="width: 120px;" clearable>
            <el-option label="不限" value=""></el-option>
            <el-option label="活动" value="activity"></el-option>
            <el-option label="赛事" value="event"></el-option>
          </el-select>
        </div>
        <div class="search-item">
          <label>活动状态:</label>
          <el-select v-model="searchForm.status" placeholder="不限" style="width: 120px;" clearable>
            <el-option label="不限" value=""></el-option>
            <el-option label="未开始" value="pending"></el-option>
            <el-option label="进行中" value="ongoing"></el-option>
            <el-option label="已结束" value="finished"></el-option>
          </el-select>
        </div>
        <div class="search-item">
          <label>状态:</label>
          <el-select v-model="searchForm.publishStatus" placeholder="不限" style="width: 120px;" clearable>
            <el-option label="不限" value=""></el-option>
            <el-option label="已发布" value="published"></el-option>
            <el-option label="草稿" value="draft"></el-option>
          </el-select>
        </div>
        <el-button type="primary" @click="searchActivities" icon="Search">搜索</el-button>
      </div>
    </div>

    <!-- 新建按钮 -->
    <div class="action-section">
      <el-button type="primary" @click="goToCreate" icon="Plus">
        新建
      </el-button>
    </div>

    <!-- 活动列表表格 -->
    <div class="table-section">
      <el-table 
        :data="activityList" 
        style="width: 100%"
        stripe
        :header-cell-style="{ background: '#fafafa', color: '#262626' }"
      >
        <el-table-column prop="id" label="序号"  align="center"></el-table-column>
        <el-table-column prop="title" label="标题"  show-overflow-tooltip></el-table-column>
        <el-table-column prop="type" label="类型"  align="center">
          <template #default="scope">
            <el-tag :type="scope.row.type === 'event' ? 'warning' : 'primary'" size="small">
              {{ scope.row.type === 'event' ? '赛事' : '活动' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="运动类型"  align="center"></el-table-column>
        <el-table-column prop="participants" label="阅读人/次数"  align="center">
          <template #default="scope">
            {{ scope.row.readnumber }}
          </template>
        </el-table-column>
        <el-table-column prop="registrations" label="报名人数" align="center"></el-table-column>
        <el-table-column prop="activityStatus" label="活动进度"  align="center">
          <template #default="scope">
            <el-tag :type="getActivityStatusType(scope.row.activityprogress)" size="small">
              {{ getActivityStatusText(scope.row.activityprogress) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="publishStatus" label="状态"  align="center">
          <template #default="scope">
            <el-tag :type="scope.row.publishStatus === 'published' ? 'success' : 'info'" size="small">
              {{ scope.row.publishStatus === 'published' ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="140" align="center"></el-table-column>
        <el-table-column label="操作" width="360" align="center" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="editActivity(scope.row)">编辑</el-button>
            <el-button size="small" type="success" @click="viewRegistrations(scope.row)">下载</el-button>
            <el-button size="small" type="warning" @click="manageRegistrations(scope.row)">报名管理</el-button>
            <el-button size="small" type="info" @click="viewDetails(scope.row)">取消发布</el-button>
            <el-button size="small" type="danger" @click="deleteActivity(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-section">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import axios from 'axios'
const router = useRouter()

// 搜索表单
const searchForm = reactive({
  title: '',
  type: '',
  status: '',
  publishStatus: ''
})

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 800
})

// 活动列表数据
const activityList = ref([
  // {
  //   id: 1,
  //   title: '跑步比赛',
  //   type: 'activity',
  //   category: '游泳',
  //   currentParticipants: 0,
  //   maxParticipants: 0,
  //   registrations: 0,
  //   activityStatus: 'pending',
  //   publishStatus: 'published',
  //   createTime: '2020.01.03 13:09'
  // },
  // {
  //   id: 2,
  //   title: '点亮跑步活动',
  //   type: 'event',
  //   category: '跑步',
  //   currentParticipants: 2356,
  //   maxParticipants: 3356,
  //   registrations: 123,
  //   activityStatus: 'ongoing',
  //   publishStatus: 'published',
  //   createTime: '2020.01.03 11:09'
  // },
  // {
  //   id: 3,
  //   title: '明星跑步推荐',
  //   type: 'activity',
  //   category: '文化',
  //   currentParticipants: 1289,
  //   maxParticipants: 3356,
  //   registrations: 235,
  //   activityStatus: 'ongoing',
  //   publishStatus: 'draft',
  //   createTime: '2020.01.02 11:09'
  // },
  // {
  //   id: 4,
  //   title: '九州山登山活动',
  //   type: 'event',
  //   category: '登山',
  //   currentParticipants: 1298,
  //   maxParticipants: 23356,
  //   registrations: 563,
  //   activityStatus: 'finished',
  //   publishStatus: 'published',
  //   createTime: '2020.01.01 11:09'
  // }
])

// 搜索功能
const searchActivities = () => {
  console.log('搜索条件:', searchForm)
  // 实现搜索逻辑
}

// 获取活动状态类型
const getActivityStatusType = (status: string) => {
  switch (status) {
    case 'pending': return 'info'
    case 'ongoing': return 'success'
    case 'finished': return 'warning'
    default: return 'info'
  }
}

// 获取活动状态文本
const getActivityStatusText = (status: string) => {
  switch (status) {
    case 'pending': return '未开始'
    case 'ongoing': return '进行中'
    case 'finished': return '已结束'
    default: return '未知'
  }
}

// 操作方法
const goToCreate = () => {
  router.push('/dashboard/activity/create')
}

const editActivity = (row: any) => {
  console.log('编辑活动:', row)
}

const viewRegistrations = (row: any) => {
  console.log('下载:', row)
}

const manageRegistrations = (row: any) => {
  router.push('/dashboard/activity/registration')
}

const viewDetails = (row: any) => {
  console.log('取消发布:', row)
}

const deleteActivity = (row: any) => {
  console.log('删除活动:', row)
}

// 分页方法
const handleSizeChange = (val: number) => {
  pagination.pageSize = val
  // 重新加载数据
}

const handleCurrentChange = (val: number) => {
  pagination.currentPage = val
  // 重新加载数据
}

const getlist = async() => {
  let res = await axios.get('http://localhost:3000/list')
  console.log(res.data.data,255)
  activityList.value = res.data.data
}

onMounted(() => {
  // 初始化加载数据
  getlist()
})
</script>

<style scoped>
.activity-management {
  padding: 20px;
}

.search-section {
  background: #f5f5f5;
  padding: 15px;
  margin-bottom: 20px;
  border-radius: 4px;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.search-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-item label {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

.action-section {
  margin-bottom: 20px;
}

.table-section {
  margin-bottom: 20px;
}

.pagination-section {
  display: flex;
  justify-content: center;
}
</style>
