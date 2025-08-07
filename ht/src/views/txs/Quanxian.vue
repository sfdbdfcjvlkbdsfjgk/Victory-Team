<template>
  <div class="permission-management">
    <div class="page-header">
      <h2>权限管理</h2>
   
    </div>

      <!-- 搜索区域 -->
      <div class="search-area">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="权限名称">
            <el-input v-model="searchForm.search" placeholder="请输入权限名称或代码" clearable />
          </el-form-item>
          <el-form-item label="上级权限">
            <el-select
              v-model="searchForm.parentId"
              placeholder="请选择上级权限"
              clearable
              style="width: 200px"
            >
              <el-option
                label="全部"
                :value="null"
              />
              <el-option
                v-for="parent in parentMenus"
                :key="parent._id"
                :label="parent.name"
                :value="parent._id"
              >
                <div style="display: flex; align-items: center;">
                  <el-icon style="margin-right: 8px;">
                    <component :is="parent.icon || 'Setting'" />
                  </el-icon>
                  <span>{{ parent.name }}</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
               <el-button type="primary" @click="handleAdd">新增权限</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 表格区域 -->
      <el-table :data="tableData" class="PermissionTable" v-loading="loading" row-key="_id">
        <el-table-column prop="name" label="权限名称" min-width="150">
          <template #default="scope">
            <span>
              {{ scope.row.name }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="权限代码" min-width="200" />
        <el-table-column prop="description" label="权限描述" min-width="200" />
        <el-table-column prop="path" label="权限路径" min-width="200" />
        <!-- <el-table-column prop="sort" label="排序" min-width="80" /> -->
        <el-table-column prop="isShow" label="是否显示" min-width="100">
          <template #default="scope">
            <el-tag :type="scope.row.isShow ? 'success' : 'info'">
              {{ scope.row.isShow ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
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
            <el-button size="small" type="warning" @click="handleViewRoles(scope.row)">查看角色</el-button>
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

    <!-- 权限表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="权限名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入权限名称" />
        </el-form-item>
        <el-form-item label="权限代码" prop="code">
          <el-input v-model="form.code" placeholder="请输入权限代码" />
        </el-form-item>
        <el-form-item label="权限描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入权限描述"
          />
        </el-form-item>
        <el-form-item label="上级权限" prop="parentId">
          <el-select
            v-model="form.parentId"
            placeholder="请选择上级权限（不选择则为一级菜单）"
            clearable
            style="width: 100%"
          >
            <el-option
              label="无上级权限（一级菜单）"
              :value="null"
            />
            <el-option
              v-for="parent in parentMenus"
              :key="parent._id"
              :label="parent.name"
              :value="parent._id"
            >
              <div style="display: flex; align-items: center;">
                <el-icon style="margin-right: 8px;">
                  <component :is="parent.icon || 'Setting'" />
                </el-icon>
                <span>{{ parent.name }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="权限路径" prop="path">
          <el-input v-model="form.path" placeholder="请输入权限路径" />
        </el-form-item>
        <!-- <el-form-item label="图标" prop="icon">
          <el-input v-model="form.icon" placeholder="请输入图标" />
        </el-form-item> -->
        <!-- <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
        </el-form-item> -->
        <el-form-item label="是否显示" prop="isShow">
          <el-switch v-model="form.isShow" />
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

    <!-- 查看角色对话框 -->
    <el-dialog
      v-model="roleDialogVisible"
      title="权限角色列表"
      width="600px"
    >
      <el-table :data="permissionRoles" style="width: 100%">
        <el-table-column prop="name" label="名称" width="150" />
        <el-table-column prop="code" label="角色代码" width="150" />
        <el-table-column prop="description" label="描述" width="200" />
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
          <el-button @click="roleDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { permissionAPI } from '../../api/txs.js' 

// 响应式数据
const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const roleDialogVisible = ref(false)
const dialogTitle = ref('新增权限')
const permissionRoles = ref([])
const formRef = ref()
const parentMenus = ref([])

// 搜索表单
const searchForm = reactive({
  search: '',
  parentId: null
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
  parentId: null,
  path: '',
  icon: '',
  sort: 0,
  isShow: true,
  status: 'active'
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入权限名称', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入权限代码', trigger: 'blur' }
  ],
  path: [
    { required: true, message: '请输入权限路径', trigger: 'blur' }
  ]
}

// 方法
// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  fetchData()
}

// 重置
const handleReset = () => {
  // Object.assign是ES6的语法，用于将一个或多个对象的属性复制到另一个对象，并返回目标对象。
  // 这里将searchForm对象的属性复制到另一个对象，并返回目标对象。
  // 参数1：目标对象；参数2：源对象属性；
  Object.assign(searchForm, {
    search: '',
    parentId: null
  })
  handleSearch()
}

// 新增
const handleAdd = () => {
  dialogTitle.value = '新增权限'
  Object.assign(form, {
    _id: '',
    name: '',
    code: '',
    description: '',
    parentId: null,
    path: '',
    icon: '',
    sort: 0,
    isShow: true,
    status: 'active'
  })
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: any) => {
  dialogTitle.value = '编辑权限'
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该权限吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    loading.value = true
    const response = await permissionAPI.deletePermission(row._id)
    
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

// 查看角色
const handleViewRoles = async (row: any) => {
  try {
    // 获取拥有该权限的角色列表
    const response = await permissionAPI.getPermissionRoles(row._id)
    
    if (response.code === 200) {
      permissionRoles.value = response.data.roles
      roleDialogVisible.value = true
    } else {
      ElMessage.error(response.message || '获取角色列表失败')
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '获取角色列表失败')
  }
}

// 提交
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    
    submitLoading.value = true
    const formData = { ...form }
    
    let response
    if (form._id) {
      // 编辑
      response = await permissionAPI.updatePermission(form._id, formData)
    } else {
      // 新增
      response = await permissionAPI.createPermission(formData)
    }
    
    if (response.code === 200) {
      ElMessage.success(form._id ? '编辑成功' : '新增成功')
      dialogVisible.value = false
      fetchData()
    } else {
      ElMessage.error(response.message || '操作失败')
    }
  } catch (error: any) {
  console.error('提交失败详细信息:', error);
  if (error !== false) {
    ElMessage.error(error.response?.data?.message || '操作失败');
  }
}
   finally {
    submitLoading.value = false
  }
}

// 关闭对话框
const handleDialogClose = () => {
  dialogVisible.value = false
  formRef.value?.resetFields()
}

// 分页
const handleSizeChange = (val: number) => {
  pagination.pageSize = val
  fetchData()
}

// 当前页
const handleCurrentChange = (val: number) => {
  pagination.currentPage = val
  fetchData()
}

// 格式化日期
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString()
}

// 获取数据
const fetchData = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.currentPage,
      limit: pagination.pageSize,
      search: searchForm.search,
      parentId: searchForm.parentId
    }
    
    const response = await permissionAPI.getPermissions(params)
    
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

// 获取权限树
const fetchPermissionTree = async () => {
  try {
    console.log('开始获取权限树...');
    const response = await permissionAPI.getAllPermissions();
    console.log('权限树响应:', response);
    
    if (response.code === 200) {
      // 设置父级菜单选项
      parentMenus.value = response.data
        .filter((item: any) => !item.parentId)
        .map((item: any) => ({
          _id: item._id,
          name: item.name,
          icon: item.icon || 'Setting'
        }));
      console.log('处理后的父级菜单:', parentMenus.value);
    } else {
      console.error('获取权限树失败:', response.message);
      ElMessage.error(response.message || '获取权限树失败');
    }
  } catch (error: any) {
    console.error('获取权限列表失败:', error);
    ElMessage.error(error.response?.data?.message || '获取权限树失败');
  }
}

// 生命周期
// onMounted：在组件挂载时执行
onMounted(() => {
  fetchData()
  fetchPermissionTree()
})
</script>

<style scoped lang="scss">
.permission-management {
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

  .PermissionTable {
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