<template>
  <div class="role-management">
    <div class="page-header">
      <h2>角色管理</h2>
      
    </div>

      <!-- 搜索区域 -->
      <div class="search-area">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="角色名称">
            <el-input v-model="searchForm.search" placeholder="请输入角色名称或代码" clearable />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
            <el-button type="primary" @click="handleAdd">新增角色</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 表格区域 -->
      <el-table :data="tableData" class="RoleTable" v-loading="loading" row-key="_id">
        <el-table-column prop="name" label="角色名称" min-width="150" />
        <el-table-column prop="code" label="角色代码" min-width="150" />
        <el-table-column prop="description" label="角色描述" min-width="200" />
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
        <el-table-column label="操作" min-width="280" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="primary" @click="handleAssignPermission(scope.row)">分配权限</el-button>
            <el-button size="small" type="warning" @click="handleViewUsers(scope.row)">查看用户</el-button>
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

    <!-- 角色表单对话框 -->
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
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色代码" prop="code">
          <el-input v-model="form.code" placeholder="请输入角色代码" />
        </el-form-item>
        <el-form-item label="角色描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入角色描述"
          />
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

    <!-- 分配权限对话框 -->
    <el-dialog
      v-model="permissionDialogVisible"
      title="分配权限"
      width="900px"
    >
      <div class="permission-assignment">
        <div class="permission-header">
          <el-alert
            type="info"
            :closable="false"
            show-icon
          >
            <template #default>
              <p>• 当前角色：<strong>{{ currentRole?.name }}</strong></p>
            </template>
          </el-alert>
        </div>
        
        <div class="permission-tree-container">

      <el-tree
        ref="permissionTree"
        :data="permissionTreeData"
        :props="permissionTreeProps"
        show-checkbox
            node-key="_id"
        :default-checked-keys="selectedPermissions"
            @check="handlePermissionCheck"
            class="permission-tree"
          >
            <template #default="{ data }">
              <div class="permission-node">
                <div class="permission-info">
                  <el-icon v-if="data.icon" class="permission-icon">
                    <component :is="data.icon" />
                  </el-icon>
                  <span class="permission-name">{{ data.name }}</span>
                </div>
              </div>
            </template>
          </el-tree>
        </div>
        
        <div class="permission-summary">
          <el-divider content-position="left">已选的权限统计</el-divider>
          <div class="summary-content">
            <div class="summary-item">
              <span class="summary-label">总权限数：</span>
              <span class="summary-value">{{ totalSelectedCount }} 个</span>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="permissionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAssignPermissionSubmit" :loading="assignLoading">确定分配</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 查看用户对话框 -->
    <el-dialog
      v-model="userDialogVisible"
      title="角色用户列表"
      width="600px"
    >
      <el-table  :header-cell-style="headerCellStyle"  :data="roleUsers" style="width: 100%">
        <el-table-column prop="userName" label="用户名" width="120" />
        <el-table-column prop="realName" label="真实姓名" width="120" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
              {{ scope.row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="userDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { roleAPI, permissionAPI } from '../../api/txs.js'
import {
  DataAnalysis,
  Document,
  Goods,
  Picture,
  Promotion,
  User,
  Avatar,
  Money,
  Setting,
  ArrowDown,
  ArrowUp
} from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const submitLoading = ref(false)
const assignLoading = ref(false)
const dialogVisible = ref(false)
const permissionDialogVisible = ref(false)
const userDialogVisible = ref(false)
const dialogTitle = ref('新增角色')
const selectedPermissions = ref([])
const permissionTreeData = ref([])
const roleUsers = ref<any[]>([])
const currentRole = ref(null)
const formRef = ref()
const permissionTree = ref()

// 权限统计计算
const totalSelectedCount = computed(() => {
  if (!permissionTree.value) return 0
  return permissionTree.value.getCheckedKeys().length;
});

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
  name: '',
  code: '',
  description: '',
  status: 'active'
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入角色代码', trigger: 'blur' }
  ]
}

