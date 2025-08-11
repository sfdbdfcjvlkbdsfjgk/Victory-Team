<template>
  <div class="tag-display">
    <div class="tag-header">
      <el-icon><Collection /></el-icon>
      <span>运动标签</span>
      <el-tag type="info" size="small">{{ tags.length }}个标签</el-tag>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="4" animated />
    </div>
    
    <!-- 标签网格 -->
    <div v-else class="tag-grid">
      <div
        v-for="tag in tags"
        :key="tag._id || tag"
        class="tag-item"
        :class="{ 'selected': selectedTags.includes(tag.sport_tag || tag) }"
        @click="toggleTag(tag.sport_tag || tag)"
      >
        {{ tag.sport_tag || tag }}
        <el-icon 
          v-if="showDelete" 
          class="delete-icon" 
          @click.stop="deleteTag(tag)"
        >
          <Close />
        </el-icon>
      </div>
    </div>
    
    <!-- 空状态 -->
    <el-empty 
      v-if="!loading && tags.length === 0" 
      description="暂无标签"
    >
      <template #image>
        <el-icon style="font-size: 60px; color: #c0c4cc;"><Collection /></el-icon>
      </template>
      <template #description>
        <span style="color: #909399;">还没有任何标签</span>
      </template>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Collection, Close } from '@element-plus/icons-vue'
import axios from 'axios'

// axios配置
axios.defaults.baseURL = 'http://localhost:3000'

// 定义props
interface Props {
  apiUrl?: string
  showDelete?: boolean
  selectable?: boolean
  maxSelect?: number
}

const props = withDefaults(defineProps<Props>(), {
  apiUrl: '/labels', // 默认API路径
  showDelete: false,
  selectable: false,
  maxSelect: 5
})

// 定义emits
const emit = defineEmits<{
  'tag-selected': [tags: string[]]
  'tag-deleted': [tag: any]
}>()

// 响应式数据
const tags = ref<any[]>([])
const selectedTags = ref<string[]>([])
const loading = ref(false)

// 获取标签数据
const fetchTags = async () => {
  loading.value = true
  try {
    const response = await axios.get(props.apiUrl)
    if (response.data.success) {
      tags.value = response.data.data || []
    } else {
      ElMessage.error(response.data.message || '获取标签失败')
    }
  } catch (error) {
    console.error('获取标签失败:', error)
    ElMessage.error('获取标签失败')
  } finally {
    loading.value = false
  }
}

// 切换标签选择状态
const toggleTag = (tagName: string) => {
  if (!props.selectable) return
  
  const index = selectedTags.value.indexOf(tagName)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    if (selectedTags.value.length >= props.maxSelect) {
      ElMessage.warning(`最多只能选择${props.maxSelect}个标签`)
      return
    }
    selectedTags.value.push(tagName)
  }
  
  emit('tag-selected', selectedTags.value)
}

// 删除标签
const deleteTag = async (tag: any) => {
  try {
    // 获取标签的id，优先使用_id，如果没有则使用tag本身作为id
    const tagId = tag._id || tag.id || tag
    const response = await axios.post('/wsj/deletelabel', { id: tagId })
    
    if (response.data.code === 200) {
      ElMessage.success(response.data.msg || '删除成功')
      emit('tag-deleted', tag)
      await fetchTags() // 重新获取标签列表
    } else {
      ElMessage.error(response.data.msg || '删除失败')
    }
  } catch (error) {
    console.error('删除标签失败:', error)
    ElMessage.error('删除标签失败')
  }
}

// 组件挂载时获取数据
onMounted(() => {
  fetchTags()
})

// 暴露方法给父组件
defineExpose({
  fetchTags,
  selectedTags
})
</script>

<style scoped>
.tag-display {
  padding: 20px;
}

.tag-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.loading-container {
  padding: 20px 0;
}

.tag-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.tag-item {
  position: relative;
  padding: 12px 16px;
  background-color: #f0f9ff;
  border: 1px solid #e0f2fe;
  border-radius: 8px;
  text-align: center;
  font-size: 14px;
  color: #0369a1;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
}

.tag-item:hover {
  background-color: #e0f2fe;
  border-color: #0284c7;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(3, 105, 161, 0.15);
}

.tag-item.selected {
  background-color: #0284c7;
  border-color: #0284c7;
  color: white;
}

.tag-item.selected:hover {
  background-color: #0369a1;
  border-color: #0369a1;
}

.delete-icon {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 12px;
  color: #ef4444;
  background-color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.tag-item:hover .delete-icon {
  opacity: 1;
}

.delete-icon:hover {
  background-color: #fee2e2;
  color: #dc2626;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tag-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 8px;
  }
  
  .tag-item {
    padding: 8px 12px;
    font-size: 12px;
  }
}
</style> 