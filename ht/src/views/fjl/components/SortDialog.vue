<template>
  <el-dialog
    v-model="visible"
    title="排序"
    width="800px"
    :close-on-click-modal="false"
    class="sort-dialog"
    @close="handleClose"
  >
    <div class="sort-description">
      <p>运营位: 首页banner位</p>
      <p class="sort-rule">
        已上线内容{{ sortData.length }}条, 序号越小, 排序越靠前
      </p>
    </div>

    <el-table
      :data="sortData"
      class="sort-table"
      :loading="loading"
      row-key="_id"
    >
      <el-table-column
        prop="sequence"
        label="序号"
        width="80"
        align="center"
      />
      <el-table-column prop="title" label="标题" min-width="200" />
      <el-table-column label="内容id" width="100" align="center">
        <template #default="scope">
          {{ formatId(scope.row._id) }}
        </template>
      </el-table-column>
      <el-table-column label="排序" width="200" align="center">
        <template #default="scope">
          <div class="sort-actions">
            <span
              v-if="scope.$index > 0"
              @click="moveUp(scope.$index)"
              class="sort-text-link"
              :class="{ 'loading': loading }"
            >
              上移
            </span>
            <span
              v-if="scope.$index < sortData.length - 1"
              @click="moveDown(scope.$index)"
              class="sort-text-link"
              :class="{ 'loading': loading }"
            >
              下移
            </span>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-info">
          <el-icon v-if="hasChanges" class="change-icon"><Warning /></el-icon>
          <span v-if="hasChanges" class="change-text">排序已修改，请点击确定保存</span>
          <span v-else class="no-change-text">排序未修改</span>
        </div>
        <div class="footer-actions">
          <el-button @click="handleCancel">取消</el-button>
          <el-button 
            type="primary" 
            @click="handleConfirm"
            :disabled="!hasChanges"
            :loading="confirmLoading"
          >
            确定
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch, defineEmits, defineProps, withDefaults } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Warning } from '@element-plus/icons-vue';
import type { Banner } from '../api/banner';

interface SortItem extends Banner {
  sequence: number;
}

interface Props {
  modelValue: boolean;
  data: Banner[];
  loading?: boolean;
  confirmLoading?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm', data: SortItem[]): void;
  (e: 'cancel'): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  confirmLoading: false
});

const emit = defineEmits<Emits>();

// 本地可见性状态
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// 排序数据
const sortData = ref<SortItem[]>([]);
const originalData = ref<SortItem[]>([]);

// 是否有变化
const hasChanges = computed(() => {
  if (sortData.value.length !== originalData.value.length) return true;
  
  return sortData.value.some((item, index) => {
    const original = originalData.value[index];
    return !original || item._id !== original._id || item.sequence !== original.sequence;
  });
});

// 监听数据变化，初始化排序数据
watch(() => props.data, (newData) => {
  if (newData && newData.length > 0) {
    const processedData = newData
      .filter(item => item.status === '已发布')
      .map((banner, index) => ({
        ...banner,
        sequence: index + 1,
      }));
    
    sortData.value = [...processedData];
    originalData.value = JSON.parse(JSON.stringify(processedData));
  }
}, { immediate: true, deep: true });

// 格式化ID
const formatId = (id: string): string => {
  if (!id) return "";
  return id.substring(0, 8);
};

// 上移操作
const moveUp = async (index: number): Promise<void> => {
  if (index > 0 && !props.loading) {
    const temp = sortData.value[index];
    sortData.value[index] = sortData.value[index - 1];
    sortData.value[index - 1] = temp;
    
    // 更新序号
    updateSequences();
    
    // 显示操作提示
    ElMessage.success(`已将"${temp.title}"上移一位`);
  }
};

// 下移操作
const moveDown = async (index: number): Promise<void> => {
  if (index < sortData.value.length - 1 && !props.loading) {
    const temp = sortData.value[index];
    sortData.value[index] = sortData.value[index + 1];
    sortData.value[index + 1] = temp;
    
    // 更新序号
    updateSequences();
    
    // 显示操作提示
    ElMessage.success(`已将"${temp.title}"下移一位`);
  }
};

// 更新序号
const updateSequences = (): void => {
  sortData.value.forEach((item, index) => {
    item.sequence = index + 1;
  });
};

// 确认排序
const handleConfirm = (): void => {
  // 更新序号确保一致性
  updateSequences();
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🎯 排序对话框确认数据:', sortData.value.map(item => ({
      _id: item._id,
      title: item.title,
      sequence: item.sequence
    })));
  }
  
  emit('confirm', [...sortData.value]);
};

// 取消排序
const handleCancel = (): void => {
  if (hasChanges.value) {
    ElMessageBox.confirm(
      "排序已修改，确定要放弃更改吗？",
      "提示",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    ).then(() => {
      resetData();
      emit('cancel');
    }).catch(() => {
      // 用户取消，不做任何操作
    });
  } else {
    emit('cancel');
  }
};

// 关闭对话框
const handleClose = (): void => {
  handleCancel();
};

// 重置数据
const resetData = (): void => {
  sortData.value = JSON.parse(JSON.stringify(originalData.value));
};

// 暴露方法
defineExpose({
  resetData
});
</script>

<style scoped>
/* 排序对话框样式 */
.sort-dialog {
  :deep(.el-dialog__header) {
    background: #409eff;
    color: white;
    padding: 16px 24px;
  }
  
  :deep(.el-dialog__title) {
    color: white;
    font-weight: 500;
  }
  
  :deep(.el-dialog__body) {
    padding: 20px 24px;
  }
}

.sort-description {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 6px;

  p {
    margin: 0;
    font-size: 14px;
    color: #606266;

    &:first-child {
      font-weight: 500;
      color: #303133;
      margin-bottom: 4px;
    }
  }

  .sort-rule {
    font-size: 12px;
    color: #909399;
  }
}

.sort-table {
  border: 1px solid #e4e7ed;
  border-radius: 6px;

  :deep(.el-table__header) {
    background-color: #409eff;

    th {
      background-color: #409eff;
      color: white;
      font-weight: 500;
      border-bottom: none;
    }
  }

  :deep(.el-table__row) {
    transition: all 0.3s ease;
    
    &:hover {
      background-color: #f0f7ff;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
    }
  }
  
  :deep(.el-table__row.moving) {
    background-color: #e6f7ff;
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
  }
}

.sort-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  align-items: center;
}

.sort-text-link {
  color: #606266;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.3s;
  user-select: none;
  
  &:hover {
    color: #409eff;
  }
  
  &.loading {
    color: #c0c4cc;
    cursor: not-allowed;
  }
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
  
  .footer-info {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .change-icon {
      color: #e6a23c;
      font-size: 16px;
    }
    
    .change-text {
      color: #e6a23c;
      font-size: 14px;
      font-weight: 500;
    }
    
    .no-change-text {
      color: #909399;
      font-size: 14px;
    }
  }
  
  .footer-actions {
    display: flex;
    gap: 12px;
  }
}

/* 动画效果 */
.sort-table :deep(.el-table__row) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sort-dialog {
    :deep(.el-dialog) {
      width: 95% !important;
      margin: 0 auto;
    }
  }
  
  .sort-actions {
    gap: 8px;
  }
  
  .dialog-footer {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    
    .footer-info {
      justify-content: center;
    }
    
    .footer-actions {
      justify-content: center;
    }
  }
}
</style> 