// 权限树配置
const permissionTreeProps = {
  children: 'children',
  label: 'name',
  value: '_id'
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
  dialogTitle.value = '新增角色'
  Object.assign(form, {
    _id: '',
    name: '',
    code: '',
    description: '',
    status: 'active'
  })
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  dialogTitle.value = '编辑角色'
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该角色吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
    })
    
    loading.value = true
    const response = await roleAPI.deleteRole(row._id)
    
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

const handleAssignPermission = async (row: any) => {
  currentRole.value = row
  try {
    // 获取角色权限树，包括已分配的权限
    const response = await roleAPI.getRolePermissions(row._id)
    
    if (response.code === 200) {
      selectedPermissions.value = response.data.assignedPermissionIds
      permissionTreeData.value = response.data.permissionTree
    }
    
    permissionDialogVisible.value = true
  } catch (error: any) {
    ElMessage.error('获取角色权限失败')
  }
}

const handlePermissionCheck = (data: any, checkedInfo: any) => {
  // 如果选中的是一级菜单，自动选中其下所有二级菜单
  if (data.children && data.children.length > 0) {
    const tree = permissionTree.value
    const childKeys = data.children.map((child: any) => child._id)
    
    if (checkedInfo.checkedKeys.includes(data._id)) {
      // 选中一级菜单时，选中所有子菜单
      childKeys.forEach((key: string) => {
        if (!checkedInfo.checkedKeys.includes(key)) {
          tree.setChecked(key, true, false)
        }
      })
    } else {
      // 取消选中一级菜单时，取消选中所有子菜单
      childKeys.forEach((key: string) => {
        tree.setChecked(key, false, false)
      })
    }
  }
  
  // 如果选中的是二级菜单，检查是否需要更新父菜单状态
  if (data.parentId) {
    const tree = permissionTree.value
    const parentNode = tree.getNode(data.parentId)
    
    if (parentNode) {
      const parentChildren = parentNode.childNodes
      const checkedChildren = parentChildren.filter((child: any) => 
        checkedInfo.checkedKeys.includes(child.data._id)
      )
      
      // 如果所有子菜单都被选中，则选中父菜单
      if (checkedChildren.length === parentChildren.length) {
        tree.setChecked(data.parentId, true, false)
      } else {
        // 否则设置父菜单为半选状态
        tree.setChecked(data.parentId, false, false)
      }
    }
  }
}

const expandAllNodes = () => {
  if (permissionTree.value) {
    const nodes = permissionTree.value.store.nodesMap
    Object.values(nodes).forEach((node: any) => {
      if (node.childNodes && node.childNodes.length > 0) {
        node.expanded = true
      }
    })
  }
}

const collapseAllNodes = () => {
  if (permissionTree.value) {
    const nodes = permissionTree.value.store.nodesMap
    Object.values(nodes).forEach((node: any) => {
      if (node.childNodes && node.childNodes.length > 0) {
        node.expanded = false
      }
    })
  }
}

const handleAssignPermissionSubmit = async () => {
  try {
    assignLoading.value = true
    const checkedKeys = permissionTree.value.getCheckedKeys()
    const halfCheckedKeys = permissionTree.value.getHalfCheckedKeys()
    const allCheckedKeys = [...checkedKeys, ...halfCheckedKeys]
    
    // 过滤掉一级菜单的权限ID，只保留二级菜单
    const validPermissionIds = allCheckedKeys.filter((key: string) => {
      const findPermission = (items: any[]): any => {
        for (const item of items) {
          if (item._id === key) {
            return item;
          }
          if (item.children && item.children.length > 0) {
            const found = findPermission(item.children);
            if (found) return found;
          }
        }
        return null;
      };
      
      const permission = findPermission(permissionTreeData.value);
      return permission && permission.parentId; // 只保留有父级的权限（二级菜单）
    });
    
    if (!currentRole.value) {
      ElMessage.error('角色信息不存在')
      return
}

    const response = await roleAPI.assignPermissions(currentRole.value._id, validPermissionIds)
    
    if (response.code === 200) {
  ElMessage.success('权限分配成功')
  permissionDialogVisible.value = false
      fetchData()
    } else {
      ElMessage.error(response.message || '权限分配失败')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '权限分配失败')
  } finally {
    assignLoading.value = false
  }
}

