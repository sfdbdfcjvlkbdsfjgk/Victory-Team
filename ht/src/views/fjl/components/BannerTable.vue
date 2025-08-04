<template>
  <div class="banner-table-container">
    <!-- 操作按钮 -->
    <div class="action-buttons">
      <div class="left-actions">
        <el-button type="primary" @click="$emit('create')">新建</el-button>
        <el-button 
          type="primary"
          @click="$emit('sort')" 
          :disabled="!publishedCount"
        >
          排序
        </el-button>
        
        <!-- 批量操作按钮组 -->
        <transition name="batch-fade">
          <div v-if="selectedRows.length > 0" class="batch-actions">
            <el-divider direction="vertical" />
            <span class="selected-count">已选择 {{ selectedRows.length }} 项</span>
            <el-button 
              type="primary" 
              size="small" 
              @click="handleBatchToggleStatus('已发布')"
              :disabled="!canBatchPublish"
            >
              批量上线
            </el-button>
            <el-button 
              type="primary" 
              size="small" 
              @click="handleBatchToggleStatus('已下线')"
              :disabled="!canBatchOffline"
            >
              批量下线
            </el-button>
            <el-button 
              type="primary" 
              size="small" 
              @click="handleBatchDelete"
              :disabled="!canBatchDelete"
            >
              批量删除
            </el-button>
            <el-button type="primary" size="small" @click="clearSelection">取消选择</el-button>
          </div>
        </transition>
      </div>
      
      <div class="right-actions">
        <!-- 导入导出按钮 -->
        <el-button 
          type="primary" 
          size="small" 
          @click="handleDownloadTemplate"
        >
          <el-icon><Document /></el-icon>
          下载模板
        </el-button>
        <el-button 
          type="primary" 
          size="small" 
          @click="handleImport"
          :loading="importLoading"
        >
          <el-icon><Upload /></el-icon>
          导入Excel
        </el-button>
        <el-button 
          type="primary" 
          size="small" 
          @click="handleExport"
        >
          <el-icon><Download /></el-icon>
          导出Excel
        </el-button>
        <span class="data-count">共 {{ total }} 条数据</span>
      </div>
    </div>

    <!-- 数据表格 -->
    <el-table
      ref="tableRef"
      :data="paginatedData"
      style="width: 100%"
      class="data-table"
      :class="{ 'drag-enabled': enableDragSort && isDragSortable, 'is-dragging': isDragging }"
      :loading="loading"
      element-loading-text="加载中..."
      :empty-text="loading ? '加载中...' : '暂无数据'"
      row-key="_id"
      @selection-change="handleSelectionChange"
      table-layout="fixed"
      stripe
      border
    >
      <!-- 多选框列 -->
      <el-table-column type="selection" width="50" :selectable="isRowSelectable" />
      
      <!-- 拖拽手柄列 -->
      <el-table-column v-if="enableDragSort && isDragSortable" label="" width="40" fixed="left">
        <template #default>
          <div class="drag-handle" title="拖拽排序">
            <el-icon class="drag-icon">
              <svg viewBox="0 0 1024 1024" width="16" height="16">
                <path d="M300 200h100v100H300zm200 0h100v100H500zm-200 200h100v100H300zm200 0h100v100H500zm-200 200h100v100H300zm200 0h100v100H500z" fill="currentColor"/>
              </svg>
            </el-icon>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column prop="_id" label="内容id" width="90">
        <template #default="scope">
          {{ formatId(scope.row._id) }}
        </template>
      </el-table-column>
      
      <el-table-column prop="title" label="标题" min-width="120" show-overflow-tooltip>
        <template #default="scope">
          <span class="title-text">{{ scope.row.title }}</span>
        </template>
      </el-table-column>
      
      <el-table-column prop="status" label="状态" width="85">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)" size="small">
            {{ scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column prop="createTime" label="创建时间" width="120">
        <template #default="scope">
          <span class="create-time">{{ formatDateShort(scope.row.createdAt) }}</span>
        </template>
      </el-table-column>
      
      <el-table-column label="起止时间" min-width="180" show-overflow-tooltip>
        <template #default="scope">
          <div class="time-range">
            <span class="time-item">{{ formatDateShort(scope.row.startTime) }}</span>
            <span class="time-separator">~</span>
            <span class="time-item">{{ formatDateShort(scope.row.endTime) }}</span>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <div class="action-container">
            <el-button
              type="primary"
              @click="$emit('edit', scope.row)"
              class="action-btn edit-btn"
              size="small"
              text
            >
              编辑
            </el-button>
            <el-button
              :type="scope.row.status === '已发布' ? 'warning' : 'success'"
              @click="$emit('toggle-status', scope.row)"
              class="action-btn status-btn"
              size="small"
              text
            >
              {{ scope.row.status === "已发布" ? "下线" : "上线" }}
            </el-button>
            <el-button
              v-if="scope.row.status === '已下线'"
              type="danger"
              @click="$emit('delete', scope.row)"
              class="action-btn delete-btn"
              size="small"
              text
            >
              删除
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-section">
      <div class="custom-pagination">
        <span class="pagination-total">共 {{ total }} 条</span>
        
        <div class="pagination-sizes">
          <span>每页</span>
          <el-select 
            :model-value="pageSize" 
            @update:model-value="$emit('size-change', $event)"
            size="small"
            style="width: 80px; margin: 0 8px;"
          >
            <el-option 
              v-for="size in pageSizeOptions"
              :key="size"
              :label="size.toString()" 
              :value="size" 
            />
          </el-select>
          <span>条</span>
        </div>
        
        <el-pagination
          :current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="$emit('page-change', $event)"
          :pager-count="7"
          prev-text="上一页"
          next-text="下一页"
          :background="true"
          small
          :hide-on-single-page="false"
        />
        
        <div class="pagination-jump">
          <span>前往第</span>
          <el-input
            v-model="jumpPageInput"
            size="small"
            style="width: 50px; margin: 0 8px;"
            @keyup.enter="handleJumpPage"
          />
          <span>页</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, nextTick, defineEmits, defineProps, withDefaults } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Upload, Download, Document } from '@element-plus/icons-vue';
