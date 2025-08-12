<template>
  <div class="registration">
    <!-- 顶部信息栏 -->
    <div class="header-info">
      <span class="activity-info">活动/赛事：厦门线上跑（报名中）</span>
      <span class="participant-count">报名人数：233</span>
    </div>

    <!-- 搜索筛选区域 -->
    <div class="search-section">
      <div class="search-row">
        <div class="search-item">
          <label>报名方式：</label>
          <el-select v-model="searchForm.project" placeholder="不限" style="width: 120px;">
            <el-option label="不限" value=""></el-option>
            <el-option label="单人报名" value="单人报名"></el-option>
            <el-option label="家庭报名" value="家庭报名"></el-option>
            <el-option label="团体报名" value="团体报名"></el-option>
          </el-select>
        </div>
        
        <div class="search-item">
          <label>联系人姓名：</label>
          <el-input v-model="searchForm.contactName" style="width: 150px;"></el-input>
        </div>
        
        <div class="search-item">
          <label>报名人手机：</label>
          <el-input v-model="searchForm.phone" style="width: 150px;"></el-input>
        </div>
        
        <div class="search-item">
          <label>是否缴费：</label>
          <el-select v-model="searchForm.paymentStatus" placeholder="不限" style="width: 120px;">
            <el-option label="不限" value=""></el-option>
            <el-option label="已缴费" value="已缴费"></el-option>
            <el-option label="未缴费" value="未缴费"></el-option>
          </el-select>
        </div>
        
        <el-button type="primary" @click="searchRegistration">搜索</el-button>
      </div>
    </div>

    <!-- 导出按钮 -->
    <!-- <div class="export-section">
      <el-button type="primary" @click="exportData">导出报名信息</el-button>
    </div> -->

    <!-- 表格 -->
    <div class="table-section">
      <el-table 
        :data="registrationData" 
        border 
        v-loading="loading"
        style="width: 100%;"
      >
        <el-table-column prop="contactName" label="联系人姓名" align="center" width="150">
          <template #default="scope">
            <span v-if="scope.row.projectName === '家庭报名' && scope.row.members && scope.row.members[0]">
              {{ scope.row.members[0].姓名 }}
            </span>
            <span v-else-if="scope.row.projectName === '单人报名' && scope.row.formData && scope.row.formData[0]">
              {{ scope.row.formData[0].姓名 }}
            </span>
            <span v-else-if="scope.row.projectName === '团体报名'">
              {{ scope.row.teamLeader || (scope.row.members && scope.row.members[0] ? scope.row.members[0].name : '') || scope.row.contactName || '未填写' }}
            </span>
            <span v-else>{{ scope.row.contactName || '未填写' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="contactPhone" label="联系人手机" width="120" align="center">
          <template #default="scope">
            <span v-if="scope.row.projectName === '家庭报名' && scope.row.members && scope.row.members[0]">
              {{ scope.row.members[0].手机号 }}
            </span>
            <span v-else-if="scope.row.projectName === '单人报名' && scope.row.formData && scope.row.formData[0]">
              {{ scope.row.formData[0].手机号 }}
            </span>
            <span v-else-if="scope.row.projectName === '团体报名'">
              {{ scope.row.teamLeaderPhone || (scope.row.members && scope.row.members[0] ? scope.row.members[0].phone : '') || scope.row.contactPhone || '未填写' }}
            </span>
            <span v-else>{{ scope.row.contactPhone || '未填写' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="projectName" label="报名方式" width="100" align="center"></el-table-column>
        <el-table-column prop="unitPrice" label="报名费" align="center">
          <template #default="scope">
            <span v-if="getRegistrationFee(scope.row) == 0">免费</span>
            <span v-else>¥{{ getRegistrationFee(scope.row) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="人数" align="center">
          <template #default="scope">
            <span>{{ scope.row.quantity || scope.row.participantCount || (scope.row.members ? scope.row.members.length : 1) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" align="center">
          <template #default="scope">
            <el-tag 
              :type="scope.row.status === '已报名' ? 'success' : scope.row.status === '已取消' ? 'danger' : 'warning'"
              size="small"
            >
              {{ scope.row.status || '已报名' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="报名来源" width="100" align="center">
          <template #default="scope">
            <span>{{ scope.row.source || '线上报名' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="paymentStatus" label="是否缴费" width="90" align="center">
          <template #default="scope">
            <span :style="{ color: scope.row.paymentStatus === '否' ? '#f56c6c' : '#67c23a' }">
              {{ scope.row.paymentStatus || '否' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="paymentAmount" label="缴费金额" width="90" align="center">
          <template #default="scope">
            <span v-if="scope.row.paymentAmount">¥{{ scope.row.paymentAmount }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="报名时间" width="140" align="center">
          <template #default="scope">
            <span>{{ formatDateTime(scope.row.registrationTime || scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="age" label="年龄" width="80" align="center">
          <template #default="scope">
            <span v-if="scope.row.projectName === '单人报名' && scope.row.formData && scope.row.formData[0]">
              {{ scope.row.formData[0].年龄限制 }}
            </span>
            <span v-else-if="scope.row.projectName === '家庭报名' && scope.row.members && scope.row.members[0]">
              {{ scope.row.members[0].年龄限制 }}
            </span>
            <span v-else-if="scope.row.projectName === '团体报名' && scope.row.members && scope.row.members[0]">
              {{ scope.row.members[0].age }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="gender" label="性别" width="80" align="center">
          <template #default="scope">
            <span v-if="scope.row.projectName === '单人报名' && scope.row.formData && scope.row.formData[0]">
              {{ scope.row.formData[0].性别限制 }}
            </span>
            <span v-else-if="scope.row.projectName === '家庭报名' && scope.row.members && scope.row.members[0]">
              {{ scope.row.members[0].性别限制 }}
            </span>
            <span v-else-if="scope.row.projectName === '团体报名' && scope.row.members && scope.row.members[0]">
              {{ scope.row.members[0].gender }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="emergencyContact" label="紧急联系人" width="120" align="center">
          <template #default="scope">
            <span v-if="scope.row.projectName === '单人报名' && scope.row.formData && scope.row.formData[0]">
              {{ scope.row.formData[0].紧急联系人姓名 }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <!-- 可选：添加团队名称列 -->
        <el-table-column prop="teamName" label="团队名称" width="120" align="center">
          <template #default="scope">
            <span v-if="scope.row.projectName === '团体报名'">
              {{ scope.row.teamName || '-' }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" link @click="viewDetail(scope.row)">报名详情</el-button>
            <el-button size="small" type="danger" link @click="cancelRegistration(scope.row)">退款</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页组件 -->
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
  </div>

  <!-- 报名详情弹窗 -->
  <el-dialog
    v-model="detailDialogVisible"
    title="查看报名详情"
    width="800px"
    :before-close="handleCloseDetail"
  >
    <div v-if="currentDetail" class="detail-content">
      <!-- 报名状态 -->
      <div class="status-section">
        <h3>报名状态</h3>
        <el-tag 
          :type="currentDetail.status === '已报名' ? 'success' : currentDetail.status === '已取消' ? 'danger' : 'warning'"
          size="large"
        >
          {{ currentDetail.status || '已报名' }}
        </el-tag>
      </div>

      <!-- 报名信息 -->
      <div class="info-section">
        <h3>报名信息</h3>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="报名方式">
            {{ currentDetail.projectName }}
          </el-descriptions-item>
          <el-descriptions-item label="报名人数">
            {{ currentDetail.quantity || currentDetail.participantCount || (currentDetail.members ? currentDetail.members.length : 1) }}
          </el-descriptions-item>
          <el-descriptions-item label="报名费">
            <span v-if="getRegistrationFee(currentDetail) == 0">免费</span>
            <span v-else>¥{{ getRegistrationFee(currentDetail) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="团队名称" v-if="currentDetail.projectName === '团体报名'">
            {{ currentDetail.teamName || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="家庭名称" v-if="currentDetail.projectName === '家庭报名'">
            {{ currentDetail.familyName || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="联系人">
            {{ getContactName(currentDetail) }}
          </el-descriptions-item>
          <el-descriptions-item label="联系人手机">
            {{ getContactPhone(currentDetail) }}
          </el-descriptions-item>
          <el-descriptions-item label="操作人账号">
            {{ currentDetail.operatorPhone || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="报名时间" v-if="currentDetail.registrationTime || currentDetail.createTime">
            {{ formatDateTime(currentDetail.registrationTime || currentDetail.createTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="退款时间" v-if="currentDetail.refundTime">
            {{ formatDateTime(currentDetail.refundTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="签到时间" v-if="currentDetail.checkInTime">
            {{ formatDateTime(currentDetail.checkInTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="取消时间" v-if="currentDetail.cancelTime">
            {{ formatDateTime(currentDetail.cancelTime) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 报名人信息 -->
      <div class="participants-section">
        <h3>报名人信息</h3>
        <el-tabs v-model="activeParticipantTab" type="card">
          <!-- 单人报名 -->
          <el-tab-pane 
            v-if="currentDetail.projectName === '单人报名' && currentDetail.formData"
            v-for="(participant, index) in currentDetail.formData"
            :key="index"
            :label="`报名人${index + 1}`"
            :name="index.toString()"
          >
            <el-descriptions :column="2" border>
              <el-descriptions-item label="姓名">{{ participant.姓名 || '-' }}</el-descriptions-item>
              <el-descriptions-item label="手机号">{{ participant.手机号 || '-' }}</el-descriptions-item>
              <el-descriptions-item label="年龄">{{ participant.年龄限制 || '-' }}</el-descriptions-item>
              <el-descriptions-item label="性别">{{ participant.性别限制 || '-' }}</el-descriptions-item>
              <el-descriptions-item label="证件号">{{ participant['证件类型/证件号'] || '-' }}</el-descriptions-item>
              <el-descriptions-item label="紧急联系人">{{ participant.紧急联系人姓名 || '-' }}</el-descriptions-item>
              <el-descriptions-item label="紧急联系人电话">{{ participant.紧急联系人电话 || '-' }}</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <!-- 家庭报名 -->
          <el-tab-pane 
            v-if="currentDetail.projectName === '家庭报名' && currentDetail.members"
            v-for="(member, index) in currentDetail.members"
            :key="index"
            :label="`家庭成员${index + 1}`"
            :name="index.toString()"
          >
            <el-descriptions :column="2" border>
              <el-descriptions-item label="姓名">{{ member.姓名 || '-' }}</el-descriptions-item>
              <el-descriptions-item label="手机号">{{ member.手机号 || '-' }}</el-descriptions-item>
              <el-descriptions-item label="年龄">{{ member.年龄限制 || '-' }}</el-descriptions-item>
              <el-descriptions-item label="性别">{{ member.性别限制 || '-' }}</el-descriptions-item>
              <el-descriptions-item label="证件号">{{ member['证件类型/证件号'] || '-' }}</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <!-- 团体报名 -->
          <el-tab-pane 
            v-if="currentDetail.projectName === '团体报名' && currentDetail.members"
            v-for="(member, index) in currentDetail.members"
            :key="index"
            :label="`团队成员${index + 1}`"
            :name="index.toString()"
          >
            <el-descriptions :column="2" border>
              <el-descriptions-item label="姓名">{{ member.name || '-' }}</el-descriptions-item>
              <el-descriptions-item label="手机号">{{ member.phone || '-' }}</el-descriptions-item>
              <el-descriptions-item label="年龄">{{ member.age || '-' }}</el-descriptions-item>
              <el-descriptions-item label="性别">{{ member.gender || '-' }}</el-descriptions-item>
              <el-descriptions-item label="证件号">{{ member.idCard || member['证件类型/证件号'] || '-' }}</el-descriptions-item>
              <el-descriptions-item label="紧急联系人">{{ member.emergencyContact || '-' }}</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- 订单信息 (仅付费活动显示) -->
      <div v-if="!isFreeActivity(currentDetail)" class="order-section">
        <h3>关联订单信息</h3>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="订单编号">
            {{ currentDetail.orderNumber || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="getOrderStatusType(currentDetail.orderStatus)">
              {{ currentDetail.orderStatus || '待支付' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="支付总金额">
            ¥{{ currentDetail.totalAmount || currentDetail.paymentAmount || 0 }}
          </el-descriptions-item>
        </el-descriptions>
        <div style="margin-top: 10px;">
          <el-button type="primary" @click="viewOrderDetail">查看订单详情</el-button>
        </div>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import dayjs from 'dayjs'

// 搜索表单
const searchForm = reactive({
  project: '',
  contactName: '',
  phone: '',
  paymentStatus: ''
})

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 报名数据
const registrationData = ref([])
const loading = ref(false)

// 详情弹窗相关
const detailDialogVisible = ref(false)
const currentDetail = ref(null)
const activeParticipantTab = ref('0')

// 获取所有报名数据
const getAllRegistrationData = async () => {
  loading.value = true
  try {
    // 并发请求三张表的数据
    const [teamResponse, individualResponse, familyResponse] = await Promise.all([
      axios.get('http://localhost:3000/teamforms'),
      axios.get('http://localhost:3000/individualforms'),
      axios.get('http://localhost:3000/familyforms')
    ])

    let allData = []

    // 处理团体报名数据
    if (teamResponse.data.code === 200) {
      const teamData = teamResponse.data.data.map(item => {
        console.log('团体报名数据:', item) // 调试输出
        const primaryMember = item.members && item.members.length > 0 ? item.members[0] : {}
        
        return {
          ...item,
          projectName: '团体报名',
          contactName: item.teamLeader || primaryMember.name || item.contactName,
          contactPhone: item.teamLeaderPhone || primaryMember.phone || item.contactPhone,
          quantity: item.members ? item.members.length : 1
        }
      })
      allData.push(...teamData)
    }

    // 处理个人报名数据
    if (individualResponse.data.code === 200) {
      const individualData = individualResponse.data.data.map(item => {
        console.log('单人报名数据:', item) // 调试输出
        const formInfo = item.formData && item.formData.length > 0 ? item.formData[0] : {}
        
        return {
          ...item,
          projectName: '单人报名',
          contactName: item.contactName || formInfo.姓名,
          contactPhone: item.contactPhone || formInfo.手机号,
          emergencyContact: formInfo.紧急联系人姓名,
          emergencyPhone: formInfo.紧急联系人电话,
          age: formInfo.年龄,
          gender: formInfo.性别,
          idCard: formInfo.证件类型证件号,
          quantity: 1
        }
      })
      allData.push(...individualData)
    }

    // 处理家庭报名数据
    if (familyResponse.data.code === 200) {
      const familyData = familyResponse.data.data.map(item => {
        console.log('家庭报名数据:', item) // 调试输出
        const primaryMember = item.members && item.members.length > 0 ? item.members[0] : {}
        
        return {
          ...item,
          projectName: '家庭报名',
          contactName: item.contactName || primaryMember.姓名,
          contactPhone: item.contactPhone || primaryMember.手机号,
          quantity: item.members ? item.members.length : 1
        }
      })
      allData.push(...familyData)
    }

    // 根据搜索条件过滤数据
    const filteredData = filterData(allData)
    
    // 按报名时间排序（最新的在前）
    filteredData.sort((a, b) => {
      const timeA = a.registrationTime || a.createTime
      const timeB = b.registrationTime || b.createTime
      
      if (!timeA && !timeB) return 0
      if (!timeA) return 1
      if (!timeB) return -1
      
      return new Date(timeB).getTime() - new Date(timeA).getTime()
    })
    
    // 分页处理
    pagination.total = filteredData.length
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize
    const endIndex = startIndex + pagination.pageSize
    registrationData.value = filteredData.slice(startIndex, endIndex)

  } catch (error) {
    console.error('获取报名数据失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 数据过滤函数
const filterData = (data) => {
  return data.filter(item => {
    // 报名方式过滤
    if (searchForm.project && item.projectName !== searchForm.project) {
      return false
    }
    
    // 联系人姓名过滤
    if (searchForm.contactName && !item.contactName?.includes(searchForm.contactName)) {
      return false
    }
    
    // 手机号过滤
    if (searchForm.phone && !item.contactPhone?.includes(searchForm.phone)) {
      return false
    }
    
    // 缴费状态过滤
    if (searchForm.paymentStatus) {
      const itemPaymentStatus = item.paymentStatus || '否'
      if (searchForm.paymentStatus === '已缴费' && itemPaymentStatus !== '是') {
        return false
      }
      if (searchForm.paymentStatus === '未缴费' && itemPaymentStatus !== '否') {
        return false
      }
    }
    
    return true
  })
}

// 搜索功能
const searchRegistration = () => {
  pagination.currentPage = 1 // 搜索时重置到第一页
  getAllRegistrationData()
}

// 分页处理
const handleSizeChange = (val: number) => {
  pagination.pageSize = val
  pagination.currentPage = 1
  getAllRegistrationData()
}

const handleCurrentChange = (val: number) => {
  pagination.currentPage = val
  getAllRegistrationData()
}

// 格式化时间
const formatDateTime = (dateString: string) => {
  if (!dateString) return "";
  return dayjs(dateString).format("YYYY.MM.DD HH:mm");
};

const exportData = () => {
  ElMessage.success('导出成功')
  // 导出逻辑
}

const viewDetail = (row: any) => {
  console.log('查看报名详情:', row)
  currentDetail.value = row
  activeParticipantTab.value = '0'
  detailDialogVisible.value = true
}

const cancelRegistration = (row: any) => {
  console.log('退款操作:', row)
  // 退款逻辑
}

// 关闭详情弹窗
const handleCloseDetail = () => {
  detailDialogVisible.value = false
  currentDetail.value = null
}

// 获取联系人姓名
const getContactName = (row: any) => {
  if (row.projectName === '家庭报名' && row.members && row.members[0]) {
    return row.members[0].姓名
  } else if (row.projectName === '单人报名' && row.formData && row.formData[0]) {
    return row.formData[0].姓名
  } else if (row.projectName === '团体报名') {
    return row.teamLeader || (row.members && row.members[0] ? row.members[0].name : '') || row.contactName || '未填写'
  }
  return row.contactName || '未填写'
}

// 获取联系人手机
const getContactPhone = (row: any) => {
  if (row.projectName === '家庭报名' && row.members && row.members[0]) {
    return row.members[0].手机号
  } else if (row.projectName === '单人报名' && row.formData && row.formData[0]) {
    return row.formData[0].手机号
  } else if (row.projectName === '团体报名') {
    return row.teamLeaderPhone || (row.members && row.members[0] ? row.members[0].phone : '') || row.contactPhone || '未填写'
  }
  return row.contactPhone || '未填写'
}

// 判断是否为免费活动
const isFreeActivity = (row: any) => {
  const price = row.unitPrice || row.price || 0
  return price === 0
}

// 获取订单状态类型
const getOrderStatusType = (status: string) => {
  switch (status) {
    case '已支付':
      return 'success'
    case '待支付':
      return 'warning'
    case '已退款':
      return 'info'
    case '支付失败':
      return 'danger'
    default:
      return 'info'
  }
}

// 查看订单详情
const viewOrderDetail = () => {
  console.log('查看订单详情:', currentDetail.value)
  ElMessage.info('跳转到订单详情页面')
}

// 获取报名费
const getRegistrationFee = (row: any) => {
  // 单人报名从 formData 中获取报名费
  if (row.projectName === '单人报名' && row.formData && row.formData[0] && row.formData[0].报名费) {
    return row.formData[0].报名费
  }
  // 其他报名方式从 unitPrice 或 price 字段获取
  return row.unitPrice || row.price || 0
}

// 页面加载时获取数据
onMounted(() => {
  getAllRegistrationData()
})
</script>

<style scoped>
.registration {
  padding: 20px;
  background: #f5f5f5;
}

.header-info {
  background: white;
  padding: 15px 20px;
  margin-bottom: 20px;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.activity-info {
  font-size: 16px;
  font-weight: bold;
}

.participant-count {
  font-size: 16px;
  font-weight: bold;
}

.search-section {
  background: white;
  padding: 20px;
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
  white-space: nowrap;
  font-size: 14px;
}

.export-section {
  margin-bottom: 20px;
}

.table-section {
  background: white;
  padding: 20px;
  border-radius: 4px;
}

:deep(.el-table th) {
  background-color: #409eff !important;
  color: white !important;
}

:deep(.el-table .el-table__cell) {
  padding: 8px 0;
}

.pagination-section {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 2px;
  font-size: 12px;
}

.member-info:last-child {
  margin-bottom: 0;
}

.detail-content {
  max-height: 600px;
  overflow-y: auto;
}

.status-section,
.info-section,
.participants-section,
.order-section {
  margin-bottom: 20px;
}

.status-section h3,
.info-section h3,
.participants-section h3,
.order-section h3 {
  margin-bottom: 10px;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.status-section {
  text-align: center;
  padding: 20px 0;
  border-bottom: 1px solid #ebeef5;
}
</style>