const handleViewUsers = async (row: any) => {
  try {
    // 调用API获取拥有该角色的用户列表
    const response = await roleAPI.getRoleUsers(row._id)
    
    if (response.code === 200) {
      roleUsers.value = response.data.users
      userDialogVisible.value = true
    } else {
      ElMessage.error(response.message || '获取用户列表失败')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '获取用户列表失败')
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
      response = await roleAPI.updateRole(form._id, formData)
    } else {
      // 新增
      response = await roleAPI.createRole(formData)
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
const headerCellStyle = {
  backgroundColor: '#165DFF',
  color: '#FFFFFF',
  fontWeight: 'bold'
};

const fetchData = async () => {
  try {
  loading.value = true
    const params = {
      page: pagination.currentPage,
      limit: pagination.pageSize,
      search: searchForm.search
    }
    
    const response = await roleAPI.getRoles(params)
    
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

const fetchPermissionTree = async () => {
  try {
    const response = await permissionAPI.getPermissionTree()
    
    if (response.code === 200) {
      permissionTreeData.value = response.data
    }
  } catch (error: any) {
    console.error('获取权限树失败:', error)
  }
}

// 生命周期
onMounted(() => {
  fetchData()
  fetchPermissionTree()
})
</script>

<style scoped lang="scss">
.role-management {
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

  .RoleTable {
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

  /* 权限分配对话框样式 */
  .permission-assignment {
    max-height: 600px;
    overflow-y: auto;
  }

  .permission-header {
    margin-bottom: 20px;

    .el-alert {
      margin-bottom: 0;
    }

    p {
      margin: 5px 0;
      font-size: 14px;
    }
  }

  .permission-tree-container {
    margin-bottom: 20px;
  }

  .tree-controls {
    margin-bottom: 10px;
    display: flex;
    gap: 10px;
    
    .el-button {
      font-size: 12px;
      padding: 6px 12px;
    }
  }

  .permission-tree {
    border: 1px solid #e4e7ed;
    border-radius: 6px;
    padding: 10px;
    max-height: 400px;
    overflow-y: auto;
    
    .el-tree-node__content {
      padding: 8px 0;
      
      &:hover {
        background-color: #f5f7fa;
      }
    }
    
    .el-tree-node__expand-icon {
      color: #909399;
      font-size: 12px;
    }
    
    .el-tree-node.is-expanded > .el-tree-node__children {
      padding-left: 20px;
    }
  }

  .permission-node {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .permission-info {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .permission-icon {
    color: #409eff;
    font-size: 16px;
  }

  .permission-name {
    font-weight: 500;
    color: #303133;
  }

  .permission-details {
    display: flex;
    gap: 15px;
    font-size: 12px;
    color: #909399;
    margin-left: 24px;
  }

  .permission-code {
    background: #f5f7fa;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
  }

  .permission-path {
    color: #c0c4cc;
  }

  .permission-summary {
    background: #f8f9fa;
    border-radius: 6px;
    padding: 15px;
  }

  .summary-content {
    display: flex;
    gap: 30px;
    justify-content: center;
  }

  .summary-item {
    text-align: center;
  }

  .summary-label {
    color: #606266;
    font-size: 14px;
  }

  .summary-value {
    color: #ff4040;
    font-weight: bold;
    font-size: 16px;
    margin-left: 5px;
  }
}
</style> 