import Sortable from 'sortablejs';
import type { Banner } from '../api/banner';

interface Props {
  data: Banner[];
  loading?: boolean;
  currentPage?: number;
  pageSize?: number;
  total?: number;
  pageSizeOptions?: number[];
  enableDragSort?: boolean;
}

interface Emits {
  (e: 'create'): void;
  (e: 'sort'): void;
  (e: 'edit', row: Banner): void;
  (e: 'toggle-status', row: Banner): void;
  (e: 'delete', row: Banner): void;
  (e: 'page-change', page: number): void;
  (e: 'size-change', size: number): void;
  (e: 'jump-page', page: number): void;
  (e: 'drag-sort', data: Banner[]): void;
  (e: 'batch-toggle-status', rows: Banner[], status: string): void;
  (e: 'batch-delete', rows: Banner[]): void;
  (e: 'import-excel'): void;
  (e: 'export-excel', selectedRows?: Banner[]): void;
  (e: 'download-template'): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  currentPage: 1,
  pageSize: 5,
  total: 0,
  pageSizeOptions: () => [5, 10, 20, 50],
  enableDragSort: false
});

const emit = defineEmits<Emits>();

// 跳转页码输入
const jumpPageInput = ref('');

// 拖拽排序相关
const tableRef = ref();
let sortableInstance: Sortable | null = null;
const isDragging = ref(false);

// 批量选择相关
const selectedRows = ref<Banner[]>([]);
const importLoading = ref(false);

// 计算分页数据 - 使用客户端分页优化性能
const paginatedData = computed(() => {
  const start = (props.currentPage - 1) * props.pageSize;
  const end = start + props.pageSize;
  return props.data.slice(start, end);
});

// 计算已发布数量
const publishedCount = computed(() => {
  return props.data.filter(item => item.status === '已发布').length;
});

// 判断是否可以拖拽排序（只有已发布的数据才能拖拽）
const isDragSortable = computed(() => {
  return props.enableDragSort && paginatedData.value.every(item => item.status === '已发布');
});

// 获取已发布数据用于拖拽排序
const draggableData = computed(() => {
  return props.data.filter(item => item.status === '已发布');
});

// 格式化ID，只显示前8位
const formatId = (id: string): string => {
  if (!id) return "";
  return id.substring(0, 8);
};

