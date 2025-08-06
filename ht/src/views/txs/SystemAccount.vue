<template>
  <div class="user-management">
    <div class="page-header">
      <h2>账号管理</h2>
     
    </div>

      <!-- 搜索区域 -->
      <div class="search-area">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="账号">
            <el-input style="width: 260px;" v-model="searchForm.search" placeholder="请输入账号、真实姓名或邮箱" clearable />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
               <div class="header-actions">
        <el-button type="primary" @click="handleAdd">新增账号</el-button>
      </div>
          </el-form-item>
        
        </el-form>
      </div>

      <!-- 表格区域 -->
      <el-table :data="tableData" class="Usertable" v-loading="loading" row-key="_id">
        <el-table-column prop="userName" label="账号" min-width="120" />
        <el-table-column prop="realName" label="姓名" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="200" />
        <el-table-column prop="phone" label="手机号" min-width="150" />
        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
              {{ scope.row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" min-width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="250" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="primary" @click="handleAssignRole(scope.row)">分配角色</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
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

    <!-- 账号表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="账号" prop="userName">
          <el-input v-model="form.userName" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item label="密码" prop="passWord" v-if="!form._id">
          <el-input v-model="form.passWord" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="姓名" prop="realName">
          <el-input v-model="form.realName" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 分配角色对话框 -->
    <el-dialog
      v-model="roleDialogVisible"
      title="分配角色"
      width="600px"
    >
      <el-transfer
        v-model="selectedRoles"
        :data="allRoles"
        :titles="['可选角色', '已选角色']"
        :props="{
          key: '_id',
          label: 'name'
        }"
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="roleDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAssignRoleSubmit" :loading="assignLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { userAPI, roleAPI } from '../../api/txs.js'

// 响应式数据
const loading = ref(false)
const submitLoading = ref(false)
const assignLoading = ref(false)
const dialogVisible = ref(false)
const roleDialogVisible = ref(false)
const dialogTitle = ref('新增账号')
const selectedRoles = ref([])
const allRoles = ref([])
const currentUser = ref(null)
const formRef = ref()

// 搜索表单
const searchForm = reactive({
  search: ''
})

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 表格数据
const tableData = ref([])

// 表单数据
const form = reactive({
  _id: '',
  userName: '',
  passWord: '',
  realName: '',
  email: '',
  phone: '',
  status: 'active'
})

// 表单验证规则
const rules = {
  userName: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  passWord: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ],
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' }
  ]
}

// 方法
const handleSearch = () => {
  pagination.currentPage = 1
  fetchData()
}

const handleReset = () => {
  Object.assign(searchForm, {
    search: ''
  })
  handleSearch()
}

const handleAdd = () => {
  dialogTitle.value = '新增账号'
  Object.assign(form, {
    _id: '',
    userName: '',
    passWord: '',
    realName: '',
    email: '',
    phone: '',
    status: 'active'
  })
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  dialogTitle.value = '编辑账号'
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该账号吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    loading.value = true
    const response = await userAPI.deleteUser(row._id)
    
    if (response.code === 200) {
      ElMessage.success('删除成功')
      fetchData()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  } finally {
    loading.value = false
  }
}

const handleAssignRole = async (row: any) => {
  currentUser.value = row
  try {
    // 获取所有角色
    const rolesResponse = await roleAPI.getAllRoles()
    if (rolesResponse.code === 200) {
      allRoles.value = rolesResponse.data
    }
    
    // 获取用户当前角色
    const userResponse = await userAPI.getUserRoles(row._id)
    if (userResponse.code === 200) {
      selectedRoles.value = userResponse.data.roles.map((role: any) => role._id)
    }
    
    roleDialogVisible.value = true
  } catch (error: any) {
    ElMessage.error('获取角色信息失败')
  }
}

const handleAssignRoleSubmit = async () => {
  try {
    assignLoading.value = true
    
    const response = await userAPI.updateUser(currentUser.value._id, {
      roleIds: selectedRoles.value
    })
    
    if (response.code === 200) {
      ElMessage.success('角色分配成功')
      roleDialogVisible.value = false
      fetchData()
    } else {
      ElMessage.error(response.message || '角色分配失败')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '角色分配失败')
  } finally {
    assignLoading.value = false
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    
    submitLoading.value = true
    const formData = { ...form }
    
    let response
    if (form._id) {
      // 编辑
      response = await userAPI.updateUser(form._id, formData)
    } else {
      // 新增
      response = await userAPI.createUser(formData)
    }
    
    if (response.code === 200) {
      ElMessage.success(form._id ? '编辑成功' : '新增成功')
      dialogVisible.value = false
      fetchData()
    } else {
      ElMessage.error(response.message || '操作失败')
    }
  } catch (error: any) {
    if (error !== false) { // 表单验证失败不显示错误
      ElMessage.error(error.response?.data?.message || '操作失败')
    }
  } finally {
    submitLoading.value = false
  }
}

const handleDialogClose = () => {
  dialogVisible.value = false
  formRef.value?.resetFields()
}

const handleSizeChange = (val: number) => {
  pagination.pageSize = val
  fetchData()
}

const handleCurrentChange = (val: number) => {
  pagination.currentPage = val
  fetchData()
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString()
}

const fetchData = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.currentPage,
      limit: pagination.pageSize,
      search: searchForm.search
    }
    
    const response = await userAPI.getUsers(params)
    
    if (response.code === 200) {
      tableData.value = response.data.list
      pagination.total = response.data.total
    } else {
      ElMessage.error(response.message || '获取数据失败')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '获取数据失败')
  } finally {
    loading.value = false
  }
}

const fetchAllRoles = async () => {
  try {
    const response = await roleAPI.getAllRoles()
    
    if (response.code === 200) {
      allRoles.value = response.data
    }
  } catch (error: any) {
    console.error('获取角色列表失败:', error)
  }
}

// 生命周期
onMounted(() => {
  fetchData()
  fetchAllRoles()
})
</script>

<style scoped lang="scss">
.user-management {
  padding: 15px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #e4e7ed;

    h2 {
      margin: 0;
      color: #303133;
      font-size: 24px;
      font-weight: 600;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;


    }
  }

  .search-area {
    margin-bottom: 20px;
    padding: 20px;
    background-color: #f5f7fa;
    border-radius: 4px;

    .search-form {
      margin-bottom: 0;
    }
  }

  .Usertable {
    margin-bottom: 20px;
    border-radius: 8px;
    overflow: hidden;
    width: 100%;
    
    .el-table__header {
      th {
        background-color: #f5f7fa;
        color: #606266;
        font-weight: 600;
        font-size: 18px;
        padding: 20px 0;
        border-bottom: 2px solid #e4e7ed;
      }
    }
    
    .el-table__body {
      td {
        font-size: 18px;
        padding: 20px 0;
        border-bottom: 1px solid #ebeef5;
      }
      
      tr:hover {
        background-color: #f5f7fa;
      }
    }
    
    .el-table__row {
      transition: background-color 0.3s ease;
    }
    
    .el-button {
      font-size: 14px;
      padding: 8px 16px;
    }
    
    .el-tag {
      font-size: 14px;
      padding: 6px 12px;
    }
  }

  .pagination {
    margin-top: 20px;
    text-align: right;
    padding: 16px 0;
  }

  .dialog-footer {
    text-align: right;
    padding-top: 16px;
  }
}
</style> 