// 格式化日期
const formatDate = (date: string | Date): string => {
  if (!date) return "";
  const d = new Date(date);
  return d
    .toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(/\//g, "-");
};

// 格式化日期（短格式）
const formatDateShort = (date: string | Date): string => {
  if (!date) return "";
  const d = new Date(date);
  return d
    .toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(/\//g, "-")
    .replace(/\s/, " ");
};

// 获取状态类型
const getStatusType = (status: string): string => {
  switch (status) {
    case '已发布':
      return 'success';
    case '已下线':
      return 'danger';
    default:
      return 'info';
  }
};

// 处理页面跳转
const handleJumpPage = (): void => {
  const page = parseInt(jumpPageInput.value);
  const maxPage = Math.ceil(props.total / props.pageSize);
  
  if (page && page > 0 && page <= maxPage) {
    emit('jump-page', page);
    jumpPageInput.value = '';
  } else {
    ElMessage.warning(`请输入1-${maxPage}之间的页码`);
  }
};

// 批量操作相关
const handleBatchToggleStatus = async (status: string) => {
  const action = status === '已发布' ? '上线' : '下线';
  try {
    await ElMessageBox.confirm(
      `确定要批量${action} ${selectedRows.value.length} 个项目吗？`,
      '批量操作确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    emit('batch-toggle-status', selectedRows.value, status);
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`批量${action}操作失败`);
    }
  }
};

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要批量删除 ${selectedRows.value.length} 个项目吗？删除后不可恢复！`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    emit('batch-delete', selectedRows.value);
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除操作失败');
    }
  }
};

// 导入导出功能
const handleImport = () => {
  emit('import-excel');
};

const handleExport = () => {
  // 如果有选中的行，只导出选中的，否则导出全部
  const exportData = selectedRows.value.length > 0 ? selectedRows.value : undefined;
  emit('export-excel', exportData);
};

const handleDownloadTemplate = () => {
  emit('download-template');
};

const canBatchPublish = computed(() => {
  return selectedRows.value.length > 0 && selectedRows.value.some(row => row.status !== '已发布');
});

const canBatchOffline = computed(() => {
  return selectedRows.value.length > 0 && selectedRows.value.some(row => row.status === '已发布');
});

const canBatchDelete = computed(() => {
  return selectedRows.value.length > 0 && selectedRows.value.every(row => row.status === '已下线');
});

const clearSelection = () => {
  selectedRows.value = [];
  if (tableRef.value) {
    tableRef.value.clearSelection();
  }
};

// 处理表格选择变化
const handleSelectionChange = (rows: Banner[]) => {
  selectedRows.value = rows;
};

// 行是否可选择
const isRowSelectable = (row: Banner) => {
  return true; // 允许选择所有行，但批量操作时会有相应限制
};

// 初始化拖拽排序
const initDragSort = (): void => {
  if (!props.enableDragSort || !tableRef.value) return;
  
  nextTick(() => {
    const tbody = tableRef.value?.$el.querySelector('.el-table__body-wrapper tbody');
    if (!tbody) return;
    
    if (sortableInstance) {
      sortableInstance.destroy();
    }
    
    sortableInstance = new Sortable(tbody, {
      animation: 150,
      ghostClass: 'drag-ghost',
      chosenClass: 'drag-chosen',
      dragClass: 'drag-item',
      handle: '.drag-handle',
      filter: '.no-drag',
      onStart: () => {
        isDragging.value = true;
        if (process.env.NODE_ENV === 'development') {
          console.log('🖱️ 开始拖拽排序');
        }
      },
      onEnd: (evt) => {
        isDragging.value = false;
        const { oldIndex, newIndex } = evt;
        
        if (oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
          // 重新排序数据
          const newData = [...draggableData.value];
          const [movedItem] = newData.splice(oldIndex, 1);
          newData.splice(newIndex, 0, movedItem);
          
          // 更新sortOrder
          const updatedData = newData.map((item, index) => ({
            ...item,
            sortOrder: index + 1
          }));
          
          emit('drag-sort', updatedData);
          
          if (process.env.NODE_ENV === 'development') {
            console.log('🖱️ 拖拽排序完成:', { oldIndex, newIndex });
            console.log('📋 新排序:', updatedData.map(item => item.title));
          }
          
          ElMessage.success(`已将"${movedItem.title}"移动到新位置`);
        }
      }
    });
  });
};

// 销毁拖拽排序
const destroyDragSort = (): void => {
  if (sortableInstance) {
    sortableInstance.destroy();
    sortableInstance = null;
  }
};

// 生命周期钩子
onMounted(() => {
  if (props.enableDragSort) {
    initDragSort();
  }
});

onUnmounted(() => {
  destroyDragSort();
});

// 监听数据变化重新初始化拖拽
const reinitDragSort = () => {
  if (props.enableDragSort && isDragSortable.value) {
    setTimeout(() => {
      initDragSort();
    }, 100);
  }
};
</script>

<style scoped>
.banner-table-container {
  width: 100%;
}

.action-buttons {
  margin-bottom: 8px;
  padding: 0 16px;
  padding-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.left-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.right-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f0f9ff;
  border: 1px solid #91d5ff;
  border-radius: 6px;
  margin-left: 16px;
}

.batch-fade-enter-active {
  transition: all 0.3s ease;
}

.batch-fade-leave-active {
  transition: all 0.3s ease;
}

.batch-fade-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.batch-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.selected-count {
  color: #1890ff;
  font-size: 14px;
  font-weight: 500;
  margin-right: 8px;
}

.batch-actions .el-button {
  margin: 0;
  border-radius: 4px;
  background: #409eff;
  border-color: #409eff;
  color: white;
}

.batch-actions .el-button:hover {
  background: #66b1ff;
  border-color: #66b1ff;
}

.batch-actions .el-button:disabled {
  background: #a0cfff;
  border-color: #a0cfff;
  color: white;
}



.data-count {
  color: #666;
  font-size: 14px;
  margin-left: auto;
}

.action-buttons .el-button {
  margin-right: 8px;
  border-radius: 4px;
  font-weight: normal;
  transition: background 0.2s;
}

.action-buttons .el-button:hover {
  background: #ecf5ff;
}

/* 创建时间显示 */
.create-time {
  font-size: 12px;
  color: #606266;
  line-height: 1.2;
}

/* 时间范围显示 */
.time-range {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  line-height: 1.2;
  justify-content: center;
}

.time-item {
  white-space: nowrap;
  line-height: 1.2;
  margin: 0;
  padding: 0;
  font-size: 12px;
  color: #606266;
}

.time-separator {
  color: #909399;
  font-size: 12px;
  margin: 0 3px;
  padding: 0;
  line-height: 1.2;
  font-weight: 500;
}

/* 操作按钮容器样式 */
.action-container {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-start;
}

.action-btn {
  padding: 2px 6px;
  font-size: 12px;
  border-radius: 4px;
  transition: all 0.3s;
  min-width: auto;
}

.action-btn:hover {
  background-color: #f5f7fa;
}

/* 标题文本 */
.title-text {
  font-size: 13px;
  color: #303133;
  line-height: 1.4;
}

/* 内容ID显示 */
.data-table :deep(.el-table__body .cell) {
  padding: 8px 12px;
}

/* 表格整体优化 */
.data-table {
  margin: 0 16px;
  border-radius: 0;
  box-shadow: none;
  margin-top: 0;
  min-width: 800px;
  width: 100%;
}

/* 表格行高优化 */
.data-table :deep(.el-table__row) {
  height: 50px;
}

.data-table :deep(.el-table__header tr) {
  height: 45px;
}

.data-table :deep(.el-table td),
.data-table :deep(.el-table th) {
  padding: 8px 0;
}

/* 确保表格不会超出容器 */
.data-table :deep(.el-table__body-wrapper) {
  overflow-x: auto;
}

.data-table :deep(.el-table__header-wrapper) {
  overflow-x: auto;
}

/* 表格内容统一字体样式 */
.data-table :deep(.el-table__body) {
  font-size: 13px;
}

.data-table :deep(.el-table__row) {
  height: 50px;
}

.data-table :deep(.el-table__header tr) {
  height: 45px;
}

.data-table :deep(.cell) {
  font-size: 13px !important;
  line-height: 1.4;
}

/* 操作按钮统一样式 */
.action-btn {
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 4px;
  transition: all 0.3s;
  min-width: auto;
  margin: 0 2px;
  border: none;
}

.edit-btn {
  color: #409eff;
  background-color: rgba(64, 158, 255, 0.1);
}

.edit-btn:hover {
  background-color: rgba(64, 158, 255, 0.2);
  color: #409eff;
}

.status-btn.el-button--success {
  color: #67c23a;
  background-color: rgba(103, 194, 58, 0.1);
}

.status-btn.el-button--success:hover {
  background-color: rgba(103, 194, 58, 0.2);
  color: #67c23a;
}

.status-btn.el-button--warning {
  color: #e6a23c;
  background-color: rgba(230, 162, 60, 0.1);
}

.status-btn.el-button--warning:hover {
  background-color: rgba(230, 162, 60, 0.2);
  color: #e6a23c;
}

.delete-btn {
  color: #f56c6c;
  background-color: rgba(245, 108, 108, 0.1);
}

.delete-btn:hover {
  background-color: rgba(245, 108, 108, 0.2);
  color: #f56c6c;
}

/* 复选框样式优化 */
.data-table :deep(.el-checkbox) {
  --el-checkbox-checked-bg-color: #409eff;
  --el-checkbox-checked-input-border-color: #409eff;
  --el-checkbox-input-border-color: #409eff;
}

.data-table :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #409eff !important;
  border-color: #409eff !important;
}

.data-table :deep(.el-checkbox__inner) {
  border: 2px solid #409eff !important;
  border-radius: 3px;
  width: 16px;
  height: 16px;
}

.data-table :deep(.el-checkbox__inner::after) {
  border-color: #fff;
  border-width: 2px;
}

.data-table :deep(.el-checkbox__input.is-indeterminate .el-checkbox__inner) {
  background-color: #409eff !important;
  border-color: #409eff !important;
}

.data-table :deep(.el-table__header .el-checkbox__inner) {
  border-color: #fff !important;
  background-color: rgba(255, 255, 255, 0.2);
}

.data-table :deep(.el-table__header .el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #fff !important;
  border-color: #fff !important;
}

.data-table :deep(.el-table__header .el-checkbox__input.is-checked .el-checkbox__inner::after) {
  border-color: #409eff;
}

/* 分页样式 */
.pagination-section {
  padding: 12px 16px;
  display: flex;
  justify-content: flex-end;
  background: #fafbfc;
  border-top: 1px solid #e6eaf0;
}

/* 自定义分页样式 */
.custom-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 16px 0;
}

.pagination-total {
  color: #606266;
  font-size: 14px;
}

.pagination-sizes {
  display: flex;
  align-items: center;
  color: #606266;
  font-size: 14px;
}

.pagination-jump {
  display: flex;
  align-items: center;
  color: #606266;
  font-size: 14px;
}

.title-text {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 表格优化样式 */
:deep(.el-table th) {
  background: #409eff !important;
  color: #fff !important;
  font-weight: 500;
  font-size: 14px;
  border-bottom: 1px solid #e6eaf0;
}

:deep(.el-table th .cell) {
  color: #fff !important;
}

:deep(.el-table .el-table__row) {
  font-size: 15px;
  transition: background 0.2s;
}

:deep(.el-table .el-table__row:hover) {
  background: #f0f7ff !important;
}

/* 拖拽排序样式 */
.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.drag-handle:hover {
  background: #e6f7ff;
  transform: scale(1.1);
}

.drag-handle:active {
  cursor: grabbing;
}

.drag-icon {
  color: #909399;
  transition: color 0.2s;
}

.drag-handle:hover .drag-icon {
  color: #409eff;
}

/* 拖拽状态样式 */
.data-table.drag-enabled :deep(.el-table__row) {
  transition: all 0.2s ease;
}

.data-table.is-dragging :deep(.el-table__row) {
  transition: none;
}

/* 拖拽过程中的样式 */
:deep(.drag-ghost) {
  opacity: 0.4;
  background: #f0f7ff !important;
  transform: rotate(2deg);
}

:deep(.drag-chosen) {
  background: #e6f7ff !important;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  transform: scale(1.02);
}

:deep(.drag-item) {
  background: #ffffff !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  transform: rotate(-1deg);
}

/* 拖拽提示 */
/* 
.data-table.drag-enabled::before {
  content: "💡 提示：拖拽左侧手柄可调整排序";
  position: absolute;
  top: -30px;
  left: 0;
  font-size: 12px;
  color: #909399;
  background: #f5f7fa;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
  z-index: 10;
}
*/

/* 响应式优化 */
@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .custom-pagination {
    flex-direction: column;
    gap: 8px;
  }
  
  .pagination-jump {
    order: -1;
  }
}

/* 虚拟滚动优化提示 */
.virtual-scroll-hint {
  padding: 8px 16px;
  background: #f0f9ff;
  border: 1px solid #bae7ff;
  color: #1890ff;
  font-size: 12px;
  margin-bottom: 8px;
  border-radius: 4px;
}

/* 响应式优化 */
@media (max-width: 1200px) {
  .time-range {
    font-size: 11px;
  }
  
  .time-item {
    font-size: 11px;
  }
  
  .time-separator {
    font-size: 11px;
  }
  
  .action-btn {
    font-size: 11px;
    padding: 1px 4px;
  }
}
</style> 